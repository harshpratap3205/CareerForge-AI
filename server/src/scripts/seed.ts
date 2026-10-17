import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../modules/auth/user.model.js';
import { Consultant } from '../modules/booking/booking.model.js';
import { Resume, IResume } from '../modules/resume/resume.model.js';
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
    // 3. Seed Candidate Demo User
    const candidatePassword = 'Candidate@123';
    const candidateHash = await bcrypt.hash(candidatePassword, 10);
    let candidateUser = await User.findOne({ email: 'candidate@careerforge.ai' });
    if (!candidateUser) {
      candidateUser = await User.create({
        name: 'Alex Johnson',
        email: 'candidate@careerforge.ai',
        passwordHash: candidateHash,
        role: 'USER',
        phone: '+1 (555) 234-5678',
        targetRole: 'Senior Full-Stack Engineer',
        skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'Docker', 'AWS'],
        bio: 'Senior Full-Stack Developer with 6+ years specializing in distributed systems, real-time architectures, and high-performance React frontends.',
      });
      console.log(`[Seed] Created Demo Candidate: candidate@careerforge.ai / Candidate@123`);
    } else {
      candidateUser.passwordHash = candidateHash;
      candidateUser.role = 'USER';
      await candidateUser.save();
      console.log(`[Seed] Updated Demo Candidate: candidate@careerforge.ai / Candidate@123`);
    }

    // Seed sample resume for Alex Johnson if none exists
    let candidateResume = await Resume.findOne({ userId: candidateUser._id });
    if (!candidateResume) {
      const sampleData: Partial<IResume> = {
        personalInfo: {
          fullName: 'Alex Johnson',
          email: 'candidate@careerforge.ai',
          phone: '+1 (555) 234-5678',
          location: 'San Francisco, CA',
          portfolio: 'https://alexjohnson.dev',
          linkedin: 'https://linkedin.com/in/alexjohnson',
          github: 'https://github.com/alexjohnson',
        },
        summary: 'Senior Full-Stack Engineer with 6+ years of experience building resilient microservices, responsive web apps, and automated CI/CD pipelines.',
        experience: [
          {
            company: 'TechFlow Solutions',
            position: 'Senior Full-Stack Engineer',
            location: 'San Francisco, CA',
            startDate: '2022',
            endDate: 'Present',
            current: true,
            bullets: [
              'Architected distributed event-driven microservices handling 2M+ daily requests using Node.js and Redis.',
              'Spearheaded migration of legacy frontend to Next.js 14, improving Core Web Vitals by 42%.',
            ],
          },
          {
            company: 'Apex Cloud Systems',
            position: 'Software Engineer',
            location: 'Austin, TX',
            startDate: '2019',
            endDate: '2022',
            current: false,
            bullets: [
              'Engineered REST APIs with Express and MongoDB.',
              'Designed real-time collaboration canvas using WebSockets.',
            ],
          },
        ],
        education: [
          {
            institution: 'University of California, Berkeley',
            degree: 'B.S.',
            fieldOfStudy: 'Computer Science',
            startDate: '2015',
            endDate: '2019',
          },
        ],
        skills: {
          technical: ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'Redis', 'Docker', 'PostgreSQL'],
          soft: ['System Design', 'Technical Leadership', 'Cross-functional Collaboration'],
          tools: ['Docker', 'Git', 'AWS', 'Linux'],
        },
        projects: [
          {
            name: 'CloudSync Orchestrator',
            description: 'Real-time multi-cloud deployment visualizer built with React, Go, and Redis.',
            technologies: ['React', 'Go', 'Redis', 'Docker'],
            link: 'https://github.com/alexjohnson/cloudsync',
          },
        ],
        certifications: [
          {
            name: 'AWS Certified Solutions Architect – Associate',
            issuer: 'Amazon Web Services',
            issueDate: '2023',
          },
        ],
        achievements: [
          'Engineered event architecture reducing cloud compute costs by 28% year-over-year',
        ],
      };

      const tiptapHtml = ResumeTemplateEngine.renderModern(sampleData);
      candidateResume = await Resume.create({
        userId: candidateUser._id,
        title: 'Senior Full-Stack Resume',
        templateId: 'modern',
        data: sampleData,
        tiptapHtml,
        versions: [
          {
            versionNumber: 1,
            data: sampleData,
            tiptapHtml,
            createdAt: new Date(),
          },
        ],
      });
      console.log(`[Seed] Seeded sample resume for Alex Johnson.`);
    }

    console.log('\n======================================================');
    console.log('✅ SYSTEM ROLES INITIALIZED:');
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
