import { VERIFIED_CAMPUS_PROCEDURES, CampusProcedure } from '../data/campusGuide.data';
import { VERIFIED_CAMPUS_RESOURCES, CampusResource } from '../data/campusResources.data';
import { AuthUser } from '../types/auth';
import { GeminiService } from './gemini.service';
import { config } from '../config/env';

export type CopilotIntent =
  | 'CREATE_MAINTENANCE_REQUEST'
  | 'REQUEST_BONAFIDE'
  | 'APPLY_HOSTEL_LEAVE'
  | 'CREATE_GATE_PASS'
  | 'CAMPUS_GUIDE'
  | 'STUDY_PLAN'
  | 'RESOURCE_SEARCH'
  | 'CAMPUS_STATUS'
  | 'FALLBACK';

export interface CopilotCard {
  cardType:
    | 'ACTION_MAINTENANCE'
    | 'ACTION_BONAFIDE'
    | 'ACTION_LEAVE'
    | 'ACTION_GATE_PASS'
    | 'GUIDE_PROCEDURE'
    | 'STUDY_PLAN'
    | 'RESOURCE_LIST';
  title: string;
  data: any;
}

export interface CopilotResponse {
  intent: CopilotIntent;
  category?: string;
  confidence: number;
  message: string;
  cards: CopilotCard[];
  quickReplies?: string[];
}

