import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Faculty Attendance Demo Sessions...');

  // 1. Fetch Faculty User
  const facultyUser = await prisma.user.findFirst({
    where: { email: 'faculty@nexora.edu' },
    include: { staff: true },
  });

  if (!facultyUser) {
    console.error('Faculty user faculty@nexora.edu not found');
    return;
  }

  // 2. Fetch Subjects
  const dsSubject = await prisma.subject.findFirst({
    where: { code: 'CS201' },
    include: { branch: true },
  });

  const dbmsSubject = await prisma.subject.findFirst({
    where: { code: 'CS202' },
    include: { branch: true },
  });

  const coSubject = await prisma.subject.findFirst({
    where: { code: 'CS203' },
    include: { branch: true },
  });

  if (!dsSubject || !dbmsSubject) {
    console.error('Core subjects not found');
    return;
  }

  // 3. Fetch CSE 2nd Year Students
  const cseStudents = await prisma.student.findMany({
    where: {
      branchId: dsSubject.branchId,
      year: dsSubject.year,
    },
    orderBy: { rollNumber: 'asc' },
  });

  console.log(`Found ${cseStudents.length} CSE Year 2 students:`, cseStudents.map(s => `${s.rollNumber} - ${s.fullName}`));

  if (cseStudents.length === 0) {
    console.error('No students found for CSE Year 2');
    return;
  }

  // Demo Sessions on 05 Oct, 04 Oct, 03 Oct, 02 Oct, 30 Sep
  const demoDates = [
    { dateStr: '2026-10-05', period: 1, subject: dsSubject, topic: 'Binary Search Trees & AVL Rotations' },
    { dateStr: '2026-10-05', period: 2, subject: dbmsSubject, topic: 'Relational Algebra & Normalization' },
    { dateStr: '2026-10-05', period: 3, subject: coSubject || dsSubject, topic: 'Instruction Pipeline & Hazards' },
    { dateStr: '2026-10-04', period: 1, subject: dsSubject, topic: 'Red-Black Trees Introduction' },
    { dateStr: '2026-10-04', period: 2, subject: dbmsSubject, topic: 'B+ Tree Indexing Structures' },
    { dateStr: '2026-10-03', period: 1, subject: dsSubject, topic: 'Graph Representation & BFS/DFS' },
    { dateStr: '2026-10-02', period: 1, subject: dsSubject, topic: 'Minimum Spanning Trees: Kruskal & Prim' },
    { dateStr: '2026-09-30', period: 1, subject: dsSubject, topic: 'Dynamic Programming: Knapsack & LCS' },
  ];

  for (const item of demoDates) {
    const d = new Date(item.dateStr);
    const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));

    // Upsert AttendanceSession
    const existing = await prisma.attendanceSession.findFirst({
      where: {
        subjectId: item.subject.id,
        date: normalizedDate,
        period: item.period,
        section: item.subject.section || 'A',
      },
    });

    let session = existing;
    if (!session) {
      session = await prisma.attendanceSession.create({
        data: {
          teacherId: facultyUser.id,
          subjectId: item.subject.id,
          branchId: item.subject.branchId,
          year: item.subject.year,
          semester: item.subject.semester || 3,
          section: item.subject.section || 'A',
          date: normalizedDate,
          period: item.period,
          topic: item.topic,
        },
      });
      console.log(`Created session for ${item.subject.code} on ${item.dateStr} (Period ${item.period})`);
    }

    // Seed records for students in this session
    for (let i = 0; i < cseStudents.length; i++) {
      const student = cseStudents[i];
      // Aryan Khan (220101048) -> Mostly present
      // Rohit Sharma (220101012) -> Mostly present, absent on 03 Oct
      // Others -> alternate
      let status = 'PRESENT';
      if (student.rollNumber === '220101048') {
        status = 'PRESENT';
      } else if (student.rollNumber === '220101012') {
        status = item.dateStr === '2026-10-03' ? 'ABSENT' : 'PRESENT';
      } else if (i % 3 === 0 && item.dateStr === '2026-10-05') {
        status = 'ABSENT';
      }

      await prisma.attendanceRecord.upsert({
        where: {
          attendanceSessionId_studentId: {
            attendanceSessionId: session.id,
            studentId: student.id,
          },
        },
        update: { status },
        create: {
          attendanceSessionId: session.id,
          studentId: student.id,
          status,
          remarks: status === 'ABSENT' ? 'Unexcused absence' : null,
        },
      });
    }
  }

  console.log('✅ Demo attendance sessions & records seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
