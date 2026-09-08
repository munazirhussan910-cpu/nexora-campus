import request from 'supertest';
import http from 'http';
import app from '../app';
import prisma from '../config/prisma';

describe('Nexora Campus Backend Test Suite', () => {
  let server: http.Server;
  let aryanToken = '';
  let rameshToken = '';
  let wardenToken = '';
  let securityToken = '';
  let adminToken = '';

  let createdComplaintRequestId = '';
  let createdGatePassId = '';
  let gatePassPin = '';
  let createdBonafideId = '';
  let generatedCertId = '';
  let createdLeaveId = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    // 1. Authenticate Demo Personas
    const aryanRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'aryan@nexora.edu', password: 'Password123!' });
    expect(aryanRes.status).toBe(200);
    aryanToken = aryanRes.body.data.token;

    const rameshRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'ramesh@nexora.edu', password: 'Password123!' });
    expect(rameshRes.status).toBe(200);
    rameshToken = rameshRes.body.data.token;

    const wardenRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'warden.b@nexora.edu', password: 'Password123!' });
    expect(wardenRes.status).toBe(200);
    wardenToken = wardenRes.body.data.token;

    const securityRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'security.gate1@nexora.edu', password: 'Password123!' });
    expect(securityRes.status).toBe(200);
    securityToken = securityRes.body.data.token;

    const adminRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'admin@nexora.edu', password: 'Password123!' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
    await prisma.$disconnect();
  });

  describe('1. Authentication & RBAC', () => {
    test('GET /api/auth/me should return authenticated user details and role', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${aryanToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.user.rollNumber).toBe('220101048');
    });

    test('RBAC: Unauthorized role should receive 403 Forbidden for Admin endpoint', async () => {
      const res = await request(server)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${aryanToken}`);
      expect(res.status).toBe(403);
    });

    test('Persona Quick Switcher endpoint should switch session to Ramesh', async () => {
      const res = await request(server)
        .post('/api/auth/switch-persona')
        .send({ persona: 'ramesh' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('STAFF');
      expect(res.body.data.user.specialization).toBe('PLUMBING');
    });
  });

  describe('2. Complaint Workflow & Deterministic Routing', () => {
    test('Student creates complaint: tap leak should route to Plumbing & assign to Ramesh', async () => {
      const res = await request(server)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${aryanToken}`)
        .send({
          title: 'Bathroom tap leak in Block B',
          description: 'Water is dripping from the washbasin tap continuously',
          priority: 'NORMAL',
          location: 'Hostel B / Room 204',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.requestNumber).toMatch(/^NX-\d+/);
      expect(res.body.data.routing.category).toBe('Plumbing');
      expect(res.body.data.routing.specialization).toBe('PLUMBING');
      createdComplaintRequestId = res.body.data.id;
    });

    test('Staff accepts assigned complaint', async () => {
      const res = await request(server)
        .post(`/api/complaints/${createdComplaintRequestId}/accept`)
        .set('Authorization', `Bearer ${rameshToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACCEPTED');
    });

    test('Staff starts work on complaint', async () => {
      const res = await request(server)
        .post(`/api/complaints/${createdComplaintRequestId}/start`)
        .set('Authorization', `Bearer ${rameshToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    test('Staff resolves complaint with resolution notes', async () => {
      const res = await request(server)
        .post(`/api/complaints/${createdComplaintRequestId}/resolve`)
        .set('Authorization', `Bearer ${rameshToken}`)
        .send({ resolutionNotes: 'Replaced Teflon tape and rubber washer in spindle.' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');
    });

    test('Student confirms resolution and rates complaint', async () => {
      const confirmRes = await request(server)
        .post(`/api/complaints/${createdComplaintRequestId}/confirm`)
        .set('Authorization', `Bearer ${aryanToken}`);
      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.status).toBe('CONFIRMED');

      const rateRes = await request(server)
        .post(`/api/complaints/${createdComplaintRequestId}/rating`)
        .set('Authorization', `Bearer ${aryanToken}`)
        .send({ rating: 5, feedback: 'Fixed quickly and works cleanly!' });
      expect(rateRes.status).toBe(200);
      expect(rateRes.body.data.studentRating).toBe(5);
    });

    test('State transition validation prevents illegal status transition (CLOSED -> APPROVED)', async () => {
      const res = await request(server)
        .patch(`/api/requests/${createdComplaintRequestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('3. Gate Pass Module & QR/PIN Verification', () => {
    test('Student applies for Gate Pass', async () => {
      const dep = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const ret = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();

      const res = await request(server)
        .post('/api/gate-passes')
        .set('Authorization', `Bearer ${aryanToken}`)
        .send({
          destination: 'Bhubaneswar Central Mall',
          reason: 'Weekend groceries and academic books',
          departureTime: dep,
          expectedReturnTime: ret,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.gatePass.gateStatus).toBe('PENDING_APPROVAL');
      createdGatePassId = res.body.data.gatePass.id;
      gatePassPin = res.body.data.gatePass.passPin;
    });

    test('Warden approves Gate Pass (generates QR Token & activates PIN)', async () => {
      const res = await request(server)
        .post(`/api/gate-passes/${createdGatePassId}/approve`)
        .set('Authorization', `Bearer ${wardenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gateStatus).toBe('APPROVED');
      expect(res.body.data.qrTokenHash).toBeTruthy();
    });

    test('Security Officer verifies Gate Pass by PIN', async () => {
      const res = await request(server)
        .post('/api/gate-passes/verify')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({ tokenOrPin: gatePassPin });

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.status).toBe('VALID');
      expect(res.body.data.student.rollNumber).toBe('220101048');
    });

    test('Security Officer marks Student as DEPARTED', async () => {
      const res = await request(server)
        .post(`/api/gate-passes/${createdGatePassId}/depart`)
        .set('Authorization', `Bearer ${securityToken}`)
        .send({ verificationMethod: 'PIN', notes: 'Departed on foot' });

      expect(res.status).toBe(200);
      expect(res.body.data.gateStatus).toBe('DEPARTED');
    });

    test('Security Officer marks Student as RETURNED', async () => {
      const res = await request(server)
        .post(`/api/gate-passes/${createdGatePassId}/return`)
        .set('Authorization', `Bearer ${securityToken}`)
        .send({ verificationMethod: 'PIN', notes: 'Returned safely' });

      expect(res.status).toBe(200);
      expect(res.body.data.gateStatus).toBe('RETURNED');
    });
  });

  describe('4. Bonafide Certificate & Document Verification', () => {
    test('Student applies for Bonafide Certificate', async () => {
      const res = await request(server)
        .post('/api/bonafide')
        .set('Authorization', `Bearer ${aryanToken}`)
        .send({ purpose: 'State Merit Scholarship Verification' });

      expect(res.status).toBe(201);
      createdBonafideId = res.body.data.bonafide.id;
    });

    test('Authority approves Bonafide Certificate and generates dynamic PDF', async () => {
      const res = await request(server)
        .post(`/api/bonafide/${createdBonafideId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificateId).toMatch(/^NX-BON-2026-\d+/);
      expect(res.body.data.documentUrl).toContain('.pdf');
      generatedCertId = res.body.data.certificateId;
    });

    test('Public Document Verification API verifies certificate', async () => {
      const res = await request(server).get(`/api/verify/document/${generatedCertId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.status).toBe('VALID');
      expect(res.body.data.studentName).toBe('Aryan Khan');
      expect(res.body.data.certificateId).toBe(generatedCertId);
    });
  });

  describe('5. Hostel Leave Module', () => {
    test('Student submits leave request', async () => {
      const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(server)
        .post('/api/leaves')
        .set('Authorization', `Bearer ${aryanToken}`)
        .send({
          startDate: start,
          endDate: end,
          reason: 'Family wedding event',
          emergencyContact: '+91 9876500001 (Father)',
          parentConsent: true,
        });

      expect(res.status).toBe(201);
      createdLeaveId = res.body.data.leave.id;
    });

    test('Warden approves leave request', async () => {
      const res = await request(server)
        .post(`/api/leaves/${createdLeaveId}/approve`)
        .set('Authorization', `Bearer ${wardenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('6. Admin Command Center, SLA, Recurring Issues & Audit Trail', () => {
    test('GET /api/admin/dashboard returns operational cockpit metrics', async () => {
      const res = await request(server)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.totalRequests).toBeGreaterThan(0);
      expect(res.body.data.categoryBreakdown).toBeInstanceOf(Array);
      expect(res.body.data.recurringIssues).toBeInstanceOf(Array);
    });

    test('Section 44: Recurring Issue Detection detects Block B Plumbing cluster', async () => {
      const res = await request(server)
        .get('/api/admin/recurring-issues')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find(
        (issue: any) => issue.hostelBlock.includes('Block B') && issue.category === 'Plumbing'
      );
      expect(found).toBeDefined();
      expect(found.complaintCount).toBeGreaterThanOrEqual(3);
    });

    test('Immutable Audit Logs record actions', async () => {
      const res = await request(server)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const actions = res.body.data.map((l: any) => l.action);
      expect(actions).toContain('REQUEST_CREATED');
    });
  });

  describe('7. Kiosk & Non-Smartphone SMS Integration', () => {
    test('Kiosk student lookup by roll number', async () => {
      const res = await request(server).get('/api/kiosk/student/220101048');
      expect(res.status).toBe(200);
      expect(res.body.data.student.fullName).toBe('Aryan Khan');
    });

    test('SMS Inbound Gateway parses text ticket and creates complaint', async () => {
      const res = await request(server)
        .post('/api/integrations/sms/inbound')
        .send({
          from: '+91 9876543210',
          message: 'TICKET B204 TAP LEAKING HEAVILY',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.requestNumber).toMatch(/^NX-\d+/);
      expect(res.body.data.category).toBe('Plumbing');
    });
  });
});
