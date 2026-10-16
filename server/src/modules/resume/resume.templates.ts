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
<h1>${personalInfo?.fullName || 'Your Name'}</h1>
<p>${contactParts.join(' &nbsp;|&nbsp; ')}</p>
<hr />

${summary ? `<h2>Professional Summary</h2>\n<p>${summary}</p>` : ''}

${skills?.technical?.length ? `
<h2>Core Competencies</h2>
<p><strong>Technical Skills:</strong> ${skills.technical.join(', ')}</p>
${skills.tools?.length ? `<p><strong>Tools & Frameworks:</strong> ${skills.tools.join(', ')}</p>` : ''}
` : ''}

${experience?.length ? `
<h2>Work Experience</h2>
${experience.map(exp => `
<h3>${exp.position} &mdash; ${exp.company}</h3>
<p><em>${exp.startDate} &ndash; ${exp.current ? 'Present' : exp.endDate || ''}${exp.location ? ` | ${exp.location}` : ''}</em></p>
<ul>
  ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('\n  ')}
</ul>
`).join('\n')}
` : ''}

${projects?.length ? `
<h2>Featured Projects</h2>
${projects.map(proj => `
<h3>${proj.name}${proj.link ? ` (${proj.link})` : ''}</h3>
<p>${proj.description}</p>
${proj.technologies?.length ? `<p><strong>Technologies:</strong> ${proj.technologies.join(', ')}</p>` : ''}
`).join('\n')}
` : ''}

${education?.length ? `
<h2>Education</h2>
${education.map(edu => `
<h3>${edu.degree} in ${edu.fieldOfStudy} &mdash; ${edu.institution}</h3>
<p><em>${edu.startDate} &ndash; ${edu.endDate || 'Present'}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</em></p>
`).join('\n')}
` : ''}

${certifications?.length ? `
<h2>Certifications</h2>
<ul>
  ${certifications.map(c => `<li><strong>${c.name}</strong> &mdash; ${c.issuer} (${c.issueDate || ''})</li>`).join('\n  ')}
</ul>
` : ''}

${achievements?.length ? `
<h2>Key Achievements</h2>
<ul>
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