export class CopilotService {
  /**
   * Main conversational intelligence entry point.
   * Flow: Natural Language -> Intent Detection -> Backend Validation -> Action/Guide Cards.
   */
  static async processMessage(
    userMessage: string,
    user: AuthUser,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<CopilotResponse> {
    const text = userMessage.trim();
    const lower = text.toLowerCase();

    // 0. If Gemini API Key is configured, attempt intelligent generation via Google Gemini
    if (config.geminiApiKey) {
      try {
        const geminiRes = await GeminiService.generateResponse(userMessage, user, history);
        if (geminiRes && geminiRes.intent && geminiRes.message) {
          return this.enrichGeminiResponse(geminiRes, text, lower, user);
        }
      } catch (err) {
        console.warn('[Copilot] Gemini generation failed, falling back to local engine:', err);
      }
    }

    // 1. Check for Study Plan requests first
    if (this.isStudyPlanIntent(lower)) {
      return this.handleStudyPlan(text, lower, user);
    }

    // 2. Check for Resource / PYQ search
    if (this.isResourceSearchIntent(lower)) {
      return this.handleResourceSearch(text, lower, user);
    }

    // 3. Check for specific Actionable Workflow Intents (SOLVE)
    if (this.isMaintenanceIntent(lower)) {
      return this.handleMaintenanceAction(text, lower, user);
    }

    if (this.isBonafideIntent(lower)) {
      return this.handleBonafideAction(text, lower, user);
    }

    if (this.isLeaveIntent(lower)) {
      return this.handleLeaveAction(text, lower, user);
    }

    if (this.isGatePassIntent(lower)) {
      return this.handleGatePassAction(text, lower, user);
    }

    // 4. Check for Verified Campus Procedures (ASK - CAMPUS GUIDE)
    const matchedProcedure = this.findMatchingProcedure(lower);
    if (matchedProcedure) {
      return this.handleGuideProcedure(matchedProcedure, user);
    }

    // 5. Check for Student Status / Overview Query
    if (
      lower.includes('my status') ||
      lower.includes('my requests') ||
      lower.includes('what do i need to do') ||
      lower.includes('today classes') ||
      lower.includes('my attendance')
    ) {
      return this.handleCampusStatus(user);
    }

    // 6. Zero-hallucination fallback
    return {
      intent: 'FALLBACK',
      confidence: 0.9,
      message:
        "I don't have verified information about this specific query yet. To keep you safe and prevent misinformation, I only answer verified campus procedures and connect you to official Nexora workflows.",
      cards: [],
      quickReplies: [
        'Report a Hostel Problem',
        'Request a Bonafide Certificate',
        'Apply for Hostel Leave',
        'Generate a Gate Pass',
        'Plan my upcoming exams',
        'Find BPUT PYQs',
      ],
    };
  }

  // =========================================================================
  // INTENT DETECTORS
  // =========================================================================

  private static isStudyPlanIntent(text: string): boolean {
    return (
      (text.includes('exam') || text.includes('study') || text.includes('plan') || text.includes('prepare') || text.includes('roadmap')) &&
      (text.includes('day') || text.includes('days') || text.includes('week') || text.includes('schedule') || text.includes('haven\'t started') || text.includes('syllabus'))
    );
  }

  private static isResourceSearchIntent(text: string): boolean {
    return (
      text.includes('pyq') ||
      text.includes('previous year') ||
      text.includes('question paper') ||
      text.includes('notes') ||
      text.includes('study material') ||
      text.includes('syllabus') ||
      (text.includes('where can i find') && (text.includes('paper') || text.includes('book')))
    );
  }

  private static isMaintenanceIntent(text: string): boolean {
    const maintenanceKeywords = [
      'fan',
      'tap',
      'leak',
      'water',
      'plumbing',
      'electric',
      'spark',
      'switch',
      'socket',
      'light',
      'tube',
      'bulb',
      'drain',
      'flush',
      'washbasin',
      'door',
      'window',
      'almirah',
      'lock',
      'bed',
      'chair',
      'table',
      'wifi not working',
      'internet down',
      'cleanliness',
      'repair',
      'not working',
      'broken',
      'complaint',
    ];
    return maintenanceKeywords.some((kw) => text.includes(kw));
  }

  private static isBonafideIntent(text: string): boolean {
    return (
      text.includes('bonafide') ||
      text.includes('bona fide') ||
      (text.includes('certificate') && (text.includes('scholarship') || text.includes('bank') || text.includes('passport') || text.includes('internship')))
    );
  }

  private static isLeaveIntent(text: string): boolean {
    return (
      text.includes('hostel leave') ||
      text.includes('home leave') ||
      text.includes('going home') ||
      text.includes('night out') ||
      text.includes('overnight leave') ||
      text.includes('vacation leave') ||
      (text.includes('leave') && !text.includes('fan') && !text.includes('door'))
    );
  }

  private static isGatePassIntent(text: string): boolean {
    return (
      text.includes('gate pass') ||
      text.includes('gatepass') ||
      text.includes('out pass') ||
      text.includes('exit pass') ||
      text.includes('visit market') ||
      text.includes('go outside') ||
      text.includes('going out')
    );
  }

  // =========================================================================
  // HANDLERS (SOLVE & ASK & PLAN)
  // =========================================================================

  private static handleMaintenanceAction(
    rawText: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    let category = 'General Maintenance';
    let issueType = 'Repair Needed';
    let title = 'Hostel Facility Maintenance';
    let priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL';

    if (/fan|spark|switch|socket|power|short|wire|light|bulb|tube|ac|cooler/.test(lower)) {
      category = 'Electrical';
      if (/spark|short circuit|smoke/.test(lower)) {
        priority = 'URGENT';
        issueType = 'Electrical Sparks / Fire Hazard';
        title = 'Urgent: Electrical Sparking & Switchboard Breakdown';
      } else if (/fan/.test(lower)) {
        issueType = 'Ceiling Fan Not Working';
        title = 'Hostel Ceiling Fan Repair';
      } else {
        issueType = 'Lighting / Electrical Fixture Fault';
        title = 'Electrical Repair Request';
      }
    } else if (/tap|pipe|leak|water|drain|flush|basin|toilet|shower|sink/.test(lower)) {
      category = 'Plumbing';
      if (/overflow|burst|flooding/.test(lower)) {
        priority = 'URGENT';
        issueType = 'Continuous Water Overflow / Pipe Burst';
        title = 'Urgent: Water Leakage & Flooding';
      } else if (/tap/.test(lower)) {
        issueType = 'Bathroom Tap Leakage';
        title = 'Bathroom Tap Repair';
      } else {
        issueType = 'Plumbing Line Inspection';
        title = 'Hostel Plumbing Maintenance';
      }
    } else if (/door|window|lock|handle|table|chair|bed|hinge|cupboard|almirah/.test(lower)) {
      category = 'Carpentry';
      issueType = 'Furniture / Lock Repair';
      title = 'Hostel Room Carpentry & Fixture Repair';
    } else if (/wifi|internet|lan|router|network|speed/.test(lower)) {
      category = 'Network / IT';
      issueType = 'Hostel Wi-Fi Connectivity Issue';
      title = 'Hostel Wi-Fi / LAN Issue';
    }

    const defaultLocation =
      user.hostelBlock && user.roomNumber
        ? `${user.hostelBlock} / Room ${user.roomNumber}`
        : user.hostelBlock || 'Hostel Block B / Room 204';

    return {
      intent: 'CREATE_MAINTENANCE_REQUEST',
      category,
      confidence: 0.95,
      message: `I can help with that. This looks like a **${category} Maintenance** issue for your room (${defaultLocation}). I have prepared the maintenance request for you below. Clicking confirm will route it directly to the designated on-duty campus technician.`,
      cards: [
        {
          cardType: 'ACTION_MAINTENANCE',
          title: `Submit ${category} Request`,
          data: {
            title,
            description: rawText,
            category,
            issueType,
            location: defaultLocation,
            priority,
            studentName: user.fullName || user.username,
            rollNumber: user.rollNumber,
          },
        },
      ],
      quickReplies: [
        'How long will the repair take?',
        'What are the technician working hours?',
        'Check my active requests',
      ],
    };
  }

  private static handleBonafideAction(
    rawText: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    let purpose = 'Scholarship';
    if (lower.includes('bank') || lower.includes('loan')) purpose = 'Bank';
    else if (lower.includes('intern') || lower.includes('internship')) purpose = 'Internship';
    else if (lower.includes('passport') || lower.includes('visa')) purpose = 'Passport';
    else if (lower.includes('competition') || lower.includes('hackathon')) purpose = 'Education';

    return {
      intent: 'REQUEST_BONAFIDE',
      category: 'Documents',
      confidence: 0.94,
      message: `You can request an official, digitally certified **Bonafide Certificate** through the Academic Services wing. Once approved by the Academic Officer, a tamper-evident PDF with an embedded verification QR code will be generated for download.`,
      cards: [
        {
          cardType: 'ACTION_BONAFIDE',
          title: 'Start Bonafide Request',
          data: {
            purpose,
            studentName: user.fullName || user.username,
            rollNumber: user.rollNumber,
            branch: user.branch || 'CSE',
            year: user.year || 2,
            availablePurposes: [
              'Scholarship',
              'Bank',
              'Internship',
              'Education',
              'Passport',
              'Other',
            ],
          },
        },
      ],
      quickReplies: [
        'How long does bonafide approval take?',
        'Where can I download my issued documents?',
        'Verify an existing certificate',
      ],
    };
  }

  private static handleLeaveAction(
    rawText: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    const today = new Date();
    const startDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);

    return {
      intent: 'APPLY_HOSTEL_LEAVE',
      category: 'Hostel',
      confidence: 0.93,
      message: `I've prepared your **Hostel Leave Application** for Warden review. Make sure your emergency guardian contact is reachable for verbal confirmation if requested.`,
      cards: [
        {
          cardType: 'ACTION_LEAVE',
          title: 'Submit Hostel Leave Application',
          data: {
            startDate: startDate.toISOString().slice(0, 10),
            endDate: endDate.toISOString().slice(0, 10),
            reason: rawText.length > 8 ? rawText : 'Family gathering and vacation travel',
            emergencyContact: '+91 9876500001 (Father)',
            parentConsent: true,
            hostelBlock: user.hostelBlock || 'Block B',
            roomNumber: user.roomNumber || '204',
          },
        },
      ],
      quickReplies: [
        'What are the rules for hostel leave?',
        'Do I need HOD permission for leave?',
        'Check my pending leave status',
      ],
    };
  }

