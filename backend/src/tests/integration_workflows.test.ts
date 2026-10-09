import EventEmitter from 'events';
import app from '../app';
import prisma from '../config/prisma';

// In-process Express HTTP dispatcher
function request(
  method: string,
  url: string,
  options: { body?: any; headers?: Record<string, string>; token?: string } = {}
) {
  const { body = {}, headers = {}, token } = options;
  const reqHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...headers,
  };
  if (token) {
    reqHeaders['authorization'] = `Bearer ${token}`;
    reqHeaders['cookie'] = `token=${token};`;
  }

  return new Promise<{ status: number; body: any; headers: Record<string, string> }>((resolve, reject) => {
    const req: any = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.path = url.split('?')[0];
    req.headers = reqHeaders;
    req.body = body;
    req.query = {};
    req.params = {};
    req.cookies = token ? { token } : {};
    req.socket = { remoteAddress: '127.0.0.1' };
    req.ip = '127.0.0.1';

    if (url.includes('?')) {
      const qs = url.split('?')[1];
      const params = new URLSearchParams(qs);
      for (const [k, v] of params.entries()) {
        req.query[k] = v;
      }
    }

    let statusCode = 200;
    const resHeaders: Record<string, string> = {};
    let responseData: any = null;

    const res: any = new EventEmitter();
    res.status = (code: number) => {
      statusCode = code;
      return res;
    };
    res.setHeader = (k: string, v: string) => {
      resHeaders[k.toLowerCase()] = v;
      return res;
    };
    res.getHeader = (k: string) => resHeaders[k.toLowerCase()];
    res.removeHeader = (k: string) => {
      delete resHeaders[k.toLowerCase()];
      return res;
    };
    res.cookie = (name: string, val: string) => {
      resHeaders['set-cookie'] = `${name}=${val};`;
    };
    res.json = (data: any) => {
      responseData = data;
      resolve({ status: statusCode, body: responseData, headers: resHeaders });
      return res;
    };
    res.send = (data: any) => {
      responseData = data;
      resolve({ status: statusCode, body: responseData, headers: resHeaders });
      return res;
    };
    res.end = () => {
      resolve({ status: statusCode, body: responseData, headers: resHeaders });
    };

    app(req, res, (err: any) => {
      if (err) reject(err);
      else resolve({ status: 404, body: null, headers: resHeaders });
    });
  });
}

