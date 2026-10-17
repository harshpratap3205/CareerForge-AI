import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();
import { app } from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/modules/auth/user.model.js';
import { Consultant, Booking } from '../src/modules/booking/booking.model.js';
import { Resume } from '../src/modules/resume/resume.model.js';
import { ChatSession } from '../src/modules/chat/chat.model.js';
import { Payment } from '../src/modules/payment/payment.model.js';
import { redisClient } from '../src/config/redis.js';

describe('CareerForge API Test Suite', () => {
  jest.setTimeout(30000);

  let authToken = '';
  let testUserId = '';
  let testConsultantId = '';
  let testBookingId = '';
  let testResumeId = '';
  let testSessionId = '';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerforge_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  }, 30000);

  afterAll(async () => {
    try {
      if (redisClient) {
        await redisClient.quit();
      }
    } catch {
      // Ignore redis quit error
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('1. Health Check', () => {
    it('should return 200 ok for health endpoint', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('2. Authentication Flow', () => {
    const testEmail = `test_${Date.now()}@example.com`;

    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Engineer',
          email: testEmail,
          password: 'Password123!',
          role: 'USER',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      authToken = res.body.data.tokens.accessToken;
      testUserId = res.body.data.user._id;
    });

    it('should reject registration with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Duplicate',
          email: testEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
    });

    it('should log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should retrieve current user profile with auth token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testEmail);
    });
  });

  describe('3. AI Chat Sessions', () => {
    it('should create a chat session', async () => {
      const res = await request(app)
        .post('/api/chat/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Mock Interview Prep' });

      expect(res.status).toBe(201);
      expect(res.body.data.session.title).toBe('Mock Interview Prep');
      testSessionId = res.body.data.session._id;
    });

    it('should send a message to the session', async () => {
      const res = await request(app)
        .post(`/api/chat/sessions/${testSessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'How do I optimize system design for 100k QPS?' });

      expect(res.status).toBe(200);
      expect(res.body.data.userMsg).toBeDefined();
      expect(res.body.data.botMsg).toBeDefined();
    }, 20000);

    it('should list all user chat sessions', async () => {
      const res = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sessions.length).toBeGreaterThan(0);
    });
  });

  describe('4. Resume Builder & Template Engine', () => {
    it('should create a new resume with ATS structure', async () => {
      const res = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Senior MERN Developer Resume',
          templateId: 'modern',
          personalInfo: {
            fullName: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+1 555-0199',
            location: 'San Francisco, CA',
          },
          summary: 'Experienced distributed systems engineer with 5+ years building cloud-native platforms.',
          skills: {
            technical: ['Node.js', 'TypeScript', 'React', 'MongoDB', 'Redis'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.resume._id).toBeDefined();
      expect(res.body.data.resume.tiptapHtml).toContain('Jane Doe');
      testResumeId = res.body.data.resume._id;
    });

    it('should switch template to ats-classic', async () => {
      const res = await request(app)
        .put(`/api/resumes/${testResumeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: 'ats-classic' });

      expect(res.status).toBe(200);
      expect(res.body.data.resume.templateId).toBe('ats-classic');
      expect(res.body.data.resume.tiptapHtml).toContain('Core Competencies');
    });

    it('should duplicate an existing resume', async () => {
      const res = await request(app)
        .post(`/api/resumes/${testResumeId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.resume.title).toContain('(Copy)');
    });
  });

  describe('5. Consultation Booking & State Machine', () => {
    beforeAll(async () => {
      const uniqueEmail = `alex.rivera.${Date.now()}@careerforge.test`;
      const consultant = await Consultant.create({
        name: 'Alex Rivera',
        email: uniqueEmail,
        specialty: 'System Design Interviewer',
        hourlyRate: 80,
        slots: ['11:00', '15:00'],
        isActive: true,
      });
      testConsultantId = consultant._id.toString();
    });

    it('should prevent booking slots in the past', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultantId: testConsultantId,
          date: '2020-01-01',
          timeSlot: '11:00',
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1 555-0199',
          meetingAgenda: 'System design mock interview',
        });

      expect(res.status).toBe(400);
    });

    it('should successfully create a pending booking for a valid future slot', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultantId: testConsultantId,
          date: dateStr,
          timeSlot: '11:00',
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1 555-0199',
          meetingAgenda: 'System design mock interview',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.booking.status).toBe('PENDING_PAYMENT');
      testBookingId = res.body.data.booking._id;
    });

    it('should prevent double booking for the same slot', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultantId: testConsultantId,
          date: dateStr,
          timeSlot: '11:00',
          name: 'Another User',
          email: 'another@example.com',
          phone: '+1 555-9999',
          meetingAgenda: 'Resume review',
        });

      expect(res.status).toBe(409);
    });

    it('should support server-side pagination and search', async () => {
      const res = await request(app)
        .get('/api/bookings?page=1&limit=5&status=PENDING_PAYMENT')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.items).toBeInstanceOf(Array);
    });
  });

  describe('6. Payment & Webhook Idempotency', () => {
    it('should confirm booking and transition state to CONFIRMED', async () => {
      const res = await request(app)
        .post('/api/payments/mock-confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bookingId: testBookingId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('confirmed');

      const updated = await Booking.findById(testBookingId);
      expect(updated?.status).toBe('CONFIRMED');
      expect(updated?.meetingLink).toBeDefined();
    }, 25000);
  });

  describe('7. Dashboard & Aggregation', () => {
    it('should return aggregated dashboard metrics', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalResumes).toBeGreaterThan(0);
      expect(res.body.data.totalChats).toBeGreaterThan(0);
      expect(res.body.data.upcomingConsultations).toBeGreaterThan(0);
    });
  });
});