  private static handleGatePassAction(
    rawText: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    const now = new Date();
    const dep = new Date(now.getTime() + 30 * 60 * 1000);
    const ret = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const toLocalISO = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    let destination = 'Bhubaneswar City Market';
    if (lower.includes('library')) destination = 'State Central Library';
    else if (lower.includes('station')) destination = 'Railway Station';
    else if (lower.includes('hospital')) destination = 'City Hospital';

    return {
      intent: 'CREATE_GATE_PASS',
      category: 'Security',
      confidence: 0.92,
      message: `Here is your **Campus Exit Gate Pass** form. Once approved by your Hostel Warden, you will receive an HMAC-signed turnstile QR code and an offline 4-digit PIN for optical turnstile clearance at the main gate.`,
      cards: [
        {
          cardType: 'ACTION_GATE_PASS',
          title: 'Submit Campus Gate Pass',
          data: {
            destination,
            reason: rawText.length > 6 ? rawText : 'Purchasing academic supplies and books',
            departureTime: toLocalISO(dep),
            expectedReturnTime: toLocalISO(ret),
            hostelBlock: user.hostelBlock || 'Block B',
          },
        },
      ],
      quickReplies: [
        'What is the evening campus curfew?',
        'Can I use the offline 4-digit PIN at the gate?',
        'View my active gate pass',
      ],
    };
  }

