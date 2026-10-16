import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import { config } from '../../config/env.js';
import { Resume, IResume } from './resume.model.js';
import { ResumeTemplateEngine } from './resume.templates.js';
import { cacheDel } from '../../config/redis.js';

export class ResumeService {
  private static getGeminiModel() {
    if (!config.gemini.apiKey) return null;
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    return genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
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
    await cacheDel(`dashboard:${userId}`);
    return saved;
  }

  static async updateResume(id: string, userId: string, updateData: Partial<IResume>) {
    const resume = await Resume.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!resume) {
      const err: any = new Error('Resume not found');
      err.statusCode = 404;
      throw err;
    }

    Object.assign(resume, updateData);

    if (updateData.templateId || !resume.tiptapHtml) {
      resume.tiptapHtml = ResumeTemplateEngine.render(resume, resume.templateId);
    }

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
    await cacheDel(`dashboard:${userId}`);
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
    await cacheDel(`dashboard:${userId}`);
    return saved;
  }

  static async deleteResume(id: string, userId: string) {
    const result = await Resume.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (result) {
      await cacheDel(`dashboard:${userId}`);
    }
    return result;
  }

  static async generateResumeContent(promptData: {
    targetRole: string;
    yearsOfExperience?: number;
    rawSkills?: string[];
    userBio?: string;
  }) {
    const model = this.getGeminiModel();
    if (!model) {
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

    const prompt = `
Generate a structured, ATS-optimized resume in JSON format for a "${promptData.targetRole}" with ${promptData.yearsOfExperience || 3} years of experience.
Candidate notes: ${promptData.userBio || 'Skilled full-stack developer'}.
Return strictly a valid JSON matching this schema:
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

    try {
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini Resume Generation Error:', err);
      throw new Error('Failed to generate resume with AI');
    }
  }
}
