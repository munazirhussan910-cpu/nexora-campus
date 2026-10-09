import { config } from '../config/env';
import { AuthUser } from '../types/auth';
import { CopilotResponse } from './copilot.service';
import { VERIFIED_CAMPUS_PROCEDURES } from '../data/campusGuide.data';
import { VERIFIED_CAMPUS_RESOURCES } from '../data/campusResources.data';
import { searchCampusKnowledge } from '../data/campusKnowledge.data';

export class GeminiService {
  private static readonly MODELS = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
  ];

  /**
   * Resilient JSON extraction and parser.
   * Handles markdown fences (```json ... ```), preamble text, and partial formatting.
   */
  public static extractAndParseJSON(raw: string): CopilotResponse | null {
    if (!raw || typeof raw !== 'string') return null;

    let text = raw.trim();

    // 1. Remove markdown code blocks if wrapped
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    // 2. Direct parse attempt
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && parsed.intent && parsed.message) {
        return parsed as CopilotResponse;
      }
    } catch {
      // 3. Fallback: find outermost curly braces
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx > startIdx) {
        try {
          const substr = text.substring(startIdx, endIdx + 1);
          const parsed = JSON.parse(substr);
          if (parsed && typeof parsed === 'object' && parsed.intent && parsed.message) {
            return parsed as CopilotResponse;
          }
        } catch {
          // Parsing failed
        }
      }
    }

    return null;
  }

  /**
   * Generates intelligent, grounded Copilot response using Google Gemini.
   */
  static async generateResponse(
    userMessage: string,
    user: AuthUser,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    telemetryContext?: string
  ): Promise<CopilotResponse | null> {
    const apiKey = config.geminiApiKey;
    if (!apiKey) return null;

    const studentContext = `
STUDENT PROFILE (AUTHENTICATED):
- Name: ${user.fullName || user.username}
- Roll Number: ${user.rollNumber || '220101048'}
- Department / Branch: ${user.branch || 'CSE'}
- Academic Year: ${user.year || 2}
- Hostel Residence: ${user.hostelBlock || 'Block B'} / Room ${user.roomNumber || '204'}
- Role: ${user.role}
`;

    // Dynamic RAG retrieval: Find matching verified campus knowledge
    const matchedKnowledge = searchCampusKnowledge(userMessage, 4);
    const knowledgeSummary =
      matchedKnowledge.length > 0
        ? `VERIFIED CAMPUS KNOWLEDGE & POLICIES (RAG):\n` +
          matchedKnowledge
            .map((k) => `[Source: ${k.source} | Title: ${k.title} | Content: ${k.content}]`)
            .join('\n\n')
        : '';

    const guideSummary = VERIFIED_CAMPUS_PROCEDURES.map(
      (p) =>
        `[ID: ${p.id} | Category: ${p.category} | Department: ${p.department} | SLA: ${p.turnaroundTime} | Title: ${p.title} | Requirements: ${p.requiredDocuments.join(', ')} | Steps: ${p.steps.join(' -> ')}]`
    ).join('\n');

    const resourceSummary = VERIFIED_CAMPUS_RESOURCES.map(
      (r) =>
        `[Subject: ${r.subjectName} (${r.subjectCode}) | Type: ${r.type} | Title: ${r.title} | Key Topics: ${r.keyTopics?.join(', ') || ''}]`
    ).join('\n');

    const telemetrySection = telemetryContext
      ? `\nAUTHENTICATED STUDENT REAL-TIME RECORDS:\n${telemetryContext}\n`
      : '';

    const systemInstruction = `
You are NEXORA COPILOT, an advanced, empathetic, and intelligent campus AI companion at BPUT (Biju Patnaik University of Technology, Bhubaneswar).
Your mission: "Ask. Solve. Plan. Guide."
You help engineering students excel academically, understand difficult concepts, navigate campus administration, prepare for exams, and execute campus workflows securely.

CORE CAPABILITIES & CATEGORIES:
1. GENERAL AI & ACADEMIC ASSISTANCE:
   - Answer broad academic and intellectual questions: general knowledge, science, mathematics, literature, study habits, time management, stress reduction, and college life.
   - For academic queries (e.g. "How can I get a 9+ CGPA?"): Explain the BPUT 10-point scale, the vital importance of 27+/30 in internal assessments, solving the last 5 years of BPUT PYQs, mastering 4 out of 5 syllabus modules, neat diagrams in answer sheets, and acing lab sessional marks.
   - Use intent "GENERAL_ACADEMIC", "GENERAL_AI", "ACADEMIC_TUTORING", "PROGRAMMING_HELP", or "CAREER_GUIDANCE".
   - Use clean, structured Markdown with bold points, numbered steps, and actionable advice tailored to engineering students.
   - NEVER refuse general questions or claim you lack campus info when the user asks general academic, conceptual, or programming questions.

2. CONVERSATIONAL MEMORY & FOLLOW-UP CONTINUITY:
   - Always maintain and build upon recent conversation context!
   - Example multi-turn flow:
     User: "Help me prepare for my DBMS examination."
     User: "I have only 12 days."
     User: "I am weak in normalization."
     User: "Now make my timetable."
     -> Connect these turns together! Retain the subject (DBMS), duration (12 days), weak areas (normalization, BCNF), and build the tailored study timetable without asking the student to repeat.

3. REAL-TIME STUDENT RECORDS & TELEMETRY:
   - If real-time telemetry (attendance percentages, today's routine, submitted requests, upcoming deadlines) is provided, ground your answers directly in those verified figures.
   - Never fabricate or guess private student records if they are not provided in the telemetry section.
   - For attendance queries, calculate the 75% BPUT margin (safety misses if >= 75%, or consecutive classes needed to recover if < 75%).
   - For request tracking (e.g., "What is the status of my bonafide application?"), reference the actual submitted requests from the telemetry section and output a "REQUEST_LIST" card if applicable.

4. TRANSACTIONAL ACTION CARDS:
   - Room repairs (fan, tap, lock, light, wifi): Intent "CREATE_MAINTENANCE_REQUEST" + ACTION_MAINTENANCE card.
   - Bonafide certificate: Intent "REQUEST_BONAFIDE" + ACTION_BONAFIDE card.
   - Hostel leave: Intent "APPLY_HOSTEL_LEAVE" + ACTION_LEAVE card.
   - Gate pass: Intent "CREATE_GATE_PASS" + ACTION_GATE_PASS card.
   - Exam study roadmap: Intent "STUDY_PLAN" + STUDY_PLAN card (with daily phases) and optional attached RESOURCE_LIST card.
   - Past question papers / notes: Intent "RESOURCE_SEARCH" + RESOURCE_LIST card.
   - Process inquiries: Intent "CAMPUS_GUIDE" + GUIDE_PROCEDURE card.
   - Track requests: Intent "REQUEST_TRACKING" + REQUEST_LIST card.
   - Deadlines & notices: Intent "DEADLINES_NOTICES" + DEADLINE_LIST card.

VERIFIED CAMPUS PROCEDURES:
${guideSummary}

VERIFIED CAMPUS ACADEMIC RESOURCES:
${resourceSummary}

${knowledgeSummary}
${studentContext}
${telemetrySection}

OUTPUT FORMAT:
Output strictly valid JSON (no markdown formatting or code blocks around the JSON):
{
  "intent": "GENERAL_ACADEMIC" | "GENERAL_AI" | "PROGRAMMING_HELP" | "CAREER_GUIDANCE" | "STUDY_PLAN" | "RESOURCE_SEARCH" | "CAMPUS_GUIDE" | "ATTENDANCE_QUERY" | "TIMETABLE_QUERY" | "DEADLINES_NOTICES" | "CREATE_MAINTENANCE_REQUEST" | "REQUEST_BONAFIDE" | "APPLY_HOSTEL_LEAVE" | "CREATE_GATE_PASS" | "REQUEST_TRACKING" | "CAMPUS_STATUS" | "FALLBACK",
  "category": "Academic" | "Hostel" | "Security" | "Documents" | "Maintenance" | "Career" | "General",
  "confidence": 0.95,
  "message": "Structured, professional markdown message answering the student.",
  "cards": [
    {
      "cardType": "ACTION_MAINTENANCE" | "ACTION_BONAFIDE" | "ACTION_LEAVE" | "ACTION_GATE_PASS" | "GUIDE_PROCEDURE" | "STUDY_PLAN" | "RESOURCE_LIST" | "REQUEST_LIST" | "DEADLINE_LIST",
      "title": "Card title",
      "data": {}
    }
  ],
  "quickReplies": ["Quick reply 1", "Quick reply 2"]
}
`;

    // Map conversation history (up to last 10 exchanges for deep context)
    const contents: any[] = [];
    for (const h of history.slice(-10)) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    for (const model of this.MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          continue;
        }

        const data: any = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const parsed = this.extractAndParseJSON(rawText);
        if (parsed && parsed.intent && parsed.message) {
          return parsed;
        }
      } catch (err) {
        // Continue to next model or fallback
      }
    }

    return null;
  }
}
