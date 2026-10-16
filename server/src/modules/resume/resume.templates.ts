import { IResume } from './resume.model.js';

export class ResumeTemplateEngine {
  static render(resume: Partial<IResume>, templateId: 'modern' | 'ats-classic' = 'modern'): string {
    if (templateId === 'ats-classic') {
      return this.renderAtsClassic(resume);
    }
    return this.renderModern(resume);
  }

  static renderModern(resume: Partial<IResume>): string {
    const { personalInfo, summary, experience, education, skills, projects, certifications, achievements } = resume;

    const contactParts = [
      personalInfo?.email,
      personalInfo?.phone,
      personalInfo?.location,
      personalInfo?.linkedin,
      personalInfo?.github,
    ].filter(Boolean);

    return `
<div class="resume-modern-header">
  <h1 style="color: #1e1b4b; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px;">${personalInfo?.fullName || 'Your Name'}</h1>
  <p style="color: #4f46e5; font-size: 13px; font-weight: 600; margin-bottom: 6px;">${summary?.slice(0, 60) ? 'Professional Portfolio' : ''}</p>
  <p style="color: #64748b; font-size: 12px; margin-bottom: 14px;">${contactParts.join(' &nbsp;&bull;&nbsp; ')}</p>
  <hr style="border: none; border-top: 2px solid #e0e7ff; margin-bottom: 16px;" />
</div>

${summary ? `
<h2 style="color: #4338ca; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px;">Executive Summary</h2>
<p style="font-size: 13px; line-height: 1.6; color: #334155;">${summary}</p>
` : ''}

${skills?.technical?.length ? `
<h2 style="color: #4338ca; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px;">Core Competencies</h2>
<p style="font-size: 13px; margin-bottom: 4px;"><strong>Technical Skills:</strong> ${skills.technical.join(', ')}</p>
${skills.tools?.length ? `<p style="font-size: 13px; margin-bottom: 4px;"><strong>Frameworks & Tools:</strong> ${skills.tools.join(', ')}</p>` : ''}
` : ''}

${experience?.length ? `
<h2 style="color: #4338ca; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px;">Professional Experience</h2>
${experience.map(exp => `
<div style="margin-bottom: 12px;">
  <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${exp.position} &mdash; <span style="color: #4f46e5; font-weight: 600;">${exp.company}</span></h3>
  <p style="color: #64748b; font-size: 12px; font-style: italic; margin-bottom: 6px;">${exp.startDate} &ndash; ${exp.current ? 'Present' : exp.endDate || ''}${exp.location ? ` | ${exp.location}` : ''}</p>
  <ul style="font-size: 13px; line-height: 1.5; color: #334155; padding-left: 18px;">
    ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('\n    ')}
  </ul>
</div>
`).join('\n')}
` : ''}

${projects?.length ? `
<h2 style="color: #4338ca; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px;">Key Projects</h2>
${projects.map(proj => `
<div style="margin-bottom: 10px;">
  <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${proj.name}${proj.link ? ` &mdash; <a href="${proj.link}" style="color: #4f46e5; font-size: 12px; text-decoration: none;">View Project</a>` : ''}</h3>
  <p style="font-size: 13px; color: #334155; margin-bottom: 4px;">${proj.description}</p>
  ${proj.technologies?.length ? `<p style="font-size: 12px; color: #64748b;"><strong>Technologies:</strong> ${proj.technologies.join(', ')}</p>` : ''}
</div>
`).join('\n')}
` : ''}

${education?.length ? `
<h2 style="color: #4338ca; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px;">Education & Credentials</h2>
${education.map(edu => `
<div style="margin-bottom: 8px;">
  <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${edu.degree} in ${edu.fieldOfStudy} &mdash; ${edu.institution}</h3>
  <p style="color: #64748b; font-size: 12px; font-style: italic;">${edu.startDate} &ndash; ${edu.endDate || 'Present'}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</p>
</div>
`).join('\n')}
` : ''}

${certifications?.length ? `
<h2 style="color: #4338ca; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px;">Certifications</h2>
<ul style="font-size: 13px; color: #334155; padding-left: 18px;">
  ${certifications.map(c => `<li><strong>${c.name}</strong> &mdash; ${c.issuer} (${c.issueDate || ''})</li>`).join('\n  ')}
</ul>
` : ''}

${achievements?.length ? `
<h2 style="color: #4338ca; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px;">Key Achievements</h2>
<ul style="font-size: 13px; color: #334155; padding-left: 18px;">
  ${achievements.map(a => `<li>${a}</li>`).join('\n  ')}
</ul>
` : ''}
    `.trim();
  }

  static renderAtsClassic(resume: Partial<IResume>): string {
    const { personalInfo, summary, experience, education, skills, projects, certifications, achievements } = resume;

    const contactParts = [
      personalInfo?.location,
      personalInfo?.phone,
      personalInfo?.email,
      personalInfo?.linkedin,
      personalInfo?.github,
    ].filter(Boolean);

    return `
<h1>${(personalInfo?.fullName || 'Your Name').toUpperCase()}</h1>
<p>${contactParts.join(' &nbsp;|&nbsp; ')}</p>
<hr />

${summary ? `<h2>PROFESSIONAL SUMMARY</h2>\n<p>${summary}</p>` : ''}

${skills?.technical?.length ? `
<h2>TECHNICAL SKILLS</h2>
<p><strong>Core Competencies:</strong> ${skills.technical.join(', ')}</p>
${skills.tools?.length ? `<p><strong>Tools:</strong> ${skills.tools.join(', ')}</p>` : ''}
` : ''}

${experience?.length ? `
<h2>PROFESSIONAL EXPERIENCE</h2>
${experience.map(exp => `
<h3>${exp.position} &mdash; ${exp.company}</h3>
<p><em>${exp.startDate} &ndash; ${exp.current ? 'Present' : exp.endDate || ''}</em></p>
<ul>
  ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('\n  ')}
</ul>
`).join('\n')}
` : ''}

${projects?.length ? `
<h2>KEY PROJECTS</h2>
${projects.map(proj => `
<h3>${proj.name}</h3>
<p>${proj.description}</p>
${proj.technologies?.length ? `<p><strong>Technologies:</strong> ${proj.technologies.join(', ')}</p>` : ''}
`).join('\n')}
` : ''}

${education?.length ? `
<h2>EDUCATION</h2>
${education.map(edu => `
<h3>${edu.degree} in ${edu.fieldOfStudy} &mdash; ${edu.institution}</h3>
<p><em>${edu.startDate} &ndash; ${edu.endDate || 'Present'}</em></p>
`).join('\n')}
` : ''}

${certifications?.length ? `
<h2>CERTIFICATIONS</h2>
<ul>
  ${certifications.map(c => `<li>${c.name} &mdash; ${c.issuer} (${c.issueDate || ''})</li>`).join('\n  ')}
</ul>
` : ''}

${achievements?.length ? `
<h2>HONORS & AWARDS</h2>
<ul>
  ${achievements.map(a => `<li>${a}</li>`).join('\n  ')}
</ul>
` : ''}
    `.trim();
  }
}
