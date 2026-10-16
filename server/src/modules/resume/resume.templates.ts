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

    return `
<div class="resume modern-template font-sans text-gray-800 p-8 max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm rounded-lg">
  <header class="border-b-2 border-indigo-600 pb-4 mb-6">
    <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">${personalInfo?.fullName || 'Full Name'}</h1>
    <div class="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
      ${personalInfo?.email ? `<span>✉ ${personalInfo.email}</span>` : ''}
      ${personalInfo?.phone ? `<span>📱 ${personalInfo.phone}</span>` : ''}
      ${personalInfo?.location ? `<span>📍 ${personalInfo.location}</span>` : ''}
      ${personalInfo?.linkedin ? `<span>🔗 ${personalInfo.linkedin}</span>` : ''}
      ${personalInfo?.github ? `<span>💻 ${personalInfo.github}</span>` : ''}
    </div>
  </header>

  ${summary ? `
  <section class="mb-6">
    <h2 class="text-lg font-bold text-indigo-700 uppercase tracking-wider mb-2">Professional Summary</h2>
    <p class="text-gray-700 leading-relaxed">${summary}</p>
  </section>` : ''}

  ${skills?.technical?.length ? `
  <section class="mb-6">
    <h2 class="text-lg font-bold text-indigo-700 uppercase tracking-wider mb-2">Core Competencies</h2>
    <div class="flex flex-wrap gap-2">
      ${skills.technical.map(s => `<span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-xs font-semibold">${s}</span>`).join('')}
    </div>
  </section>` : ''}

  ${experience?.length ? `
  <section class="mb-6">
    <h2 class="text-lg font-bold text-indigo-700 uppercase tracking-wider mb-3">Work Experience</h2>
    <div class="space-y-4">
      ${experience.map(exp => `
        <div>
          <div class="flex justify-between items-baseline">
            <h3 class="font-bold text-gray-900 text-base">${exp.position} <span class="text-indigo-600">@ ${exp.company}</span></h3>
            <span class="text-xs text-gray-500 font-medium">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || ''}</span>
          </div>
          ${exp.location ? `<div class="text-xs text-gray-400 mb-1">${exp.location}</div>` : ''}
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-700 mt-1">
            ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  ${projects?.length ? `
  <section class="mb-6">
    <h2 class="text-lg font-bold text-indigo-700 uppercase tracking-wider mb-3">Featured Projects</h2>
    <div class="space-y-3">
      ${projects.map(proj => `
        <div>
          <div class="flex justify-between items-baseline">
            <h3 class="font-bold text-gray-900 text-sm">${proj.name}</h3>
            ${proj.link ? `<a href="${proj.link}" class="text-xs text-indigo-600 underline" target="_blank">Live Demo</a>` : ''}
          </div>
          <p class="text-xs text-gray-600 mt-0.5">${proj.description}</p>
          ${proj.technologies?.length ? `<div class="text-xs text-gray-500 mt-1"><strong>Tech:</strong> ${proj.technologies.join(', ')}</div>` : ''}
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  ${education?.length ? `
  <section class="mb-6">
    <h2 class="text-lg font-bold text-indigo-700 uppercase tracking-wider mb-3">Education</h2>
    <div class="space-y-2">
      ${education.map(edu => `
        <div class="flex justify-between items-baseline">
          <div>
            <h3 class="font-bold text-gray-900 text-sm">${edu.degree} in ${edu.fieldOfStudy}</h3>
            <div class="text-xs text-gray-600">${edu.institution} ${edu.gpa ? `(GPA: ${edu.gpa})` : ''}</div>
          </div>
          <span class="text-xs text-gray-500">${edu.startDate} - ${edu.endDate || 'Present'}</span>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  ${(certifications?.length || achievements?.length) ? `
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    ${certifications?.length ? `
    <section>
      <h2 class="text-md font-bold text-indigo-700 uppercase tracking-wider mb-2">Certifications</h2>
      <ul class="text-xs space-y-1 text-gray-700">
        ${certifications.map(c => `<li>• <strong>${c.name}</strong> - ${c.issuer} (${c.issueDate})</li>`).join('')}
      </ul>
    </section>` : ''}

    ${achievements?.length ? `
    <section>
      <h2 class="text-md font-bold text-indigo-700 uppercase tracking-wider mb-2">Key Achievements</h2>
      <ul class="text-xs space-y-1 text-gray-700">
        ${achievements.map(a => `<li>• ${a}</li>`).join('')}
      </ul>
    </section>` : ''}
  </div>` : ''}
</div>
    `.trim();
  }

  static renderAtsClassic(resume: Partial<IResume>): string {
    const { personalInfo, summary, experience, education, skills, projects, certifications, achievements } = resume;

    return `
<article class="resume ats-classic max-w-4xl mx-auto bg-white text-black p-8 font-serif leading-normal">
  <header style="text-align: center; margin-bottom: 20px;">
    <h1 style="font-size: 26px; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 1px;">${personalInfo?.fullName || 'Full Name'}</h1>
    <p style="font-size: 13px; margin: 0;">
      ${[personalInfo?.location, personalInfo?.phone, personalInfo?.email, personalInfo?.linkedin, personalInfo?.github]
        .filter(Boolean)
        .join(' | ')}
    </p>
  </header>

  ${summary ? `
  <section style="margin-bottom: 16px;">
    <h2 style="font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px;">Professional Summary</h2>
    <p style="font-size: 13px; margin: 0; line-height: 1.4;">${summary}</p>
  </section>` : ''}

  ${skills?.technical?.length ? `
  <section style="margin-bottom: 16px;">
    <h2 style="font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px;">Technical Skills</h2>
    <p style="font-size: 13px; margin: 0;"><strong>Core Competencies:</strong> ${skills.technical.join(', ')}</p>
    ${skills.tools?.length ? `<p style="font-size: 13px; margin: 4px 0 0 0;"><strong>Tools & Platforms:</strong> ${skills.tools.join(', ')}</p>` : ''}
  </section>` : ''}

  ${experience?.length ? `
  <section style="margin-bottom: 16px;">
    <h2 style="font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px;">Professional Experience</h2>
    ${experience.map(exp => `
      <div style="margin-bottom: 10px;">
        <table style="width: 100%; font-size: 13px; font-weight: bold; margin-bottom: 3px;">
          <tr>
            <td style="text-align: left;">${exp.position} - ${exp.company}</td>
            <td style="text-align: right; font-weight: normal;">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || ''}</td>
          </tr>
        </table>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.35;">
          ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
  </section>` : ''}

  ${projects?.length ? `
  <section style="margin-bottom: 16px;">
    <h2 style="font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px;">Key Projects</h2>
    ${projects.map(proj => `
      <div style="margin-bottom: 8px;">
        <p style="font-size: 13px; margin: 0;"><strong>${proj.name}</strong>: ${proj.description} ${proj.technologies?.length ? `<em>(${proj.technologies.join(', ')})</em>` : ''}</p>
      </div>
    `).join('')}
  </section>` : ''}

  ${education?.length ? `
  <section style="margin-bottom: 16px;">
    <h2 style="font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px;">Education</h2>
    ${education.map(edu => `
      <table style="width: 100%; font-size: 13px; margin-bottom: 4px;">
        <tr>
          <td style="text-align: left;"><strong>${edu.degree} in ${edu.fieldOfStudy}</strong>, ${edu.institution}</td>
          <td style="text-align: right;">${edu.startDate} - ${edu.endDate || 'Present'}</td>
        </tr>
      </table>
    `).join('')}
  </section>` : ''}

  ${certifications?.length ? `
  <section style="margin-bottom: 16px;">
    <h2 style="font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px;">Certifications</h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
      ${certifications.map(c => `<li>${c.name} - ${c.issuer} (${c.issueDate})</li>`).join('')}
    </ul>
  </section>` : ''}

  ${achievements?.length ? `
  <section style="margin-bottom: 16px;">
    <h2 style="font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px;">Honors & Achievements</h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
      ${achievements.map(a => `<li>${a}</li>`).join('')}
    </ul>
  </section>` : ''}
</article>
    `.trim();
  }
}
