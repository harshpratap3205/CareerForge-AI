import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../modules/auth/user.model.js';
import { Consultant } from '../modules/booking/booking.model.js';
import { Resume } from '../modules/resume/resume.model.js';
import { ResumeTemplateEngine } from '../modules/resume/resume.templates.js';

async function seedAll() {
  try {
    await connectDB();
    console.log('[Seed] Database connected successfully.');

    // 1. Seed Platform Administrator
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@careerforge.ai').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.role = 'ADMIN';
      admin.passwordHash = adminHash;
      await admin.save();
      console.log(`[Seed] Updated Administrator: ${adminEmail}`);
    } else {
      admin = await User.create({
        name: 'Platform Administrator',
        email: adminEmail,
        passwordHash: adminHash,
        role: 'ADMIN',
      });
      console.log(`[Seed] Created Administrator: ${adminEmail}`);
    }

    // 2. Seed Career Consultants
    const consultantPassword = 'Consultant@123';
    const consultantHash = await bcrypt.hash(consultantPassword, 10);

    // Consultant 1: Sarah Jenkins
    let sarahUser = await User.findOne({ email: 'sarah.jenkins@careerforge.ai' });
    if (!sarahUser) {
      sarahUser = await User.create({
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@careerforge.ai',
        passwordHash: consultantHash,
        role: 'CONSULTANT',
      });
    } else {
      sarahUser.passwordHash = consultantHash;
      sarahUser.role = 'CONSULTANT';
      await sarahUser.save();
    }

    let sarah = await Consultant.findOne({ email: 'sarah.jenkins@careerforge.ai' });
    if (!sarah) {
      sarah = await Consultant.create({
        userId: sarahUser._id,
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@careerforge.ai',
        specialty: 'FAANG Tech Lead & Resume Reviewer',
        hourlyRate: 75,
        bio: 'Former Google Staff Engineer with 10+ years interviewing candidates.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        slots: [
          '10:00 AM - 11:00 AM',
          '01:00 PM - 02:00 PM',
          '03:00 PM - 04:00 PM',
          '04:00 PM - 05:00 PM',
        ],
        isActive: true,
      });
    } else {
      sarah.userId = sarahUser._id;
      sarah.slots = [
        '10:00 AM - 11:00 AM',
        '01:00 PM - 02:00 PM',
        '03:00 PM - 04:00 PM',
        '04:00 PM - 05:00 PM',
      ];
      await sarah.save();
    }
    console.log('[Seed] Ready Consultant 1: sarah.jenkins@careerforge.ai / Consultant@123');

    // Consultant 2: David Chen
    let davidUser = await User.findOne({ email: 'david.chen@careerforge.ai' });
    if (!davidUser) {
      davidUser = await User.create({
        name: 'David Chen',
        email: 'david.chen@careerforge.ai',
        passwordHash: consultantHash,
        role: 'CONSULTANT',
      });
    } else {
      davidUser.passwordHash = consultantHash;
      davidUser.role = 'CONSULTANT';
      await davidUser.save();
    }

    let david = await Consultant.findOne({ email: 'david.chen@careerforge.ai' });
    if (!david) {
      david = await Consultant.create({
        userId: davidUser._id,
        name: 'David Chen',
        email: 'david.chen@careerforge.ai',
        specialty: 'Executive Recruiter & Career Coach',
        hourlyRate: 60,
        bio: 'Head of Talent at Silicon Valley venture studio. Placed 250+ senior engineers.',
        availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        slots: [
          '09:00 AM - 10:00 AM',
          '11:00 AM - 12:00 PM',
          '02:00 PM - 03:00 PM',
          '03:00 PM - 04:00 PM',
        ],
        isActive: true,
      });
    } else {
      david.userId = davidUser._id;
      david.slots = [
        '09:00 AM - 10:00 AM',
        '11:00 AM - 12:00 PM',
        '02:00 PM - 03:00 PM',
        '03:00 PM - 04:00 PM',
      ];
      await david.save();
    }
    console.log('[Seed] Ready Consultant 2: david.chen@careerforge.ai / Consultant@123');

    // 3. Seed Default Candidate / User
    const candidateEmail = 'candidate@careerforge.ai';
    const candidatePassword = 'Candidate@123';
    const candidateHash = await bcrypt.hash(candidatePassword, 10);

    let candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) {
      candidate = await User.create({
        name: 'Alex Morgan',
        email: candidateEmail,
        passwordHash: candidateHash,
        role: 'USER',
        phone: '+1 555-0199',
      });
      console.log(`[Seed] Created Test Candidate: ${candidateEmail} / ${candidatePassword}`);
    } else {
      candidate.passwordHash = candidateHash;
      candidate.role = 'USER';
      await candidate.save();
      console.log(`[Seed] Updated Test Candidate: ${candidateEmail}`);
    }

    // 4. Ensure sample resume for candidate
    const existingResume = await Resume.findOne({ userId: candidate._id });
    if (!existingResume) {
      const sampleResume = {
        userId: candidate._id,
        title: 'Full Stack Engineer - Production ATS Resume',
        templateId: 'modern' as const,
        personalInfo: {
          fullName: 'Alex Morgan',
          email: 'candidate@careerforge.ai',
          phone: '+1 555-0199',
          location: 'San Francisco, CA',
          linkedin: 'linkedin.com/in/alexmorgan',
          github: 'github.com/alexmorgan',
        },
        summary: 'Full-Stack Developer with 4+ years architecting scalable cloud-native microservices, high-concurrency event-driven systems with Redis, and React/Next.js client applications.',
        experience: [
          {
            company: 'TechForge Solutions',
            position: 'Senior Software Engineer',
            location: 'San Francisco, CA',
            startDate: '2022-03',
            endDate: 'Present',
            current: true,
            bullets: [
              'Architected distributed caching with Redis cluster reducing database response latencies by 68%.',
              'Engineered end-to-end payment processing pipelines with Stripe webhook idempotency handling $1.2M in annual volume.',
              'Mentored junior engineers and conducted 50+ technical hiring assessments.',
            ],
          },
        ],
        education: [
          {
            institution: 'University of California, Berkeley',
            degree: 'B.S.',
            fieldOfStudy: 'Computer Science',
            startDate: '2017',
            endDate: '2021',
          },
        ],
        skills: {
          technical: ['TypeScript', 'Node.js', 'React', 'Next.js', 'Express', 'MongoDB', 'Redis', 'Docker', 'AWS'],
        },
      };

      const tiptapHtml = ResumeTemplateEngine.render(sampleResume as any, 'modern');
      await Resume.create({
        ...sampleResume,
        tiptapHtml,
        versions: [{ versionNumber: 1, data: sampleResume, tiptapHtml, createdAt: new Date() }],
      });
      console.log('[Seed] Created sample ATS resume for test candidate.');
    }

    console.log('\n======================================================');
    console.log('✅ ALL DEMO ACCOUNTS SEEDED SUCCESSFULLY:');
    console.log('1. Admin:       admin@careerforge.ai          / Admin@123456');
    console.log('2. Consultant:  sarah.jenkins@careerforge.ai  / Consultant@123');
    console.log('3. Consultant:  david.chen@careerforge.ai     / Consultant@123');
    console.log('4. Candidate:   candidate@careerforge.ai      / Candidate@123');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Seeding failed:', error);
    process.exit(1);
  }
}

seedAll();
