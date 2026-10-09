import http from 'http';
import { Socket } from 'net';
import app from '../app';
import prisma from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// In-memory request executor avoiding physical network socket binding (listen EPERM)
function invokeApp(
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body: any = null
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    try {
      const socket = new Socket();
      const req = new http.IncomingMessage(socket);
      req.method = method.toUpperCase();
      req.url = url;
      const lowerHeaders: Record<string, string> = { host: 'localhost' };
      for (const [k, v] of Object.entries(headers)) {
        lowerHeaders[k.toLowerCase()] = v;
      }
      req.headers = lowerHeaders;

      const res = new http.ServerResponse(req);
      let resData = '';

      res.write = (chunk: any) => {
        resData += chunk?.toString() || '';
        return true;
      };

      res.end = (chunk: any) => {
        if (chunk) resData += chunk.toString();
        let parsed: any = resData;
        try {
          parsed = JSON.parse(resData);
        } catch {
          parsed = resData;
        }
        resolve({ status: res.statusCode, body: parsed });
        return res;
      };

      if (body) {
        req.headers['content-type'] = 'application/json';
        const str = typeof body === 'string' ? body : JSON.stringify(body);
        req.headers['content-length'] = String(Buffer.byteLength(str));
        process.nextTick(() => {
          req.push(str);
          req.push(null);
        });
      } else {
        process.nextTick(() => {
          req.push(null);
        });
      }

      app(req as any, res as any);
    } catch (e) {
      reject(e);
    }
  });
}

