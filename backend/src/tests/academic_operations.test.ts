import request from 'supertest';
import http from 'http';
import app from '../app';
import prisma from '../config/prisma';

describe('Academic Operations & Guidance Mode Test Suite', () => {
  let server: http.Server;
  let academicToken = '';
  let studentToken = '';
  let cseBranchId = '';
  let testSubjectId = '';
  let createdRoutineId = '';
  let createdNoticeId = '';
  let createdDeadlineId = '';
  let createdGuidanceId = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    // 1. Authenticate Academic Officer
    const acadRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'academic@nexora.edu', password: 'Password123!' });
    expect(acadRes.status).toBe(200);
    academicToken = acadRes.body.data.token;

    // 2. Authenticate Student (Aryan)
    const studentRes = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'aryan@nexora.edu', password: 'Password123!' });
    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.data.token;

    // Get Branch & Subject IDs
    const branch = await prisma.branch.findFirst({ where: { code: 'CSE' } });
    expect(branch).not.toBeNull();
    cseBranchId = branch!.id;

    const subject = await prisma.subject.findFirst({ where: { branchId: cseBranchId } });
    expect(subject).not.toBeNull();
    testSubjectId = subject!.id;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  });

  describe('1. Academic Officer Dashboard', () => {
    it('GET /api/academic/dashboard should return comprehensive operational metrics', async () => {
      const res = await request(server)
        .get('/api/academic/dashboard')
        .set('Authorization', `Bearer ${academicToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toBeDefined();
      expect(typeof res.body.data.metrics.pendingApprovals).toBe('number');
      expect(typeof res.body.data.metrics.approvedCount).toBe('number');
      expect(typeof res.body.data.metrics.totalSubjects).toBe('number');
      expect(typeof res.body.data.metrics.todayClasses).toBe('number');
      expect(typeof res.body.data.metrics.upcomingDeadlines).toBe('number');
      expect(typeof res.body.data.metrics.guidanceArticles).toBe('number');
      expect(Array.isArray(res.body.data.todayClasses)).toBe(true);
      expect(Array.isArray(res.body.data.deadlines)).toBe(true);
      expect(Array.isArray(res.body.data.guidanceItems)).toBe(true);
    });
  });

  describe('2. Daily Academic Routine Management', () => {
    it('Academic Officer creates a new lecture routine entry', async () => {
      const res = await request(server)
        .post('/api/academic/routine')
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          subjectId: testSubjectId,
          branchId: cseBranchId,
          year: 2,
          semester: 3,
          section: 'A',
          day: 'MONDAY',
          startTime: '15:00',
          endTime: '16:00',
          room: 'CSE-301',
          faculty: 'Prof. Sanjeev Mohanty',
          type: 'LECTURE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.room).toBe('CSE-301');
      expect(res.body.data.type).toBe('LECTURE');
      createdRoutineId = res.body.data.id;
    });

    it('Academic Officer updates the routine entry', async () => {
      const res = await request(server)
        .put(`/api/academic/routine/${createdRoutineId}`)
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          room: 'CSE-305',
          type: 'TUTORIAL',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.room).toBe('CSE-305');
      expect(res.body.data.type).toBe('TUTORIAL');
    });

    it('Student can view the updated routine via /api/student/routine', async () => {
      const res = await request(server)
        .get('/api/student/routine')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cohort.branchCode).toBe('CSE');
      expect(Array.isArray(res.body.data.weekly)).toBe(true);
    });

    it('Student CANNOT create routine entries (RBAC 403 Forbidden)', async () => {
      const res = await request(server)
        .post('/api/academic/routine')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subjectId: testSubjectId,
          branchId: cseBranchId,
          year: 2,
          day: 'FRIDAY',
          startTime: '10:00',
          endTime: '11:00',
          room: 'CSE-101',
        });

      expect(res.status).toBe(403);
    });

    it('Academic Officer deletes the routine entry', async () => {
      const res = await request(server)
        .delete(`/api/academic/routine/${createdRoutineId}`)
        .set('Authorization', `Bearer ${academicToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Academic Notices Management', () => {
    it('Academic Officer publishes an official academic notice', async () => {
      const res = await request(server)
        .post('/api/academic/notices')
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          title: 'Mid-Semester Lab Evaluation Notice',
          content: 'All 2nd year students must submit complete lab journals by Thursday.',
          priority: 'URGENT',
          status: 'PUBLISHED',
          targets: [
            { targetType: 'BRANCH', targetValue: 'CSE' },
            { targetType: 'YEAR', targetValue: '2' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Mid-Semester Lab Evaluation Notice');
      createdNoticeId = res.body.data.id;
    });

    it('Academic Officer can toggle notice publish status', async () => {
      const res = await request(server)
        .patch(`/api/academic/notices/${createdNoticeId}/publish`)
        .set('Authorization', `Bearer ${academicToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('Student CANNOT create official notices (RBAC 403 Forbidden)', async () => {
      const res = await request(server)
        .post('/api/academic/notices')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Student Notice',
          content: 'This should be blocked',
          targets: [{ targetType: 'ALL', targetValue: 'ALL' }],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('4. Academic Deadlines Management', () => {
    it('Academic Officer creates an academic deadline', async () => {
      const res = await request(server)
        .post('/api/academic/deadlines')
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          title: 'Internship NOC Form Submission Deadline',
          description: 'Last date to submit verification documents for summer internship.',
          deadline: '2026-11-20T17:00:00Z',
          targetYear: 2,
          targetBranchId: cseBranchId,
          relatedForm: 'INTERNSHIP',
          actionUrl: '/student/documents?purpose=Internship',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      createdDeadlineId = res.body.data.id;
    });

    it('Student views upcoming deadlines via /api/student/deadlines', async () => {
      const res = await request(server)
        .get('/api/student/deadlines')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find((d: any) => d.id === createdDeadlineId);
      expect(found).toBeDefined();
      expect(found.title).toContain('Internship NOC');
    });

    it('Student CANNOT create deadlines (RBAC 403 Forbidden)', async () => {
      const res = await request(server)
        .post('/api/academic/deadlines')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Malicious Deadline',
          description: 'Hacked',
          deadline: '2026-10-10T00:00:00Z',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('5. Guidance Mode & Knowledge Graph', () => {
    it('Academic Officer creates a new structured Guidance Item', async () => {
      const res = await request(server)
        .post('/api/academic/guidance')
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          title: 'How to Apply for Hackathon Travel Grant',
          category: 'SCHOLARSHIP',
          subcategory: 'GRANT',
          description: 'Guidelines to claim travel and registration grant for recognized hackathons.',
          requiredDocs: [
            'Hackathon Invitation / Selection Letter',
            'College ID Card',
            'Event Schedule & Location Details',
          ],
          processSteps: [
            'Obtain team acceptance letter from hackathon organizers',
            'Fill grant application form in Academic Cell',
            'Dean Academic approves travel authorization',
            'Submit travel ticket proofs upon return for reimbursement',
          ],
          responsibleRole: 'ACADEMIC_OFFICER',
          relatedForm: 'BONAFIDE',
          actionUrl: '/student/documents?purpose=Education',
          actionLabel: 'Apply for Event Bonafide',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('How to Apply for Hackathon Travel Grant');
      createdGuidanceId = res.body.data.id;
    });

    it('Student views Guidance items via /api/student/guidance', async () => {
      const res = await request(server)
        .get('/api/student/guidance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify structure matches requirements
      const bonafideGuide = res.body.data.find((g: any) => g.category === 'CERTIFICATE');
      expect(bonafideGuide).toBeDefined();
      expect(Array.isArray(bonafideGuide.requiredDocs)).toBe(true);
      expect(Array.isArray(bonafideGuide.processSteps)).toBe(true);
      expect(bonafideGuide.actionUrl).toBeDefined();
      expect(bonafideGuide.actionLabel).toBeDefined();
    });

    it('Student CANNOT modify guidance content (RBAC 403 Forbidden)', async () => {
      const res = await request(server)
        .delete(`/api/academic/guidance/${createdGuidanceId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('6. Academic Requests & Certificate Approvals Desk', () => {
    it('Academic Officer views all requests via /api/academic/requests', async () => {
      const res = await request(server)
        .get('/api/academic/requests')
        .set('Authorization', `Bearer ${academicToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const item = res.body.data[0];
        expect(item.request).toBeDefined();
        expect(item.request.requester).toBeDefined();
      }
    });
  });
});
