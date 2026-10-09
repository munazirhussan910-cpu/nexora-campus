import { VERIFIED_CAMPUS_PROCEDURES, CampusProcedure } from '../data/campusGuide.data';
import { VERIFIED_CAMPUS_RESOURCES, CampusResource } from '../data/campusResources.data';
import {
  VERIFIED_CAMPUS_KNOWLEDGE,
  searchCampusKnowledge,
  CampusKnowledgeItem,
} from '../data/campusKnowledge.data';
import { AuthUser } from '../types/auth';
import { GeminiService } from './gemini.service';
import { config } from '../config/env';
import prisma from '../config/prisma';
import { getWardenHostelBlock } from './warden.service';
import { EmergencyService } from './emergency.service';

export type CopilotIntent =
  | 'GENERAL_AI'
  | 'GENERAL_ACADEMIC'
  | 'ACADEMIC_TUTORING'
  | 'PROGRAMMING_HELP'
  | 'CAREER_GUIDANCE'
  | 'STUDY_PLAN'
  | 'RESOURCE_SEARCH'
  | 'CAMPUS_GUIDE'
  | 'ATTENDANCE_QUERY'
  | 'TIMETABLE_QUERY'
  | 'DEADLINES_NOTICES'
  | 'CREATE_MAINTENANCE_REQUEST'
  | 'REQUEST_BONAFIDE'
  | 'APPLY_HOSTEL_LEAVE'
  | 'CREATE_GATE_PASS'
  | 'REQUEST_TRACKING'
  | 'CAMPUS_STATUS'
  | 'WARDEN_TELEMETRY'
  | 'STAFF_TELEMETRY'
  | 'SECURITY_TELEMETRY'
  | 'ACADEMIC_OFFICER_TELEMETRY'
  | 'FACULTY_TELEMETRY'
  | 'ADMIN_TELEMETRY'
  | 'PRIVACY_RESTRICTION'
  | 'UNVERIFIED_POLICY'
  | 'CLARIFICATION_NEEDED'
  | 'FALLBACK';