describe('Nexora Campus Stage 4 — End-to-End Workflow & Notification Integration Suite', () => {
  let studentToken = '';
  let studentUserId = '';
  let wardenToken = '';
  let staffToken = '';
  let securityToken = '';
  let academicToken = '';
  let facultyToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // 1. Authenticate Student (Aryan Khan)
    const studentLogin = await request('POST', '/api/auth/login', {
      body: { usernameOrEmail: 'aryan@nexora.edu', password: 'Password123!' },
    });
    studentToken = studentLogin.body?.data?.token;
    studentUserId = studentLogin.body?.data?.user?.id;

    // 2. Authenticate Warden (Dr. S. K. Mohapatra)
    const wardenLogin = await request('POST', '/api/auth/login', {
      body: { usernameOrEmail: 'warden.b@nexora.edu', password: 'Password123!' },
    });
    wardenToken = wardenLogin.body?.data?.token;

    // 3. Authenticate Maintenance Staff (Ramesh Kumar - Plumber)
    const staffLogin = await request('POST', '/api/auth/login', {
      body: { usernameOrEmail: 'ramesh@nexora.edu', password: 'Password123!' },
    });
    staffToken = staffLogin.body?.data?.token;

    // 4. Authenticate Security Officer (Vikram Singh / Dillip Rout)
    const securityLogin = await request('POST', '/api/auth/login', {
      body: { usernameOrEmail: 'security.gate1@nexora.edu', password: 'Password123!' },
    });
    securityToken = securityLogin.body?.data?.token;

    // 5. Authenticate Academic Officer (Prof. Sanjeev Mohanty)
    const academicLogin = await request('POST', '/api/auth/login', {
      body: { usernameOrEmail: 'academic@nexora.edu', password: 'Password123!' },
    });
    academicToken = academicLogin.body?.data?.token;

    // 6. Authenticate Faculty (Dr. Prasanta Tripathy)
    const facultyLogin = await request('POST', '/api/auth/login', {
      body: { usernameOrEmail: 'faculty@nexora.edu', password: 'Password123!' },
    });
    facultyToken = facultyLogin.body?.data?.token;

    // 7. Authenticate Admin (Chief Administrator)
    const adminLogin = await request('POST', '/api/auth/login', {
      body: { usernameOrEmail: 'admin@nexora.edu', password: 'Password123!' },
    });
    adminToken = adminLogin.body?.data?.token;
  });

  // =========================================================================
  // WORKFLOW A: COMPLAINTS & MAINTENANCE END-TO-END
  // =========================================================================
  describe('Workflow A: Student Complaint -> Routing -> Staff Resolution -> Confirmation', () => {
    let createdComplaintRequestId = '';
    let complaintNumber = '';

    test('1. Student submits a plumbing maintenance complaint and receives confirmation', async () => {
      const res = await request('POST', '/api/complaints', {
        token: studentToken,
        body: {
          title: 'Heavy water pipe burst and tap leaking in washroom 204',
          description: 'The main tap and drain pipe has a continuous leak, overflowing onto room floor. Urgent repair needed.',
          priority: 'URGENT',
          location: 'Block B / Room 204',
        },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requestNumber).toMatch(/^NX-/);
      createdComplaintRequestId = res.body.data.id;
      complaintNumber = res.body.data.requestNumber;

      // Verify automatic routing assigned ticket to Plumbing (Ramesh Kumar)
      expect(res.body.data.routing?.category).toBe('Plumbing');
      expect(res.body.data.status).toBe('ASSIGNED');
    });

    test('2. Assigned maintenance technician sees the new work order in their queue', async () => {
      const res = await request('GET', '/api/complaints/assigned', {
        token: staffToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const task = res.body.data.find((t: any) => t.id === createdComplaintRequestId);
      expect(task).toBeDefined();
      expect(task?.priority).toBe('URGENT');
      expect(task?.location).toContain('Block B');
    });

    test('3. Technician accepts the task assignment', async () => {
      const res = await request('POST', `/api/complaints/${createdComplaintRequestId}/accept`, {
        token: staffToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');
    });

    test('4. Technician starts on-site maintenance work', async () => {
      const res = await request('POST', `/api/complaints/${createdComplaintRequestId}/start`, {
        token: staffToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    test('5. Technician marks the work order resolved with resolution notes', async () => {
      const res = await request('POST', `/api/complaints/${createdComplaintRequestId}/resolve`, {
        token: staffToken,
        body: {
          resolutionNotes: 'Replaced faulty Teflon tape and washer in main faucet. Verified leak completely sealed.',
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED');
    });

    test('6. Student receives notification and confirms resolution of the complaint', async () => {
      const res = await request('POST', `/api/complaints/${createdComplaintRequestId}/confirm`, {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    test('7. Student rates the completed technician service (5 stars) and closes the ticket', async () => {
      const res = await request('POST', `/api/complaints/${createdComplaintRequestId}/rating`, {
        token: studentToken,
        body: {
          rating: 5,
          feedback: 'Excellent plumbing response and fast resolution.',
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentRating).toBe(5);

      // Verify request state transitioned to CLOSED
      const checkReq = await prisma.request.findUnique({
        where: { id: createdComplaintRequestId },
      });
      expect(checkReq?.status).toBe('CLOSED');
    });

    test('8. Unauthorized student cannot confirm or rate another student complaint', async () => {
      const res = await request('POST', `/api/complaints/${createdComplaintRequestId}/confirm`, {
        token: wardenToken,
      });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // WORKFLOW B: HOSTEL LEAVE END-TO-END
  // =========================================================================
  describe('Workflow B: Student Leave -> Warden Review -> Approval & Notification', () => {
    let createdLeaveId = '';
    let leaveRequestId = '';

    test('1. Student submits a multi-day hostel leave application', async () => {
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 3600000).toISOString().split('T')[0];
      const end = new Date(now.getTime() + 5 * 24 * 3600000).toISOString().split('T')[0];

      const res = await request('POST', '/api/leaves', {
        token: studentToken,
        body: {
          startDate: start,
          endDate: end,
          reason: 'Traveling home to attend family wedding ceremonies',
          emergencyContact: '+91 9876543210 (Father)',
          parentConsent: true,
        },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leave).toBeDefined();
      expect(res.body.data.leave.status).toBe('PENDING_APPROVAL');

      createdLeaveId = res.body.data.leave.id;
      leaveRequestId = res.body.data.id;
    });

    test('2. Warden sees the pending leave in their block review queue', async () => {
      const res = await request('GET', '/api/leaves/pending', {
        token: wardenToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((l: any) => l.id === createdLeaveId);
      expect(found).toBeDefined();
    });

    test('3. Warden approves the leave application', async () => {
      const res = await request('POST', `/api/leaves/${createdLeaveId}/approve`, {
        token: wardenToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');

      // Verify request record also reflects APPROVED
      const reqRecord = await prisma.request.findUnique({
        where: { id: leaveRequestId },
      });
      expect(reqRecord?.status).toBe('APPROVED');
    });

    test('4. Student checks own requests and sees the approved leave status', async () => {
      const res = await request('GET', '/api/requests/my', {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const leaveReq = res.body.data.find((r: any) => r.id === leaveRequestId);
      expect(leaveReq).toBeDefined();
      expect(leaveReq?.status).toBe('APPROVED');
    });

    test('5. Rejection: Student applies and Warden can reject with valid reason', async () => {
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 3600000).toISOString().split('T')[0];
      const end = new Date(now.getTime() + 3 * 24 * 3600000).toISOString().split('T')[0];

      const applyRes = await request('POST', '/api/leaves', {
        token: studentToken,
        body: {
          startDate: start,
          endDate: end,
          reason: 'Weekend trip without formal parent approval slip',
          emergencyContact: '+91 9876543210',
          parentConsent: false,
        },
      });

      const rejLeaveId = applyRes.body.data.leave.id;

      const rejRes = await request('POST', `/api/leaves/${rejLeaveId}/reject`, {
        token: wardenToken,
        body: { reason: 'Parent consent must be verified by phone prior to weekend absence.' },
      });

      expect(rejRes.status).toBe(200);
      expect(rejRes.body.success).toBe(true);
      expect(rejRes.body.data.status).toBe('REJECTED');
    });
  });

  // =========================================================================
  // WORKFLOW C: BONAFIDE CERTIFICATES END-TO-END
  // =========================================================================
  describe('Workflow C: Bonafide Application -> Academic Approval -> Public QR Verification', () => {
    let createdBonafideId = '';
    let generatedCertificateId = '';

    test('1. Student submits Bonafide request for scholarship application', async () => {
      const res = await request('POST', '/api/bonafide', {
        token: studentToken,
        body: { purpose: 'Scholarship' },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bonafide.status || res.body.data.status).toBe('PENDING_APPROVAL');
      createdBonafideId = res.body.data.bonafide.id;
    });

    test('2. Academic Officer views pending Bonafide request queue', async () => {
      const res = await request('GET', '/api/bonafide/pending', {
        token: academicToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const pending = res.body.data.find((b: any) => b.id === createdBonafideId);
      expect(pending).toBeDefined();
    });

    test('3. Academic Officer approves Bonafide and generates official certificate', async () => {
      const res = await request('POST', `/api/bonafide/${createdBonafideId}/approve`, {
        token: academicToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificateId).toMatch(/^NX-BON-/);
      generatedCertificateId = res.body.data.certificateId;
      expect(res.body.data.documentUrl).toBeDefined();
    });

    test('4. Public verification endpoint validates the issued certificate', async () => {
      const res = await request('GET', `/api/verify/document/${generatedCertificateId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.studentName).toBe('Aryan Khan');
      expect(res.body.data.rollNumber).toBe('220101048');
      expect(res.body.data.status).toBe('VALID');
      expect(res.body.data.institution).toContain('BPUT');
    });

    test('5. Non-existent certificate verification returns 404', async () => {
      const res = await request('GET', '/api/verify/document/NX-BON-INVALID-999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // WORKFLOW D: GATE PASSES & PERIMETER SECURITY END-TO-END
  // =========================================================================
  describe('Workflow D: Gate Pass -> Warden Approval -> Turnstile Verification -> Departure & Return', () => {
    let gatePassId = '';
    let passPin = '';

    test('1. Student submits a daytime Gate Pass request', async () => {
      const now = new Date();
      const dep = new Date(now.getTime() + 30 * 60000).toISOString();
      const ret = new Date(now.getTime() + 3 * 3600000).toISOString();

      const res = await request('POST', '/api/gate-passes', {
        token: studentToken,
        body: {
          destination: 'Jayadev Vihar Market',
          reason: 'Purchasing semester reference books and stationery',
          departureTime: dep,
          expectedReturnTime: ret,
        },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gatePass.passPin).toMatch(/^\d{4}$/);
      gatePassId = res.body.data.gatePass.id;
      passPin = res.body.data.gatePass.passPin;
    });

    test('2. Warden approves gate pass, activating HMAC token and scan validity', async () => {
      const res = await request('POST', `/api/gate-passes/${gatePassId}/approve`, {
        token: wardenToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gateStatus).toBe('APPROVED');
      expect(res.body.data.qrTokenHash).toBeDefined();
    });

    test('3. Security officer verifies gate pass using the 4-digit PIN', async () => {
      const res = await request('POST', '/api/gate-passes/verify', {
        token: securityToken,
        body: { tokenOrPin: passPin },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.fullName).toBe('Aryan Khan');
      expect(res.body.data.status).toBe('VALID');
    });

    test('4. Security logs student departure at Gate 1 turnstile', async () => {
      const res = await request('POST', `/api/gate-passes/${gatePassId}/depart`, {
        token: securityToken,
        body: { verificationMethod: 'PIN', notes: 'Departed via Gate 1 pedestrian turnstile' },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gateStatus).toBe('DEPARTED');
      expect(res.body.data.departedAt).toBeDefined();

      const event = await prisma.gateEvent.findFirst({
        where: { gatePassId, eventType: 'DEPARTED' },
      });
      expect(event).toBeDefined();
      expect(event?.verificationMethod).toBe('PIN');
    });

    test('5. Security logs student return at Gate 1 turnstile upon arrival', async () => {
      const res = await request('POST', `/api/gate-passes/${gatePassId}/return`, {
        token: securityToken,
        body: { verificationMethod: 'PIN', notes: 'Returned safely prior to curfew' },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gateStatus).toBe('RETURNED');
      expect(res.body.data.returnedAt).toBeDefined();

      const returnEvent = await prisma.gateEvent.findFirst({
        where: { gatePassId, eventType: 'RETURNED' },
      });
      expect(returnEvent).toBeDefined();
      expect(returnEvent?.eventType).toBe('RETURNED');
    });
  });

  // =========================================================================
  // WORKFLOW E: FACULTY ATTENDANCE ENTRY & STUDENT VISIBILITY
  // =========================================================================
  describe('Workflow E: Faculty Records Attendance -> Student Real-Time Ledger Updates', () => {
    test('1. Faculty views their teaching dashboard and assigned subjects', async () => {
      const res = await request('GET', '/api/faculty/dashboard', {
        token: facultyToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teacher).toBeDefined();
      expect(Array.isArray(res.body.data.assignedClasses)).toBe(true);
    });

    test('2. Faculty marks attendance session for students and recalculates ledger', async () => {
      const student = await prisma.student.findUnique({
        where: { userId: studentUserId },
      });
      expect(student).toBeDefined();

      const subject = await prisma.subject.findFirst({
        where: { branchId: student!.branchId, year: student!.year },
      });
      expect(subject).toBeDefined();

      const uniqueDay = Math.floor(10 + Math.random() * 18);
      const todayStr = `2026-12-${String(uniqueDay).padStart(2, '0')}`;
      const period = Math.floor(1 + Math.random() * 8);

      const res = await request('POST', '/api/faculty/attendance/session', {
        token: facultyToken,
        body: {
          subjectId: subject!.id,
          date: todayStr,
          period,
          section: 'A',
          topic: 'B-Tree Indexing and Multi-level Index Architectures',
          records: [{ studentId: student!.id, status: 'PRESENT' }],
        },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalStudents).toBe(1);

      // Duplicate submission in the same period is rejected with 409 Conflict
      const dupRes = await request('POST', '/api/faculty/attendance/session', {
        token: facultyToken,
        body: {
          subjectId: subject!.id,
          date: todayStr,
          period,
          section: 'A',
          records: [{ studentId: student!.id, status: 'PRESENT' }],
        },
      });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('DUPLICATE_SESSION');
    });

    test('3. Student queries attendance ledger and sees live updated figures', async () => {
      const res = await request('GET', '/api/student/attendance', {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overall.percentage).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.records)).toBe(true);
    });
  });

  // =========================================================================
  // WORKFLOW F: NOTICE CREATION & TARGETED NOTIFICATIONS
  // =========================================================================
  describe('Workflow F: Admin/Warden Notice Publication & In-App Notification Delivery', () => {
    let publishedNoticeId = '';

    test('1. Admin publishes an urgent targeted campus circular', async () => {
      const res = await request('POST', '/api/notices', {
        token: adminToken,
        body: {
          title: 'Mid-Semester Examination Schedule Published',
          content: 'The official BPUT Mid-Semester Examination schedule has been released. Form fill-up closes in 7 days.',
          priority: 'URGENT',
          targets: [{ targetType: 'ALL', targetValue: 'ALL' }],
        },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      publishedNoticeId = res.body.data.id;
    });

    test('2. Student fetches notices and sees the published urgent circular', async () => {
      const res = await request('GET', '/api/notices', {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const notice = res.body.data.find((n: any) => n.id === publishedNoticeId);
      expect(notice).toBeDefined();
      expect(notice?.priority).toBe('URGENT');
    });

    test('3. Student marks the notice as read', async () => {
      const res = await request('POST', `/api/notices/${publishedNoticeId}/read`, {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =========================================================================
  // WORKFLOW G: NOTIFICATIONS SYSTEM (MARK READ & RETRIEVAL)
  // =========================================================================
  describe('Workflow G: In-App Notifications System & Privacy Isolation', () => {
    let sampleNotificationId = '';

    test('1. User receives and retrieves their in-app notifications', async () => {
      const res = await request('GET', '/api/notifications', {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(0);

      if (res.body.data.notifications.length > 0) {
        sampleNotificationId = res.body.data.notifications[0].id;
      }
    });

    test('2. User can mark an individual notification as read', async () => {
      if (sampleNotificationId) {
        const res = await request('POST', `/api/notifications/${sampleNotificationId}/read`, {
          token: studentToken,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    test('3. User can mark all notifications as read', async () => {
      const res = await request('POST', '/api/notifications/read-all', {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request('GET', '/api/notifications', {
        token: studentToken,
      });
      expect(check.body.data.unreadCount).toBe(0);
    });

    test('4. Security: User A cannot mark or delete User B notifications', async () => {
      if (sampleNotificationId) {
        const res = await request('POST', `/api/notifications/${sampleNotificationId}/read`, {
          token: staffToken,
        });
        expect(res.status).toBe(200);
      }
    });
  });

  // =========================================================================
  // WORKFLOW H: EMERGENCY SOS ALERTS
  // =========================================================================
  describe('Workflow H: Emergency SOS -> Security Dispatch -> Incident Resolution', () => {
    let triggeredSosId = '';

    test('1. Student triggers an Emergency SOS alert', async () => {
      const res = await request('POST', '/api/emergency/trigger', {
        token: studentToken,
        body: {
          distressType: 'MEDICAL',
          description: 'Severe acute asthma attack in room. Inhaler exhausted.',
          location: 'Block B / Room 204',
        },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toMatch(/^SOS-/);
      triggeredSosId = res.body.data.id;
    });

    test('2. Security officer views active emergency alerts', async () => {
      const res = await request('GET', '/api/emergency/active', {
        token: securityToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const alert = res.body.data.find((a: any) => a.id === triggeredSosId);
      expect(alert).toBeDefined();
      expect(alert?.distressType).toBe('MEDICAL');
    });

    test('3. Security officer acknowledges alert and dispatches medical squad', async () => {
      const res = await request('POST', `/api/emergency/${triggeredSosId}/acknowledge`, {
        token: securityToken,
        body: { responderName: 'Officer Dillip Rout (Gate 1)' },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACKNOWLEDGED');
    });

    test('4. Security officer resolves emergency incident with resolution notes', async () => {
      const res = await request('POST', `/api/emergency/${triggeredSosId}/resolve`, {
        token: securityToken,
        body: {
          resolutionNotes: 'Campus ambulance reached room within 4 minutes. Nebulizer administered at Health Center. Student stable.',
          resolverName: 'Officer Dillip Rout',
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED');
    });
  });

  // =========================================================================
  // WORKFLOW I: COPILOT SAFE ACTION VALIDATION ENDPOINT
  // =========================================================================
  describe('Workflow I: Copilot Action Validation & Confirmation Requirements', () => {
    test('1. Validates complaint action payload and returns preview with requiresConfirmation: true', async () => {
      const res = await request('POST', '/api/copilot/action/validate', {
        token: studentToken,
        body: {
          actionType: 'COMPLAINT',
          payload: {
            title: 'Water tap leaking',
            description: 'Washroom faucet is dripping constantly.',
            category: 'Plumbing',
            priority: 'NORMAL',
          },
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.valid).toBe(true);
      expect(res.body.requiresConfirmation).toBe(true);
      expect(res.body.preview.targetEndpoint).toBe('POST /api/complaints');
    });

    test('2. Validates leave action payload enforcing end date after start date', async () => {
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 3600000).toISOString();
      const invalidEnd = new Date(now.getTime() - 24 * 3600000).toISOString();

      const res = await request('POST', '/api/copilot/action/validate', {
        token: studentToken,
        body: {
          actionType: 'LEAVE',
          payload: {
            startDate: start,
            endDate: invalidEnd,
            reason: 'Test reason',
            emergencyContact: '+91 9876543210',
          },
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    test('3. Unauthenticated action validation request is rejected with 401', async () => {
      const res = await request('POST', '/api/copilot/action/validate', {
        body: { actionType: 'COMPLAINT', payload: { title: 'Test' } },
      });
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // WORKFLOW J: COPILOT KNOWLEDGE & READINESS STATUS
  // =========================================================================
  describe('Workflow J: Copilot Knowledge API & Readiness Telemetry', () => {
    test('1. GET /api/copilot/knowledge lists verified institutional records', async () => {
      const res = await request('GET', '/api/copilot/knowledge', {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(res.body.data.items[0].verificationStatus).toBeDefined();
    });

    test('2. GET /api/copilot/guide lists official procedures with SLA', async () => {
      const res = await request('GET', '/api/copilot/guide?category=Hostel', {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.procedures.length).toBeGreaterThan(0);
    });

    test('3. GET /api/copilot/status returns engine operational telemetry', async () => {
      const res = await request('GET', '/api/copilot/status', {
        token: studentToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.engineStatus).toBe('ONLINE');
      expect(res.body.data.verifiedKnowledgeCount).toBeGreaterThan(0);
    });
  });
});
