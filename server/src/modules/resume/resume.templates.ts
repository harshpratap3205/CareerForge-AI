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

    const mailIcon = `<svg style="display:inline-block;vertical-align:-2px;margin-right:4px;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
    const phoneIcon = `<svg style="display:inline-block;vertical-align:-2px;margin-right:4px;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
    const pinIcon = `<svg style="display:inline-block;vertical-align:-2px;margin-right:4px;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
    const linkIcon = `<svg style="display:inline-block;vertical-align:-2px;margin-right:4px;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

    const contactItems: string[] = [];
    if (personalInfo?.email) contactItems.push(`<span>${mailIcon}${personalInfo.email}</span>`);
    if (personalInfo?.phone) contactItems.push(`<span>${phoneIcon}${personalInfo.phone}</span>`);
    if (personalInfo?.location) contactItems.push(`<span>${pinIcon}${personalInfo.location}</span>`);
    if (personalInfo?.linkedin) contactItems.push(`<span>${linkIcon}${personalInfo.linkedin}</span>`);
    if (personalInfo?.github) contactItems.push(`<span>${linkIcon}${personalInfo.github}</span>`);

    return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <!-- Modern Header Banner -->
  <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 18px;">
    <div style="height: 4px; width: 48px; background: #4f46e5; border-radius: 2px; margin-bottom: 8px;"></div>
    <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.02em;">
      ${personalInfo?.fullName || 'Your Name'}
    </h1>
    <div style="font-size: 13px; font-weight: 600; color: #4f46e5; margin-bottom: 10px;">
      ${(personalInfo as any)?.headline || 'Professional Profile'}
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #64748b;">
      ${contactItems.join('')}
    </div>
  </div>

  ${summary ? `
  <div style="margin-bottom: 18px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin: 0 0 6px 0; display: flex; items-center;">
      Executive Summary
    </h2>
    <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">${summary}</p>
  </div>
  ` : ''}

  ${(skills?.technical?.length || skills?.tools?.length) ? `
  <div style="margin-bottom: 18px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin: 0 0 8px 0;">
      Core Competencies & Stack
    </h2>
    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">
      ${(skills.technical || []).map(s => `<span style="display: inline-block; background-color: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; border-radius: 9999px; padding: 2.5px 11px; font-size: 11px; font-weight: 600;">${s}</span>`).join('')}
      ${(skills.tools || []).map(t => `<span style="display: inline-block; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 9999px; padding: 2.5px 11px; font-size: 11px; font-weight: 600;">${t}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${experience?.length ? `
  <div style="margin-bottom: 18px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin: 0 0 10px 0;">
      Professional Experience
    </h2>
    ${experience.map(exp => `
    <div style="margin-bottom: 14px; padding-left: 12px; border-left: 2px solid #e0e7ff;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">
          ${exp.position} <span style="color: #4f46e5; font-weight: 600;">&bull; ${exp.company}</span>
        </h3>
        <span style="font-size: 11px; font-weight: 600; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; padding: 1px 8px; border-radius: 4px;">
          ${exp.startDate} &ndash; ${exp.current ? 'Present' : exp.endDate || ''}
        </span>
      </div>
      <ul style="margin: 6px 0 0 0; padding-left: 16px; font-size: 13px; color: #334155; line-height: 1.55;">
        ${(exp.bullets || []).map(b => `<li style="margin-bottom: 3px;">${b}</li>`).join('')}
      </ul>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${projects?.length ? `
  <div style="margin-bottom: 18px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin: 0 0 10px 0;">
      Featured Projects
    </h2>
    ${projects.map(p => `
    <div style="margin-bottom: 10px; padding: 10px 12px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px;">
      <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 3px 0;">
        ${p.name}${p.link ? ` &mdash; <a href="${p.link}" style="color: #4f46e5; font-size: 11px; text-decoration: none;">View Project</a>` : ''}
      </h3>
      <p style="font-size: 12px; color: #475569; margin: 0 0 5px 0;">${p.description}</p>
      ${p.technologies?.length ? `
      <div style="display: flex; flex-wrap: wrap; gap: 4px;">
        ${p.technologies.map(t => `<span style="font-size: 10px; font-weight: 600; background: #ffffff; border: 1px solid #e2e8f0; color: #64748b; padding: 1px 6px; border-radius: 3px;">${t}</span>`).join('')}
      </div>` : ''}
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${education?.length ? `
  <div style="margin-bottom: 16px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin: 0 0 8px 0;">
      Education & Credentials
    </h2>
    ${education.map(edu => `
    <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: baseline;">
      <div>
        <strong style="font-size: 13px; color: #0f172a;">${edu.degree} in ${edu.fieldOfStudy}</strong>
        <span style="font-size: 12px; color: #64748b;"> &mdash; ${edu.institution}</span>
      </div>
      <span style="font-size: 11px; color: #94a3b8;">${edu.startDate} &ndash; ${edu.endDate || 'Present'}</span>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${certifications?.length ? `
  <div style="margin-bottom: 14px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin: 0 0 6px 0;">
      Certifications
    </h2>
    <div style="font-size: 12px; color: #334155;">
      ${certifications.map(c => `<div>&bull; <strong>${c.name}</strong> &mdash; ${c.issuer} (${c.issueDate || ''})</div>`).join('')}
    </div>
  </div>
  ` : ''}

  ${achievements?.length ? `
  <div>
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin: 0 0 6px 0;">
      Honors & Awards
    </h2>
    <div style="font-size: 12px; color: #334155;">
      ${achievements.map(a => `<div>&bull; ${a}</div>`).join('')}
    </div>
  </div>
  ` : ''}
</div>
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
<div style="font-family: 'Times New Roman', Times, Georgia, serif; color: #000000; line-height: 1.45; max-width: 100%;">
  <!-- Strict Single-Column Centered Header -->
  <div style="text-align: center; margin-bottom: 14px;">
    <h1 style="font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px 0; color: #000000;">
      ${(personalInfo?.fullName || 'YOUR NAME').toUpperCase()}
    </h1>
    <p style="font-size: 12px; margin: 0; color: #111111;">
      ${contactParts.join(' &nbsp;|&nbsp; ')}
    </p>
    <hr style="border: 0; border-top: 1.5px solid #000000; margin: 8px 0 12px 0;" />
  </div>

  ${summary ? `
  <div style="margin-bottom: 14px;">
    <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000000; padding-bottom: 2px; margin: 0 0 5px 0;">
      PROFESSIONAL SUMMARY
    </h2>
    <p style="font-size: 12px; margin: 0; text-align: justify;">${summary}</p>
  </div>
  ` : ''}

  ${(skills?.technical?.length || skills?.tools?.length) ? `
  <div style="margin-bottom: 14px;">
    <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000000; padding-bottom: 2px; margin: 0 0 5px 0;">
      TECHNICAL SKILLS
    </h2>
    <p style="font-size: 12px; margin: 0 0 3px 0;">
      <strong>Core Competencies:</strong> ${(skills.technical || []).join(', ')}
    </p>
    ${skills.tools?.length ? `
    <p style="font-size: 12px; margin: 0;">
      <strong>Frameworks & Tools:</strong> ${skills.tools.join(', ')}
    </p>` : ''}
  </div>
  ` : ''}

  ${experience?.length ? `
  <div style="margin-bottom: 14px;">
    <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000000; padding-bottom: 2px; margin: 0 0 6px 0;">
      WORK EXPERIENCE
    </h2>
    ${experience.map(exp => `
    <div style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <strong>${exp.position} &mdash; ${exp.company}</strong>
        <span>${exp.startDate} &ndash; ${exp.current ? 'Present' : exp.endDate || ''}</span>
      </div>
      <ul style="margin: 3px 0 0 0; padding-left: 20px; font-size: 12px;">
        ${(exp.bullets || []).map(b => `<li style="margin-bottom: 2px;">${b}</li>`).join('')}
      </ul>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${projects?.length ? `
  <div style="margin-bottom: 14px;">
    <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000000; padding-bottom: 2px; margin: 0 0 6px 0;">
      TECHNICAL PROJECTS
    </h2>
    ${projects.map(proj => `
    <div style="margin-bottom: 6px; font-size: 12px;">
      <strong>${proj.name}</strong>: ${proj.description}
      ${proj.technologies?.length ? ` (Technologies: ${proj.technologies.join(', ')})` : ''}
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${education?.length ? `
  <div style="margin-bottom: 14px;">
    <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000000; padding-bottom: 2px; margin: 0 0 5px 0;">
      EDUCATION
    </h2>
    ${education.map(edu => `
    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
      <div><strong>${edu.degree} in ${edu.fieldOfStudy}</strong> &mdash; ${edu.institution}</div>
      <span>${edu.startDate} &ndash; ${edu.endDate || 'Present'}</span>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${certifications?.length ? `
  <div style="margin-bottom: 12px;">
    <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000000; padding-bottom: 2px; margin: 0 0 5px 0;">
      CERTIFICATIONS
    </h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 12px;">
      ${certifications.map(c => `<li>${c.name} &mdash; ${c.issuer} (${c.issueDate || ''})</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${achievements?.length ? `
  <div>
    <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000000; padding-bottom: 2px; margin: 0 0 5px 0;">
      HONORS & AWARDS
    </h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 12px;">
      ${achievements.map(a => `<li>${a}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
</div>
    `.trim();
  }
}
