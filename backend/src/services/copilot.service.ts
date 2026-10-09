import { VERIFIED_CAMPUS_PROCEDURES, CampusProcedure } from '../data/campusGuide.data';
import { VERIFIED_CAMPUS_RESOURCES, CampusResource } from '../data/campusResources.data';
import { VERIFIED_CAMPUS_KNOWLEDGE, searchCampusKnowledge, CampusKnowledgeItem } from '../data/campusKnowledge.data';
import { AuthUser } from '../types/auth';
import { GeminiService } from './gemini.service';
import { config } from '../config/env';
import prisma from '../config/prisma';

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
    | 'DEADLINE_LIST';
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

    // 0. Extract multi-turn context (subject, timeline, weak areas)
    const multiTurnContext = this.extractMultiTurnContext(history, text, lower);

    // 1. Detect inquiry domains
    const isAttendance = this.isAttendanceQuery(lower);
    const isTimetable = this.isTimetableQuery(lower, multiTurnContext);
    const isRequestTracking = this.isRequestTrackingIntent(lower);
    const isDeadlinesOrNotices = this.isDeadlinesNoticesIntent(lower);

    // 2. Pre-fetch real student telemetry from database if needed
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

    // 4a. Real-time Student Attendance Query
    if (isAttendance) {
      return await this.handleAttendanceQuery(user, lower, text);
    }

    // 4b. Real-time Student Timetable & Routine Query (or study timetable follow-up)
    if (isTimetable) {
      if (multiTurnContext.isExamStudyContext && (lower.includes('make') || lower.includes('plan') || lower.includes('create') || lower.includes('schedule'))) {
        return this.handleStudyPlan(text, lower, user, multiTurnContext);
      }
      return await this.handleTimetableQuery(user, lower);
    }

    // 4c. Real-time Student Request Tracking
    if (isRequestTracking) {
      return await this.handleRequestTracking(user, lower);
    }

    // 4d. Real-time Academic Deadlines & Published Notices
    if (isDeadlinesOrNotices) {
      return await this.handleDeadlinesAndNotices(user, lower);
    }

    // 4e. Actionable Workflow Intents (SOLVE)
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

    // 4f. Structured Study Plan Requests (PLAN)
    if (this.isStudyPlanIntent(lower) || (multiTurnContext.isExamStudyContext && (multiTurnContext.detectedDays || multiTurnContext.detectedWeakness))) {
      return this.handleStudyPlan(text, lower, user, multiTurnContext);
    }

    // 4g. Resource / PYQ / Notes Search
    if (this.isResourceSearchIntent(lower)) {
      return this.handleResourceSearch(text, lower, user);
    }

    // 4h. Conversational Follow-ups & Greetings
    if (this.isConversationalFollowUp(lower, history)) {
      return this.handleConversational(text, lower, user, history, multiTurnContext);
    }

    // 4i. General Academic Advice & 9+ CGPA Strategy
    if (this.isGeneralAcademicIntent(lower)) {
      return this.handleGeneralAcademicAdvice(text, lower, user, history);
    }

    // 4j. Programming & Coding Assistance
    if (this.isProgrammingIntent(lower)) {
      return this.handleProgrammingHelp(text, lower, user);
    }

    // 4k. Career Guidance & Placement Preparation
    if (this.isCareerGuidanceIntent(lower)) {
      return this.handleCareerGuidance(text, lower, user);
    }

    // 4l. Verified Campus Procedures (ASK - CAMPUS GUIDE)
    const matchedProcedure = this.findMatchingProcedure(lower);
    if (matchedProcedure) {
      return this.handleGuideProcedure(matchedProcedure, user);
    }

    // 4m. Verified Campus Knowledge & Policy Queries (RAG)
    const campusKnowledge = this.handleCampusKnowledge(lower, user);
    if (campusKnowledge) {
      return campusKnowledge;
    }

    // 4n. General Student Status Query
    if (this.isCampusStatusIntent(lower)) {
      return await this.handleCampusStatus(user);
    }

    // 4o. General AI queries (knowledge, writing, reasoning)
    if (this.isGeneralAiIntent(lower, text)) {
      return this.handleGeneralAi(text, lower, user);
    }

    // 4p. Zero-hallucination helpful fallback
    return this.handleFallback(text, lower, user);
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

    // Scan history backwards to extract ongoing context
    const allTurns = [...history.map((h) => h.content), currentText];
    const fullText = allTurns.join(' ').toLowerCase();

    // Check if subject is mentioned in dialogue
    if (fullText.includes('dbms') || fullText.includes('database')) {
      subject = 'Database Management Systems';
      subjectCode = 'CS204';
      isExamStudyContext = true;
    } else if (fullText.includes('os') || fullText.includes('operating system')) {
      subject = 'Operating Systems';
      subjectCode = 'CS202';
      isExamStudyContext = true;
    } else if (fullText.includes('dsa') || fullText.includes('data structure') || fullText.includes('algorithm')) {
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

    if (fullText.includes('exam') || fullText.includes('prepare') || fullText.includes('study plan') || fullText.includes('revision')) {
      isExamStudyContext = true;
    }

    // Check for days extraction from current turn or recent turns
    const daysMatch = currentText.match(/(\d+)[-\s]*(?:days?|day)/i) || fullText.match(/(\d+)[-\s]*(?:days?|day)/i);
    if (daysMatch) {
      detectedDays = parseInt(daysMatch[1], 10);
    }

    // Check for hours extraction
    const hoursMatch = currentText.match(/(\d+)[-\s]*(?:hours?|hrs?|h)\s*(?:per|\/|a)?\s*day/i) || fullText.match(/(\d+)[-\s]*(?:hours?|hrs?|h)\s*(?:per|\/|a)?\s*day/i);
    if (hoursMatch) {
      detectedHours = parseInt(hoursMatch[1], 10);
    }

    // Check for weakness mention
    const weaknessMatch =
      currentText.match(/(?:weak in|struggling with|difficult(?:y)? in|need help with|focus on)\s+([a-zA-Z\s]+?)(?:\.|$|,)/i) ||
      fullText.match(/(?:weak in|struggling with|difficult(?:y)? in|need help with|focus on)\s+([a-zA-Z\s]+?)(?:\.|$|,)/i);
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
    // If student is in an exam prep context and says "make my timetable", that's a study roadmap
    if (
      multiTurnContext?.isExamStudyContext &&
      (text.includes('timetable') || text.includes('schedule')) &&
      (text.includes('make') || text.includes('plan') || text.includes('create') || text.includes('now'))
    ) {
      return true; // handled inside processMessage to route to study plan
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
      (text.includes('status') && (text.includes('request') || text.includes('application') || text.includes('ticket') || text.includes('bonafide') || text.includes('complaint') || text.includes('leave') || text.includes('pass'))) ||
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
      (text.includes('operating system') && (text.includes('explain') || text.includes('how') || text.includes('what') || text.includes('concept')))
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
  // DETERMINISTIC HANDLERS (REAL DATABASE TELEMETRY & WORKFLOWS)
  // =========================================================================

  /**
   * Fetches real-time attendance standing directly from Prisma for the authenticated student.
   * Supports subject-specific attendance queries (e.g. "What is my current DBMS attendance?").
   */
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
          message: `No published attendance sessions were found for **${student.fullName}** (Roll: **${student.rollNumber}**) in the active semester database.\n\nAttendance records are updated weekly by subject faculty coordinators following completed lectures and practical labs. If classes have commenced, please consult your department academic coordinator or the Academic Affairs Cell.`,
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

        subjectSpecificSection = `### Focus Subject: **${matchedSubject.name}** (${matchedSubject.code})\n- **Standing**: **${matchedSubject.present} / ${matchedSubject.total}** classes (**${matchedSubject.percentage}%**)\n- **Status**: ${matchedSubject.isAbove ? '✅ Eligible (>= 75%)' : '⚠️ Shortage (< 75%)'}\n- ${subMarginNote}\n\n---\n`;
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
        .join('\n');

      const message = `${subjectSpecificSection}Here is your verified, real-time attendance telemetry for **${student.fullName}** (Roll: **${student.rollNumber}**):

### Overall Attendance: **${overallPercentage}%** (${totalPresent} / ${totalClasses} classes attended)
- **Status**: ${isOverallAbove ? '✅ **Exam Eligible (>= 75%)**' : '🚨 **Shortage Alert (< 75%)**'}
- ${marginNote}

#### Subject-Wise Breakdown:
${rows}

> **BPUT Academic Regulation**: Minimum 75% attendance is compulsory in each course for end-semester admit card generation. Condonation up to 65% is only admissible on certified medical grounds.`;

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

  /**
   * Fetches real-time daily routine and timetable from Prisma.
   */
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

      // Check if user specified a day of the week
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
          message: `You have **no scheduled lectures for ${targetDay}**.\n\nUse this time for assignment submissions, project development, or structured exam revision. You can explore verified university question papers and notes below.`,
          cards: [],
          quickReplies: ['Check my attendance standing', 'Find BPUT PYQs', 'Plan my upcoming exams'],
        };
      }

      const classList = classes
        .map(
          (c, idx) =>
            `${idx + 1}. **${c.startTime} – ${c.endTime}** | **${c.subject.name}** (${c.subject.code})\n   • Room: **${c.room || 'LH-101'}** • Faculty: ${c.faculty || 'Department Faculty'}`
        )
        .join('\n');

      const message = `Here is your scheduled timetable for **${targetDay}** — ${student.branch.code} Year ${student.year}:\n\n${classList}\n\n> **Reminder**: Please report 5 minutes prior to period commencement. Attendance is recorded digitally at the start of each lecture.`;

      return {
        intent: 'TIMETABLE_QUERY',
        category: 'Academic',
        confidence: 0.98,
        message,
        cards: [],
        quickReplies: ['Check my attendance standing', 'Find BPUT PYQs', 'Plan my upcoming exams'],
      };
    } catch (err) {
      console.error('[Copilot] Timetable query error:', err);
      return {
        intent: 'TIMETABLE_QUERY',
        category: 'Academic',
        confidence: 0.8,
        message: "Unable to retrieve today's timetable from the campus database. Please review the Academic Hub routine tab.",
        cards: [],
      };
    }
  }

  /**
   * Real-time Student Request Tracking (Complaints, Bonafides, Leaves, Gate Passes).
   */
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

      // Filter by subcategory if student specifically asked about bonafide or complaint
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
          if (r.status === 'APPROVED' || r.status === 'CONFIRMED' || r.status === 'RESOLVED') badge = '✅ ' + r.status;
          else if (r.status === 'REJECTED' || r.status === 'CANCELLED') badge = '❌ ' + r.status;
          else if (r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS') badge = '🔧 ' + r.status;

          const dateStr = new Date(r.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return `• **[${r.requestNumber}]** ${r.title}\n  - **Status**: \`${r.status}\` (${badge}) • Submitted: ${dateStr}`;
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
        message: 'Unable to access your request records from the database right now. Please check **My Requests** in the navigation bar.',
        cards: [],
      };
    }
  }

  /**
   * Real-time Academic Deadlines & Campus Notices from Prisma.
   */
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
              year: 'numeric',
            });
            return `• **${d.title}**: Due by **${dateStr}**\n  - ${d.description} ([Action Link](${d.actionUrl || '/student/academics'}))`;
          })
          .join('\n');
        deadlineSection = `### 📅 Upcoming Academic Deadlines\n${rows}\n\n`;
      } else {
        deadlineSection = `### 📅 Academic Deadlines\nNo pending academic submission deadlines are registered for this week.\n\n`;
      }

      let noticeSection = '';
      if (notices.length > 0) {
        const rows = notices
          .map((n) => {
            const dateStr = new Date(n.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            return `• **${n.title}** (${dateStr}) — *${n.priority} Priority*\n  - ${n.content}`;
          })
          .join('\n');
        noticeSection = `### 📢 Official Campus Notices\n${rows}`;
      }

      const message = `${deadlineSection}${noticeSection}\n\n> Verified directly from the Academic Affairs Cell notice board.`;

      const cardData = {
        title: 'Active Deadlines & Circulars',
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
          content: n.content,
          publishedAt: n.publishedAt,
        })),
      };

      return {
        intent: 'DEADLINES_NOTICES',
        category: 'Academic',
        confidence: 0.98,
        message,
        cards: [
          {
            cardType: 'DEADLINE_LIST',
            title: 'Academic Deadlines & Notices',
            data: cardData,
          },
        ],
        quickReplies: [
          'What classes do I have today?',
          'Check my attendance standing',
          'Plan my upcoming exams',
        ],
      };
    } catch (err) {
      console.error('[Copilot] Error retrieving deadlines:', err);
      return {
        intent: 'DEADLINES_NOTICES',
        category: 'Academic',
        confidence: 0.8,
        message: 'Could not load official academic deadlines from the campus notice board right now.',
        cards: [],
      };
    }
  }

  /**
   * Builds factual telemetry context string for Gemini prompt injection.
   */
  private static async getTelemetryContext(
    user: AuthUser,
    isAttendance: boolean,
    isTimetable: boolean,
    isRequestTracking: boolean,
    isDeadlines: boolean,
    lower: string
  ): Promise<string> {
    let result = '';

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

    if (!student) return '';

    // Attendance telemetry
    if (isAttendance || true) {
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
    }

    // Timetable telemetry
    if (isTimetable || true) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const dayUpper = today.toUpperCase();
      const entries = await prisma.timetableEntry.findMany({
        where: { branchId: student.branchId, year: student.year, day: dayUpper },
        include: { subject: true },
        orderBy: { startTime: 'asc' },
      });
      if (entries.length > 0) {
        const cls = entries.map((e) => `${e.startTime}-${e.endTime} ${e.subject.name} (${e.subject.code}) in Room ${e.room}`);
        result += `TODAY'S SCHEDULE (${today}): ${cls.join('; ')}.\n`;
      } else {
        result += `TODAY'S SCHEDULE (${today}): No lectures scheduled today.\n`;
      }
    }

    // Requests telemetry
    try {
      const recentReqs = await prisma.request.findMany({
        where: { requesterId: user.id },
        include: { requestType: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      if (recentReqs.length > 0) {
        const reqStr = recentReqs.map((r) => `[${r.requestNumber}] ${r.title} (Type: ${r.requestType.code}, Status: ${r.status})`).join('; ');
        result += `SUBMITTED REQUESTS: ${reqStr}.\n`;
      }
    } catch {}

    // Deadlines telemetry
    try {
      const deadlines = await prisma.academicDeadline.findMany({
        where: { isActive: true },
        orderBy: { deadline: 'asc' },
        take: 3,
      });
      if (deadlines.length > 0) {
        const dStr = deadlines.map((d) => `${d.title} (Due: ${new Date(d.deadline).toISOString().split('T')[0]})`).join('; ');
        result += `UPCOMING DEADLINES: ${dStr}.\n`;
      }
    } catch {}

    return result;
  }

  // =========================================================================
  // GENERAL ACADEMIC, PROGRAMMING & CAREER GUIDANCE HANDLERS
  // =========================================================================

  /**
   * Comprehensive, realistic 9+ CGPA and academic strategy engine.
   */
  private static handleGeneralAcademicAdvice(
    rawText: string,
    lower: string,
    user: AuthUser,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): CopilotResponse {
    const isCgpaQuery =
      lower.includes('9 cgpa') ||
      lower.includes('9+') ||
      lower.includes('cgpa') ||
      lower.includes('sgpa') ||
      lower.includes('topper') ||
      lower.includes('high marks') ||
      lower.includes('improve grade');

    if (isCgpaQuery) {
      const message = `Here is the verified, tactical blueprint to achieve a **9+ CGPA in Engineering (BPUT)**:

### 1. Master Internal Assessment (30% Weightage)
• In BPUT, every theory paper has **30 internal marks** (Mid-term tests + Quizzes/Assignments + Attendance) and **70 end-semester marks**.
• **The Golden Formula**: Aim for **27–29 / 30 in internals**.
• *Why this matters*: If you secure 28/30 in internals, you only need **52/70 in the end-semester exam** to hit 80% total (**'E' Grade = 9.0 Grade Points**), and **62/70** for an **'O' Grade (10.0 Points)**. Skipping internals forces you to get near-impossible scores on external exams.

### 2. Leverage BPUT Past 5-Year Question Papers (PYQs)
• BPUT university question setting heavily re-uses standard question templates and derivations. **60% to 70%** of core questions repeat every 3–4 years.
• Solve the last 5 years' papers under 3-hour exam conditions.
• Prioritize standard 7-mark and 10-mark long questions that recur annually.

### 3. The 4+1 Module Rule
• The university syllabus for each subject is divided into 5 modules.
• Thoroughly master **4 modules at 100% depth** to comfortably answer all compulsory and optional section questions.
• Prepare at least the core definitions and 2-mark question formulas for the remaining 1 module.

### 4. Technical Answer Sheet Architecture
• Evaluators grade hundreds of physical answer scripts. Presentation directly impacts marks:
  - **Diagrams First**: Draw clean block diagrams, flowcharts, circuit schematics, or ER diagrams for every long answer.
  - **Structured Steps**: Use bullet points and bold technical terms rather than dense paragraphs.
  - **Box Final Answers**: Box numerical results clearly with appropriate units.

### 5. Never Treat Practical Labs as Optional
• Laboratory and sessional courses carry 1.5–2 credits each and are evaluated internally.
• Regular attendance, prompt lab record submissions, and crisp viva answers almost always yield **9 or 10 grade points**, significantly boosting your SGPA.

### 6. Daily 90-Minute Habit
• Dedicate 90 minutes each evening to revise that day's lecture topics and solve 2 numericals. Consistent small efforts eliminate pre-exam panic.`;

      return {
        intent: 'GENERAL_ACADEMIC',
        category: 'Academic Strategy',
        confidence: 0.98,
        message,
        cards: [],
        quickReplies: [
          'Generate a 10-day DBMS study plan',
          'Find BPUT PYQs',
          'Check my attendance standing',
          'Explain BPUT grading formula',
        ],
      };
    }

    // Study methods & productivity
    if (lower.includes('how to study') || lower.includes('study tips') || lower.includes('pomodoro') || lower.includes('active recall')) {
      const message = `Here is a high-retention engineering study system:

1. **Active Recall over Passive Reading**: Close your notes and write out key algorithms, formulas, and definitions from memory. Testing yourself is 3x more effective than re-reading.
2. **The Pomodoro Technique (50/10)**: Study with absolute focus for 50 minutes, then take a strict 10-minute break away from screens. Complete 3–4 cycles daily.
3. **The Feynman Technique**: Explain complex engineering concepts (like virtual memory or BCNF decomposition) as if you were teaching a junior student. Identify gaps where your explanation stumbles.
4. **Formula & Diagram Sheets**: Maintain a single sheet of core derivations, theorems, and state diagrams for quick review before exams.`;

      return {
        intent: 'GENERAL_ACADEMIC',
        category: 'Study Skills',
        confidence: 0.95,
        message,
        cards: [],
        quickReplies: ['Plan my upcoming exams', 'Find BPUT PYQs', 'How can I get a 9+ CGPA?'],
      };
    }

    // BPUT Grading Formula & Scale
    if (lower.includes('formula') || lower.includes('calculate cgpa') || lower.includes('percentage') || lower.includes('grading system')) {
      const k = VERIFIED_CAMPUS_KNOWLEDGE.find((item) => item.id === 'bput-grading-system');
      return {
        intent: 'GENERAL_ACADEMIC',
        category: 'Grading Rules',
        confidence: 0.98,
        message: k?.content || 'BPUT follows a 10-point scale: O (10), E (9), A (8), B (7), C (6), D (5), F (0). Formula: Percentage = (CGPA - 0.5) * 10.',
        cards: [],
        quickReplies: ['How can I get a 9+ CGPA?', 'Check my attendance standing', 'Find BPUT PYQs'],
      };
    }

    // General academic fallback
    return {
      intent: 'GENERAL_ACADEMIC',
      category: 'Academic Guidance',
      confidence: 0.92,
      message: `Here is actionable academic guidance for your engineering coursework:

• **Clarify Core Fundamentals**: Technical subjects build sequentially. Ensure prerequisites (such as Discrete Mathematics for Algorithms or Digital Logic for Computer Architecture) are sound.
• **Solve Real Problems**: For analytical subjects, spend 70% of study time actively working through numericals, code implementations, or circuit problems.
• **Utilize Campus Resources**: Download verified university question papers and lecture notes directly through Nexora.
• **Target High Internals**: Complete quizzes, lab evaluations, and mid-semester exams diligently to build a solid grade foundation.

Would you like me to construct a structured study plan or find verified past question papers for any specific subject?`,
      cards: [],
      quickReplies: [
        'How can I get a 9+ CGPA?',
        'Generate a 10-day DBMS study plan',
        'Find BPUT PYQs',
        'Check my attendance standing',
      ],
    };
  }

  /**
   * Technical problem-solving and programming roadmap handler.
   */
  private static handleProgrammingHelp(rawText: string, lower: string, user: AuthUser): CopilotResponse {
    if (lower.includes('deadlock')) {
      return {
        intent: 'PROGRAMMING_HELP',
        category: 'Operating Systems',
        confidence: 0.98,
        message: `### How Operating Systems Handle Deadlocks

A **Deadlock** is an execution state where two or more processes are permanently blocked because each is holding a resource and waiting for another resource held by another process.

#### The 4 Necessary Coffman Conditions:
1. **Mutual Exclusion**: At least one resource is held in a non-shareable mode.
2. **Hold and Wait**: A process holds a resource while requesting others.
3. **No Preemption**: Resources cannot be forcibly taken from a process.
4. **Circular Wait**: A closed chain of processes exists where $P_0$ waits for $P_1$, and $P_n$ waits for $P_0$.

#### Core OS Deadlock Resolution Strategies:
1. **Deadlock Prevention**: Structurally eliminate at least one Coffman condition (e.g., impose total resource ordering).
2. **Deadlock Avoidance**: The OS verifies whether allocating a requested resource preserves a **Safe State** using **Banker's Algorithm**.
3. **Deadlock Detection & Recovery**: Periodically check for cycles in the Resource Allocation Graph (RAG) and terminate processes or preempt resources.
4. **Ostrich Algorithm**: Ignore the possibility of deadlocks for performance reasons (common in general-purpose OS kernels).`,
        cards: [],
        quickReplies: ["Explain Banker's Algorithm", 'Find OS PYQs', 'Process vs Thread'],
      };
    }

    if (lower.includes('process') && lower.includes('thread')) {
      return {
        intent: 'PROGRAMMING_HELP',
        category: 'Operating Systems',
        confidence: 0.98,
        message: `### Difference Between a Process and a Thread

| Dimension | Process | Thread (Lightweight Process) |
| :--- | :--- | :--- |
| **Memory** | Own independent address space & page tables | Shares code, data, and heap with parent process |
| **Context Switch** | Slower; requires flushing CPU caches & registers | Faster; only registers and program counter saved |
| **Isolation** | High; crash in one process does not affect others | Low; crash in one thread can terminate the whole process |
| **Communication** | IPC (Pipes, Sockets, Shared Memory) | Direct access to shared memory variables |`,
        cards: [],
        quickReplies: ['Explain Deadlocks in OS', 'CPU Scheduling Algorithms', 'Find OS PYQs'],
      };
    }

    if (lower.includes('recursion')) {
      return {
        intent: 'PROGRAMMING_HELP',
        category: 'Programming & DSA',
        confidence: 0.98,
        message: `### Understanding Recursion in Computer Science

Recursion occurs when a function calls itself to solve a smaller instance of the exact same problem until reaching a termination condition (**Base Case**).

#### The 3 Pillars of Every Recursive Function:
1. **Base Case**: The stopping condition that prevents infinite call-stack memory growth.
2. **Recursive Step**: The function calling itself with reduced input parameters.
3. **Work Done**: The calculation performed at the current frame before or after the recursive call.

\`\`\`cpp
// Classic Example: Factorial Calculation in C++
#include <iostream>

long long factorial(int n) {
    // 1. Base Case: 0! = 1 and 1! = 1
    if (n <= 1) return 1;
    
    // 2. Recursive Step: n! = n * (n - 1)!
    return n * factorial(n - 1);
}

int main() {
    std::cout << "5! = " << factorial(5) << std::endl; // Output: 120
    return 0;
}
\`\`\`

#### Key Mental Model: The Call Stack
Each recursive invocation pushes a stack frame containing local variables and return address. If recursion depth exceeds the stack limit, a **Stack Overflow** occurs. To optimize deep recursion, consider **Tail Call Optimization (TCO)** or iterative tabulation.`,
        cards: [],
        quickReplies: ['Learn Dynamic Programming', 'Time Complexity of Recursion', 'Find DSA PYQs'],
      };
    }

    if (lower.includes('dsa') || lower.includes('data structure') || lower.includes('algorithm')) {
      const k = VERIFIED_CAMPUS_KNOWLEDGE.find((item) => item.id === 'programming-dsa-guidance');
      return {
        intent: 'PROGRAMMING_HELP',
        category: 'Programming & DSA',
        confidence: 0.95,
        message:
          k?.content ||
          `Mastering Data Structures & Algorithms requires solving problems by patterns rather than memorizing code:\n\n1. **Arrays & Two Pointers**: Sliding Window, Prefix Sum.\n2. **Linear Structures**: Linked Lists, Stacks, Queues.\n3. **Trees & Graphs**: DFS, BFS, Dijkstra, Topological Sort.\n4. **Optimization**: Binary Search, Dynamic Programming.`,
        cards: [],
        quickReplies: ['Explain recursion in C++', 'Find DSA PYQs', 'Placement Preparation Tips'],
      };
    }

    return {
      intent: 'PROGRAMMING_HELP',
      category: 'Programming & DSA',
      confidence: 0.9,
      message: `Here is programming guidance for engineering problem-solving:

• **Break Down Problems**: Write out the algorithm in plain English or pseudo-code before writing syntax.
• **Check Edge Cases**: Empty arrays, single-element collections, overflow values, and null pointers.
• **Analyze Complexity**: Always state the Big-O Time and Auxiliary Space complexity of your solution.

What specific coding concept, language (C++, Java, Python), or algorithm would you like to explore?`,
      cards: [],
      quickReplies: ['Explain recursion in C++', 'Data Structures Roadmap', 'Placement Preparation Tips'],
    };
  }

  /**
   * Career guidance and placement preparation handler.
   */
  private static handleCareerGuidance(rawText: string, lower: string, user: AuthUser): CopilotResponse {
    const k = VERIFIED_CAMPUS_KNOWLEDGE.find((item) => item.id === 'placement-preparation-roadmap');
    return {
      intent: 'CAREER_GUIDANCE',
      category: 'Placement & Career',
      confidence: 0.96,
      message:
        k?.content ||
        `To prepare for campus placements:\n1. Maintain CGPA >= 7.0 with no backlogs.\n2. Practice 150+ DSA problems on LeetCode.\n3. Master core CS subjects (DBMS, OS, CN).\n4. Build 2 production-ready full-stack projects with live deployments.\n5. Practice aptitude tests weekly.`,
      cards: [],
      quickReplies: [
        'How can I get a 9+ CGPA?',
        'Data Structures Roadmap',
        'Find BPUT PYQs',
      ],
    };
  }

  /**
   * General AI reasoning for broad knowledge, writing, and explanations.
   */
  private static handleGeneralAi(text: string, lower: string, user: AuthUser): CopilotResponse {
    // Provide a well-structured, practical answer
    return {
      intent: 'GENERAL_AI',
      category: 'General',
      confidence: 0.92,
      message: `Here is a clear breakdown for **"${text}"**:

• **Core Concept**: When approaching complex engineering or academic topics, prioritize understanding the foundational principles before moving to specific implementations or formulas.
• **Practical Application**: Break the problem down into distinct, testable components. Apply first-principles thinking to verify each assumption.
• **Campus Integration**: You can connect this study effort to your semester coursework and access official lecture notes and question papers directly in Nexora.

Feel free to ask follow-up questions, request step-by-step mathematical derivations, or ask me to draft study schedules around this topic!`,
      cards: [],
      quickReplies: [
        'How can I get a 9+ CGPA?',
        'What classes do I have today?',
        'Plan my upcoming exams',
      ],
    };
  }

  /**
   * Verified Campus Knowledge Query Handler (RAG from verified policy database).
   */
  private static handleCampusKnowledge(lower: string, user: AuthUser): CopilotResponse | null {
    const matches = searchCampusKnowledge(lower, 1);
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

  /**
   * Conversational greetings and polite responses.
   */
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
        message: `Hello **${user.fullName || user.username}**! I am your **Nexora Copilot**.\n\nI can help you:\n• Check live **attendance percentages** & 75% bunk safety margins\n• Inspect your **timetable & class routine**\n• Plan multi-day **exam revision roadmaps** & download verified BPUT PYQs\n• Track submitted **bonafide certificates, leaves, & maintenance tickets**\n• Explain **BPUT regulations, grading formulas, and 9+ CGPA strategies**\n\nWhat would you like to focus on today?`,
        cards: [],
        quickReplies: [
          'How can I get a 9+ CGPA?',
          'What is my current attendance?',
          'What classes do I have today?',
          'Plan my upcoming exams',
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
    if (lower.includes('tap') || lower.includes('water') || lower.includes('leak') || lower.includes('flush') || lower.includes('drain')) {
      category = 'Plumbing';
    } else if (lower.includes('door') || lower.includes('window') || lower.includes('cupboard') || lower.includes('bed') || lower.includes('chair') || lower.includes('table')) {
      category = 'Carpentry';
    } else if (lower.includes('wifi') || lower.includes('internet') || lower.includes('lan')) {
      category = 'Network';
    } else if (lower.includes('clean') || lower.includes('dirty') || lower.includes('smell') || lower.includes('pest')) {
      category = 'Cleanliness';
    }

    let priority = 'NORMAL';
    if (lower.includes('spark') || lower.includes('urgent') || lower.includes('immediately') || lower.includes('heavy leak') || lower.includes('broken lock')) {
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

  private static handleBonafideAction(
    text: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    let purpose = 'Scholarship';
    if (lower.includes('passport')) purpose = 'Passport Application';
    else if (lower.includes('bank') || lower.includes('loan')) purpose = 'Bank Education Loan';
    else if (lower.includes('internship')) purpose = 'Summer Industrial Internship';
    else if (lower.includes('competition') || lower.includes('hackathon')) purpose = 'Technical Competition / Hackathon';

    const card: CopilotCard = {
      cardType: 'ACTION_BONAFIDE',
      title: 'Bonafide Certificate Application',
      data: {
        purpose,
        studentName: user.fullName || user.username,
        rollNumber: user.rollNumber || '220101048',
        branch: user.branch || 'Computer Science & Engineering',
        year: user.year || 2,
        turnaround: '24–48 Hours',
      },
    };

    return {
      intent: 'REQUEST_BONAFIDE',
      category: 'Documents',
      confidence: 0.98,
      message: `I have prepared your official **Bonafide Certificate Application** for **${purpose}**. Once submitted, it will be automatically routed to the Academic Affairs Cell for digital verification and signature.`,
      cards: [card],
      quickReplies: ['Check my pending requests', 'Check academic deadlines'],
    };
  }

  private static handleLeaveAction(
    text: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    const today = new Date();
    const startDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const card: CopilotCard = {
      cardType: 'ACTION_LEAVE',
      title: 'Hostel Leave Application',
      data: {
        startDate,
        endDate,
        reason: text.length > 5 ? text : 'Home Visit & Festival Travel',
        emergencyContact: 'Parent / Guardian (+91 9876543210)',
        hostelBlock: user.hostelBlock || 'Block B',
        roomNumber: user.roomNumber || '204',
        parentConsent: true,
      },
    };

    return {
      intent: 'APPLY_HOSTEL_LEAVE',
      category: 'Hostel',
      confidence: 0.98,
      message: `I have drafted your **Hostel Leave Application** starting from tomorrow. Please review the departure and return dates below, ensure your emergency contact is accurate, and confirm to submit for Warden endorsement.`,
      cards: [card],
      quickReplies: ['Check my pending requests', 'When is the hostel curfew?'],
    };
  }

  private static handleGatePassAction(
    text: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    let destination = 'Local Market (Jayadev Vihar)';
    if (lower.includes('library')) destination = 'BPUT Central Library / Reading Hall';
    else if (lower.includes('hospital') || lower.includes('clinic') || lower.includes('doctor')) destination = 'Campus Health Center / AIIMS Bhubaneswar';
    else if (lower.includes('mall') || lower.includes('central')) destination = 'Bhubaneswar Central / Esplanade';

    const now = new Date();
    const departure = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const returnTime = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

    const card: CopilotCard = {
      cardType: 'ACTION_GATE_PASS',
      title: 'Campus Exit Gate Pass',
      data: {
        destination,
        reason: text.length > 5 ? text : 'Personal Essential Outing',
        departureTime: departure,
        expectedReturnTime: returnTime,
        gate: 'Gate 1 (Main Academic Entrance)',
      },
    };

    return {
      intent: 'CREATE_GATE_PASS',
      category: 'Security',
      confidence: 0.98,
      message: `I have prepared your digital **Campus Exit Gate Pass** to **${destination}**. Confirming this will generate a cryptographically signed HMAC QR code and a 4-digit security PIN for gate verification.`,
      cards: [card],
      quickReplies: ['When is the hostel curfew?', 'Check my attendance standing'],
    };
  }

  private static handleGuideProcedure(
    proc: CampusProcedure,
    user: AuthUser
  ): CopilotResponse {
    const card: CopilotCard = {
      cardType: 'GUIDE_PROCEDURE',
      title: proc.title,
      data: {
        id: proc.id,
        category: proc.category,
        title: proc.title,
        department: proc.department,
        location: proc.location,
        turnaroundTime: proc.turnaroundTime,
        requiredDocuments: Array.isArray(proc.requiredDocuments) ? proc.requiredDocuments : [],
        steps: Array.isArray(proc.steps) ? proc.steps : [],
        notes: proc.notes,
        directActionIntent: proc.directActionIntent,
      },
    };

    return {
      intent: 'CAMPUS_GUIDE',
      category: proc.category,
      confidence: 0.98,
      message: `Here is the verified operating procedure for **${proc.title}** from the **${proc.department}**:\n\n• **Location**: ${proc.location}\n• **Turnaround Time**: ${proc.turnaroundTime}\n• **Key Requirements**: ${proc.requiredDocuments.join(', ')}\n\nFollow the step-by-step guidance below to complete this process smoothly.`,
      cards: [card],
      quickReplies: [
        'What is my current attendance?',
        'Plan my upcoming exams',
        'Find BPUT PYQs',
      ],
    };
  }

  private static handleStudyPlan(
    text: string,
    lower: string,
    user: AuthUser,
    multiTurnContext?: any
  ): CopilotResponse {
    let subject = multiTurnContext?.subject || 'Database Management Systems';
    let subjectCode = multiTurnContext?.subjectCode || 'CS204';
    let days = multiTurnContext?.detectedDays || 10;
    let hoursPerDay = multiTurnContext?.detectedHours || 3;

    if (lower.includes('os') || lower.includes('operating system')) {
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

    // Parse days if explicitly stated
    const dMatch = text.match(/(\d+)[-\s]*(?:days?|day)/i);
    if (dMatch) {
      const parsedDays = parseInt(dMatch[1], 10);
      if (parsedDays >= 1 && parsedDays <= 60) days = parsedDays;
    }

    // Parse hours if explicitly stated
    const hMatch = text.match(/(\d+)[-\s]*(?:hours?|hrs?|h)\s*(?:per|\/|a)?\s*day/i);
    if (hMatch) {
      const parsedHours = parseInt(hMatch[1], 10);
      if (parsedHours >= 1 && parsedHours <= 12) hoursPerDay = parsedHours;
    }

    const plan = this.generateStructuredStudyPlan(
      subject,
      subjectCode,
      days,
      hoursPerDay,
      multiTurnContext?.detectedWeakness
    );

    const relatedResources = VERIFIED_CAMPUS_RESOURCES.filter(
      (r) => r.subjectCode === subjectCode
    );

    const cards: CopilotCard[] = [
      {
        cardType: 'STUDY_PLAN',
        title: `${subject} Exam Roadmap`,
        data: {
          subject,
          subjectCode,
          days,
          hoursPerDay,
          totalHours: days * hoursPerDay,
          focusWeakness: multiTurnContext?.detectedWeakness,
          plan,
        },
      },
    ];

    if (relatedResources.length > 0) {
      cards.push({
        cardType: 'RESOURCE_LIST',
        title: `Verified ${subject} Materials`,
        data: {
          subject,
          subjectCode,
          resources: relatedResources,
        },
      });
    }

    const weaknessNote = multiTurnContext?.detectedWeakness
      ? `\n> 🎯 **Customized Focus**: Prioritizing your requested focus area: **${multiTurnContext.detectedWeakness}** in Phase 1 & 2.`
      : '';

    return {
      intent: 'STUDY_PLAN',
      category: 'Academic',
      confidence: 0.98,
      message: `I have generated a high-yield, **${days}-day academic study roadmap** for **${subject} (${subjectCode})** at **${hoursPerDay} hours/day** (${days * hoursPerDay} total study hours).${weaknessNote}\n\nThis roadmap is organized into progressive phases covering high-probability BPUT question patterns, theoretical derivations, and timed PYQ practice.`,
      cards,
      quickReplies: [
        'Find BPUT PYQs',
        'Check my attendance standing',
        'How can I get a 9+ CGPA?',
      ],
    };
  }

  private static handleResourceSearch(
    text: string,
    lower: string,
    user: AuthUser
  ): CopilotResponse {
    let subjectCode = 'CS204';
    let subjectName = 'Database Management Systems';

    if (lower.includes('os') || lower.includes('operating')) {
      subjectCode = 'CS202';
      subjectName = 'Operating Systems';
    } else if (lower.includes('digital') || lower.includes('electronics')) {
      subjectCode = 'EC201';
      subjectName = 'Digital Electronics';
    } else if (lower.includes('dsa') || lower.includes('data structure')) {
      subjectCode = 'CS201';
      subjectName = 'Data Structures & Algorithms';
    } else if (lower.includes('network')) {
      subjectCode = 'CS301';
      subjectName = 'Computer Networks';
    }

    const resources = VERIFIED_CAMPUS_RESOURCES.filter(
      (r) => r.subjectCode === subjectCode
    );

    const card: CopilotCard = {
      cardType: 'RESOURCE_LIST',
      title: `Verified University Materials — ${subjectName}`,
      data: {
        subject: subjectName,
        subjectCode,
        resources: resources.length > 0 ? resources : VERIFIED_CAMPUS_RESOURCES.slice(0, 4),
      },
    };

    return {
      intent: 'RESOURCE_SEARCH',
      category: 'Academic',
      confidence: 0.98,
      message: `Here are the verified past-year university question papers (PYQs) and faculty lecture notes for **${subjectName} (${subjectCode})**:\n\nAll materials have been endorsed by the Department Academic Coordinator. You can download and save them directly.`,
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
      message: `Here is your current student status overview for **${user.fullName || user.username}** (Roll: ${user.rollNumber || '220101048'}):
• **Hostel**: ${user.hostelBlock || 'Block B'} / Room ${user.roomNumber || '204'}
• **Academic Cohort**: ${user.branch || 'CSE'} — Year ${user.year || 2}
• **Submitted Requests**: ${recentRequestsCount} total campus requests on record.
• **Operational Standing**: Active Semester — Good Standing.

You can click any quick action below to check live records or plan your week.`,
      cards: [],
      quickReplies: [
        'What is my current attendance?',
        'What classes do I have today?',
        'What is the status of my bonafide application?',
        'How can I get a 9+ CGPA?',
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
  // HELPER ALGORITHMS
  // =========================================================================

  private static findMatchingProcedure(lower: string): CampusProcedure | null {
    let bestMatch: CampusProcedure | null = null;
    let maxScore = 0;

    for (const proc of VERIFIED_CAMPUS_PROCEDURES) {
      let score = 0;
      for (const kw of proc.keywords) {
        if (lower.includes(kw)) {
          score += kw.length;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = proc;
      }
    }

    return maxScore >= 5 ? bestMatch : null;
  }

  public static generateStructuredStudyPlan(
    subject: string,
    subjectCode: string,
    days: number,
    hoursPerDay: number,
    focusWeakness?: string
  ): Array<{ dayNumber: number; focus: string; hours: number; topics: string[] }> {
    const isDbms = subject.toLowerCase().includes('dbms') || subject.toLowerCase().includes('database') || subjectCode === 'CS204';
    const isOs = subject.toLowerCase().includes('os') || subject.toLowerCase().includes('operating') || subjectCode === 'CS202';

    const plan: Array<{ dayNumber: number; focus: string; hours: number; topics: string[] }> = [];

    for (let day = 1; day <= days; day++) {
      let focus = `Module ${Math.min(5, Math.ceil((day / days) * 5))} Mastery`;
      let topics: string[] = [];

      if (isDbms) {
        if (day <= Math.ceil(days * 0.25)) {
          focus = focusWeakness ? `Foundations & ${focusWeakness}` : 'ER Modeling, Relational Algebra & SQL';
          topics = [
            'Entity-Relationship (ER) to Relational Mapping',
            'Relational Algebra operators (Select, Project, Join, Division)',
            'Complex SQL Queries: Nested Subqueries & Group By / Having',
          ];
          if (focusWeakness) {
            topics.unshift(`Targeted Focus: ${focusWeakness} fundamentals`);
          }
        } else if (day <= Math.ceil(days * 0.5)) {
          focus = 'Functional Dependencies & Normalization';
          topics = [
            'Closure of Attribute Sets & Minimal Cover algorithm',
            '1NF, 2NF, 3NF and Boyce-Codd Normal Form (BCNF)',
            'Lossless Join Decomposition & Dependency Preservation proofs',
          ];
          if (focusWeakness && focusWeakness.toLowerCase().includes('normal')) {
            topics.unshift('⭐ In-depth Practice: 5 Past BPUT Normalization Problems');
          }
        } else if (day <= Math.ceil(days * 0.75)) {
          focus = 'Transaction Processing & Concurrency Control';
          topics = [
            'ACID properties & Transaction State Diagram',
            'Conflict vs View Serializability (Precedence Graph testing)',
            'Two-Phase Locking (2PL) Protocol & Deadlock detection',
          ];
        } else {
          focus = 'Indexing, Crash Recovery & BPUT PYQ Solvathon';
          topics = [
            'B-Tree vs B+ Tree Search, Insertion & Deletion mechanics',
            'Log-based Crash Recovery (Deferred vs Immediate Update)',
            'Solving 2023 & 2024 End-Semester University Question Papers',
          ];
        }
      } else if (isOs) {
        if (day <= Math.ceil(days * 0.33)) {
          focus = 'Processes, Threads & CPU Scheduling';
          topics = [
            'Process Control Block (PCB) & Context Switching',
            'Scheduling Algorithms: FCFS, SJF, Round Robin, Priority',
            'Inter-Process Communication & Thread concurrency',
          ];
        } else if (day <= Math.ceil(days * 0.66)) {
          focus = 'Synchronization & Deadlocks';
          topics = [
            'Critical Section Problem, Peterson Solution & Semaphores',
            'Classical Problems: Dining Philosophers, Producer-Consumer',
            "Banker's Algorithm for Deadlock Avoidance",
          ];
        } else {
          focus = 'Memory Management & File Systems';
          topics = [
            'Paging, Segmentation & Inverted Page Tables',
            'Page Replacement: FIFO, LRU, Optimal algorithms',
            'Solving Past 5-Year BPUT Question Papers under timed exam conditions',
          ];
        }
      } else {
        topics = [
          `Core syllabus derivations and theoretical fundamentals for Day ${day}`,
          'Standard numerical problem-solving practice (last 5 years)',
          'Formula sheet synthesis and answer presentation rehearsal',
        ];
      }

      plan.push({
        dayNumber: day,
        focus,
        hours: hoursPerDay,
        topics,
      });
    }

    return plan;
  }

  /**
   * Enriches and sanitizes the response object from Gemini before sending to client.
   * Guarantees that all card types have non-null, validly typed arrays and fields.
   */
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
            topics: Array.isArray(p.topics) ? p.topics : ['Core Theoretical Concepts', 'PYQ Practice'],
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
          } else if (lower.includes('network')) {
            resources = VERIFIED_CAMPUS_RESOURCES.filter((r) => r.subjectCode === 'CS301');
          } else {
            resources = VERIFIED_CAMPUS_RESOURCES.slice(0, 4);
          }
        } else {
          resources = resources.map((r: any, idx: number) => ({
            id: r.id || `res-ai-${idx + 1}`,
            title: r.title || 'Verified University Academic Resource',
            type: r.type || 'PYQ',
            description: r.description || 'Official University Academic Material',
            keyTopics: Array.isArray(r.keyTopics) ? r.keyTopics : [],
            downloadUrl: r.downloadUrl || '/resources/academic',
            ...r,
          }));
        }

        return {
          ...card,
          data: {
            subject: card.data?.subject,
            subjectCode: card.data?.subjectCode,
            resources,
          },
        };
      }

      if (card.cardType === 'GUIDE_PROCEDURE') {
        const matchedProc = this.findMatchingProcedure(lower);
        const proc = card.data || {};
        return {
          ...card,
          data: {
            id: proc.id || matchedProc?.id || 'proc-general',
            category: proc.category || matchedProc?.category || 'General',
            title: proc.title || matchedProc?.title || card.title || 'Verified Campus Operating Procedure',
            department: proc.department || matchedProc?.department || 'Administrative Affairs',
            location: proc.location || matchedProc?.location || 'Administrative Block, Ground Floor',
            turnaroundTime: proc.turnaroundTime || matchedProc?.turnaroundTime || '24-48 Hours',
            requiredDocuments: Array.isArray(proc.requiredDocuments)
              ? proc.requiredDocuments
              : matchedProc?.requiredDocuments || ['Student Identity Card (Roll Number)'],
            steps:
              Array.isArray(proc.steps) && proc.steps.length > 0
                ? proc.steps
                : matchedProc?.steps || ['Submit request through official desk or portal', 'Wait for departmental verification'],
            notes: proc.notes || matchedProc?.notes,
            directActionIntent: proc.directActionIntent || matchedProc?.directActionIntent,
          },
        };
      }

      if (card.cardType === 'REQUEST_LIST') {
        const reqs = Array.isArray(card.data?.requests)
          ? card.data.requests
          : Array.isArray(card.data?.items)
          ? card.data.items
          : Array.isArray(card.data)
          ? card.data
          : [];
        return {
          ...card,
          data: {
            title: card.data?.title || 'Campus Requests',
            requests: reqs.map((r: any, idx: number) => ({
              id: r.id || `req-${idx}`,
              requestNumber: r.requestNumber || `NX-${10000 + idx}`,
              title: r.title || 'Campus Request',
              status: r.status || 'PENDING_APPROVAL',
              type: r.type || 'GENERAL',
              createdAt: r.createdAt || new Date().toISOString(),
            })),
          },
        };
      }

      if (card.cardType === 'DEADLINE_LIST') {
        const deadlines = Array.isArray(card.data?.deadlines)
          ? card.data.deadlines
          : Array.isArray(card.data?.items)
          ? card.data.items
          : [];
        return {
          ...card,
          data: {
            title: card.data?.title || 'Academic Deadlines',
            deadlines: deadlines.map((d: any, idx: number) => ({
              id: d.id || `dl-${idx}`,
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
            location: d.location || `${user.hostelBlock || 'Hostel Block B'} - Room ${user.roomNumber || '204'}`,
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
            startDate: d.startDate || new Date(today.getTime() + 24 * 3600000).toISOString().split('T')[0],
            endDate: d.endDate || new Date(today.getTime() + 4 * 24 * 3600000).toISOString().split('T')[0],
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
            expectedReturnTime: d.expectedReturnTime || new Date(now.getTime() + 4 * 3600000).toISOString(),
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
