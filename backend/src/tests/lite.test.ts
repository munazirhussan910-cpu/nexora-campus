import request from 'supertest';
import http from 'http';
import app from '../app';
import prisma from '../config/prisma';

describe('Nexora Lite Student-Only API Suite', () => {
  let server: http.Server;
  let studentToken = '';
  let staffToken = '';
  let adminToken = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => resolve());
    });

    // Login as Student (Aryan)
    const stuRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'aryan@nexora.edu', password: 'Password123!' });
    studentToken = stuRes.body.data.token;

    // Login as Staff (Ramesh)
    const stfRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'ramesh@nexora.edu', password: 'Password123!' });
    staffToken = stfRes.body.data.token;

    // Login as Admin
    const admRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'admin@nexora.edu', password: 'Password123!' });
    adminToken = admRes.body.data.token;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) server.close(() => resolve());
      else resolve();
    });
    await prisma.$disconnect();
  });

  describe('1. Access Control & Student-Only Boundary', () => {
    it('Unauthenticated requests to /api/lite/me are rejected with 401', async () => {
      const res = await request(server).get('/api/lite/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Staff role is strictly forbidden from Lite APIs (403 Forbidden)', async () => {
      const res = await request(server)
        .get('/api/lite/me')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Admin role is strictly forbidden from Lite APIs (403 Forbidden)', async () => {
      const res = await request(server)
        .get('/api/lite/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Student Identity & Compact Lite Endpoints', () => {
    it('GET /api/lite/me returns full student identity and QR code data', async () => {
      const res = await request(server)
        .get('/api/lite/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.role).toBe('STUDENT');
      expect(data.fullName).toBe('Aryan Khan');
      expect(data.rollNumber).toBe('220101048');
      expect(data.department).toBe('CSE');
      expect(data.institution).toContain('BPUT');
      expect(data.status).toBe('ACTIVE');
      expect(data.qrCodeData).toContain('NEXORA:STUDENT:220101048');
    });

    it('GET /api/lite/attendance returns compact overall and subject attendance', async () => {
      const res = await request(server)
        .get('/api/lite/attendance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(typeof data.overallPercentage).toBe('number');
      expect(typeof data.totalClasses).toBe('number');
      expect(typeof data.attendedClasses).toBe('number');
      expect(Array.isArray(data.subjects)).toBe(true);
      expect(data.lastUpdated).toBeDefined();
    });

    it('GET /api/lite/timetable returns today and weekly classes', async () => {
      const res = await request(server)
        .get('/api/lite/timetable')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.todayDay).toBeDefined();
      expect(Array.isArray(data.todayClasses)).toBe(true);
      expect(Array.isArray(data.allEntries)).toBe(true);
    });

    it('GET /api/lite/updates returns compact published notices', async () => {
      const res = await request(server)
        .get('/api/lite/updates')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.updates)).toBe(true);
    });

    it('GET /api/lite/requests returns compact requests with gate pass / bonafide details', async () => {
      const res = await request(server)
        .get('/api/lite/requests')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.requests)).toBe(true);
    });
  });
});
