import request from 'supertest';
import http from 'http';
import app from '../app';
import prisma from '../config/prisma';
import { resolveStudentYear, isMentorEligible } from '../routes/mentor.routes';

describe('Mentor Profile Eligibility & Authorization Test Suite', () => {
  let server: http.Server;
  let snehaToken = ''; // Year 1 Student
  let aryanToken = ''; // Year 2 Student
  let priyaToken = ''; // Year 3 Student (Existing Mentor)
  let vikasToken = ''; // Year 4 Student (Existing Mentor)

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    // 1. Authenticate 1st Year Student (Sneha Patel)
    const snehaRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'sneha@nexora.edu', password: 'Password123!' });
    expect(snehaRes.status).toBe(200);
    snehaToken = snehaRes.body.data.token;

    // 2. Authenticate 2nd Year Student (Aryan Khan)
    const aryanRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'aryan@nexora.edu', password: 'Password123!' });
    expect(aryanRes.status).toBe(200);
    aryanToken = aryanRes.body.data.token;

    // 3. Authenticate 3rd Year Student (Priya Sen)
    const priyaRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'priya@nexora.edu', password: 'Password123!' });
    expect(priyaRes.status).toBe(200);
    priyaToken = priyaRes.body.data.token;

    // 4. Authenticate 4th Year Student (Vikas Sahu)
    const vikasRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'vikas@nexora.edu', password: 'Password123!' });
    expect(vikasRes.status).toBe(200);
    vikasToken = vikasRes.body.data.token;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  });

  describe('1. Unit Tests: resolveStudentYear & isMentorEligible', () => {
    it('1st Year students (Semester 1 & 2) resolve to Year 1 and are NOT eligible', () => {
      expect(resolveStudentYear({ year: 1 })).toBe(1);
      expect(resolveStudentYear({ year: '1' })).toBe(1);
      expect(resolveStudentYear({ year: '1st Year' })).toBe(1);
      expect(resolveStudentYear({ year: 'FIRST_YEAR' })).toBe(1);
      expect(resolveStudentYear({ semester: 1 })).toBe(1);
      expect(resolveStudentYear({ semester: 2 })).toBe(1);
      expect(resolveStudentYear({ semester: 'Semester 1' })).toBe(1);
      expect(resolveStudentYear({ semester: '2nd Semester' })).toBe(1);

      expect(isMentorEligible({ year: 1 })).toBe(false);
      expect(isMentorEligible({ semester: 1 })).toBe(false);
      expect(isMentorEligible({ semester: 2 })).toBe(false);
      expect(isMentorEligible({ year: '1st Year', semester: 2 })).toBe(false);
    });

    it('2nd Year students (Semester 3 & 4) resolve to Year 2 and ARE ELIGIBLE', () => {
      expect(resolveStudentYear({ year: 2 })).toBe(2);
      expect(resolveStudentYear({ year: '2' })).toBe(2);
      expect(resolveStudentYear({ year: '2nd Year' })).toBe(2);
      expect(resolveStudentYear({ year: 'SECOND_YEAR' })).toBe(2);
      expect(resolveStudentYear({ semester: 3 })).toBe(2);
      expect(resolveStudentYear({ semester: 4 })).toBe(2);
      expect(resolveStudentYear({ semester: 'Semester 3' })).toBe(2);
      expect(resolveStudentYear({ semester: '4th Semester' })).toBe(2);

      expect(isMentorEligible({ year: 2 })).toBe(true);
      expect(isMentorEligible({ semester: 3 })).toBe(true);
      expect(isMentorEligible({ semester: 4 })).toBe(true);
      expect(isMentorEligible({ year: '2nd Year', semester: '4th Semester' })).toBe(true);
    });

    it('3rd Year students (Semester 5 & 6) resolve to Year 3 and ARE ELIGIBLE', () => {
      expect(resolveStudentYear({ year: 3 })).toBe(3);
      expect(resolveStudentYear({ year: '3rd Year' })).toBe(3);
      expect(resolveStudentYear({ semester: 5 })).toBe(3);
      expect(resolveStudentYear({ semester: 6 })).toBe(3);

      expect(isMentorEligible({ year: 3 })).toBe(true);
      expect(isMentorEligible({ semester: 5 })).toBe(true);
    });

    it('4th Year students (Semester 7 & 8) resolve to Year 4 and ARE ELIGIBLE', () => {
      expect(resolveStudentYear({ year: 4 })).toBe(4);
      expect(resolveStudentYear({ year: '4th Year' })).toBe(4);
      expect(resolveStudentYear({ semester: 7 })).toBe(4);
      expect(resolveStudentYear({ semester: 8 })).toBe(4);

      expect(isMentorEligible({ year: 4 })).toBe(true);
      expect(isMentorEligible({ semester: 8 })).toBe(true);
    });
  });

  describe('2. API Integration: 1st Year Student (Sneha)', () => {
    it('GET /api/mentors/me returns isEligible = false for 1st Year student', async () => {
      const res = await request(server)
        .get('/api/mentors/me')
        .set('Authorization', `Bearer ${snehaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.year).toBe(1);
      expect(res.body.data.isEligible).toBe(false);
    });

    it('PUT /api/mentors/me BLOCKS 1st Year student with 403 Forbidden (MENTOR_INELIGIBLE)', async () => {
      const res = await request(server)
        .put('/api/mentors/me')
        .set('Authorization', `Bearer ${snehaToken}`)
        .send({
          headline: '1st Year Trying to Mentor',
          bio: 'I should be rejected by the backend authorization check.',
          isAvailable: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MENTOR_INELIGIBLE');
      expect(res.body.error.message).toContain('Mentor profiles are available from 2nd year onwards');
    });
  });

  describe('3. API Integration: 2nd Year Student (Aryan - Semester 3/4)', () => {
    it('GET /api/mentors/me returns isEligible = true for 2nd Year student without existing profile', async () => {
      const res = await request(server)
        .get('/api/mentors/me')
        .set('Authorization', `Bearer ${aryanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.year).toBe(2);
      expect(res.body.data.isEligible).toBe(true);
    });

    it('PUT /api/mentors/me ALLOWS 2nd Year student to create their mentor profile', async () => {
      const res = await request(server)
        .put('/api/mentors/me')
        .set('Authorization', `Bearer ${aryanToken}`)
        .send({
          headline: 'CSE 2nd Year · Data Structures & Campus Guidance',
          bio: 'Happy to help 1st year juniors with lab setups and discrete mathematics.',
          interests: 'DSA, Operating Systems, Web Development',
          cgpa: 8.5,
          isAvailable: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.headline).toContain('CSE 2nd Year');
      expect(res.body.data.isAvailable).toBe(true);
    });

    it('GET /api/mentors/me now returns hasProfile = true for the 2nd Year student', async () => {
      const res = await request(server)
        .get('/api/mentors/me')
        .set('Authorization', `Bearer ${aryanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasProfile).toBe(true);
      expect(res.body.data.profile).not.toBeNull();
      expect(res.body.data.profile.headline).toContain('CSE 2nd Year');
    });
  });

  describe('4. API Integration: Existing Mentors (Priya - Year 3 & Vikas - Year 4)', () => {
    it('3rd Year existing mentor (Priya) is eligible and hasProfile = true', async () => {
      const res = await request(server)
        .get('/api/mentors/me')
        .set('Authorization', `Bearer ${priyaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.year).toBe(3);
      expect(res.body.data.isEligible).toBe(true);
      expect(res.body.data.hasProfile).toBe(true);
      expect(res.body.data.profile.headline).toBeDefined();
    });

    it('3rd Year existing mentor can edit/update profile without re-creation', async () => {
      const res = await request(server)
        .put('/api/mentors/me')
        .set('Authorization', `Bearer ${priyaToken}`)
        .send({
          headline: 'Mechanical Engineering 3rd Year · CAD & Gate Preparation',
          bio: 'Updated bio for senior mentorship.',
          isAvailable: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('4th Year existing mentor (Vikas) is eligible and hasProfile = true', async () => {
      const res = await request(server)
        .get('/api/mentors/me')
        .set('Authorization', `Bearer ${vikasToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.year).toBe(4);
      expect(res.body.data.isEligible).toBe(true);
      expect(res.body.data.hasProfile).toBe(true);
    });
  });
});
