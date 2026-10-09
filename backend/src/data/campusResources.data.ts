export interface CampusResource {
  id: string;
  branch: string; // CSE, ECE, MECH, CIVIL, EE, ALL
  semester: number; // 1 to 8
  subjectCode: string;
  subjectName: string;
  type: 'PYQ' | 'NOTES' | 'SYLLABUS' | 'ASSIGNMENT';
  title: string;
  year?: number;
  description: string;
  downloadUrl?: string;
  keyTopics?: string[];
}

export const VERIFIED_CAMPUS_RESOURCES: CampusResource[] = [
  // DBMS (Database Management Systems)
  {
    id: 'res-dbms-pyq-2024',
    branch: 'CSE',
    semester: 4,
    subjectCode: 'CS204',
    subjectName: 'Database Management Systems',
    type: 'PYQ',
    title: 'BPUT End-Semester Examination 2024 Question Paper',
    year: 2024,
    description: 'Official university end-term question paper with question weightage covering Relational Algebra, SQL, Normalization, and ACID transactions.',
    downloadUrl: '/resources/pyq/bput-dbms-2024.pdf',
    keyTopics: ['ER Model', 'BCNF vs 3NF', 'B+ Tree Indexing', 'Serializability', 'Two-Phase Locking (2PL)'],
  },
  {
    id: 'res-dbms-pyq-2023',
    branch: 'CSE',
    semester: 4,
    subjectCode: 'CS204',
    subjectName: 'Database Management Systems',
    type: 'PYQ',
    title: 'BPUT End-Semester Examination 2023 Question Paper',
    year: 2023,
    description: 'Official solved question paper with solutions for high-yield numericals on relational calculus and functional dependencies.',
    downloadUrl: '/resources/pyq/bput-dbms-2023.pdf',
    keyTopics: ['Functional Dependencies', 'Query Optimization', 'Log-based Recovery', 'SQL Joins'],
  },
  {
    id: 'res-dbms-notes-prof',
    branch: 'CSE',
    semester: 4,
    subjectCode: 'CS204',
    subjectName: 'Database Management Systems',
    type: 'NOTES',
    title: 'Comprehensive Lecture Notes by Dr. P. K. Tripathy',
    year: 2024,
    description: 'Faculty-approved modular lecture notes mapped to BPUT 4th Semester syllabus.',
    downloadUrl: '/resources/notes/dbms-complete-notes.pdf',
    keyTopics: ['ER to Relational Schema Mapping', '1NF, 2NF, 3NF, BCNF Decomposition', 'Deadlock Detection', 'Hashing Techniques'],
  },
  {
    id: 'res-dbms-syllabus',
    branch: 'CSE',
    semester: 4,
    subjectCode: 'CS204',
    subjectName: 'Database Management Systems',
    type: 'SYLLABUS',
    title: 'BPUT Official Syllabus & Module Distribution',
    description: 'Detailed syllabus modules, credit distribution (3-0-0), recommended textbooks (Korth, Navathe), and module-wise exam marks allocation.',
    downloadUrl: '/resources/syllabus/bput-cs204-syllabus.pdf',
    keyTopics: ['Module 1: Intro & Data Models', 'Module 2: Relational Queries', 'Module 3: Database Design & Normalization', 'Module 4: Transaction & Concurrency'],
  },

  // Digital Electronics (ECE / CSE)
  {
    id: 'res-de-pyq-2024',
    branch: 'ECE',
    semester: 3,
    subjectCode: 'EC201',
    subjectName: 'Digital Electronics',
    type: 'PYQ',
    title: 'BPUT End-Semester Examination 2024 Question Paper',
    year: 2024,
    description: 'Original question paper covering Karnaugh maps, combinational logic design, flip-flops, and synchronous counter synthesis.',
    downloadUrl: '/resources/pyq/bput-de-2024.pdf',
    keyTopics: ['K-Map 4-Variable Minimization', 'Full Adder using Multiplexer', 'JK Flip-Flop Race Around Condition', 'Mod-N Ripple Counter'],
  },
  {
    id: 'res-de-pyq-2023',
    branch: 'ECE',
    semester: 3,
    subjectCode: 'EC201',
    subjectName: 'Digital Electronics',
    type: 'PYQ',
    title: 'BPUT End-Semester Examination 2023 Question Paper',
    year: 2023,
    description: 'Previous year paper with marked step-by-step solutions for state diagram reductions and finite state machines.',
    downloadUrl: '/resources/pyq/bput-de-2023.pdf',
    keyTopics: ['Quine-McCluskey Method', 'Carry Lookahead Adder', 'Shift Registers (SISO/SIPO)', 'Finite State Machines'],
  },
  {
    id: 'res-de-notes',
    branch: 'ECE',
    semester: 3,
    subjectCode: 'EC201',
    subjectName: 'Digital Electronics',
    type: 'NOTES',
    title: 'Complete Hand-Curated Study Notes',
    year: 2024,
    description: 'High-yield revision notes with highlighted past 5-year repeated university exam questions.',
    downloadUrl: '/resources/notes/digital-electronics-handbook.pdf',
    keyTopics: ['Logic Gates & Boolean Algebra', 'Decoders & Encoders', 'Counters & Registers', 'Semiconductor Memories (RAM/ROM)'],
  },

  // Operating Systems
  {
    id: 'res-os-pyq-2024',
    branch: 'CSE',
    semester: 4,
    subjectCode: 'CS202',
    subjectName: 'Operating Systems',
    type: 'PYQ',
    title: 'BPUT End-Semester Examination 2024 Question Paper',
    year: 2024,
    description: 'End-term paper featuring numerical problems on CPU scheduling (SJF, Round Robin), Banker Algorithm, and paging.',
    downloadUrl: '/resources/pyq/bput-os-2024.pdf',
    keyTopics: ['Process Synchronization (Semaphores)', 'Bankers Deadlock Avoidance', 'Page Replacement (FIFO, LRU, Optimal)', 'Disk Scheduling (SSTF, SCAN)'],
  },
  {
    id: 'res-os-notes',
    branch: 'CSE',
    semester: 4,
    subjectCode: 'CS202',
    subjectName: 'Operating Systems',
    type: 'NOTES',
    title: 'Operating Systems Quick Revision Blueprint',
    description: 'Concise summary of OS concepts with key algorithms and C implementations for fork(), threads, and mutex locks.',
    downloadUrl: '/resources/notes/os-revision-notes.pdf',
    keyTopics: ['Process Lifecycle & IPC', 'Classical Synchronization Problems', 'Virtual Memory & Demand Paging', 'File Systems'],
  },

  // Data Structures & Algorithms
  {
    id: 'res-dsa-pyq-2024',
    branch: 'CSE',
    semester: 3,
    subjectCode: 'CS201',
    subjectName: 'Data Structures & Algorithms',
    type: 'PYQ',
    title: 'BPUT End-Semester Examination 2024 Question Paper',
    year: 2024,
    description: 'Core DSA examination paper testing AVL tree rotations, Graph traversals (BFS/DFS), and dynamic programming.',
    downloadUrl: '/resources/pyq/bput-dsa-2024.pdf',
    keyTopics: ['AVL Trees', 'Dijkstra Shortest Path', 'Quicksort Worst-Case Analysis', 'Binary Search Tree Deletion'],
  },

  // Computer Networks
  {
    id: 'res-cn-pyq-2024',
    branch: 'CSE',
    semester: 5,
    subjectCode: 'CS301',
    subjectName: 'Computer Networks',
    type: 'PYQ',
    title: 'BPUT End-Semester Examination 2024 Question Paper',
    year: 2024,
    description: 'Network engineering examination covering OSI vs TCP/IP, IP subnetting, distance vector routing, and TCP handshake.',
    downloadUrl: '/resources/pyq/bput-cn-2024.pdf',
    keyTopics: ['IPv4 Subnetting & CIDR', 'Go-Back-N vs Selective Repeat', 'TCP Congestion Control', 'DNS and HTTP/2 Protocol'],
  },
];
