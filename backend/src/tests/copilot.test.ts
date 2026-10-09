import { CopilotService, CopilotResponse } from '../services/copilot.service';
import { GeminiService } from '../services/gemini.service';
import { AuthUser } from '../types/auth';

describe('Nexora Copilot Service & Card Generation Suite', () => {
  const mockStudentUser: AuthUser = {
    id: 'c0eeeaf2-d46c-41f2-940b-6fae1eaab22f',
    username: 'aryan',
    email: 'aryan@nexora.edu',
    role: 'STUDENT',
    roleId: 'role-student-1',
    permissions: ['student:read', 'student:write'],
    fullName: 'Aryan Khan',
    rollNumber: '220101048',
    branch: 'CSE',
    year: 2,
    hostelBlock: 'Block B',
    roomNumber: '204',
  };

  describe('1. Fallback Heuristic Engine Intent & Card Handling', () => {
    test('RESOURCE_SEARCH intent returns RESOURCE_LIST card with valid resources array in data', async () => {
      const res = await CopilotService.processMessage('Find BPUT PYQs for DBMS', mockStudentUser);
      expect(res.intent).toBe('RESOURCE_SEARCH');
      expect(res.cards).toBeDefined();
      expect(res.cards.length).toBeGreaterThan(0);

      const resourceCard = res.cards.find((c) => c.cardType === 'RESOURCE_LIST');
      expect(resourceCard).toBeDefined();
      expect(resourceCard?.data).toBeDefined();
      // Test data structure: data has a resources array
      expect(Array.isArray(resourceCard?.data?.resources)).toBe(true);
      expect(resourceCard?.data.resources.length).toBeGreaterThan(0);

      // Frontend compatibility test: ensure frontend extraction logic yields non-empty items
      const frontendExtracted = Array.isArray(resourceCard?.data?.resources)
        ? resourceCard?.data.resources
        : Array.isArray(resourceCard?.data)
        ? resourceCard?.data
        : [];
      expect(frontendExtracted.length).toBe(resourceCard?.data.resources.length);
      expect(typeof frontendExtracted.map).toBe('function');
      const mapped = frontendExtracted.map((r: any) => r.title);
      expect(mapped.length).toBeGreaterThan(0);
    });

    test('STUDY_PLAN intent returns STUDY_PLAN card and attached RESOURCE_LIST card', async () => {
      const res = await CopilotService.processMessage('Generate a 10-day DBMS exam study plan', mockStudentUser);
      expect(res.intent).toBe('STUDY_PLAN');

      const planCard = res.cards.find((c) => c.cardType === 'STUDY_PLAN');
      expect(planCard).toBeDefined();
      expect(Array.isArray(planCard?.data?.plan)).toBe(true);
      expect(planCard?.data.plan.length).toBe(10);
      expect(planCard?.data.plan[0].topics).toBeDefined();
      expect(Array.isArray(planCard?.data.plan[0].topics)).toBe(true);

      const resourceCard = res.cards.find((c) => c.cardType === 'RESOURCE_LIST');
      expect(resourceCard).toBeDefined();
      expect(Array.isArray(resourceCard?.data?.resources)).toBe(true);
      expect(resourceCard?.data.resources.length).toBeGreaterThan(0);

      // Verify frontend mapping does not throw
      expect(() => {
        const items = Array.isArray(resourceCard?.data?.resources)
          ? resourceCard?.data.resources
          : Array.isArray(resourceCard?.data)
          ? resourceCard?.data
          : [];
        items.map((i: any) => i.id);
      }).not.toThrow();
    });

    test('ACTION_MAINTENANCE intent returns pre-filled maintenance card', async () => {
      const res = await CopilotService.processMessage('The ceiling fan in my room is broken and sparking', mockStudentUser);
      expect(res.intent).toBe('CREATE_MAINTENANCE_REQUEST');
      const card = res.cards.find((c) => c.cardType === 'ACTION_MAINTENANCE');
      expect(card).toBeDefined();
      expect(card?.data.category).toBe('Electrical');
      expect(card?.data.priority).toBe('URGENT');
      expect(card?.data.location).toContain('Block B');
    });

    test('ACTION_BONAFIDE intent returns pre-filled bonafide card', async () => {
      const res = await CopilotService.processMessage('Need a bonafide certificate for scholarship', mockStudentUser);
      expect(res.intent).toBe('REQUEST_BONAFIDE');
      const card = res.cards.find((c) => c.cardType === 'ACTION_BONAFIDE');
      expect(card).toBeDefined();
      expect(card?.data.purpose).toBe('Scholarship');
      expect(card?.data.studentName).toBe('Aryan Khan');
      expect(card?.data.rollNumber).toBe('220101048');
    });

    test('ACTION_LEAVE intent returns pre-filled leave card', async () => {
      const res = await CopilotService.processMessage('I need hostel leave to go home for Diwali', mockStudentUser);
      expect(res.intent).toBe('APPLY_HOSTEL_LEAVE');
      const card = res.cards.find((c) => c.cardType === 'ACTION_LEAVE');
      expect(card).toBeDefined();
      expect(card?.data.startDate).toBeDefined();
      expect(card?.data.endDate).toBeDefined();
      expect(card?.data.hostelBlock).toBe('Block B');
    });

    test('ACTION_GATE_PASS intent returns pre-filled gate pass card', async () => {
      const res = await CopilotService.processMessage('I need a gate pass to visit the market', mockStudentUser);
      expect(res.intent).toBe('CREATE_GATE_PASS');
      const card = res.cards.find((c) => c.cardType === 'ACTION_GATE_PASS');
      expect(card).toBeDefined();
      expect(card?.data.destination).toBeDefined();
      expect(card?.data.departureTime).toBeDefined();
      expect(card?.data.expectedReturnTime).toBeDefined();
    });

    test('CAMPUS_GUIDE intent returns GUIDE_PROCEDURE card with steps array and required documents', async () => {
      const res = await CopilotService.processMessage('What is the procedure for semester registration?', mockStudentUser);
      expect(res.intent).toBe('CAMPUS_GUIDE');
      const card = res.cards.find((c) => c.cardType === 'GUIDE_PROCEDURE');
      expect(card).toBeDefined();
      expect(card?.data.steps).toBeDefined();
      expect(Array.isArray(card?.data.steps)).toBe(true);
      expect(Array.isArray(card?.data.requiredDocuments)).toBe(true);
    });
  });

  describe('2. Gemini Response Enrichment & Normalization', () => {
    test('Enriches and normalizes RESOURCE_LIST card when Gemini returns an object with resources', () => {
      const rawGeminiResponse: CopilotResponse = {
        intent: 'RESOURCE_SEARCH',
        confidence: 0.95,
        message: 'Here are the resources for DBMS',
        cards: [
          {
            cardType: 'RESOURCE_LIST',
            title: 'Verified Materials',
            data: {
              resources: [
                {
                  id: 'res-custom-1',
                  title: 'DBMS PYQ 2024',
                  type: 'PYQ',
                  description: '2024 Exam Paper',
                  keyTopics: ['ACID', 'Normalization'],
                },
              ],
            },
          },
        ],
      };

      const enriched = (CopilotService as any).enrichGeminiResponse(
        rawGeminiResponse,
        'DBMS question papers',
        'dbms question papers',
        mockStudentUser
      );

      const card = enriched.cards[0];
      expect(card.cardType).toBe('RESOURCE_LIST');
      expect(Array.isArray(card.data.resources)).toBe(true);
      expect(card.data.resources.length).toBe(1);
      expect(card.data.resources[0].title).toBe('DBMS PYQ 2024');
    });

    test('Enriches and normalizes RESOURCE_LIST card when Gemini returns a raw array in data', () => {
      const rawGeminiResponse: CopilotResponse = {
        intent: 'RESOURCE_SEARCH',
        confidence: 0.95,
        message: 'Here are the resources for DBMS',
        cards: [
          {
            cardType: 'RESOURCE_LIST',
            title: 'Verified Materials',
            data: [
              {
                id: 'res-raw-1',
                title: 'DBMS Notes',
                type: 'NOTES',
              },
            ],
          },
        ],
      };

      const enriched = (CopilotService as any).enrichGeminiResponse(
        rawGeminiResponse,
        'DBMS notes',
        'dbms notes',
        mockStudentUser
      );

      const card = enriched.cards[0];
      expect(card.cardType).toBe('RESOURCE_LIST');
      expect(Array.isArray(card.data.resources)).toBe(true);
      expect(card.data.resources.length).toBe(1);
      expect(card.data.resources[0].title).toBe('DBMS Notes');
    });

    test('Enriches RESOURCE_LIST with verified campus resources when Gemini returns empty data', () => {
      const rawGeminiResponse: CopilotResponse = {
        intent: 'RESOURCE_SEARCH',
        confidence: 0.9,
        message: 'Found academic resources',
        cards: [
          {
            cardType: 'RESOURCE_LIST',
            title: 'Verified Materials',
            data: {},
          },
        ],
      };

      const enriched = (CopilotService as any).enrichGeminiResponse(
        rawGeminiResponse,
        'Find DBMS PYQ',
        'find dbms pyq',
        mockStudentUser
      );

      const card = enriched.cards[0];
      expect(card.cardType).toBe('RESOURCE_LIST');
      expect(Array.isArray(card.data.resources)).toBe(true);
      expect(card.data.resources.length).toBeGreaterThan(0);
      expect(card.data.resources[0].subjectCode).toBe('CS204');
    });

    test('Enriches GUIDE_PROCEDURE card ensuring steps and requiredDocuments arrays exist', () => {
      const rawGeminiResponse: CopilotResponse = {
        intent: 'CAMPUS_GUIDE',
        confidence: 0.9,
        message: 'Here is how to get a bonafide certificate',
        cards: [
          {
            cardType: 'GUIDE_PROCEDURE',
            title: 'Bonafide Procedure',
            data: {
              title: 'Bonafide Certificate',
            },
          },
        ],
      };

      const enriched = (CopilotService as any).enrichGeminiResponse(
        rawGeminiResponse,
        'How to get bonafide certificate',
        'how to get bonafide certificate',
        mockStudentUser
      );

      const card = enriched.cards[0];
      expect(card.cardType).toBe('GUIDE_PROCEDURE');
      expect(Array.isArray(card.data.steps)).toBe(true);
      expect(Array.isArray(card.data.requiredDocuments)).toBe(true);
      expect(card.data.steps.length).toBeGreaterThan(0);
    });

    test('GeminiService.extractAndParseJSON successfully strips markdown fences and parses JSON', () => {
      const markdownJson = `\`\`\`json
{
  "intent": "GENERAL_ACADEMIC",
  "category": "Academic",
  "confidence": 0.95,
  "message": "To get a 9+ CGPA, master internal marks and solve past 5-year PYQs.",
  "cards": [],
  "quickReplies": ["Find BPUT PYQs"]
}
\`\`\``;

      const parsed = GeminiService.extractAndParseJSON(markdownJson);
      expect(parsed).not.toBeNull();
      expect(parsed?.intent).toBe('GENERAL_ACADEMIC');
      expect(parsed?.message).toContain('9+ CGPA');
    });
  });

  describe('3. Frontend Compatibility & Error Guarding', () => {
    test('Simulates frontend extraction for all card types without throwing TypeError', async () => {
      const queries = [
        'fan broken in room',
        'bonafide certificate for loan',
        'leave application for vacation',
        'gate pass for market',
        'how to replace lost id card',
        'plan my 5-day dbms exam',
        'where can i find bput pyqs for dbms',
        'what is the status of my bonafide application',
        'what are the upcoming academic deadlines',
      ];

      for (const query of queries) {
        const res = await CopilotService.processMessage(query, mockStudentUser);
        for (const card of res.cards) {
          if (card.cardType === 'RESOURCE_LIST') {
            const resourceList: any[] = Array.isArray(card.data?.resources)
              ? card.data.resources
              : Array.isArray(card.data)
              ? card.data
              : Array.isArray(card.data?.items)
              ? card.data.items
              : [];
            expect(Array.isArray(resourceList)).toBe(true);
            const rendered = resourceList.map((r) => r.title);
            expect(rendered.length).toBe(resourceList.length);
          } else if (card.cardType === 'STUDY_PLAN') {
            const planList = Array.isArray(card.data?.plan) ? card.data.plan : [];
            expect(planList.length).toBeGreaterThan(0);
            planList.map((day: any) => {
              const topics = Array.isArray(day?.topics) ? day.topics : [];
              topics.map((t: string) => t);
            });
          } else if (card.cardType === 'GUIDE_PROCEDURE') {
            const steps = Array.isArray(card.data?.steps) ? card.data.steps : [];
            expect(steps.length).toBeGreaterThan(0);
            steps.map((st: string) => st);
            const docs = Array.isArray(card.data?.requiredDocuments) ? card.data.requiredDocuments : [];
            docs.map((d: string) => d);
          } else if (card.cardType === 'REQUEST_LIST') {
            const reqs = Array.isArray(card.data?.requests) ? card.data.requests : [];
            expect(Array.isArray(reqs)).toBe(true);
            reqs.map((r: any) => r.title);
          } else if (card.cardType === 'DEADLINE_LIST') {
            const dls = Array.isArray(card.data?.deadlines) ? card.data.deadlines : [];
            expect(Array.isArray(dls)).toBe(true);
            dls.map((d: any) => d.title);
          } else {
            expect(card.data).toBeDefined();
          }
        }
      }
    });
  });

  describe('4. General Academic Intelligence & Real-time Telemetry', () => {
    test('General question "How can I get a 9+ CGPA?" returns GENERAL_ACADEMIC intent with actionable strategy (not FALLBACK)', async () => {
      const res = await CopilotService.processMessage('How can I get a 9+ CGPA?', mockStudentUser);
      expect(res.intent).toBe('GENERAL_ACADEMIC');
      expect(res.message).toContain('9+ CGPA');
      expect(res.message).toContain('Internal Assessment');
      expect(res.message).toContain('PYQ');
      expect(res.confidence).toBeGreaterThan(0.9);
      expect(res.intent).not.toBe('FALLBACK');
    });

    test('Real-time attendance query retrieves authenticated student data and calculates 75% margin', async () => {
      const res = await CopilotService.processMessage('What is my current attendance?', mockStudentUser);
      expect(res.intent).toBe('ATTENDANCE_QUERY');
      expect(res.message).toContain('Aryan Khan');
      expect(res.message).toContain('220101048');
      expect(res.message).toContain('Overall Attendance');
      expect(res.message).toContain('75%');
      expect(res.message).toContain('Safety Buffer');
      expect(res.message).toContain('CS202');
    });

    test('Subject-specific attendance query "What is my current DBMS attendance?" highlights specific subject', async () => {
      const res = await CopilotService.processMessage('What is my current DBMS attendance?', mockStudentUser);
      expect(res.intent).toBe('ATTENDANCE_QUERY');
      expect(res.message).toContain('DBMS');
      expect(res.message).toContain('CS202');
      expect(res.message).toContain('Focus Subject');
    });

    test('Bunking query "Can I bunk class tomorrow?" calculates safe class misses based on 75% rule', async () => {
      const res = await CopilotService.processMessage('Can I bunk class tomorrow?', mockStudentUser);
      expect(res.intent).toBe('ATTENDANCE_QUERY');
      expect(res.message).toContain('Safety Buffer');
      expect(res.message).toContain('safely miss up to');
    });

    test('Attendance query for student without published records gracefully explains absence of data', async () => {
      const studentWithoutRecords: AuthUser = {
        id: 'unlinked-student-id',
        username: 'samir',
        email: 'samir@nexora.edu',
        role: 'STUDENT',
        roleId: 'role-student-1',
        permissions: ['student:read'],
        fullName: 'Samir Unknown',
        rollNumber: '888888888',
      };
      const res = await CopilotService.processMessage('What is my current attendance?', studentWithoutRecords);
      expect(res.intent).toBe('ATTENDANCE_QUERY');
      expect(res.message).toContain('No active student enrollment profile was found');
    });

    test('Programming query "Explain recursion in C++" returns PROGRAMMING_HELP with code example', async () => {
      const res = await CopilotService.processMessage('Explain recursion in C++', mockStudentUser);
      expect(res.intent).toBe('PROGRAMMING_HELP');
      expect(res.message).toContain('Base Case');
      expect(res.message).toContain('Recursive Step');
      expect(res.message).toContain('factorial');
      expect(res.message).toContain('cpp');
    });

    test('Career query "How should I prepare for campus placements?" returns CAREER_GUIDANCE', async () => {
      const res = await CopilotService.processMessage('How should I prepare for campus placements?', mockStudentUser);
      expect(res.intent).toBe('CAREER_GUIDANCE');
      expect(res.message).toContain('CGPA');
      expect(res.message).toContain('DSA');
    });

    test('Campus knowledge query "When is the hostel curfew?" retrieves grounded policy with source', async () => {
      const res = await CopilotService.processMessage('When is the hostel curfew?', mockStudentUser);
      expect(res.intent).toBe('CAMPUS_GUIDE');
      expect(res.message).toContain('Hostel Curfew');
      expect(res.message).toContain('7:30 PM');
      expect(res.message).toContain('8:30 PM');
      expect(res.message).toContain('Source:');
    });

    test('Conversational follow-up "Thanks for the tips!" responds gracefully', async () => {
      const res = await CopilotService.processMessage('Thanks for the tips!', mockStudentUser);
      expect(res.intent).toBe('GENERAL_ACADEMIC');
      expect(res.message.toLowerCase()).toContain('welcome');
    });

    test('Study plan with custom hours "5-day study plan for OS at 4 hours a day" parses hours and days', async () => {
      const res = await CopilotService.processMessage('5-day study plan for OS at 4 hours a day', mockStudentUser);
      expect(res.intent).toBe('STUDY_PLAN');
      const planCard = res.cards.find((c) => c.cardType === 'STUDY_PLAN');
      expect(planCard).toBeDefined();
      expect(planCard?.data.days).toBe(5);
      expect(planCard?.data.hoursPerDay).toBe(4);
      expect(planCard?.data.subjectCode).toBe('CS202');
    });
  });

  describe('5. Real-Time Student Requests, Deadlines & Multi-Turn Memory', () => {
    test('Request tracking query "What is the status of my bonafide application?" returns REQUEST_TRACKING with REQUEST_LIST card', async () => {
      const res = await CopilotService.processMessage('What is the status of my bonafide application?', mockStudentUser);
      expect(res.intent).toBe('REQUEST_TRACKING');
      expect(res.cards.length).toBeGreaterThan(0);
      const reqCard = res.cards.find((c) => c.cardType === 'REQUEST_LIST');
      expect(reqCard).toBeDefined();
      expect(Array.isArray(reqCard?.data?.requests)).toBe(true);
      expect(reqCard?.data?.requests.length).toBeGreaterThan(0);
      expect(reqCard?.data?.requests[0].requestNumber).toMatch(/^NX-/);
    });

    test('Academic deadlines query "What are the upcoming academic deadlines?" returns DEADLINES_NOTICES with DEADLINE_LIST card', async () => {
      const res = await CopilotService.processMessage('What are the upcoming academic deadlines?', mockStudentUser);
      expect(res.intent).toBe('DEADLINES_NOTICES');
      expect(res.message).toContain('Academic Deadlines');
      expect(res.cards.length).toBeGreaterThan(0);
      const dlCard = res.cards.find((c) => c.cardType === 'DEADLINE_LIST');
      expect(dlCard).toBeDefined();
      expect(Array.isArray(dlCard?.data?.deadlines)).toBe(true);
      expect(dlCard?.data?.deadlines.length).toBeGreaterThan(0);
    });

    test('Multi-turn context continuity: "Help me prepare for DBMS" -> "I have only 12 days" -> "I am weak in normalization" -> "Now make my timetable"', async () => {
      const history1 = [
        { role: 'user' as const, content: 'Help me prepare for my DBMS examination.' },
        { role: 'assistant' as const, content: 'I can help you prepare for Database Management Systems. How many days do you have until the exam?' },
      ];

      const res2 = await CopilotService.processMessage('I have only 12 days.', mockStudentUser, history1);
      expect(res2.intent).toBe('STUDY_PLAN');
      const planCard2 = res2.cards.find((c) => c.cardType === 'STUDY_PLAN');
      expect(planCard2).toBeDefined();
      expect(planCard2?.data.days).toBe(12);
      expect(planCard2?.data.subject).toContain('Database');

      const history3 = [
        ...history1,
        { role: 'user' as const, content: 'I have only 12 days.' },
        { role: 'assistant' as const, content: res2.message },
        { role: 'user' as const, content: 'I am weak in normalization.' },
        { role: 'assistant' as const, content: 'Got it, I will prioritize Functional Dependencies and Normalization (1NF to BCNF) in your roadmap.' },
      ];

      const res4 = await CopilotService.processMessage('Now make my timetable.', mockStudentUser, history3);
      expect(res4.intent).toBe('STUDY_PLAN');
      const planCard4 = res4.cards.find((c) => c.cardType === 'STUDY_PLAN');
      expect(planCard4).toBeDefined();
      expect(planCard4?.data.days).toBe(12);
      expect(planCard4?.data.subject).toContain('Database');
      expect(res4.message).toContain('12-day');
      expect(res4.message).toContain('Database Management Systems');
    });

    test('General AI question "Explain how operating systems handle deadlocks" returns answer with principles', async () => {
      const res = await CopilotService.processMessage('Explain how operating systems handle deadlocks', mockStudentUser);
      expect(['GENERAL_AI', 'PROGRAMMING_HELP', 'GENERAL_ACADEMIC']).toContain(res.intent);
      expect(res.message.length).toBeGreaterThan(50);
      expect(res.intent).not.toBe('FALLBACK');
    });
  });
});