  private static handleGuideProcedure(
    proc: CampusProcedure,
    user: AuthUser
  ): CopilotResponse {
    const cards: CopilotCard[] = [
      {
        cardType: 'GUIDE_PROCEDURE',
        title: proc.title,
        data: proc,
      },
    ];

    // If procedure has a direct workflow hook, attach the action card as well!
    if (proc.directActionIntent === 'REQUEST_BONAFIDE') {
      cards.push({
        cardType: 'ACTION_BONAFIDE',
        title: 'Start Bonafide Request',
        data: {
          purpose: 'Scholarship',
          studentName: user.fullName || user.username,
          rollNumber: user.rollNumber,
          branch: user.branch || 'CSE',
          year: user.year || 2,
        },
      });
    } else if (proc.directActionIntent === 'CREATE_MAINTENANCE_REQUEST') {
      cards.push({
        cardType: 'ACTION_MAINTENANCE',
        title: 'Report Room Problem',
        data: {
          title: 'Hostel Maintenance Request',
          description: 'Maintenance inspection required',
          category: 'General Maintenance',
          location: user.hostelBlock ? `${user.hostelBlock} / Room ${user.roomNumber || '204'}` : 'Hostel Block B',
          priority: 'NORMAL',
        },
      });
    }

    return {
      intent: 'CAMPUS_GUIDE',
      category: proc.category,
      confidence: 0.98,
      message: `Here is the verified university procedure for **${proc.title}** handled by the **${proc.department}**.`,
      cards,
      quickReplies: [
        'Where is this department located?',
        'What documents do I need to carry?',
        'Ask about another procedure',
      ],
    };
  }

