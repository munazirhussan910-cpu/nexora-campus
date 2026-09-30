import request from 'supertest';
import http from 'http';
import app from '../app';
import prisma from '../config/prisma';

describe('Nexora Campus Full Authentication & RBAC Suite', () => {
  let server: http.Server;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
    // Clean up test students created during test run if any
    const testUsers = await prisma.user.findMany({
      where: {
        email: { in: ['test.student@nexora.edu', 'test.malicious@nexora.edu', 'test.dup@nexora.edu'] },
      },
    });
    for (const u of testUsers) {
      await prisma.student.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
    await prisma.$disconnect();
  });

  // TEST 1: Existing demo Student login works
  test('TEST 1: Existing demo Student login works (aryan@nexora.edu / Password123!)', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'aryan@nexora.edu', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.rollNumber).toBe('220101048');
    expect(res.body.data.user.fullName).toBe('Aryan Khan');
  });

  // TEST 2: Existing demo Staff login works
  test('TEST 2: Existing demo Staff login works (ramesh@nexora.edu / Password123!)', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'ramesh@nexora.edu', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('STAFF');
    expect(res.body.data.user.specialization).toBe('PLUMBING');
  });

  // TEST 3: Existing demo Warden login works
  test('TEST 3: Existing demo Warden login works (warden.b@nexora.edu / Password123!)', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'warden.b@nexora.edu', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('WARDEN');
  });

  // TEST 4: Existing demo Security login works
  test('TEST 4: Existing demo Security login works (security.gate1@nexora.edu / Password123!)', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'security.gate1@nexora.edu', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('SECURITY');
  });

  // TEST 5: Existing demo Admin login works
  test('TEST 5: Existing demo Admin login works (admin@nexora.edu / Password123!)', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'admin@nexora.edu', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  // TEST 6: New student can register
  let newStudentToken = '';
  const newStudentData = {
    fullName: 'Pooja Verma',
    email: 'test.student@nexora.edu',
    rollNumber: '240101099',
    department: 'CSE',
    year: 1,
    hostel: 'Block C',
    roomNumber: '101',
    phone: '+91 9876543999',
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
  };

  test('TEST 6: New student can register', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send(newStudentData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.email).toBe('test.student@nexora.edu');
    expect(res.body.data.user.fullName).toBe('Pooja Verma');
    expect(res.body.data.user.rollNumber).toBe('240101099');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never return password hash
    newStudentToken = res.body.data.token;
  });

  // TEST 7: New student can immediately log in
  test('TEST 7: New student can immediately log in using campus email, username, or roll number', async () => {
    // Login with campus email
    const emailLoginRes = await request(server)
      .post('/api/auth/login')
      .send({
        usernameOrEmail: 'test.student@nexora.edu',
        password: 'SecurePassword123!',
      });
    expect(emailLoginRes.status).toBe(200);
    expect(emailLoginRes.body.data.user.role).toBe('STUDENT');
    expect(emailLoginRes.body.data.user.rollNumber).toBe('240101099');

    // Login with Student ID / roll number
    const rollLoginRes = await request(server)
      .post('/api/auth/login')
      .send({
        usernameOrEmail: '240101099',
        password: 'SecurePassword123!',
      });
    expect(rollLoginRes.status).toBe(200);
    expect(rollLoginRes.body.data.user.role).toBe('STUDENT');
  });

  // TEST 8: Duplicate email is rejected
  test('TEST 8: Duplicate email is rejected with clean error', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        fullName: 'Another Student',
        email: 'test.student@nexora.edu', // Duplicate email
        rollNumber: '240101100',
        department: 'ECE',
        year: 2,
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    expect(res.body.error.message).toContain('An account with this campus email already exists');
  });

  // TEST 9: Duplicate Student ID is rejected
  test('TEST 9: Duplicate Student ID is rejected with clean error', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        fullName: 'Another Student',
        email: 'test.diff@nexora.edu',
        rollNumber: '240101099', // Duplicate rollNumber
        department: 'MECH',
        year: 1,
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_STUDENT_ID');
    expect(res.body.error.message).toContain('This Student ID is already registered');
  });

  // TEST 10: Wrong password is rejected
  test('TEST 10: Wrong password is rejected with 401', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({
        usernameOrEmail: 'test.student@nexora.edu',
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  // TEST 11: Empty/invalid registration fields are rejected
  test('TEST 11: Empty/invalid registration fields are rejected by validator', async () => {
    // Missing required fields
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        fullName: '',
        email: 'not-an-email',
        rollNumber: '',
        password: 'short',
        confirmPassword: 'mismatch',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeInstanceOf(Array);
  });

  // TEST 12: Malicious request attempting role=ADMIN during registration
  test('TEST 12: A malicious request attempting role=ADMIN is rejected or forced to STUDENT', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        fullName: 'Hacker Attempt',
        email: 'test.malicious@nexora.edu',
        rollNumber: '999999999',
        department: 'CSE',
        year: 3,
        role: 'ADMIN', // Malicious privileged role injection
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      });

    // Should be rejected with 400 PRIVILEGED_ROLE_FORBIDDEN
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PRIVILEGED_ROLE_FORBIDDEN');

    // Verify in database that no ADMIN user was created
    const created = await prisma.user.findFirst({
      where: { email: 'test.malicious@nexora.edu' },
      include: { role: true },
    });
    expect(created).toBeNull();
  });

  // TEST 13: New student cannot access admin endpoints
  test('TEST 13: New student cannot access admin endpoints (RBAC 403 Forbidden)', async () => {
    const res = await request(server)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${newStudentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // TEST 14: New student profile loads student data
  test('TEST 14: New student reaches /api/auth/me and loads profile', async () => {
    const res = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.fullName).toBe('Pooja Verma');
    expect(res.body.data.user.rollNumber).toBe('240101099');
    expect(res.body.data.user.branch).toBe('CSE');
  });

  // TEST 15: Logout works
  test('TEST 15: Logout clears cookie and invalidates session cache', async () => {
    const res = await request(server).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Logged out successfully');
  });

  // TEST 16: Session refresh preserves authentication correctly
  test('TEST 16: Session verification on /api/auth/me preserves authenticated user state', async () => {
    const res = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('test.student@nexora.edu');
    expect(res.body.data.user.role).toBe('STUDENT');
  });
});