describe('Hostel Mess Menu End-to-End Suite', () => {
  let aryanToken = ''; // Hostel Student (Block B)
  let dayScholarToken = ''; // Non-hostel Student
  let wardenToken = ''; // Warden (Block B)
  let staffToken = ''; // Maintenance Staff
  let blockBId = '';

  beforeAll(async () => {
    // 1. Authenticate Aryan (Hostel Student in Block B)
    const aryanRes = await invokeApp('POST', '/api/auth/login', {}, {
      usernameOrEmail: 'aryan@nexora.edu',
      password: 'Password123!',
    });
    expect(aryanRes.status).toBe(200);
    aryanToken = aryanRes.body.data.token;

    // 2. Authenticate Warden (Dr. S. K. Mohapatra - Block B)
    const wardenRes = await invokeApp('POST', '/api/auth/login', {}, {
      usernameOrEmail: 'warden.b@nexora.edu',
      password: 'Password123!',
    });
    expect(wardenRes.status).toBe(200);
    wardenToken = wardenRes.body.data.token;

    // 3. Authenticate Ramesh (Staff)
    const staffRes = await invokeApp('POST', '/api/auth/login', {}, {
      usernameOrEmail: 'ramesh@nexora.edu',
      password: 'Password123!',
    });
    expect(staffRes.status).toBe(200);
    staffToken = staffRes.body.data.token;

    // 4. Ensure or create a day-scholar student (no hostel room)
    const dayScholarUser = await prisma.user.upsert({
      where: { email: 'dayscholar.test@nexora.edu' },
      update: {},
      create: {
        username: 'dayscholar_test',
        email: 'dayscholar.test@nexora.edu',
        passwordHash: '$2a$10$wKqC.f7v2/N5lYj9R1sZbeJ2O3g8C5c0D5Q8M6L4e5G6A7B8C9D0E',
        roleId: (await prisma.role.findUnique({ where: { name: 'STUDENT' } }))!.id,
        isActive: true,
      },
    });

    const cseBranch = await prisma.branch.findFirst();
    await prisma.student.upsert({
      where: { userId: dayScholarUser.id },
      update: { hostelRoomId: null },
      create: {
        userId: dayScholarUser.id,
        rollNumber: 'DS-99001',
        fullName: 'Kavita DayScholar',
        branchId: cseBranch!.id,
        year: 2,
        hostelRoomId: null, // Day scholar
      },
    });

    dayScholarToken = jwt.sign({ userId: dayScholarUser.id }, config.jwtSecret, {
      expiresIn: '1d',
    });

    // Retrieve Block B
    const blockB = await prisma.hostelBlock.findUnique({ where: { name: 'Block B' } });
    blockBId = blockB!.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'dayscholar.test@nexora.edu' },
    });
    await prisma.$disconnect();
  });

  describe('1. Authentication & Role-Based Access Control', () => {
    it('rejects unauthenticated requests to GET /api/mess-menu with 401', async () => {
      const res = await invokeApp('GET', '/api/mess-menu');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-hostel (day scholar) students with 403 HOSTEL_RESIDENT_REQUIRED', async () => {
      const res = await invokeApp('GET', '/api/mess-menu', {
        Authorization: `Bearer ${dayScholarToken}`,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('HOSTEL_RESIDENT_REQUIRED');
    });

    it('rejects unauthorized roles (like maintenance staff) with 403', async () => {
      const res = await invokeApp('GET', '/api/mess-menu', {
        Authorization: `Bearer ${staffToken}`,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows hostel students (Aryan) to view their hostel mess menu with read-only access', async () => {
      const res = await invokeApp('GET', '/api/mess-menu', {
        Authorization: `Bearer ${aryanToken}`,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hostelBlock.name).toBe('Block B');
      expect(res.body.data.canEdit).toBe(false);
      expect(res.body.data.todayMenu).toBeDefined();
      expect(res.body.data.weekly).toBeDefined();
      expect(res.body.data.weekly.MONDAY.BREAKFAST).toBeDefined();
    });

    it('allows hostel students to fetch via /api/student/mess-menu', async () => {
      const res = await invokeApp('GET', '/api/student/mess-menu', {
        Authorization: `Bearer ${aryanToken}`,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.hostelBlock).toBe('Block B');
      expect(res.body.data.canEdit).toBe(false);
    });

    it('prohibits students from modifying the mess menu (PUT returns 403)', async () => {
      const res = await invokeApp(
        'PUT',
        '/api/mess-menu',
        { Authorization: `Bearer ${aryanToken}` },
        {
          day: 'MONDAY',
          meal: 'BREAKFAST',
          items: 'Unauthorized Student Pizza Breakfast',
        }
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Warden Operations & Data Persistence', () => {
    it('allows authorized warden to view menu with canEdit: true', async () => {
      const res = await invokeApp('GET', '/api/mess-menu', {
        Authorization: `Bearer ${wardenToken}`,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.canEdit).toBe(true);
      expect(res.body.data.availableBlocks.length).toBeGreaterThan(0);
    });

    it('allows warden to update a single meal and verifies database persistence', async () => {
      const testMealItems =
        'Special Mysore Masala Dosa, Podi Idli, Coconut & Tomato Chutney, Filter Coffee';
      const testSpecialNotes = 'Chef Special for Thursday Breakfast';

      const updateRes = await invokeApp(
        'PUT',
        '/api/mess-menu',
        { Authorization: `Bearer ${wardenToken}` },
        {
          hostelBlockId: blockBId,
          day: 'THURSDAY',
          meal: 'BREAKFAST',
          items: testMealItems,
          timings: '07:30 AM – 09:30 AM',
          specialNotes: testSpecialNotes,
        }
      );

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);

      // Verify in database directly
      const dbRecord = await prisma.messMenu.findUnique({
        where: {
          hostelBlockId_day_meal: {
            hostelBlockId: blockBId,
            day: 'THURSDAY',
            meal: 'BREAKFAST',
          },
        },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord!.items).toBe(testMealItems);
      expect(dbRecord!.specialNotes).toBe(testSpecialNotes);

      // Verify reflection in student portal fetch
      const studentRes = await invokeApp('GET', '/api/mess-menu', {
        Authorization: `Bearer ${aryanToken}`,
      });

      expect(studentRes.status).toBe(200);
      expect(studentRes.body.data.weekly.THURSDAY.BREAKFAST.items).toBe(testMealItems);
      expect(studentRes.body.data.weekly.THURSDAY.BREAKFAST.specialNotes).toBe(testSpecialNotes);
    });

    it('allows warden to bulk update a full day (Breakfast, Lunch, Dinner)', async () => {
      const bulkPayload = {
        hostelBlockId: blockBId,
        updates: [
          {
            day: 'FRIDAY',
            meal: 'BREAKFAST',
            items: 'Crispy Bedmi Puri, Aloo Sabzi, Semolina Halwa, Tea / Coffee',
            timings: '07:30 AM – 09:30 AM',
            specialNotes: 'Freshly fried hot puris',
          },
          {
            day: 'FRIDAY',
            meal: 'LUNCH',
            items: 'Steamed Rice, Gujarati Kadhi, Aloo Methi, Crispy Papad, Sweet Lassi',
            timings: '12:30 PM – 02:30 PM',
            specialNotes: 'Low oil preparation',
          },
          {
            day: 'FRIDAY',
            meal: 'DINNER',
            items: 'Tawa Paratha, Shahi Paneer, Jeera Rice, Dal Tadka, Hot Gulab Jamun',
            timings: '07:30 PM – 09:30 PM',
            specialNotes: 'Weekend kickoff feast',
          },
        ],
      };

      const res = await invokeApp(
        'PUT',
        '/api/mess-menu',
        { Authorization: `Bearer ${wardenToken}` },
        bulkPayload
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCount).toBe(3);

      // Verify student sees updated Friday schedule
      const checkRes = await invokeApp('GET', '/api/mess-menu', {
        Authorization: `Bearer ${aryanToken}`,
      });

      const friday = checkRes.body.data.weekly.FRIDAY;
      expect(friday.BREAKFAST.items).toContain('Bedmi Puri');
      expect(friday.LUNCH.items).toContain('Gujarati Kadhi');
      expect(friday.DINNER.items).toContain('Shahi Paneer');
    });

    it('validates input schema rejecting invalid day or meal', async () => {
      const badRes = await invokeApp(
        'PUT',
        '/api/mess-menu',
        { Authorization: `Bearer ${wardenToken}` },
        {
          day: 'FUNDAY', // invalid day
          meal: 'BRUNCH', // invalid meal
          items: 'Invalid items',
        }
      );

      expect(badRes.status).toBe(422);
      expect(badRes.body.success).toBe(false);
      expect(badRes.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