export interface CopilotCard {
  cardType:
    | 'ACTION_MAINTENANCE'
    | 'ACTION_BONAFIDE'
    | 'ACTION_LEAVE'
    | 'ACTION_GATE_PASS'
    | 'GUIDE_PROCEDURE'
    | 'STUDY_PLAN'
    | 'RESOURCE_LIST'
    | 'REQUEST_LIST'
    | 'DEADLINE_LIST'
    | 'TELEMETRY_STAT_CARD'
    | 'VERIFIED_RECORD';
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
   * Architecture: Hybrid AI (Gemini Reasoning + Grounded Knowledge RAG + Deterministic Real Data)
   */
  static async processMessage(
    userMessage: string,
    user: AuthUser,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<CopilotResponse> {
    const text = userMessage.trim();
    const lower = text.toLowerCase();

    // 0a. Security Defense: Prompt injection & adversarial directive prevention
    if (this.isPromptInjection(lower)) {
      return this.handleSecurityRefusal();
    }

    // 0b. Privacy Defense: Cross-student private record isolation
    if (this.isCrossStudentAccessAttempt(text, lower, user)) {
      return this.handlePrivacyRefusal(user);
    }

    // 0c. Usability: Ambiguous short keywords clarification
    const ambiguity = this.checkAmbiguity(lower);
    if (ambiguity) {
      return ambiguity;
    }

    // 0d. Multi-turn context extraction (subject, timeline, weak areas)
    const multiTurnContext = this.extractMultiTurnContext(history, text, lower);

    // 1. Detect inquiry domains
    const isAttendance = this.isAttendanceQuery(lower);
    const isTimetable = this.isTimetableQuery(lower, multiTurnContext);
    const isRequestTracking = this.isRequestTrackingIntent(lower);
    const isDeadlinesOrNotices = this.isDeadlinesNoticesIntent(lower);

    // Role-specific intent detection
    const isWarden = this.isWardenIntent(lower);
    const isStaff = this.isStaffIntent(lower);
    const isSecurity = this.isSecurityIntent(lower);
    const isAcademicOfficer = this.isAcademicOfficerIntent(lower);
    const isFaculty = this.isFacultyIntent(lower);
    const isAdmin = this.isAdminIntent(lower);

    // Role Restriction Defense: Prevent unauthorized students from requesting administrative command logs
    if (
      user.role === 'STUDENT' &&
      (lower.includes('all warden leaves') ||
        lower.includes('show security logs') ||
        lower.includes('admin command center metrics') ||
        lower.includes('all students attendance'))
    ) {
      return this.handleRoleRestrictedRefusal('STUDENT', 'administrative operations');
    }

    // 2. Pre-fetch real telemetry from database based on user's authorized role
    let telemetryContext = '';
    try {
      telemetryContext = await this.getTelemetryContext(
        user,
        isAttendance,
        isTimetable,
        isRequestTracking,
        isDeadlinesOrNotices,
        lower
      );
    } catch (err) {
      console.warn('[Copilot] Could not load telemetry:', err);
    }

    // 3. If Gemini API Key is configured, attempt intelligent generation via Google Gemini
    if (config.geminiApiKey) {
      try {
        const geminiRes = await GeminiService.generateResponse(
          userMessage,
          user,
          history,
          telemetryContext
        );
        if (geminiRes && geminiRes.intent && geminiRes.message && geminiRes.intent !== 'FALLBACK') {
          return this.enrichGeminiResponse(geminiRes, text, lower, user, multiTurnContext);
        }
      } catch (err) {
        console.warn('[Copilot] Gemini generation failed, falling back to local engine:', err);
      }
    }

    // 4. Local Deterministic & Heuristic Engine (Zero-Failure Fallback)

    // 4a. Role-specific live telemetry handlers
    if (user.role === 'WARDEN' && (isWarden || lower.includes('status') || lower.includes('leave') || lower.includes('hostel'))) {
      return await this.handleWardenInquiry(user, lower);
    }

    if (user.role === 'STAFF' && (isStaff || lower.includes('task') || lower.includes('complaint') || lower.includes('work') || lower.includes('repair'))) {
      return await this.handleStaffInquiry(user, lower);
    }

    if (user.role === 'SECURITY' && (isSecurity || lower.includes('gate') || lower.includes('pass') || lower.includes('depart') || lower.includes('alert') || lower.includes('sos'))) {
      return await this.handleSecurityInquiry(user, lower);
    }

    if (user.role === 'ACADEMIC_OFFICER' && (isAcademicOfficer || lower.includes('bonafide') || lower.includes('certificate') || lower.includes('pending'))) {
      return await this.handleAcademicOfficerInquiry(user, lower);
    }

    if (user.role === 'FACULTY' && (isFaculty || lower.includes('schedule') || lower.includes('class') || lower.includes('routine') || lower.includes('teaching'))) {
      return await this.handleFacultyInquiry(user, lower);
    }

    if (user.role === 'ADMIN' && (isAdmin || lower.includes('command') || lower.includes('metric') || lower.includes('overdue'))) {
      return await this.handleAdminInquiry(user, lower);
    }

    // 4b. Real-time Student Attendance Query
    if (isAttendance) {
      return await this.handleAttendanceQuery(user, lower, text);
    }

    // 4c. Real-time Student Timetable & Routine Query (or study timetable follow-up)
    if (isTimetable) {
      if (
        multiTurnContext.isExamStudyContext &&
        (lower.includes('make') || lower.includes('plan') || lower.includes('create') || lower.includes('schedule'))
      ) {
        return this.handleStudyPlan(text, lower, user, multiTurnContext);
      }
      return await this.handleTimetableQuery(user, lower);
    }

    // 4d. Real-time Student Request Tracking
    if (isRequestTracking) {
      return await this.handleRequestTracking(user, lower);
    }

    // 4e. Real-time Academic Deadlines & Published Notices
    if (isDeadlinesOrNotices) {
      return await this.handleDeadlinesAndNotices(user, lower);
    }

    // 4f. Actionable Workflow Intents (SOLVE)
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

    // 4g. Structured Study Plan Requests (PLAN)
    if (
      this.isStudyPlanIntent(lower) ||
      (multiTurnContext.isExamStudyContext &&
        (multiTurnContext.detectedDays || multiTurnContext.detectedWeakness))
    ) {
      return this.handleStudyPlan(text, lower, user, multiTurnContext);
    }

    // 4h. Resource / PYQ / Notes Search
    if (this.isResourceSearchIntent(lower)) {
      return this.handleResourceSearch(text, lower, user);
    }

    // 4i. Conversational Follow-ups & Greetings
    if (this.isConversationalFollowUp(lower, history)) {
      return this.handleConversational(text, lower, user, history, multiTurnContext);
    }

    // 4j. General Academic Advice & 9+ CGPA Strategy
    if (this.isGeneralAcademicIntent(lower)) {
      return this.handleGeneralAcademicAdvice(text, lower, user, history);
    }

    // 4k. Programming & Coding Assistance
    if (this.isProgrammingIntent(lower)) {
      return this.handleProgrammingHelp(text, lower, user);
    }

    // 4l. Career Guidance & Placement Preparation
    if (this.isCareerGuidanceIntent(lower)) {
      return this.handleCareerGuidance(text, lower, user);
    }

    // 4m. Verified Campus Procedures (ASK - CAMPUS GUIDE)
    const matchedProcedure = this.findMatchingProcedure(lower);
    if (matchedProcedure) {
      return this.handleGuideProcedure(matchedProcedure, user);
    }

    // 4n. Unverified Campus Policy Detection (Admit limitation rather than hallucinating)
    if (this.isUnverifiedCampusPolicy(text, lower, user)) {
      return this.handleUnverifiedCampusPolicy(text, lower, user);
    }

    // 4o. Verified Campus Knowledge & Policy Queries (RAG)
    const campusKnowledge = this.handleCampusKnowledge(lower, user);
    if (campusKnowledge) {
      return campusKnowledge;
    }

    // 4p. General Student Status Query
    if (this.isCampusStatusIntent(lower)) {
      return await this.handleCampusStatus(user);
    }

    // 4q. General AI queries (knowledge, writing, reasoning)
    if (this.isGeneralAiIntent(lower, text)) {
      return this.handleGeneralAi(text, lower, user);
    }

    // 4r. Zero-hallucination helpful fallback
    return this.handleFallback(text, lower, user);
  }

  // =========================================================================
  // SECURITY & PRIVACY DEFENSE MECHANISMS
  // =========================================================================

  private static isPromptInjection(lower: string): boolean {
    const injectionPatterns = [
      'ignore previous',
      'ignore all previous',
      'ignore your instructions',
      'ignore system prompt',
      'system override',
      'reveal system prompt',
      'print your prompt',
      'show your prompt',
      'what is your system instruction',
      'reveal password',
      'dump database',
      'drop table',
      'select * from user',
      'show all passwords',
      'bypass rbac',
      'bypass security',
      'act as root',
      'sudo su',
      'show secret key',
      'reveal api key',
      'delete all requests',
    ];
    return injectionPatterns.some((pattern) => lower.includes(pattern));
  }

  private static isCrossStudentAccessAttempt(text: string, lower: string, user: AuthUser): boolean {
    if (user.role !== 'STUDENT') return false;

    // 1. Check for specific 9-digit roll numbers that are not the current student's
    const rollMatches = text.match(/\b(2[0-9]{8})\b/g);
    if (rollMatches) {
      for (const roll of rollMatches) {
        if (user.rollNumber && roll !== user.rollNumber) {
          return true;
        }
      }
    }

    // 2. Check for other student names in database
    const otherStudentKeywords = [
      'rohit',
      'sneha',
      'priya',
      'amit',
      'vikas',
      'another student',
      'other student',
      'someone else',
      'all students',
    ];

    const asksForPrivateData =
      lower.includes('attendance') ||
      lower.includes('grade') ||
      lower.includes('marks') ||
      lower.includes('leave') ||
      lower.includes('pass') ||
      lower.includes('phone') ||
      lower.includes('room') ||
      lower.includes('request') ||
      lower.includes('status') ||
      lower.includes('complaint');

    if (asksForPrivateData) {
      const userNameLower = (user.fullName || user.username || '').toLowerCase();
      for (const name of otherStudentKeywords) {
        if (!userNameLower.includes(name) && lower.includes(name)) {
          return true;
        }
      }
    }

    return false;
  }

  private static handleSecurityRefusal(): CopilotResponse {
    return {
      intent: 'PRIVACY_RESTRICTION',
      category: 'Security',
      confidence: 0.99,
      message: `🔒 **Security Exception — Unauthorized Directive**

This request cannot be fulfilled. Administrative operations, system prompt disclosures, and unrestricted database queries are strictly protected by server-side authorization controls.

All interactions with Nexora Copilot are logged in the immutable security audit trail (\`AuditLog\`).`,
      cards: [],
      quickReplies: ['Campus Helpdesk', 'Check My Attendance', 'Campus Operating Procedures'],
    };
  }

  private static handlePrivacyRefusal(user: AuthUser): CopilotResponse {
    return {
      intent: 'PRIVACY_RESTRICTION',
      category: 'Security',
      confidence: 0.99,
      message: `🔒 **Access Denied — Privacy Policy Restriction**

Under campus privacy regulations (FERPA and University Student Data Protection Charter), you are strictly authorized to view only your own student records (**${user.fullName || user.username}**, Roll: **${user.rollNumber || 'Your Account'}**).

You cannot access attendance percentages, leave histories, room locations, or personal records belonging to other students. If you require authorized access for a university club or team project, please contact your faculty coordinator.`,
      cards: [],
      quickReplies: ['Show my own attendance', 'Check my submitted requests', 'What classes do I have today?'],
    };
  }

  private static handleRoleRestrictedRefusal(userRole: string, targetArea: string): CopilotResponse {
    return {
      intent: 'PRIVACY_RESTRICTION',
      category: 'Security',
      confidence: 0.99,
      message: `🔒 **Access Denied — Role Authorization Required**

You are currently signed in as **${userRole}**. The requested information or operation requires **${targetArea}** authorization.

Your current account permissions do not grant access to other departments' administrative queues. If you believe this is an error, please contact the Nexora System Administrator.`,
      cards: [],
      quickReplies: ['View My Desk', 'Campus Operating Procedures', 'Contact Helpdesk'],
    };
  }

  // =========================================================================
  // AMBIGUITY & UNVERIFIED INQUIRY HANDLERS
  // =========================================================================

  private static checkAmbiguity(lower: string): CopilotResponse | null {
    const trimmed = lower.replace(/[?!.]/g, '').trim();

    if (trimmed === 'leave') {
      return {
        intent: 'CLARIFICATION_NEEDED',
        category: 'Hostel',
        confidence: 0.99,
        message: `Would you like to **apply for an overnight hostel leave**, or **check the status of an existing leave application**?

Please let me know:
1. **Apply for Leave**: Specify your destination, departure date, return date, and emergency contact.
2. **Track Leave**: Check if your submitted leave has been approved by the Hostel Warden.`,
        cards: [],
        quickReplies: ['Apply for hostel leave', 'What is the status of my leave?'],
      };
    }

    if (trimmed === 'gate pass' || trimmed === 'gatepass' || trimmed === 'pass') {
      return {
        intent: 'CLARIFICATION_NEEDED',
        category: 'Security',
        confidence: 0.99,
        message: `Would you like to **generate a new campus exit gate pass**, or **view your active gate pass QR code & PIN**?

1. **Apply Gate Pass**: Specify destination and time window within curfew.
2. **Active Gate Pass**: View your time-limited QR token and 4-digit PIN for Main Gate security.`,
        cards: [],
        quickReplies: ['Generate a gate pass', 'Show my active gate pass PIN'],
      };
    }

    if (trimmed === 'bonafide' || trimmed === 'certificate') {
      return {
        intent: 'CLARIFICATION_NEEDED',
        category: 'Documents',
        confidence: 0.99,
        message: `To generate an official Bonafide Certificate request, please specify the purpose of your certificate:
• **Scholarship**: For State Post-Matric / NSP verification
• **Bank Education Loan**: For bank sanction and verification
• **Passport / Visa**: For official consular verification
• **Summer Internship**: Institutional NOC recommendation`,
        cards: [],
        quickReplies: [
          'Bonafide for Scholarship',
          'Bonafide for Education Loan',
          'Bonafide for Internship',
        ],
      };
    }

    if (trimmed === 'repair' || trimmed === 'complaint' || trimmed === 'broken') {
      return {
        intent: 'CLARIFICATION_NEEDED',
        category: 'Maintenance',
        confidence: 0.99,
        message: `What kind of maintenance problem are you experiencing in your hostel room?
• **Electrical**: Fan, switch, socket, light, or geyser breakdown
• **Plumbing**: Tap leak, water supply, washroom drain, or flush issue
• **Carpentry**: Door lock, window latch, cupboard, table, or bed repair
• **Network**: Wi-Fi 6 login, captive portal, or LAN connectivity`,
        cards: [],
        quickReplies: [
          'Fan broken in room',
          'Tap leaking in washroom',
          'Door lock broken',
          'Wi-Fi not connecting',
        ],
      };
    }

    if (trimmed === 'help' || trimmed === 'help me') {
      return {
        intent: 'CLARIFICATION_NEEDED',
        category: 'General',
        confidence: 0.99,
        message: `I'm here to assist you! What campus task would you like help with today?
• **Academic**: Attendance percentages (75% margin), class routine, BPUT PYQs & study plans
• **Hostel & Security**: Overnight leave applications, day gate passes, mess timings & curfews
• **Facilities**: Room maintenance complaints with 4h–24h technician SLAs
• **Documents**: Digitally certified Bonafide certificates with verification QR codes`,
        cards: [],
        quickReplies: [
          'Show my attendance status',
          'What classes do I have today?',
          'How to apply for gate pass?',
          'Report room maintenance',
        ],
      };
    }

    return null;
  }

  private static isUnverifiedCampusPolicy(
    text: string,
    lower: string,
    user: AuthUser
  ): boolean {
    const policyIndicators = [
      'policy on',
      'policy for',
      'rules for',
      'rule for',
      'rule on',
      'is it allowed to',
      'can i bring',
      'can i keep',
      'can i install',
      'am i allowed to',
      'penalty for',
      'fine for',
      'procedure for',
      'guidelines for',
    ];

    const hasPolicyIndicator = policyIndicators.some((ind) => lower.includes(ind));
    if (!hasPolicyIndicator) return false;

    // Known covered topics
    const knownKeywords = [
      'attendance',
      '75%',
      '75 percent',
      'condonation',
      'duty leave',
      'curfew',
      'gate pass',
      'gatepass',
      'hostel leave',
      'night out',
      'bonafide',
      'certificate',
      'loan',
      'scholarship',
      'passport',
      'internship',
      'maintenance',
      'plumbing',
      'electrical',
      'fan',
      'tap',
      'wifi',
      'internet',
      'lost id',
      'id card',
      'ragging',
      'anti-ragging',
      'room change',
      'room swap',
      'mess',
      'breakfast',
      'lunch',
      'dinner',
      'grading',
      'cgpa',
      'sgpa',
      'backlog',
      'semester registration',
      'rechecking',
      're-evaluation',
      'medical emergency',
      'library',
      'pyq',
      'dsa',
      'c++',
      'java',
      'python',
      'placement',
      'interview',
    ];

    if (lower.includes('pet') || lower.includes('cat') || lower.includes('dog') || lower.includes('drone') || lower.includes('car in hostel')) {
      return true;
    }

    const matchesKnown = knownKeywords.some((kw) => lower.includes(kw));
    if (matchesKnown) return false;

    const matchedProcedure = this.findMatchingProcedure(lower);
    if (matchedProcedure) return false;

    const matchedKnowledge = searchCampusKnowledge(lower, 1, user.role, 12);
    if (matchedKnowledge.length > 0) return false;

    return true;
  }

  private static handleUnverifiedCampusPolicy(
    rawText: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    return {
      intent: 'UNVERIFIED_POLICY',
      category: 'General',
      confidence: 0.95,
      message: `⚠️ **No Verified Campus Policy on Record**

There is no official university policy or verified regulation on record regarding *"${rawText.trim()}"*.

To ensure compliance with university guidelines and avoid procedural violations, please consult the responsible campus office directly:
• **Hostel & Residential Policies**: Hostel Warden Office or Chief Warden Hub (Central Hostel Complex)
• **Academic Rules & Special Permissions**: Academic Affairs Cell (Ground Floor, Administrative Block, Window 3)
• **Security & Vehicle Guidelines**: Chief Security Officer (Main Gate Security Desk)

> **Nexora Verification Policy**: Copilot answers are strictly grounded in verified institutional documentation and will not speculate on unverified campus rules.`,
      cards: [],
      quickReplies: [
        'Hostel Curfew & Gate Rules',
        '75% Attendance Regulation',
        'Bonafide Certificate Procedure',
        'Campus Emergency Contacts',
      ],
    };
  }

  // =========================================================================
  // MULTI-TURN CONTEXT EXTRACTOR
  // =========================================================================

  private static extractMultiTurnContext(
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentText: string,
    lower: string
  ): {
    isExamStudyContext: boolean;
    subject?: string;
    subjectCode?: string;
    detectedDays?: number;
    detectedHours?: number;
    detectedWeakness?: string;
  } {
    let isExamStudyContext = false;
    let subject: string | undefined;
    let subjectCode: string | undefined;
    let detectedDays: number | undefined;
    let detectedHours: number | undefined;
    let detectedWeakness: string | undefined;

    const allTurns = [...history.map((h) => h.content), currentText];
    const fullText = allTurns.join(' ').toLowerCase();

    if (fullText.includes('dbms') || fullText.includes('database')) {
      subject = 'Database Management Systems';
      subjectCode = 'CS204';
      isExamStudyContext = true;
    } else if (fullText.includes('os') || fullText.includes('operating system')) {
      subject = 'Operating Systems';
      subjectCode = 'CS202';
      isExamStudyContext = true;
    } else if (
      fullText.includes('dsa') ||
      fullText.includes('data structure') ||
      fullText.includes('algorithm')
    ) {
      subject = 'Data Structures & Algorithms';
      subjectCode = 'CS201';
      isExamStudyContext = true;
    } else if (fullText.includes('network') || fullText.includes('cn')) {
      subject = 'Computer Networks';
      subjectCode = 'CS301';
      isExamStudyContext = true;
    } else if (fullText.includes('digital') || fullText.includes('electronics')) {
      subject = 'Digital Electronics';
      subjectCode = 'EC201';
      isExamStudyContext = true;
    }

    if (
      fullText.includes('exam') ||
      fullText.includes('prepare') ||
      fullText.includes('study plan') ||
      fullText.includes('revision')
    ) {
      isExamStudyContext = true;
    }

    const daysMatch =
      currentText.match(/(\d+)[-\s]*(?:days?|day)/i) || fullText.match(/(\d+)[-\s]*(?:days?|day)/i);
    if (daysMatch) {
      detectedDays = parseInt(daysMatch[1], 10);
    }

    const hoursMatch =
      currentText.match(/(\d+)[-\s]*(?:hours?|hrs?|h)\s*(?:per|\/|a)?\s*day/i) ||
      fullText.match(/(\d+)[-\s]*(?:hours?|hrs?|h)\s*(?:per|\/|a)?\s*day/i);
    if (hoursMatch) {
      detectedHours = parseInt(hoursMatch[1], 10);
    }

    const weaknessMatch =
      currentText.match(
        /(?:weak in|struggling with|difficult(?:y)? in|need help with|focus on)\s+([a-zA-Z\s]+?)(?:\.|$|,)/i
      ) ||
      fullText.match(
        /(?:weak in|struggling with|difficult(?:y)? in|need help with|focus on)\s+([a-zA-Z\s]+?)(?:\.|$|,)/i
      );
    if (weaknessMatch) {
      detectedWeakness = weaknessMatch[1].trim();
    }

    return {
      isExamStudyContext,
      subject,
      subjectCode,
      detectedDays,
      detectedHours,
      detectedWeakness,
    };
  }

  // =========================================================================
  // INTENT DETECTORS
  // =========================================================================

  private static isAttendanceQuery(text: string): boolean {
    return (
      text.includes('attendance') ||
      text.includes('bunk') ||
      text.includes('miss class') ||
      text.includes('miss classes') ||
      text.includes('can i miss') ||
      text.includes('how many classes') ||
      text.includes('safe to miss') ||
      text.includes('shortage') ||
      text.includes('75%') ||
      text.includes('75 percent') ||
      text.includes('classes to attend') ||
      text.includes('my percentage') ||
      text.includes('attendance standing')
    );
  }

  private static isTimetableQuery(
    text: string,
    multiTurnContext?: { isExamStudyContext: boolean }
  ): boolean {
    if (
      multiTurnContext?.isExamStudyContext &&
      (text.includes('timetable') || text.includes('schedule')) &&
      (text.includes('make') || text.includes('plan') || text.includes('create') || text.includes('now'))
    ) {
      return true;
    }

    return (
      text.includes('timetable') ||
      text.includes('routine') ||
      text.includes('schedule today') ||
      text.includes('today schedule') ||
      text.includes('classes today') ||
      text.includes('today class') ||
      text.includes('what classes') ||
      text.includes('which classes') ||
      text.includes('periods today') ||
      text.includes('lecture today') ||
      text.includes('lectures today')
    );
  }

  private static isRequestTrackingIntent(text: string): boolean {
    return (
      (text.includes('status') &&
        (text.includes('request') ||
          text.includes('application') ||
          text.includes('ticket') ||
          text.includes('bonafide') ||
          text.includes('complaint') ||
          text.includes('leave') ||
          text.includes('pass'))) ||
      text.includes('track') ||
      text.includes('my requests') ||
      text.includes('my applications') ||
      text.includes('my complaints') ||
      text.includes('pending requests') ||
      text.includes('request status') ||
      text.includes('ticket status') ||
      /^nx-\d+/i.test(text.trim()) ||
      text.includes('nx-')
    );
  }

  private static isDeadlinesNoticesIntent(text: string): boolean {
    return (
      text.includes('deadline') ||
      text.includes('deadlines') ||
      text.includes('due date') ||
      text.includes('last date') ||
      text.includes('notices') ||
      text.includes('notice board') ||
      text.includes('announcement') ||
      text.includes('announcements') ||
      text.includes('circular') ||
      text.includes('academic calendar') ||
      text.includes('when is exam form') ||
      text.includes('form fill up')
    );
  }

  private static isStudyPlanIntent(text: string): boolean {
    return (
      (text.includes('exam') ||
        text.includes('study') ||
        text.includes('plan') ||
        text.includes('prepare') ||
        text.includes('roadmap') ||
        text.includes('revision') ||
        text.includes('crash course')) &&
      (text.includes('day') ||
        text.includes('days') ||
        text.includes('week') ||
        text.includes('weeks') ||
        text.includes('schedule') ||
        text.includes("haven't started") ||
        text.includes('syllabus') ||
        text.includes('tomorrow') ||
        text.includes('module'))
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
      text.includes('question bank') ||
      text.includes('sample paper') ||
      text.includes('reference book')
    );
  }

  private static isMaintenanceIntent(text: string): boolean {
    const issues = [
      'fan',
      'light',
      'tap',
      'leak',
      'water',
      'door',
      'lock',
      'broken',
      'switch',
      'socket',
      'wifi',
      'internet',
      'flush',
      'window',
      'cupboard',
      'bed',
      'table',
      'chair',
      'plug',
      'ac',
      'cooler',
      'geyser',
      'cleanliness',
      'dirty',
      'smell',
      'pest',
    ];
    const actions = [
      'broken',
      'not working',
      'repair',
      'fix',
      'issue',
      'problem',
      'replace',
      'sparking',
      'damaged',
      'complaint',
      'report',
      'leaking',
      'choked',
      'no water',
      'no power',
      'no electricity',
    ];

    const hasIssue = issues.some((i) => text.includes(i));
    const hasAction = actions.some((a) => text.includes(a));
    return hasIssue && hasAction;
  }

  private static isBonafideIntent(text: string): boolean {
    return (
      text.includes('bonafide') ||
      (text.includes('certificate') &&
        (text.includes('scholarship') ||
          text.includes('bank') ||
          text.includes('loan') ||
          text.includes('passport') ||
          text.includes('internship') ||
          text.includes('proof')))
    );
  }

  private static isLeaveIntent(text: string): boolean {
    return (
      text.includes('leave') ||
      text.includes('home travel') ||
      text.includes('night out') ||
      text.includes('vacation') ||
      text.includes('going home') ||
      text.includes('out of hostel') ||
      text.includes('weekend travel')
    );
  }

  private static isGatePassIntent(text: string): boolean {
    return (
      text.includes('gate pass') ||
      text.includes('gatepass') ||
      text.includes('exit pass') ||
      text.includes('out pass') ||
      text.includes('outpass') ||
      (text.includes('exit') && text.includes('campus')) ||
      (text.includes('leave') && text.includes('gate')) ||
      text.includes('market pass')
    );
  }

  private static isGeneralAcademicIntent(text: string): boolean {
    if (
      text.includes('how is cgpa calculated') ||
      text.includes('cgpa calculation formula') ||
      text.includes('calculate cgpa') ||
      text.includes('grading scale') ||
      text.includes('grading system')
    ) {
      return false;
    }

    return (
      text.includes('cgpa') ||
      text.includes('sgpa') ||
      text.includes('9 cgpa') ||
      text.includes('9+') ||
      text.includes('high marks') ||
      text.includes('good marks') ||
      text.includes('topper') ||
      text.includes('improve grades') ||
      text.includes('study tips') ||
      text.includes('how to study') ||
      text.includes('how do i study') ||
      text.includes('study habit') ||
      text.includes('memorize') ||
      text.includes('active recall') ||
      text.includes('pomodoro') ||
      text.includes('scoring') ||
      text.includes('academic advice') ||
      text.includes('exam strategy') ||
      text.includes('internal marks') ||
      text.includes('internal assessment') ||
      text.includes('mid sem') ||
      text.includes('mid term') ||
      text.includes('bput exam') ||
      text.includes('backlog') ||
      text.includes('arrear')
    );
  }

  private static isProgrammingIntent(text: string): boolean {
    return (
      text.includes('recursion') ||
      text.includes('dsa') ||
      text.includes('data structure') ||
      text.includes('algorithm') ||
      text.includes('binary search') ||
      text.includes('dynamic programming') ||
      text.includes('leetcode') ||
      text.includes('c++') ||
      text.includes('java') ||
      text.includes('python') ||
      text.includes('coding') ||
      text.includes('learn programming') ||
      text.includes('learn to code') ||
      text.includes('web development') ||
      text.includes('frontend') ||
      text.includes('backend') ||
      text.includes('oop') ||
      text.includes('object oriented') ||
      text.includes('complexity') ||
      text.includes('big o') ||
      text.includes('sorting') ||
      text.includes('sql') ||
      text.includes('deadlock') ||
      text.includes('deadlocks') ||
      text.includes('process') ||
      text.includes('thread') ||
      text.includes('paging') ||
      text.includes('semaphore') ||
      (text.includes('operating system') &&
        (text.includes('explain') ||
          text.includes('how') ||
          text.includes('what') ||
          text.includes('concept')))
    );
  }

  private static isCareerGuidanceIntent(text: string): boolean {
    return (
      text.includes('placement') ||
      text.includes('job') ||
      text.includes('internship') ||
      text.includes('interview') ||
      text.includes('resume') ||
      text.includes('campus drive') ||
      text.includes('off campus') ||
      text.includes('tier 1') ||
      text.includes('career') ||
      text.includes('package') ||
      text.includes('software engineer') ||
      text.includes('sde')
    );
  }

  private static isCampusStatusIntent(text: string): boolean {
    return (
      text.includes('my status') ||
      text.includes('my standing') ||
      text.includes('what do i need to do') ||
      text.includes('overview')
    );
  }

  private static isWardenIntent(text: string): boolean {
    return (
      text.includes('warden') ||
      text.includes('hostel block') ||
      text.includes('pending leave') ||
      text.includes('leaves to approve') ||
      text.includes('block complaints') ||
      text.includes('block occupancy')
    );
  }

  private static isStaffIntent(text: string): boolean {
    return (
      text.includes('my task') ||
      text.includes('assigned complaint') ||
      text.includes('work order') ||
      text.includes('maintenance task') ||
      text.includes('tickets assigned')
    );
  }

  private static isSecurityIntent(text: string): boolean {
    return (
      text.includes('gate security') ||
      text.includes('turnstile') ||
      text.includes('departed student') ||
      text.includes('who departed') ||
      text.includes('active pass') ||
      text.includes('emergency alert') ||
      text.includes('sos alert')
    );
  }

  private static isAcademicOfficerIntent(text: string): boolean {
    return (
      text.includes('academic officer') ||
      text.includes('pending bonafide') ||
      text.includes('certificates to approve')
    );
  }

  private static isFacultyIntent(text: string): boolean {
    return (
      text.includes('teaching schedule') ||
      text.includes('my classes today') ||
      text.includes('assigned subject')
    );
  }

  private static isAdminIntent(text: string): boolean {
    return (
      text.includes('command center') ||
      text.includes('system overview') ||
      text.includes('overdue ticket') ||
      text.includes('campus metrics')
    );
  }

  private static isGeneralAiIntent(lower: string, text: string): boolean {
    const generalKeywords = [
      'explain',
      'what is',
      'how does',
      'why does',
      'write',
      'summarize',
      'help me write',
      'solve',
      'calculate',
      'difference between',
      'tips for',
      'how to manage',
      'stress',
      'time management',
      'email template',
      'essay',
    ];
    return generalKeywords.some((kw) => lower.includes(kw)) || text.endsWith('?');
  }

  private static isConversationalFollowUp(
    text: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): boolean {
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening'];
    const thanks = ['thanks', 'thank you', 'thx', 'appreciated', 'great', 'cool', 'awesome'];
    const followUps = [
      'tell me more',
      'elaborate',
      'explain that',
      'point 1',
      'point 2',
      'point 3',
      'what next',
      'what about',
      'how do i start',
      'can you give me',
      'i have only',
      'weak in',
      'now make',
      'make my',
    ];

    if (greetings.some((g) => text === g || text.startsWith(g + ' '))) return true;
    if (thanks.some((t) => text.includes(t))) return true;
    if (history.length > 0 && followUps.some((f) => text.includes(f))) return true;
    return false;
  }

  // =========================================================================
  // MULTI-ROLE TELEMETRY CONTEXT ENGINE
  // =========================================================================

  private static async getTelemetryContext(
    user: AuthUser,
    isAttendance: boolean,
    isTimetable: boolean,
    isRequestTracking: boolean,
    isDeadlines: boolean,
    lower: string
  ): Promise<string> {
    let result = '';

    // 1. STUDENT Telemetry
    if (user.role === 'STUDENT') {
      let student = null;
      if (user.studentId) {
        student = await prisma.student.findUnique({
          where: { id: user.studentId },
          include: { branch: true },
        });
      } else if (user.id) {
        student = await prisma.student.findUnique({
          where: { userId: user.id },
          include: { branch: true },
        });
      }

      if (student) {
        // Attendance
        const attendances = await prisma.attendance.findMany({
          where: { studentId: student.id },
          include: { subject: true },
        });

        if (attendances.length > 0) {
          let totalP = 0;
          let totalC = 0;
          const subList: string[] = [];
          for (const a of attendances) {
            totalP += a.present;
            totalC += a.total;
            const p = a.total > 0 ? ((a.present / a.total) * 100).toFixed(1) : '0';
            subList.push(`${a.subject.name} (${a.subject.code}): ${a.present}/${a.total} (${p}%)`);
          }
          const ovr = totalC > 0 ? ((totalP / totalC) * 100).toFixed(1) : '0';
          result += `LIVE ATTENDANCE: Overall ${ovr}% (${totalP}/${totalC} sessions). Subjects: ${subList.join('; ')}. BPUT Minimum Rule is 75%.\n`;
        }

        // Timetable
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const dayUpper = today.toUpperCase();
        const entries = await prisma.timetableEntry.findMany({
          where: { branchId: student.branchId, year: student.year, day: dayUpper },
          include: { subject: true },
          orderBy: { startTime: 'asc' },
        });
        if (entries.length > 0) {
          const cls = entries.map(
            (e) => `${e.startTime}-${e.endTime} ${e.subject.name} (${e.subject.code}) in Room ${e.room}`
          );
          result += `TODAY'S SCHEDULE (${today}): ${cls.join('; ')}.\n`;
        } else {
          result += `TODAY'S SCHEDULE (${today}): No lectures scheduled today.\n`;
        }

        // Requests
        const recentReqs = await prisma.request.findMany({
          where: { requesterId: user.id },
          include: { requestType: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        if (recentReqs.length > 0) {
          const reqStr = recentReqs
            .map((r) => `[${r.requestNumber}] ${r.title} (Type: ${r.requestType.code}, Status: ${r.status})`)
            .join('; ');
          result += `SUBMITTED REQUESTS: ${reqStr}.\n`;
        }

        // Active Gate Pass
        const activeGatePass = await prisma.gatePass.findFirst({
          where: {
            request: { requesterId: user.id },
            gateStatus: { in: ['APPROVED', 'DEPARTED'] },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (activeGatePass) {
          result += `ACTIVE APPROVED GATE PASS: Destination: ${activeGatePass.destination}, Status: ${activeGatePass.gateStatus}, Pass PIN: ${activeGatePass.passPin}, Valid Return: ${new Date(activeGatePass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.\n`;
        }

        // Deadlines
        const deadlines = await prisma.academicDeadline.findMany({
          where: { isActive: true },
          orderBy: { deadline: 'asc' },
          take: 3,
        });
        if (deadlines.length > 0) {
          const dStr = deadlines
            .map((d) => `${d.title} (Due: ${new Date(d.deadline).toISOString().split('T')[0]})`)
            .join('; ');
          result += `UPCOMING DEADLINES: ${dStr}.\n`;
        }
      }
      return result;
    }

    // 2. WARDEN Telemetry
    if (user.role === 'WARDEN') {
      const wardenBlock = await getWardenHostelBlock(user);
      const blockId = wardenBlock?.id;
      const blockName = wardenBlock?.name || user.hostelBlock || 'Hostel Block B';

      const pendingLeaves = await prisma.leaveRequest.findMany({
        where: {
          status: 'PENDING_APPROVAL',
          ...(blockId
            ? { request: { requester: { student: { hostelRoom: { hostelBlockId: blockId } } } } }
            : {}),
        },
        include: {
          request: {
            include: {
              requester: {
                include: {
                  student: true,
                },
              },
            },
          },
        },
        take: 5,
      });

      const activePasses = await prisma.gatePass.count({
        where: {
          gateStatus: { in: ['APPROVED', 'DEPARTED'] },
          ...(blockId
            ? { request: { requester: { student: { hostelRoom: { hostelBlockId: blockId } } } } }
            : {}),
        },
      });

      result += `WARDEN TELEMETRY (${blockName}): Pending leaves: ${pendingLeaves.length}. Active student gate passes: ${activePasses}.\n`;
      return result;
    }

    // 3. STAFF (Maintenance) Telemetry
    if (user.role === 'STAFF') {
      const myTasks = await prisma.request.findMany({
        where: { assignedTo: user.id, requestType: { code: 'COMPLAINT' } },
        include: { complaint: true },
        take: 5,
      });
      const urgent = myTasks.filter((t) => t.priority === 'URGENT').length;
      result += `MAINTENANCE STAFF TELEMETRY: Total assigned: ${myTasks.length}. Urgent priority: ${urgent}.\n`;
      return result;
    }

    // 4. SECURITY Telemetry
    if (user.role === 'SECURITY') {
      const departed = await prisma.gatePass.count({ where: { gateStatus: 'DEPARTED' } });
      const approved = await prisma.gatePass.count({ where: { gateStatus: 'APPROVED' } });
      const emergencies = EmergencyService.getActive();
      result += `GATE SECURITY TELEMETRY: Departed students: ${departed}. Approved passes awaiting exit: ${approved}. Active SOS: ${emergencies.length}.\n`;
      return result;
    }

    // 5. ACADEMIC OFFICER Telemetry
    if (user.role === 'ACADEMIC_OFFICER') {
      const pendingBonafide = await prisma.bonafideRequest.count({
        where: { certificateId: null, request: { status: 'PENDING_APPROVAL' } },
      });
      result += `ACADEMIC OFFICER TELEMETRY: Pending bonafide requests: ${pendingBonafide}.\n`;
      return result;
    }

    // 6. ADMIN Telemetry
    if (user.role === 'ADMIN') {
      const total = await prisma.request.count();
      const open = await prisma.request.count({
        where: { status: { in: ['SUBMITTED', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL'] } },
      });
      result += `ADMIN COMMAND CENTER: Total requests: ${total}. Active open requests: ${open}.\n`;
      return result;
    }

    return result;
  }

  // =========================================================================
  // ROLE-SPECIFIC DETERMINISTIC HANDLERS
  // =========================================================================

  private static async handleWardenInquiry(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      const wardenBlock = await getWardenHostelBlock(user);
      const blockName = wardenBlock ? wardenBlock.name : user.hostelBlock || 'Hostel Block B';
      const blockId = wardenBlock ? wardenBlock.id : undefined;

      const pendingLeaves = await prisma.leaveRequest.findMany({
        where: {
          status: 'PENDING_APPROVAL',
          ...(blockId
            ? { request: { requester: { student: { hostelRoom: { hostelBlockId: blockId } } } } }
            : {}),
        },
        include: {
          request: {
            include: {
              requester: {
                include: {
                  student: {
                    include: {
                      hostelRoom: true,
                      branch: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const activePassesCount = await prisma.gatePass.count({
        where: {
          gateStatus: { in: ['APPROVED', 'DEPARTED'] },
          ...(blockId
            ? { request: { requester: { student: { hostelRoom: { hostelBlockId: blockId } } } } }
            : {}),
        },
      });

      const openComplaintsCount = await prisma.request.count({
        where: {
          requestType: { code: 'COMPLAINT' },
          status: { in: ['SUBMITTED', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS'] },
          ...(wardenBlock ? { location: { contains: wardenBlock.name } } : {}),
        },
      });

      const totalResidents = blockId
        ? await prisma.student.count({ where: { hostelRoom: { hostelBlockId: blockId } } })
        : 120;

      let leaveRows = '';
      if (pendingLeaves.length > 0) {
        leaveRows = pendingLeaves
          .map((l) => {
            const sName = l.request.requester.student?.fullName || l.request.requester.username;
            const sRoll = l.request.requester.student?.rollNumber || 'N/A';
            const room = l.request.requester.student?.hostelRoom?.roomNumber || 'Room';
            const start = new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const end = new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `• **[${l.request.requestNumber}]** **${sName}** (Roll: ${sRoll}, Room ${room})\n  - Dates: **${start} – ${end}** | Reason: ${l.reason} | Emergency: \`${l.emergencyContact}\``;
          })
          .join('\n');
      } else {
        leaveRows = '• *No leave applications currently awaiting warden review.*';
      }

      const message = `### 🏢 Hostel Warden Operational Overview — **${blockName}**

**Jurisdiction Summary**:
• **Hostel Block**: **${blockName}** (Resident Students: **${totalResidents}**)
• **Pending Leave Applications**: **${pendingLeaves.length} awaiting approval**
• **Active Gate Passes**: **${activePassesCount} students currently on campus outpass**
• **Open Room Maintenance Tickets**: **${openComplaintsCount} tickets in progress**

#### Pending Leave Applications Awaiting Review:
${leaveRows}

> **Hostel Policy Guideline**: Standard overnight leaves must be reviewed within **12 hours**. Urgent/medical leaves must be processed within **2 hours**. Verify parent consent via emergency contact for leaves exceeding 3 days.`;

      return {
        intent: 'WARDEN_TELEMETRY',
        category: 'Hostel',
        confidence: 0.98,
        message,
        cards: [
          {
            cardType: 'REQUEST_LIST',
            title: `${blockName} - Pending Leave Requests`,
            data: {
              title: `Pending Leaves (${blockName})`,
              requests: pendingLeaves.map((l) => ({
                id: l.request.id,
                requestNumber: l.request.requestNumber,
                title: l.request.title,
                status: l.status,
                type: 'LEAVE',
                createdAt: l.createdAt,
              })),
            },
          },
        ],
        quickReplies: [
          'Review pending leaves in portal',
          'Check block maintenance complaints',
          'View curfew regulations',
        ],
      };
    } catch (err) {
      console.error('[Copilot] Warden telemetry error:', err);
      return {
        intent: 'WARDEN_TELEMETRY',
        category: 'Hostel',
        confidence: 0.8,
        message: 'Unable to query live warden operational data. Please navigate to the **Warden Portal**.',
        cards: [],
      };
    }
  }

  private static async handleStaffInquiry(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
      });

      const myTasks = await prisma.request.findMany({
        where: {
          assignedTo: user.id,
          requestType: { code: 'COMPLAINT' },
          status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ROUTED'] },
        },
        include: { complaint: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 6,
      });

      const urgentCount = myTasks.filter((t) => t.priority === 'URGENT').length;
      const highCount = myTasks.filter((t) => t.priority === 'HIGH').length;

      let taskRows = '';
      if (myTasks.length > 0) {
        taskRows = myTasks
          .map((t) => {
            const prioBadge =
              t.priority === 'URGENT'
                ? '🚨 URGENT (4h SLA)'
                : t.priority === 'HIGH'
                ? '⚠️ HIGH (12h SLA)'
                : 'NORMAL (48h SLA)';
            return `• **[${t.requestNumber}]** ${t.title} [${prioBadge}]\n  - Location: **${t.location || 'Campus'}** • Category: ${t.complaint?.category || 'General'}`;
          })
          .join('\n');
      } else {
        taskRows = '• *No pending maintenance tickets currently assigned to your queue.*';
      }

      const message = `### 🔧 Maintenance Staff Operations Queue — **${user.fullName || user.username}**
**Specialization**: ${staff?.specialization || 'Facility Operations'} • Department: ${staff?.department || 'Maintenance'}

• **Active Assigned Work Orders**: **${myTasks.length} pending**
• **Priority Breakdown**: **${urgentCount} Urgent**, **${highCount} High**

#### Your Active Work Orders:
${taskRows}

> **Maintenance SLA**: Urgent electrical or plumbing repairs must be attended within **4 hours** of ticket dispatch.`;

      return {
        intent: 'STAFF_TELEMETRY',
        category: 'Maintenance',
        confidence: 0.98,
        message,
        cards: [
          {
            cardType: 'REQUEST_LIST',
            title: 'Assigned Work Orders',
            data: {
              title: 'Active Maintenance Tasks',
              requests: myTasks.map((t) => ({
                id: t.id,
                requestNumber: t.requestNumber,
                title: t.title,
                status: t.status,
                type: 'COMPLAINT',
                createdAt: t.createdAt,
              })),
            },
          },
        ],
        quickReplies: ['Open Tasks Portal', 'View Maintenance SLAs'],
      };
    } catch (err) {
      console.error('[Copilot] Staff telemetry error:', err);
      return {
        intent: 'STAFF_TELEMETRY',
        category: 'Maintenance',
        confidence: 0.8,
        message: 'Unable to access your maintenance task queue right now.',
        cards: [],
      };
    }
  }

  private static async handleSecurityInquiry(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      const departedCount = await prisma.gatePass.count({ where: { gateStatus: 'DEPARTED' } });
      const approvedCount = await prisma.gatePass.count({ where: { gateStatus: 'APPROVED' } });
      const activeAlerts = EmergencyService.getActive();

      const activeDeparted = await prisma.gatePass.findMany({
        where: { gateStatus: 'DEPARTED' },
        include: {
          request: {
            include: {
              requester: {
                include: {
                  student: {
                    include: {
                      hostelRoom: { include: { hostelBlock: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { departedAt: 'desc' },
        take: 5,
      });

      let departedRows = '';
      if (activeDeparted.length > 0) {
        departedRows = activeDeparted
          .map((gp) => {
            const sName = gp.request.requester.student?.fullName || gp.request.requester.username;
            const sRoll = gp.request.requester.student?.rollNumber || 'Student';
            const retTime = new Date(gp.expectedReturnTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return `• **${sName}** (${sRoll}) — Destination: **${gp.destination}** | Due Back: **${retTime}** (PIN: \`${gp.passPin}\`)`;
          })
          .join('\n');
      } else {
        departedRows = '• *No students currently departed on gate pass.*';
      }

      const alertSection =
        activeAlerts.length > 0
          ? `\n🚨 **ACTIVE CAMPUS SOS ALERTS (${activeAlerts.length})**:\n` +
            activeAlerts
              .map(
                (a) =>
                  `• [${a.distressType}] ${a.studentName} at ${a.hostelBlock} Room ${a.roomNumber} (Phone: ${a.phone})`
              )
              .join('\n')
          : '✅ **No Active Emergency SOS Incidents**';

      const message = `### 🛡️ Campus Perimeter & Gate Security Operations

• **Students Currently Departed**: **${departedCount} off campus**
• **Approved Passes Awaiting Departure**: **${approvedCount} passes**
• **Emergency Incidents**: ${alertSection}

#### Recent Departed Students Awaiting Ingress:
${departedRows}

> **Gate Security Directive**: Verify all egress/ingress using dynamic QR tokens or 4-digit PINs at Gate 1 & 2. Late arrivals past curfew (7:30 PM for 1st Yr / 8:30 PM for Seniors) must be logged in the late entry register.`;

      return {
        intent: 'SECURITY_TELEMETRY',
        category: 'Security',
        confidence: 0.98,
        message,
        cards: [],
        quickReplies: ['Open Security Scanner', 'View Emergency Incident History'],
      };
    } catch (err) {
      console.error('[Copilot] Security telemetry error:', err);
      return {
        intent: 'SECURITY_TELEMETRY',
        category: 'Security',
        confidence: 0.8,
        message: 'Unable to retrieve gate telemetry from security records.',
        cards: [],
      };
    }
  }

  private static async handleAcademicOfficerInquiry(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      const pendingBonafides = await prisma.bonafideRequest.findMany({
        where: {
          certificateId: null,
          request: { status: 'PENDING_APPROVAL' },
        },
        include: {
          request: {
            include: {
              requester: {
                include: {
                  student: {
                    include: { branch: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      let bonafideRows = '';
      if (pendingBonafides.length > 0) {
        bonafideRows = pendingBonafides
          .map((b) => {
            const sName = b.request.requester.student?.fullName || b.request.requester.username;
            const sRoll = b.request.requester.student?.rollNumber || 'N/A';
            const branch = b.request.requester.student?.branch?.code || 'CSE';
            return `• **[${b.request.requestNumber}]** **${sName}** (${branch} - Roll: ${sRoll}) — Purpose: **${b.purpose}**`;
          })
          .join('\n');
      } else {
        bonafideRows = '• *No bonafide certificates currently pending digital certification.*';
      }

      const message = `### 📜 Academic Affairs Cell — Operational Dashboard

• **Pending Bonafide Requests**: **${pendingBonafides.length} awaiting certification**
• **Turnaround Commitment**: 24 to 48 Hours

#### Applications Awaiting Approval:
${bonafideRows}

> **Academic Cell Guideline**: Digitally certified certificates include public QR verification links and tamper-evident document numbers. Hard copies may be physically stamped at Window 3, Ground Floor Admin Block upon request.`;

      return {
        intent: 'ACADEMIC_OFFICER_TELEMETRY',
        category: 'Documents',
        confidence: 0.98,
        message,
        cards: [
          {
            cardType: 'REQUEST_LIST',
            title: 'Pending Bonafide Requests',
            data: {
              title: 'Bonafide Applications Queue',
              requests: pendingBonafides.map((b) => ({
                id: b.request.id,
                requestNumber: b.request.requestNumber,
                title: b.request.title,
                status: b.request.status,
                type: 'BONAFIDE',
                createdAt: b.createdAt,
              })),
            },
          },
        ],
        quickReplies: ['Open Academic Approvals', 'View Academic Deadlines'],
      };
    } catch (err) {
      console.error('[Copilot] Academic officer telemetry error:', err);
      return {
        intent: 'ACADEMIC_OFFICER_TELEMETRY',
        category: 'Documents',
        confidence: 0.8,
        message: 'Unable to query academic records at this time.',
        cards: [],
      };
    }
  }

  private static async handleFacultyInquiry(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      const facultyName = user.fullName || user.username;
      const subjects = await prisma.subject.findMany({
        where: {
          faculty: { contains: facultyName },
        },
        include: { branch: true },
      });

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const dayUpper = today.toUpperCase();

      const todayClasses = await prisma.timetableEntry.findMany({
        where: {
          faculty: { contains: facultyName },
          day: dayUpper,
        },
        include: { subject: true },
        orderBy: { startTime: 'asc' },
      });

      let classRows = '';
      if (todayClasses.length > 0) {
        classRows = todayClasses
          .map(
            (c, idx) =>
              `${idx + 1}. **${c.startTime} – ${c.endTime}** | **${c.subject.name}** (${c.subject.code}) • Room: **${c.room || 'LH-101'}**`
          )
          .join('\n');
      } else {
        classRows = `• *No teaching lectures scheduled for today (${today}).*`;
      }

      const message = `### 🎓 Faculty Academic Schedule — **${facultyName}**

• **Assigned Courses**: ${subjects.map((s) => `${s.name} (${s.code})`).join(', ') || 'Department Subjects'}
• **Instruction Day**: **${today}**

#### Today's Teaching Periods:
${classRows}

> **Faculty Notice**: Class attendance should be logged digitally via the Faculty Attendance Portal within 24 hours of session completion.`;

      return {
        intent: 'FACULTY_TELEMETRY',
        category: 'Academic',
        confidence: 0.98,
        message,
        cards: [],
        quickReplies: ['Record Attendance', 'View Teaching Timetable', 'Publish Class Notice'],
      };
    } catch (err) {
      console.error('[Copilot] Faculty telemetry error:', err);
      return {
        intent: 'FACULTY_TELEMETRY',
        category: 'Academic',
        confidence: 0.8,
        message: 'Unable to load faculty timetable from database.',
        cards: [],
      };
    }
  }

  private static async handleAdminInquiry(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      const now = new Date();
      const totalRequests = await prisma.request.count();
      const openRequests = await prisma.request.count({
        where: {
          status: { in: ['SUBMITTED', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL'] },
        },
      });
      const overdueRequests = await prisma.request.count({
        where: {
          status: { in: ['SUBMITTED', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL'] },
          dueAt: { lt: now },
        },
      });
      const pendingApprovals = await prisma.request.count({
        where: { status: 'PENDING_APPROVAL' },
      });
      const activeEmergency = EmergencyService.getActive().length;

      const message = `### 🏛️ Nexora Command Center — Operations Telemetry

• **Total Campus Requests Logged**: **${totalRequests}**
• **Active Open Tickets**: **${openRequests} in progress**
• **Overdue SLA Breaches**: **${overdueRequests} overdue**
• **Pending Officer Approvals**: **${pendingApprovals} requests**
• **Active Emergency Alerts**: **${activeEmergency > 0 ? `🚨 ${activeEmergency} ACTIVE` : '✅ 0 active'}**

> **Administrative Audit**: System operations, role assignments, and resolution audits are running with 100% telemetry coverage.`;

      return {
        intent: 'ADMIN_TELEMETRY',
        category: 'General',
        confidence: 0.98,
        message,
        cards: [],
        quickReplies: ['Command Center Dashboard', 'Audit Log Trail', 'SLA Performance'],
      };
    } catch (err) {
      console.error('[Copilot] Admin telemetry error:', err);
      return {
        intent: 'ADMIN_TELEMETRY',
        category: 'General',
        confidence: 0.8,
        message: 'Unable to query command center metrics from database.',
        cards: [],
      };
    }
  }

  // =========================================================================
  // DETERMINISTIC HANDLERS (STUDENT TELEMETRY & WORKFLOWS)
  // =========================================================================

  private static async handleAttendanceQuery(
    user: AuthUser,
    lower: string,
    rawText: string
  ): Promise<CopilotResponse> {
    try {
      let student = null;
      if (user.studentId) {
        student = await prisma.student.findUnique({
          where: { id: user.studentId },
          include: { branch: true },
        });
      }

      if (!student && user.id) {
        student = await prisma.student.findUnique({
          where: { userId: user.id },
          include: { branch: true },
        });
      }

      if (!student && user.rollNumber) {
        student = await prisma.student.findUnique({
          where: { rollNumber: user.rollNumber },
          include: { branch: true },
        });
      }

      if (!student) {
        return {
          intent: 'ATTENDANCE_QUERY',
          category: 'Academic',
          confidence: 0.95,
          message: `No active student enrollment profile was found for **${user.fullName || user.username}** (Roll: ${user.rollNumber || 'N/A'}). Please verify that your account is registered as a student in the campus portal.`,
          cards: [],
          quickReplies: ['Check semester timetable', 'Plan my upcoming exams', 'Campus Helpdesk'],
        };
      }

      const attendances = await prisma.attendance.findMany({
        where: { studentId: student.id },
        include: {
          subject: {
            select: { id: true, code: true, name: true },
          },
        },
        orderBy: { subject: { code: 'asc' } },
      });

      if (attendances.length === 0) {
        return {
          intent: 'ATTENDANCE_QUERY',
          category: 'Academic',
          confidence: 0.95,
          message: `No published attendance sessions were found for **${student.fullName}** (Roll: **${student.rollNumber}**) in the active semester database.\\n\\nAttendance records are updated weekly by subject faculty coordinators following completed lectures and practical labs. If classes have commenced, please consult your department academic coordinator or the Academic Affairs Cell.`,
          cards: [],
          quickReplies: ['What classes do I have today?', 'Plan my upcoming exams', 'Find BPUT PYQs'],
        };
      }

      let totalPresent = 0;
      let totalClasses = 0;

      const subjectBreakdown = attendances.map((item) => {
        totalPresent += item.present;
        totalClasses += item.total;
        const pct = item.total > 0 ? Number(((item.present / item.total) * 100).toFixed(1)) : 0;
        return {
          code: item.subject.code,
          name: item.subject.name,
          present: item.present,
          total: item.total,
          percentage: pct,
          isAbove: pct >= 75.0,
        };
      });

      const overallPercentage =
        totalClasses > 0 ? Number(((totalPresent / totalClasses) * 100).toFixed(1)) : 0;
      const isOverallAbove = overallPercentage >= 75.0;

      // Subject-specific filter detection
      const matchedSubject = subjectBreakdown.find(
        (s) =>
          lower.includes(s.code.toLowerCase()) ||
          lower.includes(s.name.toLowerCase()) ||
          (lower.includes('dbms') && (s.code === 'CS202' || s.code === 'CS204' || s.name.toLowerCase().includes('database'))) ||
          (lower.includes('os') && (s.code === 'CS202' || s.name.toLowerCase().includes('operating'))) ||
          (lower.includes('dsa') && s.name.toLowerCase().includes('data structure'))
      );

      let subjectSpecificSection = '';
      if (matchedSubject) {
        let subMarginNote = '';
        if (matchedSubject.isAbove) {
          const subSafeMisses = Math.floor((matchedSubject.present - 0.75 * matchedSubject.total) / 0.75);
          subMarginNote = `⚡ You can safely miss up to **${subSafeMisses} class${subSafeMisses === 1 ? '' : 'es'}** in this subject.`;
        } else {
          const subNeeded = Math.ceil((0.75 * matchedSubject.total - matchedSubject.present) / 0.25);
          subMarginNote = `🚨 Below 75%! You must attend the next **${subNeeded} consecutive class${subNeeded === 1 ? '' : 'es'}** in this course without absence.`;
        }

        subjectSpecificSection = `### Focus Subject: **${matchedSubject.name}** (${matchedSubject.code})\\n- **Standing**: **${matchedSubject.present} / ${matchedSubject.total}** classes (**${matchedSubject.percentage}%**)\\n- **Status**: ${matchedSubject.isAbove ? '✅ Eligible (>= 75%)' : '⚠️ Shortage (< 75%)'}\\n- ${subMarginNote}\\n\\n---\\n`;
      }

      // 75% BPUT Margin Calculation
      let marginNote = '';
      if (isOverallAbove) {
        const safeMisses = Math.floor((totalPresent - 0.75 * totalClasses) / 0.75);
        if (safeMisses > 0) {
          marginNote = `⚡ **Safety Buffer**: You can safely miss up to **${safeMisses} upcoming class${safeMisses === 1 ? '' : 'es'}** across all courses and still stay at or above the mandatory 75% threshold.`;
        } else {
          marginNote = `⚠️ **Borderline Standing**: Your attendance is at **${overallPercentage}%**. You are right at the 75% mark—do not miss any upcoming lectures to avoid being debarred from examinations.`;
        }
      } else {
        const neededAttends = Math.ceil((0.75 * totalClasses - totalPresent) / 0.25);
        marginNote = `🚨 **Attendance Shortage**: Your current standing is **${overallPercentage}%** (below BPUT's 75% minimum). You must attend the next **${neededAttends} consecutive class${neededAttends === 1 ? '' : 'es'}** without absence to recover your eligibility.`;
      }

      const rows = subjectBreakdown
        .map(
          (s) =>
            `• **${s.name}** (${s.code}): **${s.present}/${s.total}** (${s.percentage}%) — ${
              s.isAbove ? '✅ Above 75%' : '⚠️ Below 75%'
            }`
        )
        .join('\\n');

      const message = `${subjectSpecificSection}Here is your verified, real-time attendance telemetry for **${student.fullName}** (Roll: **${student.rollNumber}**):\n\n### Overall Attendance: **${overallPercentage}%** (${totalPresent} / ${totalClasses} classes attended)\n- **Status**: ${isOverallAbove ? '✅ **Exam Eligible (>= 75%)**' : '🚨 **Shortage Alert (< 75%)**'}\n- ${marginNote}\n\n#### Subject-Wise Breakdown:\n${rows}\n\n> **BPUT Academic Regulation**: Minimum 75% attendance is compulsory in each course for end-semester admit card generation. Condonation up to 65% is only admissible on certified medical grounds.`;

      return {
        intent: 'ATTENDANCE_QUERY',
        category: 'Academic',
        confidence: 0.99,
        message,
        cards: [],
        quickReplies: [
          'What classes do I have today?',
          'Generate a 10-day DBMS study plan',
          'Find BPUT PYQs',
          'Explain the 75% attendance rule',
        ],
      };
    } catch (err) {
      console.error('[Copilot] Error retrieving attendance:', err);
      return {
        intent: 'ATTENDANCE_QUERY',
        category: 'Academic',
        confidence: 0.8,
        message:
          'Could not access the live attendance database. Please check your network connection or verify your attendance in the **My Attendance** portal.',
        cards: [],
        quickReplies: ["Check today's schedule", 'Plan my upcoming exams'],
      };
    }
  }

  private static async handleTimetableQuery(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      let student = null;
      if (user.studentId) {
        student = await prisma.student.findUnique({
          where: { id: user.studentId },
          include: { branch: true },
        });
      }

      if (!student && user.id) {
        student = await prisma.student.findUnique({
          where: { userId: user.id },
          include: { branch: true },
        });
      }

      if (!student) {
        return {
          intent: 'TIMETABLE_QUERY',
          category: 'Academic',
          confidence: 0.9,
          message: 'Student profile not linked. Please ensure your student enrollment is active to view routine.',
          cards: [],
        };
      }

      let targetDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const d of daysOfWeek) {
        if (lower.includes(d)) {
          targetDay = d.charAt(0).toUpperCase() + d.slice(1);
          break;
        }
      }
      if (lower.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
      }

      const dayUpper = targetDay.toUpperCase();

      const classes = await prisma.timetableEntry.findMany({
        where: {
          branchId: student.branchId,
          year: student.year,
          day: dayUpper,
        },
        include: {
          subject: true,
        },
        orderBy: { startTime: 'asc' },
      });

      if (classes.length === 0) {
        return {
          intent: 'TIMETABLE_QUERY',
          category: 'Academic',
          confidence: 0.95,
          message: `You have **no scheduled lectures for ${targetDay}**.\\n\\nUse this time for assignment submissions, project development, or structured exam revision. You can explore verified university question papers and notes below.`,
          cards: [],
          quickReplies: ['Check my attendance standing', 'Find BPUT PYQs', 'Plan my upcoming exams'],
        };
      }

      const classList = classes
        .map(
          (c, idx) =>
            `${idx + 1}. **${c.startTime} – ${c.endTime}** | **${c.subject.name}** (${c.subject.code})\\n   • Room: **${c.room || 'LH-101'}** • Faculty: ${c.faculty || 'Department Faculty'}`
        )
        .join('\\n');

      const message = `Here is your scheduled timetable for **${targetDay}** — ${student.branch.code} Year ${student.year}:\\n\\n${classList}\\n\\n> **Reminder**: Please report 5 minutes prior to period commencement. Attendance is recorded digitally at the start of each lecture.`;

      return {
        intent: 'TIMETABLE_QUERY',
        category: 'Academic',
        confidence: 0.98,
        message,
        cards: [],
        quickReplies: ['Check my attendance standing', 'Find BPUT PYQs', 'Plan my upcoming exams'],
      };
    } catch (err) {
      console.error('[Copilot] Error retrieving timetable:', err);
      return {
        intent: 'TIMETABLE_QUERY',
        category: 'Academic',
        confidence: 0.8,
        message: 'Could not access the live timetable database right now.',
        cards: [],
      };
    }
  }

  private static async handleRequestTracking(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      const requests = await prisma.request.findMany({
        where: { requesterId: user.id },
        include: {
          requestType: true,
          complaint: true,
          gatePass: true,
          leaveRequest: true,
          bonafide: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });

      if (requests.length === 0) {
        return {
          intent: 'REQUEST_TRACKING',
          category: 'Documents',
          confidence: 0.95,
          message: `You currently have **no submitted campus requests** on record.\n\nYou can use Nexora Copilot to create maintenance requests, apply for bonafide certificates, submit hostel leaves, or generate digital gate passes with one click.`,
          cards: [],
          quickReplies: [
            'Request a Bonafide Certificate',
            'Report a Hostel Problem',
            'Apply for Hostel Leave',
            'Generate a Gate Pass',
          ],
        };
      }

      let filtered = requests;
      let filterTitle = 'Recent Campus Requests';
      if (lower.includes('bonafide') || lower.includes('certificate')) {
        filtered = requests.filter((r) => r.requestType.code === 'BONAFIDE');
        filterTitle = 'Bonafide Certificate Requests';
      } else if (lower.includes('complaint') || lower.includes('maintenance')) {
        filtered = requests.filter((r) => r.requestType.code === 'COMPLAINT');
        filterTitle = 'Hostel & Facility Maintenance Tickets';
      } else if (lower.includes('leave')) {
        filtered = requests.filter((r) => r.requestType.code === 'LEAVE');
        filterTitle = 'Hostel Leave Applications';
      } else if (lower.includes('gate') || lower.includes('pass')) {
        filtered = requests.filter((r) => r.requestType.code === 'GATE_PASS');
        filterTitle = 'Gate Pass Authorizations';
      }

      if (filtered.length === 0) {
        filtered = requests.slice(0, 5);
      }

      const statusRows = filtered
        .map((r) => {
          let badge = '⏳ PENDING';
          if (r.status === 'APPROVED' || r.status === 'CONFIRMED' || r.status === 'RESOLVED')
            badge = '✅ ' + r.status;
          else if (r.status === 'REJECTED' || r.status === 'CANCELLED') badge = '❌ ' + r.status;
          else if (r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS') badge = '🔧 ' + r.status;

          const dateStr = new Date(r.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          let specificNote = '';
          if (r.gatePass) {
            specificNote = `\n    - PIN: \`${r.gatePass.passPin}\` | Destination: ${r.gatePass.destination} | Due: ${new Date(r.gatePass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          } else if (r.bonafide && r.bonafide.certificateId) {
            specificNote = `\n    - Issued Certificate ID: \`${r.bonafide.certificateId}\``;
          }

          return `• **[${r.requestNumber}]** ${r.title}\n  - **Status**: \`${r.status}\` (${badge}) • Submitted: ${dateStr}${specificNote}`;
        })
        .join('\n');

      const message = `Here is the live status of your **${filterTitle}**:\n\n${statusRows}\n\nYou can click on any request in the status card below to view detailed timelines or technician assignments.`;

      const cardData = {
        title: filterTitle,
        requests: filtered.map((r) => ({
          id: r.id,
          requestNumber: r.requestNumber,
          title: r.title,
          status: r.status,
          type: r.requestType.code,
          createdAt: r.createdAt,
        })),
      };

      return {
        intent: 'REQUEST_TRACKING',
        category: 'Documents',
        confidence: 0.98,
        message,
        cards: [
          {
            cardType: 'REQUEST_LIST',
            title: filterTitle,
            data: cardData,
          },
        ],
        quickReplies: [
          'Request a Bonafide Certificate',
          'Report a Hostel Problem',
          'Check my attendance standing',
        ],
      };
    } catch (err) {
      console.error('[Copilot] Error tracking requests:', err);
      return {
        intent: 'REQUEST_TRACKING',
        category: 'Documents',
        confidence: 0.8,
        message:
          'Unable to access your request records from the database right now. Please check **My Requests** in the navigation bar.',
        cards: [],
      };
    }
  }

  private static async handleDeadlinesAndNotices(user: AuthUser, lower: string): Promise<CopilotResponse> {
    try {
      const deadlines = await prisma.academicDeadline.findMany({
        where: { isActive: true },
        orderBy: { deadline: 'asc' },
        take: 5,
      });

      const notices = await prisma.notice.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      });

      let deadlineSection = '';
      if (deadlines.length > 0) {
        const rows = deadlines
          .map((d) => {
            const dateStr = new Date(d.deadline).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            return `• **${d.title}**: Due on **${dateStr}**\n  - ${d.description}`;
          })
          .join('\n');
        deadlineSection = `### 📅 Upcoming Academic Deadlines:\n${rows}\n\n`;
      } else {
        deadlineSection = '### 📅 Upcoming Academic Deadlines:\n• *No urgent deadlines pending.*\\n\\n';
      }

      let noticeSection = '';
      if (notices.length > 0) {
        const nRows = notices
          .map((n) => `• **${n.title}** (${n.priority} priority)\n  - ${n.content.slice(0, 140)}...`)
          .join('\n');
        noticeSection = `### 📢 Recent Published Campus Circulars:\n${nRows}`;
      }

      const message = `${deadlineSection}${noticeSection}\n\n> **Notice**: Stay updated with departmental announcements to ensure timely form fill-up and fee clearances.`;

      const card: CopilotCard = {
        cardType: 'DEADLINE_LIST',
        title: 'Academic Deadlines & Notices',
        data: {
          deadlines: deadlines.map((d) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            deadline: d.deadline,
            relatedForm: d.relatedForm,
            actionUrl: d.actionUrl,
          })),
          notices: notices.map((n) => ({
            id: n.id,
            title: n.title,
            priority: n.priority,
            publishedAt: n.publishedAt,
          })),
        },
      };

      return {
        intent: 'DEADLINES_NOTICES',
        category: 'Academic',
        confidence: 0.98,
        message,
        cards: [card],
        quickReplies: ['Check semester timetable', 'Plan my upcoming exams', 'What is my current attendance?'],
      };
    } catch (err) {
      console.error('[Copilot] Error retrieving deadlines:', err);
      return {
        intent: 'DEADLINES_NOTICES',
        category: 'Academic',
        confidence: 0.8,
        message: 'Could not retrieve current academic deadlines right now.',
        cards: [],
      };
    }
  }

  // =========================================================================
  // GENERAL ACADEMIC, PROGRAMMING & CAREER GUIDANCE HANDLERS
  // =========================================================================

  private static handleGeneralAcademicAdvice(
    text: string,
    lower: string,
    user: AuthUser,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): CopilotResponse {
    const message = `### 🎯 Proven Strategy to Achieve 9+ CGPA at BPUT (Engineering)

Securing a **9+ CGPA** is not about studying 12 hours a night before exams; it is about exploiting how university examinations and internal marks are structured:

1. **Maximize Internal Assessment (30% Total Weightage)**:
   - Internals consist of 30 marks (Two mid-term tests + Quizzes/Assignments + 5 marks for attendance).
   - Target **27 to 29 out of 30**. High internals give you an extraordinary buffer: you only need ~53/70 in the end-semester exam for an **'E' Grade (9 points)**, and ~63/70 for an **'O' Grade (10 points)**.
   - Maintain **80%+ attendance** to secure full attendance points.

2. **Master Past 5-Year BPUT PYQs (70% Exam Weightage)**:
   - In BPUT semester examinations, **60% to 70%** of numericals and core theoretical questions repeat from previous years.
   - Solve at least 3 previous year papers under timed conditions before each exam.

3. **Strategic Module Coverage (The 4+1 Rule)**:
   - BPUT syllabi contain 5 modules.
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
   - Dedicate 90 minutes every evening to summarize lecture notes and solve 2 analytical problems. Consistency beats 12-hour pre-exam cramming every single time.

> **Verified Academic Source**: *BPUT Academic Regulations & Nexora Academic Mentorship Framework*`;

    return {
      intent: 'GENERAL_ACADEMIC',
      category: 'Academic',
      confidence: 0.98,
      message,
      cards: [],
      quickReplies: [
        'Find BPUT PYQs',
        'Generate a 10-day DBMS study plan',
        'What is my current attendance?',
      ],
    };
  }

  private static handleProgrammingHelp(
    text: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    let message = '';
    if (lower.includes('recursion')) {
      message = `### 💻 Understanding Recursion in C++

Recursion is a programming technique where a function solves a problem by calling a smaller instance of itself.

#### The Two Pillars of Every Recursive Function:
1. **Base Case**: The stopping condition that prevents infinite execution and stack overflow.
2. **Recursive Step**: Reducing the problem into a smaller sub-problem and calling itself.

\`\`\`cpp
#include <iostream>
using namespace std;

// Recursive Factorial Calculation: n! = n * (n-1)!
long long factorial(int n) {
    // 1. Base Case
    if (n <= 1) return 1;
    
    // 2. Recursive Step
    return n * factorial(n - 1);
}

int main() {
    int num = 5;
    cout << "Factorial of " << num << " is " << factorial(num) << endl;
    return 0;
}
\`\`\`

#### Key Mental Model: The Call Stack
Each recursive invocation pushes a stack frame containing local variables and return addresses. When the base case is satisfied, stack frames unwind in Last-In-First-Out (LIFO) order.`;
    } else {
      message = `### 💻 Data Structures & Algorithms Problem-Solving Roadmap

To build strong problem-solving skills for university exams and campus placements:

1. **Master One Language**: C++ (with STL) or Java (with Collections Framework).
2. **Core Linear Structures**: Arrays, Strings, Two Pointers, Sliding Window, Linked Lists, Stacks, Queues.
3. **Non-Linear Structures**: Binary Trees, BSTs, Heaps/Priority Queues, Hash Maps, Graphs.
4. **Algorithmic Patterns**: Recursion & Backtracking, BFS/DFS, Binary Search, Dynamic Programming.
5. **Practice Strategy**: Target 150–200 curated questions on LeetCode / GeeksforGeeks.`;
    }

    return {
      intent: 'PROGRAMMING_HELP',
      category: 'Academic',
      confidence: 0.95,
      message,
      cards: [],
      quickReplies: ['Explain recursion in C++', 'How should I prepare for campus placements?', 'Find BPUT PYQs'],
    };
  }

  private static handleCareerGuidance(
    text: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    const message = `### 🚀 Comprehensive Campus Placement & Career Preparation

To secure high-tier product and software engineering offers during campus drives:

1. **Academic Eligibility (The Gatekeeper)**:
   - Maintain a CGPA of **>= 7.0 (ideally 8.0+)** with **zero active backlogs**. This ensures eligibility for 95%+ of visiting Tier-1 tech recruiters.

2. **Data Structures & Algorithms (DSA) (Coding Rounds)**:
   - Master Arrays, Strings, Trees, Graphs, and Dynamic Programming.
   - Solve 150–250 problems across LeetCode / GeeksforGeeks.

3. **Core CS Fundamentals (Technical Interviews)**:
   - **DBMS**: SQL queries, indexing, normalization (1NF–BCNF), ACID properties.
   - **Operating Systems**: Processes vs Threads, CPU scheduling, deadlocks, virtual memory.
   - **Computer Networks**: TCP/IP vs OSI model, DNS, HTTP/HTTPS, sockets.

4. **Production-Ready Projects**:
   - Build 2 full-stack or systems projects with clean code, unit tests, and live deployed URLs.

5. **Aptitude & Communication**:
   - Practice quantitative and logical reasoning for initial screening tests.`;

    return {
      intent: 'CAREER_GUIDANCE',
      category: 'Career',
      confidence: 0.95,
      message,
      cards: [],
      quickReplies: ['How can I get a 9+ CGPA?', 'Find BPUT PYQs', 'What classes do I have today?'],
    };
  }

  private static handleGuideProcedure(
    matchedProcedure: CampusProcedure,
    user: AuthUser
  ): CopilotResponse {
    const stepList = matchedProcedure.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
    const docList = matchedProcedure.requiredDocuments.map((d) => `• ${d}`).join('\n');

    let directCard: CopilotCard | null = null;
    if (matchedProcedure.directActionIntent === 'REQUEST_BONAFIDE') {
      directCard = {
        cardType: 'ACTION_BONAFIDE',
        title: 'Start Bonafide Request',
        data: {
          purpose: 'Scholarship',
          studentName: user.fullName || user.username,
          rollNumber: user.rollNumber || '220101048',
          branch: user.branch || 'CSE',
          year: user.year || 2,
        },
      };
    } else if (matchedProcedure.directActionIntent === 'CREATE_MAINTENANCE_REQUEST') {
      directCard = {
        cardType: 'ACTION_MAINTENANCE',
        title: 'Report Maintenance Problem',
        data: {
          category: 'Electrical',
          priority: 'NORMAL',
          title: 'Room Maintenance Issue',
          description: 'Hostel room repair request',
          location: `${user.hostelBlock || 'Block B'} - Room ${user.roomNumber || '204'}`,
        },
      };
    } else if (matchedProcedure.directActionIntent === 'APPLY_HOSTEL_LEAVE') {
      const today = new Date();
      directCard = {
        cardType: 'ACTION_LEAVE',
        title: 'Apply for Hostel Leave',
        data: {
          startDate: new Date(today.getTime() + 24 * 3600000).toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 4 * 24 * 3600000).toISOString().split('T')[0],
          reason: 'Home Travel',
          emergencyContact: 'Parent / Guardian (+91 9876543210)',
          parentConsent: true,
          hostelBlock: user.hostelBlock || 'Block B',
        },
      };
    } else if (matchedProcedure.directActionIntent === 'CREATE_GATE_PASS') {
      const now = new Date();
      directCard = {
        cardType: 'ACTION_GATE_PASS',
        title: 'Apply for Campus Exit Gate Pass',
        data: {
          destination: 'Local Market',
          reason: 'Personal Errands',
          departureTime: new Date(now.getTime() + 30 * 60000).toISOString(),
          expectedReturnTime: new Date(now.getTime() + 4 * 3600000).toISOString(),
        },
      };
    }

    const procedureCard: CopilotCard = {
      cardType: 'GUIDE_PROCEDURE',
      title: matchedProcedure.title,
      data: {
        id: matchedProcedure.id,
        category: matchedProcedure.category,
        department: matchedProcedure.department,
        location: matchedProcedure.location,
        turnaroundTime: matchedProcedure.turnaroundTime,
        requiredDocuments: matchedProcedure.requiredDocuments,
        steps: matchedProcedure.steps,
        actionButtonLabel: matchedProcedure.actionButtonLabel,
        notes: matchedProcedure.notes,
      },
    };

    const cards: CopilotCard[] = directCard ? [procedureCard, directCard] : [procedureCard];

    const message = `### Official Procedure: **${matchedProcedure.title}**

• **Responsible Department**: ${matchedProcedure.department}
• **Location**: ${matchedProcedure.location}
• **Turnaround Commitment**: **${matchedProcedure.turnaroundTime}**

#### Required Documents / Prerequisites:
${docList}

#### Step-by-Step Procedure:
${stepList}

${matchedProcedure.notes ? `> **Important Note**: ${matchedProcedure.notes}\n\n` : ''}> **Verified Institutional Source**: *${matchedProcedure.source || 'Nexora Campus Operations Charter'}*`;

    return {
      intent: 'CAMPUS_GUIDE',
      category: matchedProcedure.category,
      confidence: 0.99,
      message,
      cards,
      quickReplies: [
        'How to apply for gate pass?',
        'How to get bonafide certificate?',
        'Report a room problem',
      ],
    };
  }

  private static handleCampusKnowledge(lower: string, user: AuthUser): CopilotResponse | null {
    const matches = searchCampusKnowledge(lower, 1, user.role);
    if (matches.length > 0) {
      const topMatch = matches[0];
      return {
        intent: 'CAMPUS_GUIDE',
        category: topMatch.category,
        confidence: 0.95,
        message: `### ${topMatch.title}\n\n${topMatch.content}\n\n> **Verified Policy Grounding**: *Source: ${topMatch.source}*`,
        cards: [],
        quickReplies: [
          'Check my attendance standing',
          'What classes do I have today?',
          'Find BPUT PYQs',
        ],
      };
    }
    return null;
  }

  private static handleConversational(
    text: string,
    lower: string,
    user: AuthUser,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    multiTurnContext?: any
  ): CopilotResponse {
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening'];
    if (greetings.some((g) => lower === g || lower.startsWith(g + ' '))) {
      return {
        intent: 'GENERAL_ACADEMIC',
        category: 'General',
        confidence: 0.99,
        message: `Hello **${user.fullName || user.username}**! I am your **Nexora Copilot**.

I can help you:
• Check live **attendance percentages** & 75% bunk safety margins
• Inspect your **timetable & class routine**
• Plan multi-day **exam revision roadmaps** & download verified BPUT PYQs
• Track submitted **bonafide certificates, leaves, & maintenance tickets**
• Explain **BPUT regulations, grading formulas, and 9+ CGPA strategies**

What would you like to focus on today?`,
        cards: [],
        quickReplies: [
          'How can I get a 9+ CGPA?',
          'What is my current attendance?',
          'What classes do I have today?',
          'What is the status of my bonafide application?',
        ],
      };
    }

    return {
      intent: 'GENERAL_ACADEMIC',
      category: 'General',
      confidence: 0.95,
      message: `You're very welcome, **${user.fullName || user.username}**! I'm here whenever you need assistance with exams, timetable, hostel workflows, or campus guidelines. Let me know what you'd like to work on next.`,
      cards: [],
      quickReplies: [
        'How can I get a 9+ CGPA?',
        'What is my current attendance?',
        'What classes do I have today?',
      ],
    };
  }

  // =========================================================================
  // WORKFLOW ACTION GENERATORS
  // =========================================================================

  private static handleMaintenanceAction(
    text: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    let category = 'Electrical';
    if (
      lower.includes('tap') ||
      lower.includes('water') ||
      lower.includes('leak') ||
      lower.includes('flush') ||
      lower.includes('drain')
    ) {
      category = 'Plumbing';
    } else if (
      lower.includes('door') ||
      lower.includes('window') ||
      lower.includes('cupboard') ||
      lower.includes('bed') ||
      lower.includes('chair') ||
      lower.includes('table')
    ) {
      category = 'Carpentry';
    } else if (lower.includes('wifi') || lower.includes('internet') || lower.includes('lan')) {
      category = 'Network';
    } else if (
      lower.includes('clean') ||
      lower.includes('dirty') ||
      lower.includes('smell') ||
      lower.includes('pest')
    ) {
      category = 'Cleanliness';
    }

    let priority = 'NORMAL';
    if (
      lower.includes('spark') ||
      lower.includes('urgent') ||
      lower.includes('immediately') ||
      lower.includes('heavy leak') ||
      lower.includes('broken lock')
    ) {
      priority = 'URGENT';
    } else if (lower.includes('not working') && (lower.includes('fan') || lower.includes('water'))) {
      priority = 'HIGH';
    }

    const location = `${user.hostelBlock || 'Hostel Block B'} - Room ${user.roomNumber || '204'}`;

    const card: CopilotCard = {
      cardType: 'ACTION_MAINTENANCE',
      title: 'Facility Maintenance Request',
      data: {
        category,
        priority,
        title: text.length > 50 ? `${category} issue in ${location}` : text,
        description: text,
        location,
        autoRoutedTo: `${category} Department Technician Queue`,
      },
    };

    return {
      intent: 'CREATE_MAINTENANCE_REQUEST',
      category: 'Maintenance',
      confidence: 0.98,
      message: `I have prepared a **${category} Maintenance Request** for your room (**${location}**). Please review the details below and confirm to create your official work ticket.`,
      cards: [card],
      quickReplies: ['Check my pending requests', 'What is my current attendance?'],
    };
  }

  private static handleBonafideAction(text: string, lower: string, user: AuthUser): CopilotResponse {
    let purpose = 'Scholarship';
    if (lower.includes('loan') || lower.includes('bank')) purpose = 'Bank';
    else if (lower.includes('internship') || lower.includes('company')) purpose = 'Internship';
    else if (lower.includes('passport') || lower.includes('visa')) purpose = 'Passport';
    else if (lower.includes('education') || lower.includes('higher studies')) purpose = 'Education';

    const card: CopilotCard = {
      cardType: 'ACTION_BONAFIDE',
      title: 'Bonafide Certificate Application',
      data: {
        purpose,
        studentName: user.fullName || user.username,
        rollNumber: user.rollNumber || '220101048',
        branch: user.branch || 'CSE',
        year: user.year || 2,
        availablePurposes: ['Scholarship', 'Bank', 'Internship', 'Education', 'Passport', 'Other'],
      },
    };

    return {
      intent: 'REQUEST_BONAFIDE',
      category: 'Documents',
      confidence: 0.98,
      message: `I have prepared your digital **Bonafide Certificate Application** for **${purpose}**. Once approved by the Academic Affairs Cell, you will receive a tamper-evident digital certificate with a verification QR code.`,
      cards: [card],
      quickReplies: [
        'How long does bonafide approval take?',
        'Where can I download issued documents?',
        'Check my request status',
      ],
    };
  }

  private static handleLeaveAction(text: string, lower: string, user: AuthUser): CopilotResponse {
    const today = new Date();
    const startDate = new Date(today.getTime() + 24 * 3600000).toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 4 * 24 * 3600000).toISOString().split('T')[0];

    const card: CopilotCard = {
      cardType: 'ACTION_LEAVE',
      title: 'Hostel Outstation Leave Application',
      data: {
        startDate,
        endDate,
        reason: text,
        emergencyContact: 'Parent / Guardian (+91 9876543210)',
        parentConsent: true,
        hostelBlock: user.hostelBlock || 'Block B',
      },
    };

    return {
      intent: 'APPLY_HOSTEL_LEAVE',
      category: 'Hostel',
      confidence: 0.98,
      message: `I have drafted your **Hostel Leave Application**. Please verify the travel dates and ensure parental consent is confirmed prior to warden submission.`,
      cards: [card],
      quickReplies: ['Check my pending requests', 'Apply for a gate pass'],
    };
  }

  private static handleGatePassAction(text: string, lower: string, user: AuthUser): CopilotResponse {
    const now = new Date();
    const departureTime = new Date(now.getTime() + 30 * 60000).toISOString();
    const expectedReturnTime = new Date(now.getTime() + 4 * 3600000).toISOString();

    let destination = 'Local Market (Jayadev Vihar)';
    if (lower.includes('station') || lower.includes('railway')) destination = 'Bhubaneswar Railway Station';
    else if (lower.includes('hospital') || lower.includes('clinic')) destination = 'Campus Health Center / City Clinic';
    else if (lower.includes('coaching') || lower.includes('library')) destination = 'City Central Library';

    const card: CopilotCard = {
      cardType: 'ACTION_GATE_PASS',
      title: 'Digital Gate Pass Request',
      data: {
        destination,
        reason: text,
        departureTime,
        expectedReturnTime,
        curfewNotice: 'Return required before 8:30 PM curfew (7:30 PM for 1st Year).',
      },
    };

    return {
      intent: 'CREATE_GATE_PASS',
      category: 'Security',
      confidence: 0.98,
      message: `I have prepared a **Campus Exit Gate Pass** for **${destination}**. Once authorized, a dynamic QR code and 4-digit verification PIN will be generated for main gate security scanning.`,
      cards: [card],
      quickReplies: ['Check my gate pass status', 'Apply for hostel leave', 'When is the hostel curfew?'],
    };
  }

  private static handleStudyPlan(
    text: string,
    lower: string,
    user: AuthUser,
    multiTurnContext?: any
  ): CopilotResponse {
    let subject = 'Database Management Systems';
    let subjectCode = 'CS204';

    if (multiTurnContext?.subject && multiTurnContext?.subjectCode) {
      subject = multiTurnContext.subject;
      subjectCode = multiTurnContext.subjectCode;
    } else if (lower.includes('os') || lower.includes('operating')) {
      subject = 'Operating Systems';
      subjectCode = 'CS202';
    } else if (lower.includes('digital') || lower.includes('electronics')) {
      subject = 'Digital Electronics';
      subjectCode = 'EC201';
    } else if (lower.includes('dsa') || lower.includes('data structure') || lower.includes('algorithm')) {
      subject = 'Data Structures & Algorithms';
      subjectCode = 'CS201';
    } else if (lower.includes('network') || lower.includes('cn')) {
      subject = 'Computer Networks';
      subjectCode = 'CS301';
    }

    const days = multiTurnContext?.detectedDays || 10;
    const hours = multiTurnContext?.detectedHours || 3;
    const weakness = multiTurnContext?.detectedWeakness;

    const plan = this.generateStructuredStudyPlan(subject, subjectCode, days, hours, weakness);

    const relatedResources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === subjectCode);

    const planCard: CopilotCard = {
      cardType: 'STUDY_PLAN',
      title: `${days}-Day ${subject} High-Yield Roadmap`,
      data: {
        subject,
        subjectCode,
        days,
        hoursPerDay: hours,
        totalHours: days * hours,
        weaknessFocus: weakness,
        plan,
      },
    };

    const cards: CopilotCard[] = [planCard];
    if (relatedResources.length > 0) {
      cards.push({
        cardType: 'RESOURCE_LIST',
        title: `Official BPUT Resources for ${subjectCode}`,
        data: {
          subjectCode,
          resources: relatedResources,
        },
      });
    }

    const message = `Here is your customized **${days}-day study roadmap for ${subject}** (${subjectCode}) at **${hours} hours/day** (Total: **${days * hours} hours**)${
      weakness ? ` with specialized priority on **${weakness}**` : ''
    }.\n\nThis roadmap is organized into 4 strategic phases:\n1. **Core Foundation & Concepts**\n2. **High-Yield Deep Dive**\n3. **BPUT Previous Year Questions (PYQs)**\n4. **Final Rapid Revision & Formula Sheets**\n\nYou can click on each day in the interactive roadmap card below to inspect topics and practice questions:`;

    return {
      intent: 'STUDY_PLAN',
      category: 'Academic',
      confidence: 0.98,
      message,
      cards,
      quickReplies: [
        'Find BPUT PYQs for DBMS',
        'How can I get a 9+ CGPA?',
        'What is my current attendance?',
      ],
    };
  }

  private static handleResourceSearch(text: string, lower: string, user: AuthUser): CopilotResponse {
    let resources = VERIFIED_CAMPUS_RESOURCES;

    let subjectCode = 'CS204';
    let subjectName = 'Database Management Systems';

    if (lower.includes('os') || lower.includes('operating')) {
      subjectCode = 'CS202';
      subjectName = 'Operating Systems';
    } else if (lower.includes('digital') || lower.includes('electronics')) {
      subjectCode = 'EC201';
      subjectName = 'Digital Electronics';
    } else if (lower.includes('dsa') || lower.includes('data structure') || lower.includes('algorithm')) {
      subjectCode = 'CS201';
      subjectName = 'Data Structures & Algorithms';
    } else if (lower.includes('network') || lower.includes('cn')) {
      subjectCode = 'CS301';
      subjectName = 'Computer Networks';
    }

    const filtered = resources.filter((r) => r.subjectCode === subjectCode);

    const card: CopilotCard = {
      cardType: 'RESOURCE_LIST',
      title: `Verified University Resources: ${subjectName} (${subjectCode})`,
      data: {
        subjectCode,
        subjectName,
        resources: filtered,
      },
    };

    const rows = filtered
      .map(
        (r) =>
          `• **${r.title}** [${r.type}]\n  - Topics: ${r.keyTopics?.join(', ') || 'Core Syllabus'}\n  - Official Origin: *${r.semester}th Semester / ${r.year || 2024}*`
      )
      .join('\n');

    const message = `I found **${filtered.length} verified university resources** for **${subjectName}** (${subjectCode}):\n\n${rows}\n\nYou can access or download these verified BPUT question papers and faculty lecture notes from the card below:`;

    return {
      intent: 'RESOURCE_SEARCH',
      category: 'Academic',
      confidence: 0.98,
      message,
      cards: [card],
      quickReplies: [
        'Generate a 10-day DBMS study plan',
        'How can I get a 9+ CGPA?',
        'What classes do I have today?',
      ],
    };
  }

  private static async handleCampusStatus(user: AuthUser): Promise<CopilotResponse> {
    let recentRequestsCount = 0;
    try {
      recentRequestsCount = await prisma.request.count({
        where: { requesterId: user.id },
      });
    } catch {}

    return {
      intent: 'CAMPUS_STATUS',
      category: 'General',
      confidence: 0.9,
      message: `Here is your current student status overview for **${user.fullName || user.username}** (Roll: ${user.rollNumber || '220101048'}):\n• **Hostel**: ${user.hostelBlock || 'Block B'} / Room ${user.roomNumber || '204'}\n• **Academic Cohort**: ${user.branch || 'CSE'} — Year ${user.year || 2}\n• **Submitted Requests**: ${recentRequestsCount} total campus requests on record.\n• **Operational Standing**: Active Semester — Good Standing.\n\nYou can click any quick action below to check live records or plan your week.`,
      cards: [],
      quickReplies: [
        'What is my current attendance?',
        'What classes do I have today?',
        'What is the status of my bonafide application?',
        'How can I get a 9+ CGPA?',
      ],
    };
  }

  private static handleGeneralAi(text: string, lower: string, user: AuthUser): CopilotResponse {
    let message = '';
    if (lower.includes('deadlock')) {
      message = `### 🖥️ How Operating Systems Handle Deadlocks

A **deadlock** is a state where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process in the set.

#### The Four Necessary Coffman Conditions:
1. **Mutual Exclusion**: Non-shareable resource.
2. **Hold and Wait**: Process holding resources while requesting others.
3. **No Preemption**: Resources cannot be forcibly revoked.
4. **Circular Wait**: Closed chain of processes waiting on each other.

#### Handling Strategies:
1. **Deadlock Prevention**: Structurally eliminate at least one of the 4 Coffman conditions.
2. **Deadlock Avoidance**: Dynamically inspect resource allocation state using algorithms like **Dijkstra's Banker's Algorithm**.
3. **Detection and Recovery**: Periodic resource allocation graph cycle detection with process termination or resource preemption.
4. **Ostrich Algorithm**: Ignore the issue (standard in general-purpose desktop OS like Unix/Windows where deadlocks are rare).`;
    } else {
      message = `### 💡 Academic & Conceptual Assistance

I'm ready to assist you with conceptual explanations, academic writing, mathematical proofs, or engineering problem-solving.

Please feel free to ask your specific question or provide the topic you would like me to unpack.`;
    }

    return {
      intent: 'GENERAL_AI',
      category: 'General',
      confidence: 0.92,
      message,
      cards: [],
      quickReplies: [
        'How can I get a 9+ CGPA?',
        'Explain recursion in C++',
        'Generate a 10-day DBMS study plan',
      ],
    };
  }

  private static handleFallback(rawText: string, lower: string, user: AuthUser): CopilotResponse {
    return {
      intent: 'FALLBACK',
      confidence: 0.85,
      message: `I understand you are asking about: *"_ ${rawText} _"*. 

As your **Nexora Campus Copilot**, I specialize in three core areas:
1. **Academic Excellence & Tutoring**: Conceptual explanations, 9+ CGPA exam blueprints, study schedules, and programming/DSA problem-solving.
2. **Campus Records & Policies**: Live attendance tracking (with 75% margin calculation), today's class routine, academic deadlines, and official BPUT rules.
3. **Workflow Automation**: One-click creation and tracking for room repairs, bonafide certificates, hostel leave, and gate passes.

If you have a general academic question, feel free to elaborate or rephrase it. Or choose one of the quick options below:`,
      cards: [],
      quickReplies: [
        'How can I get a 9+ CGPA?',
        'What is my current attendance?',
        'What classes do I have today?',
        'What is the status of my bonafide application?',
        'Generate a 10-day DBMS study plan',
        'Find BPUT PYQs',
      ],
    };
  }

  // =========================================================================
  // HELPER METHODS & STUDY PLAN GENERATOR
  // =========================================================================

  private static findMatchingProcedure(lower: string): CampusProcedure | undefined {
    return VERIFIED_CAMPUS_PROCEDURES.find((p) => {
      if (lower.includes(p.title.toLowerCase())) return true;
      return p.keywords.some((k) => lower.includes(k.toLowerCase()));
    });
  }

  public static generateStructuredStudyPlan(
    subject: string,
    subjectCode: string,
    days: number,
    hoursPerDay: number,
    weakness?: string
  ): any[] {
    const defaultTopics: Record<string, string[]> = {
      CS204: [
        'ER Modeling, Relational Algebra & Calculus',
        'SQL Queries, Nested Queries, Joins, Triggers',
        'Functional Dependencies & Normalization (1NF, 2NF, 3NF, BCNF)',
        'Multi-valued Dependencies & 4NF/5NF',
        'Transaction Processing, ACID Properties, Schedules',
        'Concurrency Control Protocols (2PL, Timestamp Ordering)',
        'Deadlock Prevention & Recovery in DBMS',
        'Indexing: B-Trees and B+ Trees Architecture',
        'Query Processing & Optimization Cost Metrics',
        'Crash Recovery & Write-Ahead Logging (WAL)',
      ],
      CS202: [
        'OS Architecture, System Calls & Dual Mode',
        'Process State Diagram, PCB & Context Switching',
        'CPU Scheduling: FCFS, SJF, Round Robin, Multilevel Queue',
        'Process Synchronization, Race Conditions & Peterson Solution',
        'Semaphores, Mutexes & Classic Synchronization Problems',
        'Deadlock: 4 Conditions, Banker Algorithm, Prevention',
        'Memory Management: Paging, Segmentation, TLB Misses',
        'Virtual Memory: Page Replacement (FIFO, LRU, Optimal)',
        'Disk Scheduling: FCFS, SCAN, C-SCAN, LOOK',
        'File Systems, Inodes & Directory Allocation Methods',
      ],
    };

    const pool = defaultTopics[subjectCode] || [
      'Fundamental Principles & Core Definitions',
      'Mathematical Formulations & Architectural Models',
      'Analytical Numerical Problems & Step-by-Step Derivations',
      'Advanced Practical Applications & Case Studies',
      'Frequently Repeated BPUT PYQ Long-Answer Questions',
      'Module 1 & 2 Synthesis & Self-Assessment Test',
      'Module 3 & 4 Analytical Problem Set',
      'High-Yield Theory Modules & Flowchart Memorization',
      'Previous Year BPUT Exam Timed Simulation',
      'Final Formula Sheet & Rapid Definition Re-cap',
    ];

    const plan: any[] = [];
    for (let i = 1; i <= days; i++) {
      let phase = 'Core Foundation & Concepts';
      let taskType = 'FOUNDATION';
      if (i > days * 0.75) {
        phase = 'Final Rapid Revision & Formula Sheets';
        taskType = 'REVISION';
      } else if (i > days * 0.5) {
        phase = 'BPUT Previous Year Questions (PYQs)';
        taskType = 'PYQ_PRACTICE';
      } else if (i > days * 0.25) {
        phase = 'High-Yield Deep Dive';
        taskType = 'DEEP_DIVE';
      }

      const topicIndex = (i - 1) % pool.length;
      let topic = pool[topicIndex];
      if (weakness && i === 2) {
        topic = `Priority Focus: ${weakness} (Foundations and Mechanics)`;
      } else if (weakness && i === Math.ceil(days / 2)) {
        topic = `Advanced Practice: ${weakness} (Past Exam Numerical Problems)`;
      }

      plan.push({
        dayNumber: i,
        day: i,
        phase,
        taskType,
        hours: hoursPerDay,
        focus: topic,
        topic,
        tasks: `Devote ${hoursPerDay} hours to mastering ${topic}. Solve at least 3 numerical derivations and summarize bullet notes.`,
        topics: [topic, 'BPUT PYQ Verification', 'Formula Cheat-Sheet Note'],
      });
    }

    return plan;
  }

  private static enrichGeminiResponse(
    geminiRes: CopilotResponse,
    rawText: string,
    lower: string,
    user: AuthUser,
    multiTurnContext?: any
  ): CopilotResponse {
    if (!Array.isArray(geminiRes.cards)) {
      geminiRes.cards = [];
    }

    const enrichedCards = geminiRes.cards.map((card) => {
      if (!card || typeof card !== 'object') {
        return {
          cardType: 'RESOURCE_LIST' as const,
          title: 'Campus Resources',
          data: { resources: [] },
        };
      }

      if (card.cardType === 'STUDY_PLAN') {
        const subject =
          card.data?.subject || multiTurnContext?.subject || 'Database Management Systems';
        const subjectCode =
          card.data?.subjectCode || multiTurnContext?.subjectCode || 'CS204';
        const days = card.data?.days || multiTurnContext?.detectedDays || 10;
        const hoursPerDay = card.data?.hoursPerDay || multiTurnContext?.detectedHours || 3;
        let plan = card.data?.plan;

        if (!Array.isArray(plan) || plan.length === 0) {
          plan = this.generateStructuredStudyPlan(
            subject,
            subjectCode,
            days,
            hoursPerDay,
            multiTurnContext?.detectedWeakness
          );
        } else {
          plan = plan.map((p: any, idx: number) => ({
            dayNumber: p.dayNumber || idx + 1,
            focus: p.focus || `Day ${idx + 1} High-Yield Topic`,
            hours: p.hours || hoursPerDay,
            topics: Array.isArray(p.topics)
              ? p.topics
              : ['Core Theoretical Concepts', 'PYQ Practice'],
          }));
        }

        return {
          ...card,
          data: {
            subject,
            subjectCode,
            days,
            hoursPerDay,
            totalHours: days * hoursPerDay,
            plan,
          },
        };
      }

      if (card.cardType === 'RESOURCE_LIST') {
        let resources: any[] = [];
        if (Array.isArray(card.data?.resources)) {
          resources = card.data.resources;
        } else if (Array.isArray(card.data)) {
          resources = card.data;
        } else if (Array.isArray(card.data?.items)) {
          resources = card.data.items;
        }

        if (resources.length === 0) {
          if (lower.includes('dbms') || lower.includes('database')) {
            resources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'CS204');
          } else if (lower.includes('digital') || lower.includes('electronics')) {
            resources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'EC201');
          } else if (lower.includes('os') || lower.includes('operating')) {
            resources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'CS202');
          } else if (lower.includes('dsa') || lower.includes('data structure')) {
            resources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'CS201');
          } else {
            resources = VERIFIED_CAMPUS_RESOURCES.slice(0, 3);
          }
        }

        return {
          ...card,
          data: {
            resources,
          },
        };
      }

      if (card.cardType === 'GUIDE_PROCEDURE') {
        const d = card.data || {};
        return {
          ...card,
          data: {
            id: d.id || 'proc-guideline',
            title: d.title || card.title || 'Official Campus Procedure',
            category: d.category || 'General',
            department: d.department || 'Academic Affairs Cell',
            location: d.location || 'Administrative Block',
            turnaroundTime: d.turnaroundTime || '24 to 48 Hours',
            requiredDocuments: Array.isArray(d.requiredDocuments)
              ? d.requiredDocuments
              : ['Student ID Card', 'Official Application Form'],
            steps: Array.isArray(d.steps)
              ? d.steps
              : ['Submit digital application', 'Departmental verification', 'Receive official resolution'],
            actionButtonLabel: d.actionButtonLabel,
            notes: d.notes,
          },
        };
      }

      if (card.cardType === 'REQUEST_LIST') {
        const reqs = Array.isArray(card.data?.requests)
          ? card.data.requests
          : Array.isArray(card.data)
          ? card.data
          : [];
        return {
          ...card,
          data: {
            title: card.title || 'Submitted Campus Requests',
            requests: reqs.map((r: any) => ({
              id: r.id || 'req-id',
              requestNumber: r.requestNumber || 'NX-10001',
              title: r.title || 'Campus Request',
              status: r.status || 'SUBMITTED',
              type: r.type || 'REQUEST',
              createdAt: r.createdAt || new Date().toISOString(),
            })),
          },
        };
      }

      if (card.cardType === 'DEADLINE_LIST') {
        const dls = Array.isArray(card.data?.deadlines)
          ? card.data.deadlines
          : Array.isArray(card.data)
          ? card.data
          : [];
        return {
          ...card,
          data: {
            title: card.title || 'Upcoming Academic Deadlines',
            deadlines: dls.map((d: any) => ({
              id: d.id || 'dl-id',
              title: d.title || 'Academic Submission',
              description: d.description || 'Important institutional milestone',
              deadline: d.deadline || new Date().toISOString(),
              relatedForm: d.relatedForm,
              actionUrl: d.actionUrl || '/student/academics',
            })),
            notices: Array.isArray(card.data?.notices) ? card.data.notices : [],
          },
        };
      }

      if (card.cardType === 'ACTION_MAINTENANCE') {
        const d = card.data || {};
        return {
          ...card,
          data: {
            category: d.category || 'Electrical',
            priority: d.priority || 'NORMAL',
            title: d.title || 'Maintenance Request',
            description: d.description || rawText,
            location:
              d.location || `${user.hostelBlock || 'Hostel Block B'} - Room ${user.roomNumber || '204'}`,
          },
        };
      }

      if (card.cardType === 'ACTION_BONAFIDE') {
        const d = card.data || {};
        return {
          ...card,
          data: {
            purpose: d.purpose || 'Scholarship',
            studentName: d.studentName || user.fullName || user.username,
            rollNumber: d.rollNumber || user.rollNumber || '220101048',
            branch: d.branch || user.branch || 'CSE',
            year: d.year || user.year || 2,
          },
        };
      }

      if (card.cardType === 'ACTION_LEAVE') {
        const d = card.data || {};
        const today = new Date();
        return {
          ...card,
          data: {
            startDate:
              d.startDate || new Date(today.getTime() + 24 * 3600000).toISOString().split('T')[0],
            endDate:
              d.endDate || new Date(today.getTime() + 4 * 24 * 3600000).toISOString().split('T')[0],
            reason: d.reason || rawText || 'Home Visit',
            emergencyContact: d.emergencyContact || 'Parent (+91 9876543210)',
            parentConsent: d.parentConsent ?? true,
          },
        };
      }

      if (card.cardType === 'ACTION_GATE_PASS') {
        const d = card.data || {};
        const now = new Date();
        return {
          ...card,
          data: {
            destination: d.destination || 'Local Market (Jayadev Vihar)',
            reason: d.reason || rawText || 'Personal Outing',
            departureTime: d.departureTime || new Date(now.getTime() + 30 * 60000).toISOString(),
            expectedReturnTime:
              d.expectedReturnTime || new Date(now.getTime() + 4 * 3600000).toISOString(),
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