  private static handleStudyPlan(
    rawText: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    // 1. Identify Subject
    let subject = 'Database Management Systems';
    let subjectCode = 'CS204';

    if (lower.includes('dbms') || lower.includes('database')) {
      subject = 'Database Management Systems';
      subjectCode = 'CS204';
    } else if (lower.includes('os') || lower.includes('operating system')) {
      subject = 'Operating Systems';
      subjectCode = 'CS202';
    } else if (lower.includes('digital') || lower.includes('de')) {
      subject = 'Digital Electronics';
      subjectCode = 'EC201';
    } else if (lower.includes('dsa') || lower.includes('data structure')) {
      subject = 'Data Structures & Algorithms';
      subjectCode = 'CS201';
    } else if (lower.includes('network') || lower.includes('cn')) {
      subject = 'Computer Networks';
      subjectCode = 'CS301';
    }

    // 2. Identify Days
    let days = 10;
    const matchDays = lower.match(/(\d+)\s*(?:days|day)/);
    if (matchDays && matchDays[1]) {
      days = Math.max(2, Math.min(30, parseInt(matchDays[1], 10)));
    } else if (lower.includes('1 week') || lower.includes('one week')) {
      days = 7;
    } else if (lower.includes('2 weeks') || lower.includes('two weeks')) {
      days = 14;
    }

    const plan = this.generateStructuredStudyPlan(subject, subjectCode, days, 3);

    // Also look for matching resources inside Nexora!
    const matchingResources = VERIFIED_CAMPUS_RESOURCES.filter(
      (r) => r.subjectCode === subjectCode
    );

    const cards: CopilotCard[] = [
      {
        cardType: 'STUDY_PLAN',
        title: `${days}-Day High-Yield Study Roadmap: ${subject}`,
        data: {
          subject,
          subjectCode,
          days,
          hoursPerDay: 3,
          plan,
        },
      },
    ];

    if (matchingResources.length > 0) {
      cards.push({
        cardType: 'RESOURCE_LIST',
        title: `Available University Resources for ${subject}`,
        data: {
          subject,
          subjectCode,
          resources: matchingResources,
        },
      });
    }

    return {
      intent: 'STUDY_PLAN',
      category: 'Academic',
      confidence: 0.96,
      message: `I've constructed a realistic, prioritized **${days}-day study roadmap** for **${subject} (${subjectCode})**. The strategy prioritizes foundational concept clarity early on, high-yield university question patterns in the middle, and dedicated BPUT PYQ solving and revision buffers before the exam.`,
      cards,
      quickReplies: [
        `Show me ${subjectCode} 2024 PYQs`,
        'Adjust plan for 4 hours/day',
        'Save this roadmap to my Academic Hub',
      ],
    };
  }

