import request from 'supertest';
import http from 'http';
import app from '../app';
import prisma from '../config/prisma';

describe('Profile Editing For All Roles Test Suite', () => {
  let server: http.Server;

  // Personas Tokens
  let studentToken = '';
  let facultyToken = '';
  let staffToken = '';
  let wardenToken = '';
  let securityToken = '';
  let academicToken = '';
  let adminToken = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    // 1. Authenticate Student (Aryan)
    const stuRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'aryan@nexora.edu', password: 'Password123!' });
    expect(stuRes.status).toBe(200);
    studentToken = stuRes.body.data.token;

    // 2. Authenticate Faculty (Dr. P. K. Tripathy)
    const facRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'faculty@nexora.edu', password: 'Password123!' });
    expect(facRes.status).toBe(200);
    facultyToken = facRes.body.data.token;

    // 3. Authenticate Staff (Ramesh Kumar - Plumber)
    const stfRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'ramesh@nexora.edu', password: 'Password123!' });
    expect(stfRes.status).toBe(200);
    staffToken = stfRes.body.data.token;

    // 4. Authenticate Warden (Dr. S. K. Mohapatra)
    const wrdRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'warden.b@nexora.edu', password: 'Password123!' });
    expect(wrdRes.status).toBe(200);
    wardenToken = wrdRes.body.data.token;

    // 5. Authenticate Security (Vikram Singh)
    const secRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'security.gate1@nexora.edu', password: 'Password123!' });
    expect(secRes.status).toBe(200);
    securityToken = secRes.body.data.token;

    // 6. Authenticate Academic Officer (Prof. Sanjeev Mohanty)
    const acaRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'academic@nexora.edu', password: 'Password123!' });
    expect(acaRes.status).toBe(200);
    academicToken = acaRes.body.data.token;

    // 7. Authenticate Admin (Dr. Ananya Ray)
    const admRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'admin@nexora.edu', password: 'Password123!' });
    expect(admRes.status).toBe(200);
    adminToken = admRes.body.data.token;
  });

  afterAll(async () => {
    // Restore demo student (Aryan)
    await prisma.student.updateMany({
      where: { rollNumber: '220101048' },
      data: {
        fullName: 'Aryan Khan',
        phone: '+91 9876543210',
        parentPhone: '+91 9876500001',
      },
    });
    // Restore demo staff (Ramesh)
    await prisma.staff.updateMany({
      where: { employeeId: 'STF-PLUMB-01' },
      data: {
        fullName: 'Ramesh Kumar',
        phone: '+91 9876543220',
        department: 'Maintenance',
        designation: 'Senior Plumber',
        specialization: 'PLUMBING',
      },
    });
    // Restore demo faculty (Dr. Tripathy)
    await prisma.staff.updateMany({
      where: { employeeId: 'FAC-CSE-01' },
      data: {
        fullName: 'Dr. Prasanta Tripathy',
        phone: '+91 9876543270',
        department: 'Computer Science',
        designation: 'Associate Professor',
      },
    });
    // Restore demo warden (Dr. Mohapatra)
    await prisma.staff.updateMany({
      where: { employeeId: 'WRD-HOS-B' },
      data: {
        fullName: 'Dr. S. K. Mohapatra',
        phone: '+91 9876543230',
        designation: 'Hostel Warden',
      },
    });
    // Restore demo security (Vikram Singh)
    await prisma.staff.updateMany({
      where: { employeeId: 'SEC-GATE-01' },
      data: {
        fullName: 'Vikram Singh',
        phone: '+91 9876543240',
        designation: 'Chief Gate Officer',
      },
    });
    // Restore demo academic officer (Prof. Sanjeev Mohanty)
    await prisma.staff.updateMany({
      where: { employeeId: 'ACA-OFF-01' },
      data: {
        fullName: 'Prof. Sanjeev Mohanty',
        phone: '+91 9876543260',
        designation: 'Chief Academic Officer',
      },
    });
    // Restore demo admin (Dr. Ananya Ray)
    await prisma.staff.updateMany({
      where: { employeeId: 'ADM-DIR-01' },
      data: {
        fullName: 'Dr. Ananya Ray',
        phone: '+91 9876543250',
        designation: 'Dean Student Affairs',
      },
    });

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  });

  describe('1. Security & Protection Rules', () => {
    it('Unauthenticated user cannot update profile (401 Unauthorized)', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .send({ fullName: 'Malicious Hack' });
      expect(res.status).toBe(401);
    });

    it('Role escalation is strictly blocked: Student cannot change role to ADMIN', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          fullName: 'Aryan Khan',
          role: 'ADMIN',
          roleId: 'admin-id-attempt',
          permissions: ['all'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('STUDENT');

      // Verify in session me
      const meRes = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(meRes.body.data.user.role).toBe('STUDENT');
    });

    it('Email and institutional IDs cannot be altered through profile editing', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          email: 'hacked@email.com',
          rollNumber: '999999999',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('aryan@nexora.edu');
      expect(res.body.data.user.rollNumber).toBe('220101048');
    });
  });

  describe('2. Student Role Profile Editing', () => {
    it('Student successfully updates name, phone, parentPhone, and bio', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          fullName: 'Aryan K. Khan',
          phone: '+91 9876543299',
          parentPhone: '+91 9876500099',
          bio: '2nd Year B.Tech CSE student passionate about distributed systems and hackathons.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Aryan K. Khan');
      expect(res.body.data.user.phone).toBe('+91 9876543299');
      expect(res.body.data.user.parentPhone).toBe('+91 9876500099');
      expect(res.body.data.user.bio).toContain('distributed systems');

      // Verify persistence on GET /api/auth/me
      const meRes = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(meRes.body.data.user.fullName).toBe('Aryan K. Khan');
      expect(meRes.body.data.user.phone).toBe('+91 9876543299');
      expect(meRes.body.data.user.bio).toContain('distributed systems');
    });
  });

  describe('3. Faculty Role Profile Editing', () => {
    it('Faculty member successfully updates name, phone, department, designation, and bio', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          fullName: 'Dr. Prasanta K. Tripathy',
          phone: '+91 9876543271',
          department: 'Computer Science & Engineering',
          designation: 'Senior Professor & Dean Academics',
          bio: 'Faculty advisor for Algorithms and Computer Architecture research labs.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Dr. Prasanta K. Tripathy');
      expect(res.body.data.user.designation).toBe('Senior Professor & Dean Academics');
      expect(res.body.data.user.bio).toContain('Faculty advisor');

      const meRes = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(meRes.body.data.user.fullName).toBe('Dr. Prasanta K. Tripathy');
    });
  });

  describe('4. Staff Role Profile Editing', () => {
    it('Maintenance Staff successfully updates name, duty mobile, and specialization', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'Ramesh Kumar (Lead)',
          phone: '+91 9876543225',
          department: 'Campus Facilities & Maintenance',
          designation: 'Lead Maintenance Specialist',
          specialization: 'PLUMBING_AND_HYDRAULICS',
          bio: 'Available 8 AM to 6 PM for emergency hostel plumbing and pipeline issues.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Ramesh Kumar (Lead)');
      expect(res.body.data.user.specialization).toBe('PLUMBING_AND_HYDRAULICS');
    });
  });

  describe('5. Warden Role Profile Editing', () => {
    it('Hostel Warden successfully updates office hours, phone, and residential bio', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${wardenToken}`)
        .send({
          fullName: 'Dr. S. K. Mohapatra',
          phone: '+91 9876543239',
          designation: 'Chief Warden & Housing Director',
          bio: 'Hostel Block B administration. In-person approvals between 5 PM and 7 PM.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.designation).toBe('Chief Warden & Housing Director');
      expect(res.body.data.user.bio).toContain('Hostel Block B administration');
    });
  });

  describe('6. Security Role Profile Editing', () => {
    it('Security Officer successfully updates gate phone and post details', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({
          fullName: 'Vikram Singh (Head Sentry)',
          phone: '+91 9876543245',
          designation: 'Main Gate Sentry Commander',
          bio: 'Main Gate security station cabin 1. Emergency radio channel 4.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Vikram Singh (Head Sentry)');
      expect(res.body.data.user.designation).toBe('Main Gate Sentry Commander');
    });
  });

  describe('7. Academic Officer Role Profile Editing', () => {
    it('Academic Officer successfully updates office consultation hours and bio', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          fullName: 'Prof. Sanjeev Mohanty',
          phone: '+91 9876543265',
          designation: 'Chief Academic Operations Officer',
          bio: 'In-charge of university bonafide certificates, routine schedules, and academic petitions.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.designation).toBe('Chief Academic Operations Officer');
      expect(res.body.data.user.bio).toContain('bonafide certificates');
    });
  });

  describe('8. Chief Admin Role Profile Editing', () => {
    it('Campus Director / Admin successfully updates directorate statement and phone', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Dr. Ananya Ray',
          phone: '+91 9876543255',
          designation: 'Campus Operations Director & Chief Executive',
          bio: 'Executive campus oversight, cross-departmental operations, and emergency crisis management.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Dr. Ananya Ray');
      expect(res.body.data.user.designation).toBe('Campus Operations Director & Chief Executive');
    });
  });

  describe('9. Mentor Profile Eligibility Invariance Check', () => {
    it('Confirmed: Student mentor eligibility is preserved after profile changes', async () => {
      const res = await request(server)
        .get('/api/mentors/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(true);
      expect(res.body.data.student.year).toBe(2);
    });
  });
});
