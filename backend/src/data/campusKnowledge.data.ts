/**
 * Verified Campus Knowledge Base & Policies
 * Biju Patnaik University of Technology (BPUT) / Nexora Campus
 * Ground-truth repository for academic regulations, grading rules, hostel policies, and campus operations.
 */

export interface CampusKnowledgeItem {
  id: string;
  category:
    | 'Academic'
    | 'Hostel'
    | 'Exam'
    | 'Grading'
    | 'Placement'
    | 'Library'
    | 'Maintenance'
    | 'Documents'
    | 'Scholarship'
    | 'Security'
    | 'General';
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  source: string;
  lastUpdated: string;
  verificationStatus: 'OFFICIAL' | 'VERIFIED' | 'PROVISIONAL';
  audience: Array<'STUDENT' | 'FACULTY' | 'WARDEN' | 'SECURITY' | 'STAFF' | 'ACADEMIC_OFFICER' | 'ADMIN' | 'ALL'>;
  suitableForStudents: boolean;
}

export const VERIFIED_CAMPUS_KNOWLEDGE: CampusKnowledgeItem[] = [
  {
    id: 'bput-grading-system',
    category: 'Grading',
    title: 'BPUT Grading System & CGPA Calculation Formula',
    summary: 'Official 10-point letter grading scale (O, E, A, B, C, D, F) and SGPA/CGPA mathematical conversion.',
    content: `BPUT evaluates academic performance using a 10-point Letter Grading scale:
• **O (Outstanding)**: 90% and above — **10 Grade Points**
• **E (Excellent)**: 80% to 89% — **9 Grade Points**
• **A (Very Good)**: 70% to 79% — **8 Grade Points**
• **B (Good)**: 60% to 69% — **7 Grade Points**
• **C (Fair)**: 50% to 59% — **6 Grade Points**
• **D (Below Average / Pass)**: 40% to 49% — **5 Grade Points**
• **F (Fail)**: Below 40% — **0 Grade Points**

**CGPA Calculation Formula**:
$$\\text{CGPA} = \\frac{\\sum (C_i \\times G_i)}{\\sum C_i}$$
Where $C_i$ is the subject credits and $G_i$ is the grade point earned.

**Equivalent Percentage Conversion Formula**:
$$\\text{Percentage (\\%)} = (\\text{CGPA} - 0.5) \\times 10$$
*Example: A 9.0 CGPA equals (9.0 - 0.5) × 10 = 85.0%.*`,
    keywords: [
      'cgpa',
      'sgpa',
      'grading',
      'grade point',
      'percentage',
      'conversion formula',
      'how to calculate cgpa',
      'o grade',
      'e grade',
      'bput scale',
      'marks to grade',
    ],
    source: 'BPUT Academic Regulations (Clause 6.2)',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'FACULTY', 'ACADEMIC_OFFICER', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'strategy-9-cgpa',
    category: 'Academic',
    title: 'Comprehensive Strategy to Achieve 9+ CGPA in Engineering',
    summary: 'Systematic blueprint: Maximize 30% internal marks, master past 5-year BPUT PYQs, prioritize diagrams, and ace high-credit practical labs.',
    content: `Achieving a **9+ CGPA** requires a deliberate, multi-pronged approach that exploits how university examinations are evaluated:

1. **Maximize Internal Marks (30% Weightage)**:
   - Internal assessment accounts for 30 marks (2 Mid-term tests + Assignments/Quizzes + Attendance).
   - Aim for **27–29 out of 30**. High internals provide an enormous safety cushion: you only need ~53/70 in the end-semester exam to achieve an **'E' grade (9 points)**, and ~63/70 for an **'O' grade (10 points)**.
   - Maintain 80%+ attendance to guarantee the full 5/5 attendance score.

2. **Master the Past 5 Years BPUT PYQs (70% Exam Weightage)**:
   - BPUT question patterns repeat core theoretical concepts and standard numericals by **60% to 70%**.
   - Solve at least 3 previous year papers under timed conditions before each exam.

3. **Strategic Module Coverage (4+1 Rule)**:
   - BPUT semester syllabi consist of 5 modules.
   - Master **4 modules with 100% depth** (ensuring you can answer all compulsory and optional long questions).
   - Cover key definitions and 2-mark question formulas in the remaining 1 module.

4. **Visual & Structured Answer Presentation**:
   - Technical evaluators reward clean, structured presentation.
   - Always draw neat, labeled block diagrams, circuit schematics, ER diagrams, or flowcharts.
   - Use bullet points, bold keywords, and box your final numerical answers with correct units.

5. **Acing Practical & Sessional Labs**:
   - Laboratory courses carry 1.5 to 2 credits and are evaluated internally.
   - Submitting neat lab records on time, performing viva with clarity, and attending all sessions almost always yields 9 or 10 grade points.

6. **Daily 90-Minute Habit vs. Exam-Night Cramming**:
   - Dedicate 90 minutes every evening to summarize lecture notes and solve 2 analytical problems. Consistency beats 12-hour pre-exam cramming every single time.`,
    keywords: [
      '9 cgpa',
      '9+ cgpa',
      'how to get 9 cgpa',
      'how can i get a 9+ cgpa',
      'high cgpa',
      'topper',
      'score high marks',
      'improve grades',
      'exam strategy',
      'academic strategy',
      'good marks',
      'study tips',
    ],
    source: 'Nexora Academic Guidance & Topper Mentorship Framework',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'VERIFIED',
    audience: ['STUDENT', 'FACULTY', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'bput-attendance-regulation',
    category: 'Academic',
    title: 'BPUT Mandatory Attendance Regulation & Condonation Policy',
    summary: '75% minimum attendance rule in every subject for admit card eligibility, with 10% condonation permissible on genuine medical grounds.',
    content: `Under BPUT statutory regulations:
• **Standard Requirement**: A student must maintain a minimum of **75% attendance** in lectures, tutorials, and practical classes in each registered subject during the semester.
• **Admit Card Barring**: Students falling below 75% are ineligible to sit for the semester end examination in that subject.
• **Medical Condonation (65%–74.9%)**: Up to 10% attendance condonation (allowing candidates with at least 65%) may be granted strictly on genuine medical hospitalization/illness grounds.
  - An official medical fitness certificate and prescription must be formally submitted to the Academic Affairs Cell within **7 calendar days** of returning to campus.
• **Duty Leave**: Students representing the college in approved sports, cultural, or hackathon competitions are eligible for official duty attendance.`,
    keywords: [
      'attendance rule',
      '75 percent',
      '75% rule',
      'attendance requirement',
      'minimum attendance',
      'condonation',
      'medical leave',
      'bunk rule',
      'detained',
      'admit card eligibility',
    ],
    source: 'BPUT Academic Regulations Section 7.1',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'FACULTY', 'ACADEMIC_OFFICER', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'hostel-mess-curfew-rules',
    category: 'Hostel',
    title: 'Hostel Curfew, Security Guidelines & Mess Schedule',
    summary: 'Curfew timings (7:30 PM for 1st years, 8:30 PM for seniors), gate pass policy, and daily mess meal schedules.',
    content: `Official Nexora Campus Hostel Rules:
• **Curfew Timings**:
  - **1st Year (Freshers)**: In-campus reporting by **7:30 PM**.
  - **2nd to 4th Year (Seniors)**: In-campus reporting by **8:30 PM**.
• **Gate Passes**: Any exit extending beyond curfew or overnight travel requires an authorized digital Gate Pass approved by the Hostel Warden.
• **Mess Meal Timings**:
  - Breakfast: 07:30 AM – 09:00 AM
  - Lunch: 12:30 PM – 02:00 PM
  - Evening Snacks: 05:00 PM – 06:00 PM
  - Dinner: 07:30 PM – 09:30 PM
• **Quiet Hours**: 10:00 PM to 06:00 AM daily to facilitate study and sleep.`,
    keywords: [
      'curfew',
      'hostel timing',
      'gate timing',
      'mess timing',
      'breakfast time',
      'lunch time',
      'dinner time',
      'in time',
      'hostel rules',
      'night out',
    ],
    source: 'Nexora Student Hostel Handbook (2025–26)',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'WARDEN', 'SECURITY', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'placement-preparation-roadmap',
    category: 'Placement',
    title: 'Campus Recruitment Preparation & Eligibility Criteria',
    summary: 'Placement criteria (minimum 6.5–7.0 CGPA, no active backlogs) and the 4 preparation pillars (DSA, Core CS, Projects, Aptitude).',
    content: `Recommended Campus Placement Strategy for Engineering Students:
1. **Academic Eligibility**:
   - Maintain a CGPA of **>= 7.0** with **zero active backlogs** to be eligible for 95%+ of visiting Tier-1 and product companies.
2. **Data Structures & Algorithms (DSA)**:
   - Master Arrays, Strings, HashMaps, Two Pointers, Trees, Graphs, and Dynamic Programming.
   - Target 150–250 quality problems on LeetCode/GeeksforGeeks.
3. **Core CS Subjects (Technical Interviews)**:
   - **DBMS**: SQL queries, Joins, Normalization (1NF–BCNF), Indexing, ACID.
   - **Operating Systems**: Processes vs Threads, CPU Scheduling, Deadlocks, Paging.
   - **Computer Networks**: OSI & TCP/IP layers, HTTP/HTTPS, DNS, Subnetting.
4. **Hands-On Development Projects**:
   - Build 2 substantial full-stack or systems projects with clean Git repositories and deployed live demos.
5. **Aptitude & Soft Skills**:
   - Practice Quantitative Aptitude, Logical Reasoning, and Verbal ability for online screening tests.`,
    keywords: [
      'placement',
      'campus drive',
      'internship',
      'job preparation',
      'placement eligibility',
      'interview preparation',
      'dsa roadmap',
      'resume tips',
      'software engineer placement',
    ],
    source: 'Nexora Training & Placement (T&P) Cell',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'VERIFIED',
    audience: ['STUDENT', 'FACULTY', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'programming-dsa-guidance',
    category: 'Academic',
    title: 'Computer Science Programming & Problem-Solving Roadmap',
    summary: 'Recommended progression from fundamental language mastery (C++/Java) to Data Structures, OOP, and web/software engineering.',
    content: `Structured approach to building programming excellence:
1. **Core Language Mastery**: Pick either **C++ (with STL)** or **Java (with Collections)**. Master syntax, memory management, pointers/references, and object-oriented design.
2. **Foundational DSA**:
   - Linear: Arrays, Linked Lists, Stacks, Queues.
   - Non-Linear: Binary Trees, Binary Search Trees, Heaps, Hash Tables, Graphs.
3. **Algorithmic Patterns**:
   - Sliding Window, Two Pointers, Fast & Slow Pointers.
   - Recursion & Backtracking (Subsets, Permutations).
   - BFS & DFS Graph Traversals.
   - Dynamic Programming (Memoization & Tabulation).
4. **Best Practices**:
   - Write clean, modular code with descriptive variable names.
   - Always analyze Time and Space Complexity ($O(N)$, $O(\\log N)$, $O(1)$) before coding.`,
    keywords: [
      'learn programming',
      'learn coding',
      'how to start dsa',
      'recursion',
      'dsa roadmap',
      'c++',
      'java',
      'python',
      'algorithms',
      'data structures',
      'coding advice',
    ],
    source: 'Nexora Tech & Coding Club Curriculum',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'VERIFIED',
    audience: ['STUDENT', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'bput-backlog-rules',
    category: 'Exam',
    title: 'BPUT Backlog & Supplementary Examination Rules',
    summary: 'Rules for clearing F-grade backlogs in regular and special supplementary semester examinations.',
    content: `BPUT Backlog & Promotion Guidelines:
• **Grade F Status**: A subject in which a student scores under 40% total marks is recorded as an 'F' grade (Backlog).
• **Reappearing**: Students can clear backlogs during the regular odd/even semester university examinations, or in special supplementary sessions announced for graduating batches.
• **Internal Marks Retention**: Internal assessment marks (out of 30) obtained during the regular semester are carried over unless the student formally applies to repeat the course internals.
• **Degree Requirement**: All backlogs across all 8 semesters must be cleared to receive the B.Tech Degree certificate.`,
    keywords: [
      'backlog',
      'arrears',
      'supplementary exam',
      'clear backlog',
      'f grade',
      'failed in subject',
      'reappear',
      'bput backlog rule',
    ],
    source: 'BPUT Examination Regulations Section 8',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'FACULTY', 'ACADEMIC_OFFICER', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'bonafide-certificate-regulations',
    category: 'Documents',
    title: 'Official Bonafide Certificate Issuance Guidelines & SLA',
    summary: 'Eligibility, application procedure, valid purposes (Scholarship, Bank Loan, Passport, Internship), and 24–48h SLA turnaround.',
    content: `Bonafide Certificate Regulations:
• **Purposes Supported**: Scholarship Applications (State/NSP), Bank Education Loan processing, Passport verification, Visa, and Summer Internship NOCs.
• **Issuing Authority**: Academic Affairs Cell (signed digitally by the Academic Registrar).
• **Turnaround Time (SLA)**: 24 to 48 working hours from digital submission in Nexora.
• **Verification**: Each generated certificate includes a unique verification code and QR code verifiable on \`/verify/:certificateId\`.
• **Requirements**: Active student status with no academic suspension.`,
    keywords: [
      'bonafide',
      'bonafide certificate',
      'how to get bonafide',
      'scholarship certificate',
      'passport certificate',
      'bank loan certificate',
      'internship noc',
      'certificate status',
    ],
    source: 'Nexora Academic Affairs Cell Guidelines (Section 3)',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'ACADEMIC_OFFICER', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'campus-maintenance-sla',
    category: 'Maintenance',
    title: 'Campus Facility Maintenance & Ticket Resolution SLAs',
    summary: 'Turnaround SLAs: Urgent (4h), High (12h), Normal (48h) across Electrical, Plumbing, Carpentry, and Network domains.',
    content: `Campus Infrastructure Resolution Protocol:
• **Service Level Agreements (SLA)**:
  - **URGENT (4 hours)**: Sparking switches, heavy water pipe bursts, power cut to entire room/wing, broken door locks compromising room security.
  - **HIGH (12 hours)**: Non-functional fan during summer, choked drain, water purifier outage.
  - **NORMAL (48 hours)**: Minor faucet leaks, cupboard latch issues, furniture repair, tube light flicker.
• **Automatic Routing**: Tickets logged through Nexora Copilot or Complaints module automatically route to specialized estate technicians based on location and category.
• **Student Confirmation**: Once a technician marks a ticket resolved, the student receives a prompt to confirm resolution and rate service quality.`,
    keywords: [
      'maintenance',
      'complaint sla',
      'broken fan',
      'tap leak',
      'plumbing',
      'electricity problem',
      'technician',
      'repair time',
      'how long repair takes',
    ],
    source: 'Nexora Estate Management & Maintenance SLA Charter',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'STAFF', 'WARDEN', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'hostel-leave-gatepass-policy',
    category: 'Hostel',
    title: 'Hostel Leave Application & Digital Gate Pass Protocol',
    summary: 'Dual verification exit workflow: Parent consent for overnight leaves, dynamic HMAC QR code, and offline 4-digit PIN for gate security.',
    content: `Hostel Exit & Leave Policy:
• **Day Pass (Gate Pass)**:
  - For market visits, library trips, or medical visits during permissible non-curfew hours.
  - Generates a **time-limited HMAC QR Code** and a secure **4-digit offline PIN** shown to security guards at Gate 1 or Gate 2.
• **Overnight / Vacation Leave (Hostel Leave)**:
  - Required for any absence extending overnight or during festive vacations (Diwali, Puja, Summer Break).
  - Requires **Parent/Guardian consent confirmation** and Hostel Warden approval.
• **Security Departure & Return Check**:
  - Security guards scan the QR code upon departure and return. Real-time timestamps are recorded in the central database.`,
    keywords: [
      'gate pass',
      'gatepass',
      'hostel leave',
      'night out',
      'going home',
      'parent consent',
      'offline pin',
      'exit campus',
      'leave procedure',
    ],
    source: 'Nexora Student Security & Hostel Warden Protocol',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'WARDEN', 'SECURITY', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'scholarship-schemes-overview',
    category: 'Scholarship',
    title: 'State & National Scholarship Schemes for Engineering Students',
    summary: 'Eligibility and verification process for Odisha State Scholarship Portal (PRERANA, Medhabruti) and National Scholarship Portal (NSP).',
    content: `Scholarship Schemes & Institutional Verification:
• **Major Schemes**:
  - **Odisha State Scholarship Portal (PRERANA)**: Post-Matric scholarship for SC, ST, OBC/SEBC students.
  - **e-Medhabruti**: Merit scholarship by Higher Education Dept, Govt of Odisha.
  - **NSP Central Sector Scheme**: For meritorious students from low-income families.
• **Institutional Verification Steps**:
  1. Apply online on the respective government portal with income and caste certificates.
  2. Request an **Official Bonafide Certificate** from Nexora Copilot.
  3. Submit the printout and bonafide to the College Nodal Scholarship Officer for biometric/digital endorsement before the institutional deadline.`,
    keywords: [
      'scholarship',
      'prerana',
      'medhabruti',
      'nsp',
      'post matric',
      'scholarship deadline',
      'fee concession',
      'scholarship verification',
    ],
    source: 'Nexora Student Welfare & Nodal Scholarship Office',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'VERIFIED',
    audience: ['STUDENT', 'ACADEMIC_OFFICER', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'academic-calendar-exam-cycle',
    category: 'Academic',
    title: 'BPUT Academic Calendar & Semester Examination Cycle',
    summary: 'Semester timeline breakdown: 90 instructional days, two mid-term tests, lab sessionals, and end-semester university exams.',
    content: `BPUT Semester Academic Cycle:
• **Semester Duration**: Minimum 90 working days (approximately 15–16 instructional weeks).
• **Mid-Semester Assessments**:
  - Conducted between the 7th and 9th week of the semester.
  - Consists of two internal tests (best of two or average per departmental guidelines) contributing to the 30% internal mark bucket.
• **End-Semester Examination**:
  - Form Fill-Up: Typically announced 4 weeks prior to semester end on the university portal.
  - Practical & Viva Voce Exams: Conducted 1 week before external theory examinations.
  - Theory Exams: 70 marks per theory subject, evaluated externally by BPUT university examiners.`,
    keywords: [
      'academic calendar',
      'exam dates',
      'mid sem date',
      'semester timeline',
      'form fill up',
      'exam schedule',
      'when are exams',
      'semester schedule',
    ],
    source: 'BPUT University Academic Calendar 2025–26',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'FACULTY', 'ACADEMIC_OFFICER', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'campus-notices-timetable-policy',
    category: 'Academic',
    title: 'Official Campus Notices & Timetable Scheduling Regulations',
    summary: 'Digital publishing rules for branch and semester targeted circulars, urgent class updates, and daily routine revisions.',
    content: `Campus Communication & Routine Regulation:
• **Digital Notice Publication**: Official notices are published via Nexora with granular audience targeting (Target: ALL, BRANCH, YEAR, SEMESTER, or SECTION).
• **Class Rescheduling & Adjustments**: Faculty class adjustment notices or room reassignments must be published by **8:00 AM** on the date of instruction.
• **Official Hierarchy**: University circulars signed by the Dean or Registrar take precedence over departmental reminders.
• **Notice Priority Levels**:
  - **URGENT**: Exam schedule updates, campus closures, severe weather alerts.
  - **NORMAL**: Regular academic announcements, guest lectures, club events.
  - **LOW**: General informational items and club notifications.`,
    keywords: [
      'notices',
      'notice board',
      'circular',
      'timetable update',
      'class schedule',
      'reschedule',
      'routine rules',
      'announcements',
    ],
    source: 'Nexora Academic Operations Charter (Section 4.1)',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['STUDENT', 'FACULTY', 'ACADEMIC_OFFICER', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'gate-security-turnstile-policy',
    category: 'Security',
    title: 'Main Gate Security, Pass Verification & Visitor Regulations',
    summary: 'Turnstile access protocols at Gate 1 and Gate 2: QR token scanning, 4-digit offline PIN fallback, and emergency response priorities.',
    content: `Main Gate Turnstile Security Protocols:
• **Entry/Exit Verification**: All student egress and ingress is authenticated at Gate 1 (Main Gate) or Gate 2 (Hostel Quad Gate) using dynamic HMAC QR tokens or emergency 4-digit PINs.
• **Security Guard Turnstile Interface**: Security officers scan student passes via the Nexora Security Scanner (\`/security/scan\`), recording precise timestamps.
• **Late Entry Logging**: Students arriving after curfew (7:30 PM for 1st Year, 8:30 PM for seniors) are logged into the Late Registry and intimations are routed to the Hostel Warden.
• **Emergency Protocols**: In the event of a campus SOS trigger, security units immediately receive location, distress type, and contact telemetry to dispatch first responders.`,
    keywords: [
      'security gate',
      'turnstile',
      'gate 1',
      'gate 2',
      'security rules',
      'visitor policy',
      'late entry',
      'gate verification',
      'qr scanner',
    ],
    source: 'Nexora Campus Security & Gate Operations Protocol',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['SECURITY', 'WARDEN', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
  {
    id: 'warden-hostel-operations-policy',
    category: 'Hostel',
    title: 'Hostel Warden Operational Guidelines & Leave Review Protocols',
    summary: 'Warden authority guidelines: 12h SLA on overnight leaves, parental consent verification, and hostel facility oversight.',
    content: `Hostel Warden Operational Regulations:
• **Jurisdiction**: Wardens exercise administrative and disciplinary authority over their designated residential hostel blocks (e.g. Block A, Block B, Block C).
• **Leave Application Adjudication**:
  - Standard overnight leaves: Reviewed and approved within **12 hours**.
  - Emergency/Medical leave: Adjudicated within **2 hours**.
  - Parental consent telephone verification is mandatory for all leaves exceeding 3 nights.
• **Nightly Roll-Call Verification**: Nightly biometric or physical register verification is conducted by block caretakers between 9:00 PM and 9:30 PM.
• **Room Maintenance Oversight**: Urgent room repair alerts (sparking electricity, water flooding) trigger immediate warden escalation to the central estate office.`,
    keywords: [
      'warden policy',
      'warden rules',
      'hostel block',
      'leave approval',
      'roll call',
      'hostel administration',
      'warden duties',
    ],
    source: 'Nexora Hostel Administration & Warden Operational Manual',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['WARDEN', 'ADMIN'],
    suitableForStudents: false,
  },
  {
    id: 'academic-officer-bonafide-policy',
    category: 'Documents',
    title: 'Academic Cell Bonafide Certification & Verification Protocol',
    summary: 'Procedural verification for issuing official digitally signed bonafide certificates and maintaining tamper-evident audit trails.',
    content: `Academic Cell Certification Directives:
• **Prerequisite Verification**: Before approving a Bonafide Certificate request, the Academic Officer validates:
  1. Active semester student enrollment status without disciplinary suspension.
  2. Verified academic branch, year, and roll number match.
  3. Valid stated purpose (Scholarship, Bank Loan, Passport, Internship NOC).
• **Turnaround Commitment**: All digital requests processed within **24 to 48 working hours**.
• **Verification Architecture**: Each certificate is stamped with a unique document number, HMAC token, and public QR code resolvable at \`/verify/:certificateId\`.
• **Physical Stamping**: If bank or consular authorities require hard-copy embossment, students may bring the printed PDF to Window 3, Academic Cell, Ground Floor Admin Block.`,
    keywords: [
      'academic officer',
      'bonafide approval',
      'certification protocol',
      'academic cell',
      'window 3',
      'document verification',
    ],
    source: 'Nexora Academic Registrar Policy Guideline 2025',
    lastUpdated: '2025-2026 Academic Year',
    verificationStatus: 'OFFICIAL',
    audience: ['ACADEMIC_OFFICER', 'ADMIN', 'ALL'],
    suitableForStudents: true,
  },
];

/**
 * Lightweight tokenized knowledge search across verified campus records.
 * Returns relevant grounded items sorted by keyword overlap relevance score.
 * Supports optional audience role filtering.
 */
export function searchCampusKnowledge(
  query: string,
  maxResults = 3,
  userRole?: string,
  minScore = 1
): CampusKnowledgeItem[] {
  const cleanQuery = query.toLowerCase().trim();
  const queryTokens = cleanQuery.split(/[\s,?.!-]+/).filter((t) => t.length > 2);

  const filteredKnowledge = userRole
    ? VERIFIED_CAMPUS_KNOWLEDGE.filter(
        (item) => item.audience.includes('ALL') || item.audience.includes(userRole as any)
      )
    : VERIFIED_CAMPUS_KNOWLEDGE;

  const scored = filteredKnowledge.map((item) => {
    let score = 0;

    // Check exact keyword matches
    for (const kw of item.keywords) {
      if (cleanQuery.includes(kw.toLowerCase())) {
        score += kw.length * 3;
      }
    }

    // Check token matches in title, summary, and content
    for (const token of queryTokens) {
      if (item.title.toLowerCase().includes(token)) score += 6;
      if (item.summary.toLowerCase().includes(token)) score += 4;
      if (item.keywords.some((k) => k.toLowerCase().includes(token))) score += 5;
      if (item.content.toLowerCase().includes(token)) score += 1;
    }

    return { item, score };
  });

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.item);
}

/**
 * Retrieves a single verified knowledge item by its unique ID.
 */
export function getKnowledgeItemById(id: string): CampusKnowledgeItem | undefined {
  return VERIFIED_CAMPUS_KNOWLEDGE.find((item) => item.id === id);
}

/**
 * Lists verified campus knowledge items with optional category and audience filtering.
 */
export function listVerifiedKnowledge(filters?: {
  category?: string;
  audience?: string;
  suitableForStudents?: boolean;
}): CampusKnowledgeItem[] {
  return VERIFIED_CAMPUS_KNOWLEDGE.filter((item) => {
    if (filters?.category && item.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    if (
      filters?.audience &&
      !item.audience.includes('ALL') &&
      !item.audience.includes(filters.audience as any)
    ) {
      return false;
    }
    if (
      typeof filters?.suitableForStudents === 'boolean' &&
      item.suitableForStudents !== filters.suitableForStudents
    ) {
      return false;
    }
    return true;
  });
}