  private static handleResourceSearch(
    rawText: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    let matchedResources = VERIFIED_CAMPUS_RESOURCES;

    if (lower.includes('dbms') || lower.includes('database')) {
      matchedResources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'CS204');
    } else if (lower.includes('digital') || lower.includes('electronics')) {
      matchedResources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'EC201');
    } else if (lower.includes('os') || lower.includes('operating')) {
      matchedResources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'CS202');
    } else if (lower.includes('dsa') || lower.includes('data structure')) {
      matchedResources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'CS201');
    } else if (lower.includes('network')) {
      matchedResources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'CS301');
    }

    if (matchedResources.length === 0) {
      return {
        intent: 'RESOURCE_SEARCH',
        confidence: 0.8,
        message: "I couldn't find that specific resource in the Nexora verified database yet. Would you like me to check with the Central Library book bank or generate a topic study roadmap?",
        cards: [],
        quickReplies: ['Check Central Library clearance', 'Create a study roadmap'],
      };
    }

    return {
      intent: 'RESOURCE_SEARCH',
      category: 'Academic',
      confidence: 0.95,
      message: `Found **${matchedResources.length} verified university resources** matching your search in Nexora Campus:`,
      cards: [
        {
          cardType: 'RESOURCE_LIST',
          title: 'Verified Academic Materials & University PYQs',
          data: {
            resources: matchedResources,
          },
        },
      ],
      quickReplies: [
        'Generate study plan for these topics',
        'Download all 2024 Question Papers',
      ],
    };
  }

  private static handleCampusStatus(user: AuthUser): CopilotResponse {
    return {
      intent: 'CAMPUS_STATUS',
      category: 'General',
      confidence: 0.9,
      message: `Here is your current student status overview for **${user.fullName || user.username}** (Roll: ${user.rollNumber || '220101048'}):
• **Hostel**: ${user.hostelBlock || 'Block B'} / Room ${user.roomNumber || '204'}
• **Academic Cohort**: ${user.branch || 'CSE'} — Year ${user.year || 2}
• **Operational Standing**: Active Semester — No disciplinary flags.

You can click any quick action below to immediately resolve a problem or plan your week.`,
      cards: [],
      quickReplies: [
        'Report a problem in my room',
        'Check my attendance standing',
        'Plan my upcoming exams',
        'Apply for gate pass',
      ],
    };
  }

  // =========================================================================
  // HELPER ALGORITHMS
  // =========================================================================

  private static findMatchingProcedure(lower: string): CampusProcedure | null {
    let bestMatch: CampusProcedure | null = null;
    let maxScore = 0;

    for (const proc of VERIFIED_CAMPUS_PROCEDURES) {
      let score = 0;
      for (const kw of proc.keywords) {
        if (lower.includes(kw)) {
          score += kw.length; // weight longer, more specific keywords
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = proc;
      }
    }

    return maxScore >= 4 ? bestMatch : null;
  }

  public static generateStructuredStudyPlan(
    subject: string,
    subjectCode: string,
    days: number,
    hoursPerDay = 3
  ): Array<{
    dayNumber: number;
    phase: string;
    focusTitle: string;
    topics: string[];
    taskType: 'FOUNDATION' | 'DEEP_DIVE' | 'PYQ_PRACTICE' | 'REVISION';
    recommendedHours: number;
  }> {
    const plan = [];

    // Tailored curriculum topics per subject
    const subjectCurriculum: Record<string, string[][]> = {
      CS204: [
        ['ER Model & Constraints', 'Relational Model & Schema Mapping', 'Relational Algebra (Select, Project, Join)'],
        ['Tuple Relational Calculus', 'SQL DDL/DML & Nested Subqueries', 'Aggregate Functions & Views'],
        ['Functional Dependencies', 'Closure & Minimal Cover', '1NF, 2NF, 3NF Decomposition'],
        ['Boyce-Codd Normal Form (BCNF)', 'Lossless Join & Dependency Preservation', 'Multi-valued Dependencies (4NF)'],
        ['Transaction Processing & ACID Properties', 'Schedules & Serializability (Conflict & View)', 'Recoverable & Cascadeless Schedules'],
        ['Two-Phase Locking Protocol (2PL)', 'Deadlock Prevention, Detection & Wait-Die Schemes', 'Timestamp-based Concurrency Control'],
        ['Database Recovery: Log-based (Deferred/Immediate)', 'Checkpoints & Shadow Paging', 'B-Tree & B+ Tree File Indexing'],
      ],
      EC201: [
        ['Boolean Algebra Postulates & De Morgan', 'Minimization using 4-Variable K-Maps', 'SOP and POS Canonical Forms'],
        ['Combinational Circuits: Half/Full Adder, Subtractor', 'Carry Lookahead Adder', 'Multiplexers & Demultiplexers Implementation'],
        ['Decoders (3:8), Encoders & Priority Encoders', 'Code Converters (Binary to Gray)', 'Hazard and Glitch Minimization'],
        ['Sequential Circuits: SR, D, JK & T Latches', 'Master-Slave JK Flip-Flop & Race Condition', 'Excitation Tables & Flip-Flop Conversions'],
        ['Synchronous & Asynchronous Up/Down Counters', 'Mod-N Counter Design', 'Ring Counter & Johnson Counter'],
        ['Shift Registers (SISO, SIPO, PISO, PIPO)', 'Universal Shift Register', 'Finite State Machine Design (Mealy & Moore)'],
        ['Semiconductor Memories: RAM, ROM, PLA, PAL', 'Logic Families: TTL vs CMOS comparison', 'DAC and ADC Principles'],
      ],
      CS202: [
        ['OS Functions & System Calls', 'Process State Diagram & Process Control Block (PCB)', 'Context Switching & CPU Scheduling Concepts'],
        ['Scheduling Algorithms: FCFS, SJF, SRTF, Round Robin', 'Priority Scheduling & Multilevel Queue', 'Threads & Multithreading Models'],
        ['Process Synchronization: Critical Section Problem', 'Peterson Solution & Hardware Atomic Instructions', 'Counting & Binary Semaphores'],
        ['Classical Sync Problems: Producer-Consumer, Readers-Writers', 'Dining Philosophers Problem', 'Monitors'],
        ['Deadlock Characterization & 4 Necessary Conditions', 'Resource Allocation Graph', 'Bankers Deadlock Avoidance Algorithm'],
        ['Memory Management: Paging & Segmentation', 'TLB & Effective Access Time', 'Page Replacement (FIFO, Optimal, LRU)'],
        ['Thrashing & Working Set Model', 'File Systems, Directory Structure, Disk Scheduling (SSTF, SCAN, C-SCAN)'],
      ],
    };

    const modules = subjectCurriculum[subjectCode] || [
      ['Module 1 Core Fundamentals', 'Definitions, Principles & Architecture', 'Terminology & Elementary Models'],
      ['Module 2 Analytical Techniques', 'Standard Formulas & Problem Formulations', 'Step-by-step Standard Derivations'],
      ['Module 3 Intermediate Systems', 'Process Flows & System Dynamics', 'Case Studies & Worked Numerical Examples'],
      ['Module 4 Advanced Topics', 'Complex Configurations & Real-world Tradeoffs', 'Edge Cases & Comparative Tables'],
      ['Module 5 Integration & Design', 'System Architecture & Cross-modular Logic', 'Synthesis & Diagnostic Problems'],
    ];

    const phaseAllocation = (d: number, total: number) => {
      const ratio = d / total;
      if (ratio <= 0.4) return { phase: 'Phase 1: Foundational Mastery', taskType: 'FOUNDATION' as const };
      if (ratio <= 0.7) return { phase: 'Phase 2: Core Deep Dive & Numerical Practice', taskType: 'DEEP_DIVE' as const };
      if (ratio <= 0.9) return { phase: 'Phase 3: High-Yield PYQs & Problem Sets', taskType: 'PYQ_PRACTICE' as const };
      return { phase: 'Phase 4: Final High-Yield Revision & Mock Polish', taskType: 'REVISION' as const };
    };

    for (let day = 1; day <= days; day++) {
      const { phase, taskType } = phaseAllocation(day, days);
      let focusTitle = '';
      let topics: string[] = [];

      if (day === days) {
        focusTitle = 'Final Formula Blueprint & Rapid Revision';
        topics = [
          'Full syllabus memory sheet review',
          'Review error-prone numerical questions from past 3 days',
          'Mock timed paper simulation (1 hour)',
          'High-yield BPUT 10-mark recurring derivations',
        ];
      } else if (day === days - 1) {
        focusTitle = 'BPUT 2023 & 2024 End-Semester Solved Papers';
        topics = [
          'Solve BPUT 2024 Question Paper under exam timing',
          'Solve BPUT 2023 Repeated Questions',
          'Identify missing coverage gaps',
        ];
      } else if (day === days - 2) {
        focusTitle = 'High-Frequency University PYQs & Numerical Drill';
        topics = [
          'Topic-wise previous 5-year repeated university questions',
          'Long answer format structuring (diagrams, points, assumptions)',
          'Formula sheet synthesis',
        ];
      } else {
        const modIndex = Math.min(modules.length - 1, Math.floor(((day - 1) / (days - 3)) * modules.length));
        const currentMod = modules[modIndex] || ['Key Syllabus Concepts'];
        focusTitle = `Module ${modIndex + 1} & Essential Derivations`;
        topics = currentMod;
      }

      plan.push({
        dayNumber: day,
        phase,
        focusTitle,
        topics,
        taskType,
        recommendedHours: hoursPerDay,
      });
    }

    return plan;
  }

  private static enrichGeminiResponse(
    geminiRes: CopilotResponse,
    rawText: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    const defaultLocation =
      user.hostelBlock && user.roomNumber
        ? `${user.hostelBlock} / Room ${user.roomNumber}`
        : user.hostelBlock || 'Hostel Block B / Room 204';

    // Verify and enrich cards
    const enrichedCards = (geminiRes.cards || []).map((card) => {
      if (card.cardType === 'ACTION_MAINTENANCE') {
        return {
          ...card,
          data: {
            title: card.data?.title || 'Hostel Facility Maintenance',
            description: card.data?.description || rawText,
            category: card.data?.category || 'General Maintenance',
            issueType: card.data?.issueType || 'Repair Needed',
            location: card.data?.location || defaultLocation,
            priority: card.data?.priority || 'NORMAL',
            studentName: user.fullName || user.username,
            rollNumber: user.rollNumber,
          },
        };
      }

      if (card.cardType === 'ACTION_BONAFIDE') {
        return {
          ...card,
          data: {
            purpose: card.data?.purpose || 'Scholarship',
            studentName: user.fullName || user.username,
            rollNumber: user.rollNumber,
            branch: user.branch || 'CSE',
            year: user.year || 2,
            availablePurposes: [
              'Scholarship',
              'Bank',
              'Internship',
              'Education',
              'Passport',
              'Other',
            ],
          },
        };
      }

      if (card.cardType === 'ACTION_LEAVE') {
        const today = new Date();
        const start =
          card.data?.startDate ||
          new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const end =
          card.data?.endDate ||
          new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        return {
          ...card,
          data: {
            startDate: start,
            endDate: end,
            reason: card.data?.reason || rawText,
            emergencyContact: card.data?.emergencyContact || '+91 9876500001 (Father)',
            parentConsent: card.data?.parentConsent ?? true,
            hostelBlock: user.hostelBlock || 'Block B',
            roomNumber: user.roomNumber || '204',
          },
        };
      }

      if (card.cardType === 'ACTION_GATE_PASS') {
        const now = new Date();
        const toLocalISO = (d: Date) => {
          const offset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - offset).toISOString().slice(0, 16);
        };
        const dep =
          card.data?.departureTime || toLocalISO(new Date(now.getTime() + 30 * 60 * 1000));
        const ret =
          card.data?.expectedReturnTime ||
          toLocalISO(new Date(now.getTime() + 4 * 60 * 60 * 1000));
        return {
          ...card,
          data: {
            destination: card.data?.destination || 'Bhubaneswar City Market',
            reason: card.data?.reason || rawText,
            departureTime: dep,
            expectedReturnTime: ret,
            hostelBlock: user.hostelBlock || 'Block B',
          },
        };
      }

      if (card.cardType === 'STUDY_PLAN') {
        const subject = card.data?.subject || 'Database Management Systems';
        const subjectCode =
          card.data?.subjectCode || (subject.toLowerCase().includes('dbms') ? 'CS204' : 'GEN101');
        const days = card.data?.days || 10;
        const hoursPerDay = card.data?.hoursPerDay || 3;
        const plan =
          card.data?.plan && card.data.plan.length > 0
            ? card.data.plan
            : this.generateStructuredStudyPlan(subject, subjectCode, days, hoursPerDay);

        return {
          ...card,
          data: {
            subject,
            subjectCode,
            days,
            hoursPerDay,
            plan,
          },
        };
      }

      return card;
    });

    return {
      ...geminiRes,
      cards: enrichedCards,
    };
  }
}
