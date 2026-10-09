import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Nexora Campus Database Seed...');

  // 1. Roles
  const roles = [
    { name: 'STUDENT', description: 'Campus Student with request access' },
    { name: 'STAFF', description: 'Maintenance & Facility Operations Staff' },
    { name: 'WARDEN', description: 'Hostel Block Warden with approval authority' },
    { name: 'SECURITY', description: 'Campus Gate Security & Pass Verification' },
    { name: 'ADMIN', description: 'Campus Command Center & System Operations' },
    { name: 'ACADEMIC_OFFICER', description: 'Academic Cell & Certificate Certification Officer' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roleMap[r.name] = role.id;
  }

  // 2. Permissions
  const permissions = [
    { code: 'academic.view', description: 'View student academic hub (attendance, timetable, class updates)' },
    { code: 'requests.create', description: 'Create any campus request' },
    { code: 'requests.view.own', description: 'View own requests' },
    { code: 'requests.view.all', description: 'View all requests across campus' },
    { code: 'requests.assign', description: 'Assign request to staff' },
    { code: 'requests.reassign', description: 'Reassign request to another staff' },
    { code: 'requests.resolve', description: 'Mark request as resolved' },
    { code: 'gatepass.create', description: 'Apply for campus gate pass' },
    { code: 'gatepass.approve', description: 'Approve or reject gate passes' },
    { code: 'gatepass.reject', description: 'Reject gate pass' },
    { code: 'gatepass.verify', description: 'Verify gate passes at main gate' },
    { code: 'leave.create', description: 'Submit hostel leave application' },
    { code: 'leave.approve', description: 'Approve leave application' },
    { code: 'leave.reject', description: 'Reject leave application' },
    { code: 'bonafide.create', description: 'Request bonafide certificate' },
    { code: 'bonafide.approve', description: 'Approve bonafide certificate' },
    { code: 'bonafide.reject', description: 'Reject bonafide certificate request' },
    { code: 'academic.dashboard', description: 'View Academic Officer dashboard & analytics' },
    { code: 'notices.view', description: 'View targeted campus notices' },
    { code: 'notices.create', description: 'Publish targeted campus notices' },
    { code: 'analytics.view', description: 'View command center analytics' },
    { code: 'audit.view', description: 'View immutable audit log trail' },
    { code: 'staff.manage', description: 'Manage campus staff directory' },
    { code: 'students.manage', description: 'Manage student directory' },
    { code: 'configuration.manage', description: 'Manage system settings and rules' },
    { code: 'academic.subject.read', description: 'View academic subjects' },
    { code: 'academic.subject.create', description: 'Create academic subjects' },
    { code: 'academic.subject.update', description: 'Update academic subjects' },
    { code: 'academic.subject.delete', description: 'Delete academic subjects' },
    { code: 'academic.timetable.read', description: 'View class timetables' },
    { code: 'academic.timetable.create', description: 'Create timetable entries' },
    { code: 'academic.timetable.update', description: 'Update timetable entries' },
    { code: 'academic.timetable.delete', description: 'Delete timetable entries' },
    { code: 'academic.update.read', description: 'Read academic class updates' },
    { code: 'academic.update.create', description: 'Publish academic class updates' },
    { code: 'academic.update.update', description: 'Update academic class updates' },
    { code: 'academic.update.delete', description: 'Delete academic class updates' },
    { code: 'academic.attendance.read', description: 'View attendance records' },
    { code: 'attendance.read', description: 'View class attendance' },
    { code: 'attendance.create', description: 'Record student attendance' },
    { code: 'attendance.update', description: 'Update student attendance' },
    { code: 'attendance.read.own', description: 'View own attendance records' },
    { code: 'timetable.read.own', description: 'View own timetable' },
    { code: 'class-update.read', description: 'View own class updates' },
    { code: 'academic.routine.manage', description: 'Manage academic routines and timetables' },
    { code: 'academic.deadline.manage', description: 'Manage university and campus academic deadlines' },
    { code: 'academic.guidance.manage', description: 'Manage student guidance workflows' },
  ];

  const permMap: Record<string, string> = {};
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: p,
    });
    permMap[p.code] = perm.id;
  }

  // Assign Permissions to Roles
  const rolePermMappings: Record<string, string[]> = {
    STUDENT: [
      'academic.view',
      'attendance.read.own',
      'timetable.read.own',
      'class-update.read',
      'requests.create',
      'requests.view.own',
      'gatepass.create',
      'leave.create',
      'bonafide.create',
      'notices.view',
    ],
    STAFF: [
      'requests.view.own',
      'requests.resolve',
      'notices.view',
      'attendance.read',
      'attendance.create',
      'attendance.update',
      'academic.update.create',
      'academic.view',
    ],
    WARDEN: [
      'requests.view.all',
      'gatepass.approve',
      'gatepass.reject',
      'leave.approve',
      'leave.reject',
      'notices.view',
      'notices.create',
      'students.manage',
    ],
    SECURITY: [
      'gatepass.verify',
      'notices.view',
    ],
    ACADEMIC_OFFICER: [
      'academic.view',
      'academic.dashboard',
      'academic.subject.read',
      'academic.subject.create',
      'academic.subject.update',
      'academic.subject.delete',
      'academic.timetable.read',
      'academic.timetable.create',
      'academic.timetable.update',
      'academic.timetable.delete',
      'academic.update.read',
      'academic.update.create',
      'academic.update.update',
      'academic.update.delete',
      'academic.attendance.read',
      'notices.view',
      'notices.create',
      'bonafide.approve',
      'bonafide.reject',
      'requests.view.all',
      'academic.routine.manage',
      'academic.deadline.manage',
      'academic.guidance.manage',
    ],
    ADMIN: Object.keys(permMap),
  };

  for (const [roleName, permCodes] of Object.entries(rolePermMappings)) {
    const roleId = roleMap[roleName];
    for (const code of permCodes) {
      const permId = permMap[code];
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId: permId },
          },
          update: {},
          create: { roleId, permissionId: permId },
        });
      }
    }
  }

  // 3. Branches
  const branches = [
    { code: 'CSE', name: 'Computer Science & Engineering' },
    { code: 'ECE', name: 'Electronics & Communication Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'CIVIL', name: 'Civil Engineering' },
    { code: 'EE', name: 'Electrical Engineering' },
  ];

  const branchMap: Record<string, string> = {};
  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name },
      create: b,
    });
    branchMap[b.code] = branch.id;
  }

  // 4. Hostel Blocks & Rooms
  const hostelBlocks = [
    { name: 'Block A', gender: 'MALE', wardenName: 'Dr. P. K. Jena' },
    { name: 'Block B', gender: 'MALE', wardenName: 'Dr. S. K. Mohapatra' },
    { name: 'Block C', gender: 'FEMALE', wardenName: 'Dr. Sunita Das' },
    { name: 'Block D', gender: 'FEMALE', wardenName: 'Dr. R. K. Sharma' },
  ];

  const blockMap: Record<string, string> = {};
  const roomMap: Record<string, string> = {};

  for (const hb of hostelBlocks) {
    const block = await prisma.hostelBlock.upsert({
      where: { name: hb.name },
      update: { gender: hb.gender, wardenName: hb.wardenName },
      create: hb,
    });
    blockMap[hb.name] = block.id;

    // Seed rooms
    for (let floor = 1; floor <= 3; floor++) {
      for (let r = 1; r <= 5; r++) {
        const roomNum = `${floor}0${r}`;
        const roomKey = `${hb.name}-${roomNum}`;
        const room = await prisma.room.upsert({
          where: {
            hostelBlockId_roomNumber: {
              hostelBlockId: block.id,
              roomNumber: roomNum,
            },
          },
          update: {},
          create: {
            hostelBlockId: block.id,
            roomNumber: roomNum,
            floor: floor,
            capacity: 2,
          },
        });
        roomMap[roomKey] = room.id;
      }
    }
  }

  // 5. Request Types
  const requestTypes = [
    { code: 'COMPLAINT', name: 'Complaint & Maintenance', requiresApproval: false, requiresAssignment: true, slaHours: 24 },
    { code: 'GATE_PASS', name: 'Campus Gate Pass', requiresApproval: true, requiresAssignment: false, slaHours: 4 },
    { code: 'BONAFIDE', name: 'Bonafide Certificate Request', requiresApproval: true, requiresAssignment: false, slaHours: 48 },
    { code: 'LEAVE', name: 'Hostel Leave Request', requiresApproval: true, requiresAssignment: false, slaHours: 12 },
  ];

  const requestTypeMap: Record<string, string> = {};
  for (const rt of requestTypes) {
    const reqType = await prisma.requestType.upsert({
      where: { code: rt.code },
      update: rt,
      create: rt,
    });
    requestTypeMap[rt.code] = reqType.id;
  }

  // 6. Routing Rules
  const routingRules = [
    { category: 'Plumbing', keywords: 'tap,pipe,leak,water,drain,flush,basin,shower,plumbing,sink,toilet', department: 'Maintenance', targetSpecialization: 'PLUMBING', priority: 'NORMAL' },
    { category: 'Electrical', keywords: 'fan,light,switch,socket,power,bulb,short,wiring,ac,tube,mcb,cooler', department: 'Maintenance', targetSpecialization: 'ELECTRICAL', priority: 'NORMAL' },
    { category: 'Carpentry', keywords: 'door,window,lock,handle,table,chair,bed,almirah,hinge,cupboard,furniture', department: 'Maintenance', targetSpecialization: 'CARPENTRY', priority: 'NORMAL' },
    { category: 'Network', keywords: 'wifi,internet,lan,ethernet,router,network,connectivity,speed,hotspot', department: 'Maintenance', targetSpecialization: 'IT', priority: 'NORMAL' },
    { category: 'Cleanliness', keywords: 'garbage,dustbin,clean,cleaning,sweep,washroom,dirty,odor,mess', department: 'Maintenance', targetSpecialization: 'GENERAL', priority: 'LOW' },
  ];

  await prisma.routingRule.deleteMany({});
  for (const rr of routingRules) {
    await prisma.routingRule.create({ data: rr });
  }

  // 7. SLA Rules
  const slaRules = [
    { requestTypeId: requestTypeMap['COMPLAINT'], priority: 'URGENT', category: 'Plumbing', maxHours: 4 },
    { requestTypeId: requestTypeMap['COMPLAINT'], priority: 'HIGH', category: 'Plumbing', maxHours: 8 },
    { requestTypeId: requestTypeMap['COMPLAINT'], priority: 'NORMAL', category: 'Plumbing', maxHours: 12 },
    { requestTypeId: requestTypeMap['COMPLAINT'], priority: 'NORMAL', category: 'Electrical', maxHours: 12 },
    { requestTypeId: requestTypeMap['COMPLAINT'], priority: 'NORMAL', category: 'Carpentry', maxHours: 24 },
    { requestTypeId: requestTypeMap['GATE_PASS'], priority: 'NORMAL', maxHours: 4 },
    { requestTypeId: requestTypeMap['LEAVE'], priority: 'NORMAL', maxHours: 12 },
    { requestTypeId: requestTypeMap['BONAFIDE'], priority: 'NORMAL', maxHours: 48 },
  ];

  await prisma.slaRule.deleteMany({});
  for (const sr of slaRules) {
    await prisma.slaRule.create({ data: sr });
  }

  // 8. Password Hash
  const passwordHash = await bcrypt.hash('Password123!', 10);
 // 9. Demo Users
 // DEMO PERSONA 1: Aryan (STUDENT)
  const aryanUser = await prisma.user.upsert({
    where: { email: 'aryan@nexora.edu' },
    update: { passwordHash, isActive: true },
    create: {
      username: 'aryan',
      email: 'aryan@nexora.edu',
      passwordHash,
      roleId: roleMap['STUDENT'],
      isActive: true,
    },
  });

  const aryanStudent = await prisma.student.upsert({
    where: { userId: aryanUser.id },
    update: {
      rollNumber: '220101048',
      fullName: 'Aryan Khan',
      branchId: branchMap['CSE'],
      year: 2,
      phone: '+91 9876543210',
      parentPhone: '+91 9876500001',
      hostelRoomId: roomMap['Block B-204'],
      admissionYear: 2024,
    },
    create: {
      userId: aryanUser.id,
      rollNumber: '220101048',
      fullName: 'Aryan Khan',
      branchId: branchMap['CSE'],
      year: 2,
      phone: '+91 9876543210',
      parentPhone: '+91 9876500001',
      hostelRoomId: roomMap['Block B-204'],
      admissionYear: 2024,
    },
  });

  // Additional Students for realistic dashboard population
  const demoStudentProfiles = [
    { username: 'rohit', email: 'rohit@nexora.edu', roll: '220101012', name: 'Rohit Sharma', branch: 'CSE', year: 2, room: 'Block B-201' },
    { username: 'sneha', email: 'sneha@nexora.edu', roll: '230102033', name: 'Sneha Patel', branch: 'ECE', year: 1, room: 'Block C-102' },
    { username: 'priya', email: 'priya@nexora.edu', roll: '210103045', name: 'Priya Sen', branch: 'MECH', year: 3, room: 'Block C-205' },
    { username: 'amit', email: 'amit@nexora.edu', roll: '220104056', name: 'Amit Tripathy', branch: 'CIVIL', year: 2, room: 'Block A-301' },
    { username: 'vikas', email: 'vikas@nexora.edu', roll: '200105078', name: 'Vikas Sahu', branch: 'EE', year: 4, room: 'Block B-204' },
  ];

  const studentUserMap: Record<string, string> = { aryan: aryanUser.id };
  for (const s of demoStudentProfiles) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: { passwordHash },
      create: {
        username: s.username,
        email: s.email,
        passwordHash,
        roleId: roleMap['STUDENT'],
        isActive: true,
      },
    });
    studentUserMap[s.username] = u.id;

    await prisma.student.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        rollNumber: s.roll,
        fullName: s.name,
        branchId: branchMap[s.branch] || branchMap['CSE'],
        year: s.year,
        phone: '+91 98765400' + s.roll.slice(-2),
        parentPhone: '+91 98765000' + s.roll.slice(-2),
        hostelRoomId: roomMap[s.room],
        admissionYear: 2026 - s.year,
      },
    });
  }

  // Opt-in senior guides keep the mentorship directory ready for the demo.
  const mentorSeeds = [
    { username: 'priya', headline: 'Mechanical Engineering · internship and exam planning', bio: 'Happy to help juniors with core-subject preparation, project selection, and settling into campus life.', cgpa: 8.46, interests: 'Internships, CAD, exam planning, projects' },
    { username: 'vikas', headline: 'Electrical Engineering · placements and practical labs', bio: 'I can share a structured approach to lab work, GATE preparation, and building a resume from second year onward.', cgpa: 8.71, interests: 'GATE, placements, circuits, resume review' },
  ];
  for (const mentor of mentorSeeds) {
    const student = await prisma.student.findUnique({ where: { userId: studentUserMap[mentor.username] } });
    if (student) {
      const { username, ...profile } = mentor;
      await prisma.mentorProfile.upsert({
        where: { studentId: student.id },
        update: profile,
        create: { studentId: student.id, ...profile, isAvailable: true },
      });
    }
  }

  // DEMO PERSONA 2: Ramesh (STAFF - PLUMBING)
  const rameshUser = await prisma.user.upsert({
    where: { email: 'ramesh@nexora.edu' },
    update: { passwordHash },
    create: {
      username: 'ramesh',
      email: 'ramesh@nexora.edu',
      passwordHash,
      roleId: roleMap['STAFF'],
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { userId: rameshUser.id },
    update: {},
    create: {
      userId: rameshUser.id,
      employeeId: 'STF-PLUMB-01',
      fullName: 'Ramesh Kumar',
      department: 'Maintenance',
      designation: 'Senior Plumber',
      specialization: 'PLUMBING',
      phone: '+91 9876543220',
    },
  });

  // Additional Staff: Suresh (STAFF - ELECTRICAL)
  const sureshUser = await prisma.user.upsert({
    where: { email: 'suresh@nexora.edu' },
    update: { passwordHash },
    create: {
      username: 'suresh',
      email: 'suresh@nexora.edu',
      passwordHash,
      roleId: roleMap['STAFF'],
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { userId: sureshUser.id },
    update: {},
    create: {
      userId: sureshUser.id,
      employeeId: 'STF-ELEC-02',
      fullName: 'Suresh Verma',
      department: 'Maintenance',
      designation: 'Senior Electrician',
      specialization: 'ELECTRICAL',
      phone: '+91 9876543221',
    },
  });

  // DEMO PERSONA 3: Warden (WARDEN - BLOCK B)
  const wardenUser = await prisma.user.upsert({
    where: { email: 'warden.b@nexora.edu' },
    update: { passwordHash },
    create: {
      username: 'warden_b',
      email: 'warden.b@nexora.edu',
      passwordHash,
      roleId: roleMap['WARDEN'],
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { userId: wardenUser.id },
    update: {},
    create: {
      userId: wardenUser.id,
      employeeId: 'WRD-BLKB-01',
      fullName: 'Dr. S. K. Mohapatra',
      department: 'Hostel',
      designation: 'Chief Warden Block B',
      specialization: 'WARDEN',
      phone: '+91 9876543230',
    },
  });

  // DEMO PERSONA 4: Security (SECURITY - MAIN GATE)
  const securityUser = await prisma.user.upsert({
    where: { email: 'security.gate1@nexora.edu' },
    update: { passwordHash },
    create: {
      username: 'security_gate1',
      email: 'security.gate1@nexora.edu',
      passwordHash,
      roleId: roleMap['SECURITY'],
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { userId: securityUser.id },
    update: {},
    create: {
      userId: securityUser.id,
      employeeId: 'SEC-MAIN-01',
      fullName: 'Vikram Singh',
      department: 'Security',
      designation: 'Gate Operations Officer',
      specialization: 'MAIN GATE',
      phone: '+91 9876543240',
    },
  });

  // DEMO PERSONA 5: Chief Admin (ADMIN)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexora.edu' },
    update: { passwordHash },
    create: {
      username: 'admin',
      email: 'admin@nexora.edu',
      passwordHash,
      roleId: roleMap['ADMIN'],
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeId: 'ADM-DIR-01',
      fullName: 'Dr. Ananya Ray',
      department: 'Administration',
      designation: 'Campus Operations Director',
      specialization: 'ADMINISTRATION',
      phone: '+91 9876543250',
    },
  });

  // DEMO PERSONA 6: Academic Officer (ACADEMIC_OFFICER)
  const academicUser = await prisma.user.upsert({
    where: { email: 'academic@nexora.edu' },
    update: { passwordHash, isActive: true, roleId: roleMap['ACADEMIC_OFFICER'] },
    create: {
      username: 'academic',
      email: 'academic@nexora.edu',
      passwordHash,
      roleId: roleMap['ACADEMIC_OFFICER'],
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { userId: academicUser.id },
    update: {
      fullName: 'Prof. Sanjeev Mohanty',
      department: 'Academics',
      designation: 'Academic Officer',
      specialization: 'ACADEMIC_AFFAIRS',
      phone: '+91 9876543260',
    },
    create: {
      userId: academicUser.id,
      employeeId: 'ACAD-OFF-01',
      fullName: 'Prof. Sanjeev Mohanty',
      department: 'Academics',
      designation: 'Academic Officer',
      specialization: 'ACADEMIC_AFFAIRS',
      phone: '+91 9876543260',
    },
  });

  // DEMO PERSONA 7: Faculty (STAFF - Dr. P. K. Tripathy)
  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@nexora.edu' },
    update: { passwordHash, isActive: true, roleId: roleMap['STAFF'] },
    create: {
      username: 'faculty',
      email: 'faculty@nexora.edu',
      passwordHash,
      roleId: roleMap['STAFF'],
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { userId: facultyUser.id },
    update: {
      fullName: 'Dr. P. K. Tripathy',
      department: 'Computer Science & Engineering',
      designation: 'Professor (Faculty)',
      specialization: 'CSE_FACULTY',
      phone: '+91 9876543270',
    },
    create: {
      userId: facultyUser.id,
      employeeId: 'FAC-CSE-01',
      fullName: 'Dr. P. K. Tripathy',
      department: 'Computer Science & Engineering',
      designation: 'Professor (Faculty)',
      specialization: 'CSE_FACULTY',
      phone: '+91 9876543270',
    },
  });

  // 10. RECURRING ISSUE SETUP: Hostel B + Plumbing (7 complaints in 14 days)
  console.log('⚡ Generating Recurring Issue Data (Hostel B Plumbing Cluster)...');
  const recurringComplaints = [
    { title: 'Bathroom tap leaking heavily', desc: 'Tap in washroom 2nd floor is not shutting completely', room: 'Block B / Room 204', dueOffset: 8, daysAgo: 1 },
    { title: 'Flush tank continuous leakage', desc: 'Flush cistern in toilet 2B leaking into bowl', room: 'Block B / Room 202', dueOffset: 12, daysAgo: 2 },
    { title: 'Drain pipe water seepage', desc: 'Seepage through common bathroom drain pipe', room: 'Block B / Floor 2 Common', dueOffset: 6, daysAgo: 3 },
    { title: 'Washbasin pipe joint broken', desc: 'Water overflows whenever tap is opened', room: 'Block B / Room 205', dueOffset: 10, daysAgo: 4 },
    { title: 'Shower mixer tap leaking', desc: 'Shower line has constant pressure drip', room: 'Block B / Room 201', dueOffset: 12, daysAgo: 5 },
    { title: 'Corridor pipeline dripping water', desc: 'Ceiling pipeline above room 203 has leak', room: 'Block B / Corridor 2', dueOffset: 4, daysAgo: 6 },
    { title: 'Overhead water tank float valve leak', desc: 'Water overflowing from small overhead supply', room: 'Block B / Terrace', dueOffset: 12, daysAgo: 8 },
  ];

  let reqIndex = 10100;
  for (const rc of recurringComplaints) {
    const reqNumber = `NX-${reqIndex++}`;
    const createdAt = new Date(Date.now() - rc.daysAgo * 24 * 60 * 60 * 1000);
    const dueAt = new Date(createdAt.getTime() + rc.dueOffset * 60 * 60 * 1000);

    const req = await prisma.request.upsert({
      where: { requestNumber: reqNumber },
      update: {},
      create: {
        requestNumber: reqNumber,
        requesterId: aryanUser.id,
        requestTypeId: requestTypeMap['COMPLAINT'],
        status: 'ASSIGNED',
        priority: 'NORMAL',
        title: rc.title,
        description: rc.desc,
        location: rc.room,
        assignedTo: rameshUser.id,
        createdAt,
        updatedAt: createdAt,
        dueAt,
      },
    });

    await prisma.complaint.upsert({
      where: { requestId: req.id },
      update: {},
      create: {
        requestId: req.id,
        category: 'Plumbing',
        subCategory: 'Tap / Pipe Leakage',
        issueType: 'Water Leak',
        createdAt,
      },
    });

    await prisma.requestStatusHistory.create({
      data: {
        requestId: req.id,
        oldStatus: null,
        newStatus: 'SUBMITTED',
        changedBy: aryanUser.id,
        comment: 'Complaint created via Nexora Student Portal',
        createdAt,
      },
    });

    await prisma.requestStatusHistory.create({
      data: {
        requestId: req.id,
        oldStatus: 'SUBMITTED',
        newStatus: 'ASSIGNED',
        changedBy: adminUser.id,
        comment: 'Automatically routed to Plumbing team and assigned to Ramesh Kumar',
        createdAt: new Date(createdAt.getTime() + 1000 * 60 * 2),
      },
    });
  }

  // Record IssueAlert for Hostel B Plumbing
  const blockBId = blockMap['Block B'];
  if (blockBId) {
    await prisma.issueAlert.create({
      data: {
        hostelBlockId: blockBId,
        category: 'Plumbing',
        complaintCount: 7,
        windowDays: 14,
        status: 'ACTIVE',
        detectedAt: new Date(),
      },
    });
  }

  // 11. Flagship Demo Requests:
  // (A) Existing resolved complaint with Ramesh to showcase history & ratings
  const resolvedReq = await prisma.request.upsert({
    where: { requestNumber: 'NX-10080' },
    update: {},
    create: {
      requestNumber: 'NX-10080',
      requesterId: aryanUser.id,
      requestTypeId: requestTypeMap['COMPLAINT'],
      status: 'CONFIRMED',
      priority: 'HIGH',
      title: 'Ceiling fan regulator sparking',
      description: 'The fan switch produces sparks when changing speeds',
      location: 'Hostel B / Room 204',
      assignedTo: sureshUser.id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.complaint.upsert({
    where: { requestId: resolvedReq.id },
    update: {},
    create: {
      requestId: resolvedReq.id,
      category: 'Electrical',
      subCategory: 'Switchboard',
      issueType: 'Sparks / Short Circuit',
      resolutionNotes: 'Replaced faulty stepped regulator with brand new Anchor modular unit. Grounding verified.',
      studentRating: 5,
      studentFeedback: 'Fixed promptly and cleanly. Very polite technician.',
    },
  });

  // (B) Pending Gate Pass for Aryan
  const gatePassReq = await prisma.request.upsert({
    where: { requestNumber: 'NX-10250' },
    update: {},
    create: {
      requestNumber: 'NX-10250',
      requesterId: aryanUser.id,
      requestTypeId: requestTypeMap['GATE_PASS'],
      status: 'PENDING_APPROVAL',
      priority: 'NORMAL',
      title: 'Weekend Market Visit Gate Pass',
      description: 'Visiting city market for purchasing project electronic components',
      location: 'Hostel Block B',
      createdAt: new Date(),
      dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
  });

  await prisma.gatePass.upsert({
    where: { requestId: gatePassReq.id },
    update: {},
    create: {
      requestId: gatePassReq.id,
      destination: 'Bhubaneswar City Market',
      reason: 'Purchase electronic sensors and books for semester capstone',
      departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      expectedReturnTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      passPin: '4821',
      gateStatus: 'PENDING_APPROVAL',
    },
  });

  // (C) Approved Gate Pass with QR Token for immediate security demo
  const approvedGatePassReq = await prisma.request.upsert({
    where: { requestNumber: 'NX-10245' },
    update: {},
    create: {
      requestNumber: 'NX-10245',
      requesterId: aryanUser.id,
      requestTypeId: requestTypeMap['GATE_PASS'],
      status: 'APPROVED',
      priority: 'NORMAL',
      title: 'Library Research Gate Pass',
      description: 'Visiting State Central Library for research',
      location: 'Hostel Block B',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  const validQrToken = 'NEXORA-PASS-220101048-NX10245-' + Buffer.from('NX-10245:4821:' + Date.now()).toString('base64');
  await prisma.gatePass.upsert({
    where: { requestId: approvedGatePassReq.id },
    update: {},
    create: {
      requestId: approvedGatePassReq.id,
      destination: 'State Central Library',
      reason: 'Academic thesis research & reference material study',
      departureTime: new Date(),
      expectedReturnTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      approvedBy: wardenUser.id,
      approvedAt: new Date(Date.now() - 30 * 60 * 1000),
      passPin: '7392',
      qrTokenHash: validQrToken,
      qrExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      gateStatus: 'APPROVED',
    },
  });

  // (D) Pending Bonafide Request for Aryan
  const bonafideReq = await prisma.request.upsert({
    where: { requestNumber: 'NX-10280' },
    update: {},
    create: {
      requestNumber: 'NX-10280',
      requesterId: aryanUser.id,
      requestTypeId: requestTypeMap['BONAFIDE'],
      status: 'PENDING_APPROVAL',
      priority: 'NORMAL',
      title: 'Bonafide Certificate - National Scholarship Portal',
      description: 'Required for state merit-cum-means scholarship verification',
      location: 'Campus Academic Cell',
      createdAt: new Date(),
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  await prisma.bonafideRequest.upsert({
    where: { requestId: bonafideReq.id },
    update: {},
    create: {
      requestId: bonafideReq.id,
      purpose: 'Scholarship',
      certificateId: 'NX-BON-2026-00231',
    },
  });

  // (E) Pre-issued Document for Public Verification Demo: /verify/NX-BON-2026-00199
  const demoDocCertId = 'NX-BON-2026-00199';
  await prisma.document.upsert({
    where: { documentNumber: demoDocCertId },
    update: {},
    create: {
      ownerId: aryanStudent.id,
      documentType: 'BONAFIDE',
      documentNumber: demoDocCertId,
      fileUrl: '/uploads/bonafide-NX-BON-2026-00199.pdf',
      verificationToken: 'v-tok-' + Buffer.from(demoDocCertId).toString('hex'),
      issuedBy: adminUser.id,
      issuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: 'VALID',
    },
  });

  // (F) Pending Leave Request for Aryan
  const leaveReq = await prisma.request.upsert({
    where: { requestNumber: 'NX-10290' },
    update: {},
    create: {
      requestNumber: 'NX-10290',
      requesterId: aryanUser.id,
      requestTypeId: requestTypeMap['LEAVE'],
      status: 'PENDING_APPROVAL',
      priority: 'NORMAL',
      title: 'Diwali Festival Leave',
      description: 'Traveling home to Cuttack for family festive celebrations',
      location: 'Hostel Block B / Room 204',
      createdAt: new Date(),
      dueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
  });

  await prisma.leaveRequest.upsert({
    where: { requestId: leaveReq.id },
    update: {},
    create: {
      requestId: leaveReq.id,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      reason: 'Diwali Festival & Family Gathering',
      emergencyContact: '+91 9876500001 (Father)',
      parentConsent: true,
      status: 'PENDING_APPROVAL',
    },
  });

  // 12. Targeted Notices
  const noticesData = [
    {
      title: 'Hostel Block B — Plumbing Maintenance Shutdown Notice',
      content: 'Please be advised that emergency pipeline pressure replacement work will be conducted in Block B 2nd floor bathrooms between 2:00 PM and 4:00 PM today. Alternate facilities on the 1st and 3rd floors will remain fully operational.',
      priority: 'URGENT',
      targets: [{ type: 'HOSTEL', value: 'Block B' }],
    },
    {
      title: 'B.Tech 2nd Year Mid-Semester Examination Schedule',
      content: 'The official schedule for 2nd Year B.Tech Mid-Semester examinations (Autumn 2026) has been approved by the Academic Council. Students can download detailed subject-wise room allocations from the student portal.',
      priority: 'NORMAL',
      targets: [{ type: 'YEAR', value: '2' }],
    },
    {
      title: 'Campus High-Speed Wi-Fi Upgrade & Credential Refresh',
      content: 'Nexora Network Operations will deploy new Wi-Fi 6 access points across academic wings and residential blocks this Friday. Please ensure device MAC addresses are registered on the student portal for seamless 1 Gbps roaming.',
      priority: 'NORMAL',
      targets: [{ type: 'ALL', value: 'ALL' }],
    },
    {
      title: 'Department of CSE — Guest Lecture on Distributed Systems',
      content: 'Distinguished researcher from IIT Bhubaneswar will deliver a masterclass on Paxos & Raft consensus algorithms in the Central Auditorium this Wednesday at 3:30 PM.',
      priority: 'NORMAL',
      targets: [{ type: 'BRANCH', value: 'CSE' }],
    },
  ];

  for (const n of noticesData) {
    const notice = await prisma.notice.create({
      data: {
        title: n.title,
        content: n.content,
        createdBy: adminUser.id,
        priority: n.priority,
        publishedAt: new Date(),
        status: 'PUBLISHED',
      },
    });

    for (const t of n.targets) {
      await prisma.noticeTarget.create({
        data: {
          noticeId: notice.id,
          targetType: t.type,
          targetValue: t.value,
        },
      });
    }

    // Mark as read for Aryan for the third notice
    if (n.title.includes('Wi-Fi')) {
      await prisma.noticeRead.create({
        data: {
          noticeId: notice.id,
          userId: aryanUser.id,
        },
      });
    }
  }

  // 13. Notifications for Aryan
  const notifications = [
    {
      userId: aryanUser.id,
      title: 'Gate Pass Approved',
      message: 'Your gate pass NX-10245 has been approved by Warden Dr. S. K. Mohapatra. QR code and PIN 7392 are now ready.',
      type: 'SUCCESS',
      referenceType: 'GATE_PASS',
      referenceId: approvedGatePassReq.id,
      isRead: false,
    },
    {
      userId: aryanUser.id,
      title: 'Complaint Resolved',
      message: 'Complaint NX-10080 (Ceiling fan regulator) has been resolved by Suresh Verma. Please confirm and rate the service.',
      type: 'INFO',
      referenceType: 'COMPLAINT',
      referenceId: resolvedReq.id,
      isRead: true,
      readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      userId: aryanUser.id,
      title: 'New Campus Notice',
      message: 'Emergency pipeline maintenance scheduled for Hostel Block B today.',
      type: 'WARNING',
      referenceType: 'NOTICE',
      isRead: false,
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({ data: notif });
  }

  // 14. Immutable Audit Logs
  const auditLogs = [
    {
      actorId: adminUser.id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      entityId: 'SYSTEM-ROOT',
      newValues: JSON.stringify({ version: '3.0.0', platform: 'Nexora Campus' }),
      ipAddress: '127.0.0.1',
      userAgent: 'Nexora Core Engine / Seed',
    },
    {
      actorId: wardenUser.id,
      action: 'GATE_PASS_APPROVED',
      entityType: 'GATE_PASS',
      entityId: approvedGatePassReq.id,
      newValues: JSON.stringify({ passNumber: 'NX-10245', approver: 'Dr. S. K. Mohapatra', pin: '7392' }),
      ipAddress: '10.0.2.15',
      userAgent: 'Mozilla/5.0 Warden Terminal',
    },
    {
      actorId: adminUser.id,
      action: 'DOCUMENT_ISSUED',
      entityType: 'DOCUMENT',
      entityId: demoDocCertId,
      newValues: JSON.stringify({ docType: 'BONAFIDE', student: 'Aryan Khan', certId: demoDocCertId }),
      ipAddress: '10.0.1.1',
      userAgent: 'Mozilla/5.0 Admin Console',
    },
  ];

  for (const al of auditLogs) {
    await prisma.auditLog.create({ data: al });
  }

  // 15. Academic Hub: Subjects, Attendance & Timetable for CSE Year 2
  console.log('📚 Seeding Academic Hub (Subjects, Attendance, Timetable & Class Updates)...');
  const cseBranchId = branchMap['CSE'];

  const academicSubjects = [
    { code: 'CS201', name: 'Data Structures', branchId: cseBranchId, year: 2, semester: 3, section: 'A', faculty: 'Dr. P. K. Tripathy' },
    { code: 'CS202', name: 'DBMS', branchId: cseBranchId, year: 2, semester: 3, section: 'A', faculty: 'Prof. Sanjeev Mohanty' },
    { code: 'CS203', name: 'Computer Organization', branchId: cseBranchId, year: 2, semester: 3, section: 'A', faculty: 'Dr. A. Behera' },
    { code: 'CS204', name: 'Operating Systems', branchId: cseBranchId, year: 2, semester: 3, section: 'A', faculty: 'Prof. N. Pattnaik' },
    { code: 'MA201', name: 'Mathematics', branchId: cseBranchId, year: 2, semester: 3, section: 'A', faculty: 'Dr. M. R. Dash' },
  ];

  const subjectMap: Record<string, string> = {};
  for (const s of academicSubjects) {
    const sub = await prisma.subject.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        branchId: s.branchId,
        year: s.year,
        semester: s.semester,
        section: s.section,
        faculty: s.faculty,
      },
      create: s,
    });
    subjectMap[s.code] = sub.id;
  }

  // Attendance for Aryan (matches prompt example: 18/22, 20/24, 16/20, 21/23, 19/21 -> 94/110 = 85.5%)
  const aryanAttendanceRecords = [
    { code: 'CS201', present: 18, total: 22 },
    { code: 'CS202', present: 20, total: 24 },
    { code: 'CS203', present: 16, total: 20 },
    { code: 'CS204', present: 21, total: 23 },
    { code: 'MA201', present: 19, total: 21 },
  ];

  for (const att of aryanAttendanceRecords) {
    const subjectId = subjectMap[att.code];
    if (subjectId) {
      await prisma.attendance.upsert({
        where: {
          studentId_subjectId: {
            studentId: aryanStudent.id,
            subjectId,
          },
        },
        update: {
          present: att.present,
          total: att.total,
        },
        create: {
          studentId: aryanStudent.id,
          subjectId,
          present: att.present,
          total: att.total,
        },
      });
    }
  }

  // Attendance for Rohit (demo student)
  const rohitStudent = await prisma.student.findFirst({
    where: { rollNumber: '220101012' },
  });
  if (rohitStudent) {
    const rohitAttendance = [
      { code: 'CS201', present: 15, total: 22 },
      { code: 'CS202', present: 14, total: 24 },
      { code: 'CS203', present: 13, total: 20 },
      { code: 'CS204', present: 16, total: 23 },
      { code: 'MA201', present: 14, total: 21 },
    ];
    for (const att of rohitAttendance) {
      const subjectId = subjectMap[att.code];
      if (subjectId) {
        await prisma.attendance.upsert({
          where: {
            studentId_subjectId: {
              studentId: rohitStudent.id,
              subjectId,
            },
          },
          update: { present: att.present, total: att.total },
          create: {
            studentId: rohitStudent.id,
            subjectId,
            present: att.present,
            total: att.total,
          },
        });
      }
    }
  }

  // Timetable Entries for CSE Year 2 (Monday to Friday)
  await prisma.timetableEntry.deleteMany({
    where: { branchId: cseBranchId, year: 2 },
  });

  const timetableData = [
    // MONDAY
    { day: 'MONDAY', startTime: '09:00', endTime: '10:00', code: 'CS201', room: 'CSE-204', faculty: 'Dr. P. K. Tripathy' },
    { day: 'MONDAY', startTime: '10:00', endTime: '11:00', code: 'CS202', room: 'CSE-201', faculty: 'Prof. Sanjeev Mohanty' },
    { day: 'MONDAY', startTime: '11:15', endTime: '12:15', code: 'CS203', room: 'ECE Lab-2', faculty: 'Dr. A. Behera' },
    { day: 'MONDAY', startTime: '14:00', endTime: '15:00', code: 'MA201', room: 'LH-1', faculty: 'Dr. M. R. Dash' },

    // TUESDAY
    { day: 'TUESDAY', startTime: '09:00', endTime: '10:00', code: 'CS204', room: 'CSE-204', faculty: 'Prof. N. Pattnaik' },
    { day: 'TUESDAY', startTime: '10:00', endTime: '11:00', code: 'CS201', room: 'CSE-204', faculty: 'Dr. P. K. Tripathy' },
    { day: 'TUESDAY', startTime: '11:15', endTime: '12:15', code: 'CS202', room: 'CSE-201', faculty: 'Prof. Sanjeev Mohanty' },
    { day: 'TUESDAY', startTime: '14:00', endTime: '16:00', code: 'CS202', room: 'DBMS Lab-3', faculty: 'Prof. Sanjeev Mohanty' },

    // WEDNESDAY
    { day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00', code: 'MA201', room: 'LH-1', faculty: 'Dr. M. R. Dash' },
    { day: 'WEDNESDAY', startTime: '10:00', endTime: '11:00', code: 'CS204', room: 'CSE-204', faculty: 'Prof. N. Pattnaik' },
    { day: 'WEDNESDAY', startTime: '11:15', endTime: '12:15', code: 'CS203', room: 'CSE-102', faculty: 'Dr. A. Behera' },
    { day: 'WEDNESDAY', startTime: '14:00', endTime: '16:00', code: 'CS201', room: 'Computing Center 1', faculty: 'Dr. P. K. Tripathy' },

    // THURSDAY
    { day: 'THURSDAY', startTime: '09:00', endTime: '10:00', code: 'CS201', room: 'CSE-204', faculty: 'Dr. P. K. Tripathy' },
    { day: 'THURSDAY', startTime: '10:00', endTime: '11:00', code: 'CS202', room: 'CSE-201', faculty: 'Prof. Sanjeev Mohanty' },
    { day: 'THURSDAY', startTime: '11:15', endTime: '12:15', code: 'CS204', room: 'CSE-204', faculty: 'Prof. N. Pattnaik' },
    { day: 'THURSDAY', startTime: '14:00', endTime: '15:00', code: 'MA201', room: 'LH-1', faculty: 'Dr. M. R. Dash' },

    // FRIDAY
    { day: 'FRIDAY', startTime: '09:00', endTime: '10:00', code: 'CS203', room: 'CSE-102', faculty: 'Dr. A. Behera' },
    { day: 'FRIDAY', startTime: '10:00', endTime: '11:00', code: 'CS204', room: 'CSE-204', faculty: 'Prof. N. Pattnaik' },
    { day: 'FRIDAY', startTime: '11:15', endTime: '12:15', code: 'CS202', room: 'CSE-201', faculty: 'Prof. Sanjeev Mohanty' },
    { day: 'FRIDAY', startTime: '14:00', endTime: '15:00', code: 'CS201', room: 'CSE-Seminar Hall', faculty: 'Dr. P. K. Tripathy' },
  ];

  for (const t of timetableData) {
    const subjectId = subjectMap[t.code];
    if (subjectId) {
      await prisma.timetableEntry.create({
        data: {
          subjectId,
          branchId: cseBranchId,
          year: 2,
          semester: 3,
          section: 'A',
          day: t.day,
          startTime: t.startTime,
          endTime: t.endTime,
          room: t.room,
          faculty: t.faculty,
        },
      });
    }
  }

  // Class Updates (Notice system integration)
  const classUpdates = [
    {
      title: 'DBMS — Tomorrow\'s class will be held in CSE-305',
      content: 'Database Management Systems lecture scheduled for tomorrow will temporarily be held in CSE-305 instead of CSE-201 due to projector calibration work.',
      priority: 'NORMAL',
      targets: [
        { type: 'BRANCH', value: 'CSE' },
        { type: 'YEAR', value: '2' },
      ],
    },
    {
      title: 'Data Structures — Assignment 3 deadline extended',
      content: 'Assignment 3 on Binary Search Trees & Balanced AVL Trees submission window is extended to Friday 11:59 PM. Please verify test cases before submission.',
      priority: 'NORMAL',
      targets: [
        { type: 'BRANCH', value: 'CSE' },
        { type: 'YEAR', value: '2' },
      ],
    },
    {
      title: 'Operating Systems — Unit 2 revision class Wednesday',
      content: 'Special doubt-clearing and revision class covering Process Synchronization, Semaphores, and Deadlock Prevention will be conducted this Wednesday at 3:00 PM in CSE-204.',
      priority: 'NORMAL',
      targets: [
        { type: 'BRANCH', value: 'CSE' },
        { type: 'YEAR', value: '2' },
      ],
    },
  ];

  for (const cu of classUpdates) {
    const notice = await prisma.notice.create({
      data: {
        title: cu.title,
        content: cu.content,
        createdBy: academicUser.id,
        priority: cu.priority,
        publishedAt: new Date(),
        status: 'PUBLISHED',
      },
    });

    for (const t of cu.targets) {
      await prisma.noticeTarget.create({
        data: {
          noticeId: notice.id,
          targetType: t.type,
          targetValue: t.value,
        },
      });
    }
  }

  // 14. Academic Deadlines Seeding
  console.log('⏰ Seeding Academic Deadlines...');
  await prisma.academicDeadline.deleteMany({});
  const deadlinesData = [
    {
      title: 'BPUT Mid-Semester Examination Form Submission',
      description: 'Mandatory regular and backlog mid-semester examination registration. Late fee applies after deadline.',
      deadline: new Date('2026-10-10T23:59:59Z'),
      targetYear: 2,
      targetSemester: 3,
      targetBranchId: cseBranchId,
      targetSection: 'A',
      relatedForm: 'EXAM_FORM',
      actionUrl: '/student/academics',
      createdBy: academicUser.id,
    },
    {
      title: 'State Post-Matric & Merit-Cum-Means Scholarship Verification',
      description: 'Submit uploaded Bonafide Certificate and fee receipt for state scholarship portal verification.',
      deadline: new Date('2026-10-25T17:00:00Z'),
      targetYear: null,
      targetSemester: null,
      targetBranchId: null,
      targetSection: null,
      relatedForm: 'BONAFIDE',
      actionUrl: '/student/documents?purpose=Scholarship',
      createdBy: academicUser.id,
    },
    {
      title: 'Summer Industrial Internship NOC Application Deadline',
      description: 'Apply for university No Objection Certificate (NOC) and verify company offer letter with Academic Office.',
      deadline: new Date('2026-11-15T18:00:00Z'),
      targetYear: 2,
      targetSemester: 3,
      targetBranchId: null,
      targetSection: null,
      relatedForm: 'INTERNSHIP',
      actionUrl: '/student/documents?purpose=Internship',
      createdBy: academicUser.id,
    },
    {
      title: 'Course Registration & Section Confirmation for Even Semester',
      description: 'Complete core and elective subject selection for upcoming semester.',
      deadline: new Date('2026-11-30T23:59:59Z'),
      targetYear: null,
      targetSemester: null,
      targetBranchId: null,
      targetSection: null,
      relatedForm: 'REGISTRATION',
      actionUrl: '/student/academics',
      createdBy: academicUser.id,
    },
  ];

  for (const d of deadlinesData) {
    await prisma.academicDeadline.create({ data: d });
  }

  // 15. Guidance Items Seeding (Decision-Tree Knowledge Graph)
  console.log('🎓 Seeding Structured Guidance Mode Content...');
  await prisma.guidanceItem.deleteMany({});
  const guidanceData = [
    {
      title: 'Official Bonafide Certificate',
      category: 'CERTIFICATE',
      subcategory: 'BONAFIDE',
      description: 'Official institutional certificate certifying active student enrollment, course details, and conduct.',
      requiredDocs: JSON.stringify([
        'Student Roll Number & Full Name',
        'Academic Year & Branch details',
        'Specific purpose (Scholarship, Bank, Visa, Hackathon)',
        'Hostel room & clearance status'
      ]),
      processSteps: JSON.stringify([
        'Open Bonafide Application under Documents & Bonafide',
        'Select your purpose (Scholarship, Bank, Internship, etc.)',
        'Submit request to Academic Office',
        'Academic Officer reviews student credentials and digitally certifies',
        'Download cryptographically signed PDF with instant public QR verification'
      ]),
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'BONAFIDE',
      actionUrl: '/student/documents?purpose=Scholarship',
      actionLabel: 'Start Bonafide Application',
      createdBy: academicUser.id,
    },
    {
      title: 'Summer Industrial Internship NOC',
      category: 'INTERNSHIP',
      subcategory: 'NOC',
      description: 'Official institutional No-Objection Certificate (NOC) required by external organizations and companies.',
      requiredDocs: JSON.stringify([
        'Internship Offer Letter / Selection Email',
        'Host Organization Name & Location',
        'Exact Duration (Start Date to End Date)',
        'Academic Standing & Attendance Verification (>75%)'
      ]),
      processSteps: JSON.stringify([
        'Review class routine to ensure internship dates do not conflict with mandatory exams',
        'Apply for Bonafide Certificate with purpose set to "Internship"',
        'Academic Officer verifies student eligibility and absence clearance',
        'Signed institutional NOC PDF is generated with tamper-evident seal',
        'Submit PDF to employer and university Training & Placement Cell'
      ]),
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'BONAFIDE',
      actionUrl: '/student/documents?purpose=Internship',
      actionLabel: 'Apply for Internship NOC',
      createdBy: academicUser.id,
    },
    {
      title: 'State & National Scholarship Verification',
      category: 'SCHOLARSHIP',
      subcategory: 'SCHOLARSHIP',
      description: 'Institutional verification procedures and mandatory documents for NSP, Post-Matric, and Merit scholarships.',
      requiredDocs: JSON.stringify([
        'Scholarship Application ID / Registration Slip',
        'Academic Year Bonafide Certificate',
        'Annual Family Income Certificate',
        'Previous Year Marksheet & Bank Passbook Copy'
      ]),
      processSteps: JSON.stringify([
        'Apply for Bonafide Certificate with purpose "Scholarship"',
        'Download approved digital Bonafide PDF from Nexora Documents',
        'Upload certificate to National / State Scholarship Portal',
        'Academic Office conducts digital backend verification against institutional roll ledger'
      ]),
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'BONAFIDE',
      actionUrl: '/student/documents?purpose=Scholarship',
      actionLabel: 'Apply for Scholarship Bonafide',
      createdBy: academicUser.id,
    },
    {
      title: 'Mid-Semester & Final Examination Form',
      category: 'EXAMINATION',
      subcategory: 'EXAM_FORM',
      description: 'Examination registration guidelines, subject code verification, backlog forms, and admit card tracking.',
      requiredDocs: JSON.stringify([
        'Student ID Card / Roll Number',
        'Subject Code Verification Slip',
        'Fee Clearance Confirmation',
        'Minimum 75% Attendance Compliance'
      ]),
      processSteps: JSON.stringify([
        'Check Examination Notice on Academic Hub for subject registration codes',
        'Verify attendance eligibility in My Attendance (must meet 75% threshold)',
        'Ensure exam form deadline compliance in Upcoming Deadlines',
        'Download or collect stamped Admit Card before scheduled examination'
      ]),
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'EXAMINATION',
      actionUrl: '/student/academics',
      actionLabel: 'View Exam Timetable & Hub',
      createdBy: academicUser.id,
    },
    {
      title: 'Hostel Leave Application (Outstation)',
      category: 'HOSTEL',
      subcategory: 'LEAVE',
      description: 'Multi-day outstation leave authorization for family gatherings, festivals, or emergency home visits.',
      requiredDocs: JSON.stringify([
        'Travel Start & End Dates',
        'Destination City & Address',
        'Parent / Guardian Contact Number',
        'Parental Consent Confirmation'
      ]),
      processSteps: JSON.stringify([
        'Open Hostel Leave form in Student Portal',
        'Enter travel dates, destination, and emergency contact details',
        'Confirm parent consent',
        'Hostel Warden reviews application and authorizes leave',
        'Security verifies your departure at the campus gate'
      ]),
      responsibleRole: 'WARDEN',
      relatedForm: 'LEAVE',
      actionUrl: '/student/leave',
      actionLabel: 'Apply for Hostel Leave',
      createdBy: academicUser.id,
    },
    {
      title: 'Hostel Maintenance & Room Repair',
      category: 'HOSTEL',
      subcategory: 'COMPLAINT',
      description: 'Log issues regarding room plumbing leaks, broken electrical switches, carpentry, or WiFi.',
      requiredDocs: JSON.stringify([
        'Hostel Block & Room Number',
        'Short summary of the malfunction',
        'Detailed description of the issue'
      ]),
      processSteps: JSON.stringify([
        'Click "+ New Complaint" on Student Dashboard',
        'Describe the problem (Nexora keyword engine auto-routes to correct technician)',
        'Technician is dispatched under an SLA timer (4h for urgent, 24h for normal)',
        'Track live status from SUBMITTED to IN_PROGRESS and RESOLVED',
        'Confirm resolution and rate service quality'
      ]),
      responsibleRole: 'STAFF',
      relatedForm: 'COMPLAINT',
      actionUrl: '/student/requests/new',
      actionLabel: 'Log Maintenance Complaint',
      createdBy: academicUser.id,
    },
    {
      title: 'Campus Exit Gate Pass',
      category: 'HOSTEL',
      subcategory: 'GATE_PASS',
      description: 'Day pass for market visits, coaching, library, or short errands outside campus.',
      requiredDocs: JSON.stringify([
        'Destination details',
        'Reason for exit',
        'Departure and expected return time'
      ]),
      processSteps: JSON.stringify([
        'Apply for Gate Pass with destination and expected return time',
        'Warden reviews and approves pass',
        'System generates secure QR code and 4-digit offline PIN',
        'Security Officer scans QR at Main Gate terminal upon departure and return'
      ]),
      responsibleRole: 'SECURITY',
      relatedForm: 'GATE_PASS',
      actionUrl: '/student/gate-pass',
      actionLabel: 'Apply for Gate Pass',
      createdBy: academicUser.id,
    },
    {
      title: 'Daily Academic Routine & Room Schedule',
      category: 'ROUTINE',
      subcategory: 'ROUTINE',
      description: 'Check daily lectures, laboratory timings, assigned faculty, and classroom numbers.',
      requiredDocs: JSON.stringify([
        'Current Year & Branch Cohort'
      ]),
      processSteps: JSON.stringify([
        'Access Academic Hub -> Timetable tab',
        'View personalized classes scheduled for today',
        'Check classroom room numbers and faculty allocations',
        'Review temporary classroom shifts in Class Updates'
      ]),
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'ACADEMIC_ROUTINE',
      actionUrl: '/student/academics',
      actionLabel: 'View Academic Routine',
      createdBy: academicUser.id,
    },
    {
      title: 'Attendance Discrepancy & Condonation',
      category: 'ACADEMIC_REQUEST',
      subcategory: 'ATTENDANCE',
      description: 'Inquire regarding low attendance warnings, attendance calculation errors, or medical exemptions.',
      requiredDocs: JSON.stringify([
        'Medical Prescription / Hospital Discharge Summary (if medical ground)',
        'Subject Codes & Missed Date Ranges',
        'Subject Faculty Verification Signature'
      ]),
      processSteps: JSON.stringify([
        'Check subject attendance percentages in My Attendance',
        'Review daily session history to locate missing session records',
        'Consult subject teacher to rectify inadvertent absence marks',
        'Submit written medical application to Academic Cell for condonation approval'
      ]),
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'GENERAL',
      actionUrl: '/student/attendance',
      actionLabel: 'Check My Attendance',
      createdBy: academicUser.id,
    },
    {
      title: 'Official Academic Circulars & Notices',
      category: 'NOTICE',
      subcategory: 'NOTICE',
      description: 'Official department notices, examination guidelines, holiday circulars, and university orders.',
      requiredDocs: JSON.stringify([
        'None required (Public / Targeted)'
      ]),
      processSteps: JSON.stringify([
        'Check Academic Updates on Student Dashboard or Academic Hub',
        'Filter notices by your branch and year cohort',
        'Read priority notices (Normal, Urgent)',
        'Check deadlines associated with notices'
      ]),
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'ACADEMIC_NOTICE',
      actionUrl: '/student/notices',
      actionLabel: 'View Campus Notices',
      createdBy: academicUser.id,
    },
    {
      title: 'Academic Office Consultation & Support',
      category: 'GENERAL',
      subcategory: 'INQUIRY',
      description: 'For unique circumstances, special permissions, migration, credit transfers, or direct officer consultation.',
      requiredDocs: JSON.stringify([
        'Student Identity Card',
        'Written application detailing specific requirement',
        'Supporting documents / proofs'
      ]),
      processSteps: JSON.stringify([
        'Review if your request can be solved via Bonafide Certificate or Academic Hub',
        'Visit Academic Cell (Administrative Block, Room 102)',
        'Consult Academic Operations Officer Prof. Sanjeev Mohanty',
        'Submit formal paper application if online process is not applicable'
      ]),
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'GENERAL',
      actionUrl: '/student/dashboard',
      actionLabel: 'Return to Student Dashboard',
      createdBy: academicUser.id,
    }
  ];

  for (const g of guidanceData) {
    await prisma.guidanceItem.create({ data: g });
  }

  console.log('✅ Nexora Campus Database Seed Complete!');
  console.log('📊 Demo Accounts Prepared:');
  console.log('   - Student:           aryan@nexora.edu / Password123! (Aryan Khan)');
  console.log('   - Academic Officer:  academic@nexora.edu / Password123! (Prof. Sanjeev Mohanty)');
  console.log('   - Faculty:           faculty@nexora.edu / Password123! (Dr. P. K. Tripathy)');
  console.log('   - Staff:             ramesh@nexora.edu / Password123! (Ramesh Kumar - Plumbing)');
  console.log('   - Electrician:       suresh@nexora.edu / Password123! (Suresh Verma - Electrical)');
  console.log('   - Warden:            warden.b@nexora.edu / Password123! (Dr. S. K. Mohapatra - Block B)');
  console.log('   - Security:          security.gate1@nexora.edu / Password123! (Vikram Singh - Main Gate)');
  console.log('   - Chief Admin:       admin@nexora.edu / Password123! (Dr. Ananya Ray)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
