import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import mongoose from 'mongoose';
import { config } from '../../config/env.js';
import { Resume, IResume } from './resume.model.js';
import { ResumeTemplateEngine } from './resume.templates.js';
import { cacheDel } from '../../config/redis.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { ChatService } from '../chat/chat.service.js';

export class ResumeService {
  private static getGroqClient(): Groq | null {
    if (!config.groq.apiKey) return null;
    return new Groq({ apiKey: config.groq.apiKey });
  }

  private static getGeminiModel(modelName = 'gemini-flash-latest') {
    if (!config.gemini.apiKey) return null;
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });
  }

  private static isGroqModel(modelName: string): boolean {
    return (
      modelName.startsWith('openai/') ||
      modelName.startsWith('qwen/') ||
      modelName.startsWith('meta-llama/') ||
      modelName.includes('llama') ||
      modelName.includes('oss')
    );
  }

  static async listResumes(userId: string) {
    return Resume.find({ userId: new mongoose.Types.ObjectId(userId) })
      .select('title templateId createdAt updatedAt')
      .sort({ updatedAt: -1 });
  }

  static async getResume(id: string, userId: string) {
    return Resume.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  static async createResume(userId: string, data: Partial<IResume>) {
    const resume = new Resume({
      ...data,
      userId: new mongoose.Types.ObjectId(userId),
      templateId: data.templateId || 'modern',
    });

    if (!data.tiptapHtml) {
      resume.tiptapHtml = ResumeTemplateEngine.render(resume, resume.templateId);
    }

    resume.versions.push({
      versionNumber: 1,
      data: resume.toObject(),
      tiptapHtml: resume.tiptapHtml,
      createdAt: new Date(),
    });

    const saved = await resume.save();
    await DashboardService.invalidateDashboardCache(userId);
    return saved;
  }

  static async updateResume(
    id: string,
    userId: string,
    updateData: Partial<IResume> & { reRenderTemplate?: boolean }
  ) {
    const resume = await Resume.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!resume) {
      const err: any = new Error('Resume not found');
      err.statusCode = 404;
      throw err;
    }

    const templateChanged = Boolean(updateData.templateId && updateData.templateId !== resume.templateId);
    if (updateData.templateId) {
      resume.templateId = updateData.templateId;
    }

    const incomingHtml = updateData.tiptapHtml || resume.tiptapHtml;

    // Sync edited candidate name from HTML to keep structured personalInfo in sync
    if (incomingHtml) {
      const h1Match = incomingHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) {
        const rawName = h1Match[1].replace(/<[^>]+>/g, '').trim();
        if (rawName && rawName.length > 0 && !/^your name$/i.test(rawName)) {
          if (!resume.personalInfo) resume.personalInfo = {} as any;
          resume.personalInfo.fullName = rawName;
        }
      }
    }

    if (updateData.reRenderTemplate || templateChanged) {
      if (incomingHtml && incomingHtml.length > 50) {
        resume.tiptapHtml = ResumeTemplateEngine.convertTemplate(
          incomingHtml,
          resume.templateId as 'modern' | 'ats-classic',
          resume
        );
      } else {
        resume.tiptapHtml = ResumeTemplateEngine.render(resume, resume.templateId);
      }
    } else if (updateData.tiptapHtml) {
      resume.tiptapHtml = updateData.tiptapHtml;
    } else if (!resume.tiptapHtml) {
      resume.tiptapHtml = ResumeTemplateEngine.render(resume, resume.templateId);
    }

    const { reRenderTemplate, tiptapHtml, ...dataToAssign } = updateData;
    if (templateChanged || updateData.reRenderTemplate) {
      delete (dataToAssign as any).tiptapContent;
    }
    Object.assign(resume, dataToAssign);

    const nextVer = (resume.versions?.length || 0) + 1;
    resume.versions.push({
      versionNumber: nextVer,
      data: {
        personalInfo: resume.personalInfo,
        summary: resume.summary,
        experience: resume.experience,
        education: resume.education,
        skills: resume.skills,
        projects: resume.projects,
        certifications: resume.certifications,
        achievements: resume.achievements,
      },
      tiptapHtml: resume.tiptapHtml,
      createdAt: new Date(),
    });

    if (resume.versions.length > 10) {
      resume.versions.shift();
    }

    const saved = await resume.save();
    await DashboardService.invalidateDashboardCache(userId);
    return saved;
  }

  static async duplicateResume(id: string, userId: string) {
    const source = await this.getResume(id, userId);
    if (!source) {
      const err: any = new Error('Resume not found');
      err.statusCode = 404;
      throw err;
    }

    const cloned = new Resume({
      ...source.toObject(),
      _id: new mongoose.Types.ObjectId(),
      title: `${source.title} (Copy)`,
      userId: new mongoose.Types.ObjectId(userId),
      versions: [
        {
          versionNumber: 1,
          data: source.toObject(),
          tiptapHtml: source.tiptapHtml,
          createdAt: new Date(),
        },
      ],
      isNew: true,
    });

    const saved = await cloned.save();
    await DashboardService.invalidateDashboardCache(userId);
    return saved;
  }

  static async deleteResume(id: string, userId: string) {
    const result = await Resume.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (result) {
      await DashboardService.invalidateDashboardCache(userId);
    }
    return result;
  }

  static async generateResumeContent(promptData: {
    targetRole: string;
    yearsOfExperience?: number;
    rawSkills?: string[];
    userBio?: string;
    targetIndustry?: string;
    keyAchievements?: string;
    educationContext?: string;
    model?: string;
  }) {
    const prompt = `
Generate a structured, ATS-optimized resume in JSON format for a "${promptData.targetRole}" with ${promptData.yearsOfExperience ?? 3} years of experience.
Candidate notes: ${promptData.userBio || 'Skilled professional'}.
Required skills context: ${(promptData.rawSkills || []).join(', ')}.
${promptData.targetIndustry ? `Target Industry / Domain: ${promptData.targetIndustry}.` : ''}
${promptData.keyAchievements ? `Key Accomplishments to integrate: ${promptData.keyAchievements}.` : ''}
${promptData.educationContext ? `Education Context: ${promptData.educationContext}.` : ''}
Return strictly a valid JSON object matching this schema:
{
  "summary": "string",
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "tools": ["string"]
  },
  "experience": [
    {
      "company": "string",
      "position": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": boolean,
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issueDate": "string"
    }
  ],
  "achievements": ["string"]
}
`;

    const modelsToTry = [
      promptData.model || 'llama-3.3-70b-versatile',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    for (const candidate of modelsToTry) {
      try {
        if (this.isGroqModel(candidate)) {
          const groq = this.getGroqClient();
          if (!groq) continue;

          const resolvedGroq = ChatService.resolveGroqModel(candidate);
          console.log(`[Resume AI] Generating structured resume with Groq model: ${resolvedGroq}`);
          const comp = await groq.chat.completions.create({
            model: resolvedGroq,
            messages: [
              {
                role: 'system',
                content:
                  'You are an executive resume writer and ATS specialist. Return strictly a valid JSON object matching the requested schema. No conversational preamble, no markdown fences.',
              },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
          });

          const raw = comp.choices[0]?.message?.content || '{}';
          const parsed = JSON.parse(raw);
          if (parsed && parsed.summary) {
            console.log(`[Resume AI] Successfully generated resume with Groq (${resolvedGroq})`);
            return parsed;
          }
        } else {
          const resolvedGemini = ChatService.resolveGeminiModel(candidate);
          const gemini = this.getGeminiModel(resolvedGemini);
          if (!gemini) continue;

          console.log(`[Resume AI] Generating structured resume with Gemini model: ${resolvedGemini}`);
          const res = await gemini.generateContent(prompt);
          const raw = res.response.text();
          const parsed = JSON.parse(raw);
          if (parsed && parsed.summary) {
            console.log(`[Resume AI] Successfully generated resume with Gemini (${candidate})`);
            return parsed;
          }
        }
      } catch (err: any) {
        console.warn(`[Resume AI] Candidate ${candidate} failed: ${err.message}. Retrying fallback...`);
      }
    }

    console.warn('[Resume AI] All remote models failed. Falling back to default structured resume.');
    return {
      summary: `Results-driven ${promptData.targetRole} with proven track record of architecting scalable applications, enhancing operational efficiency, and driving high-impact technical initiatives.`,
      skills: {
        technical: promptData.rawSkills || ['TypeScript', 'Node.js', 'React', 'MongoDB', 'Docker', 'AWS'],
        soft: ['Problem Solving', 'Cross-functional Collaboration', 'Agile Leadership'],
        tools: ['Git', 'Postman', 'VS Code', 'Jira'],
      },
      experience: [
        {
          company: 'Tech Solutions Inc.',
          position: `Senior ${promptData.targetRole}`,
          location: 'Remote',
          startDate: '2022-01',
          endDate: 'Present',
          current: true,
          bullets: [
            'Architected distributed microservices handling 2M+ requests daily with 99.98% uptime.',
            'Mentored junior engineers and instituted code review standards reducing production incidents by 34%.',
            'Implemented automated CI/CD deployment pipelines reducing deployment cycle time by 45%.',
          ],
        },
      ],
      education: [
        {
          institution: 'State University',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2017',
          endDate: '2021',
          gpa: '3.8/4.0',
        },
      ],
      projects: [
        {
          name: 'Cloud Infrastructure Optimizer',
          description: 'Automated resource right-sizing engine analyzing metrics to eliminate idle cloud compute spend.',
          technologies: ['Node.js', 'TypeScript', 'AWS CloudWatch'],
        },
      ],
      certifications: [
        {
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          issueDate: '2023',
        },
      ],
      achievements: [
        'Awarded Developer of the Year 2023 across an engineering department of 120+ contributors.',
      ],
    };
  }
}
