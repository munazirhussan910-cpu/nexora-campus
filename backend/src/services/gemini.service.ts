import { config } from '../config/env';
import { AuthUser } from '../types/auth';
import { CopilotResponse } from './copilot.service';
import { VERIFIED_CAMPUS_PROCEDURES } from '../data/campusGuide.data';
import { VERIFIED_CAMPUS_RESOURCES } from '../data/campusResources.data';

export class GeminiService {
  private static readonly MODELS = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
  ];

  /**
   * Generates intelligent, grounded Copilot response using Google Gemini.
   */
  static async generateResponse(
    userMessage: string,
    user: AuthUser,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
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

    const guideSummary = VERIFIED_CAMPUS_PROCEDURES.map(
      (p) =>
        `[ID: ${p.id} | Category: ${p.category} | Department: ${p.department} | SLA: ${p.turnaroundTime} | Title: ${p.title} | Requirements: ${p.requiredDocuments.join(', ')} | Steps: ${p.steps.join(' -> ')}]`
    ).join('\n');

    const resourceSummary = VERIFIED_CAMPUS_RESOURCES.map(
      (r) =>
        `[Subject: ${r.subjectName} (${r.subjectCode}) | Type: ${r.type} | Title: ${r.title} | Key Topics: ${r.keyTopics?.join(', ') || ''}]`
    ).join('\n');

    const systemInstruction = `
You are NEXORA COPILOT, an autonomous campus AI problem-solving layer running at BPUT (Biju Patnaik University of Technology, Bhubaneswar).
Your positioning: "Ask. Solve. Plan."
Instead of forcing students to navigate multiple portals and department desks, you understand their problem in plain natural language, provide verified guidance, and surface pre-filled action cards for existing campus workflows.

CORE RULES:
1. Never hallucinate college policies, fees, dates, or contact details. Ground your answers strictly in the verified campus procedures and resources below.
2. If the user asks something unverified or outside campus operations (e.g. general trivia, gossip, unverified policies), respond with intent "FALLBACK" and state: "I don't have verified information about this yet."
3. When the user reports a broken fixture or facility issue (fan, tap, lock, light, wifi, leak, door), identify intent "CREATE_MAINTENANCE_REQUEST", identify the category (Electrical, Plumbing, Carpentry, Network, Cleanliness), and include an ACTION_MAINTENANCE card.
4. When the user requests a bonafide certificate, identify intent "REQUEST_BONAFIDE" and include an ACTION_BONAFIDE card.
5. When the user asks for hostel leave, identify intent "APPLY_HOSTEL_LEAVE" and include an ACTION_LEAVE card.
6. When the user wants a gate pass or exit authorization, identify intent "CREATE_GATE_PASS" and include an ACTION_GATE_PASS card.
7. When the user asks to prepare or study for an exam (e.g. "DBMS exam in 10 days"), identify intent "STUDY_PLAN" and generate a structured day-by-day roadmap in a STUDY_PLAN card (Phase 1: Foundations, Phase 2: Core Deep Dive, Phase 3: High-Yield PYQs, Phase 4: Final Revision) and link to available university resources.
8. When the user asks for question papers or notes, identify intent "RESOURCE_SEARCH" and include a RESOURCE_LIST card.
9. When the user asks how a process works (e.g., lost ID card, re-evaluation, health center), identify intent "CAMPUS_GUIDE" and include a GUIDE_PROCEDURE card.

VERIFIED CAMPUS PROCEDURES:
${guideSummary}

VERIFIED CAMPUS ACADEMIC RESOURCES:
${resourceSummary}

${studentContext}

OUTPUT FORMAT:
You MUST output strictly valid JSON conforming to this schema (no markdown fences, just pure JSON):
{
  "intent": "CREATE_MAINTENANCE_REQUEST" | "REQUEST_BONAFIDE" | "APPLY_HOSTEL_LEAVE" | "CREATE_GATE_PASS" | "CAMPUS_GUIDE" | "STUDY_PLAN" | "RESOURCE_SEARCH" | "CAMPUS_STATUS" | "FALLBACK",
  "category": "string",
  "confidence": 0.95,
  "message": "Direct, professional, and helpful markdown message explaining the solution.",
  "cards": [
    {
      "cardType": "ACTION_MAINTENANCE" | "ACTION_BONAFIDE" | "ACTION_LEAVE" | "ACTION_GATE_PASS" | "GUIDE_PROCEDURE" | "STUDY_PLAN" | "RESOURCE_LIST",
      "title": "Card title",
      "data": {}
    }
  ],
  "quickReplies": ["Quick suggestion 1", "Quick suggestion 2"]
}
`;

    // Map conversation history
    const contents: any[] = [];
    for (const h of history.slice(-4)) {
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
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.1,
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

        const parsed = JSON.parse(rawText) as CopilotResponse;
        if (parsed.intent && parsed.message) {
          return parsed;
        }
      } catch (err) {
        // Continue to next model or fallback
      }
    }

    return null;
  }
}
