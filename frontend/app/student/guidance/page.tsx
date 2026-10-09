'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import {
  Compass,
  FileCheck,
  Calendar,
  Building,
  Bell,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Shield,
  Clock,
  ChevronRight,
  RotateCcw,
  BookOpen,
  DollarSign,
  Briefcase,
  FlaskConical,
  Wrench,
  Key,
  Search,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface Step1Option {
  id: string;
  category: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
}

const STEP_1_OPTIONS: Step1Option[] = [
  {
    id: 'HOSTEL_LEAVE',
    category: 'HOSTEL_LEAVE',
    label: 'Hostel Leave',
    desc: 'Multi-day outstation leave with parental consent and warden approval',
    icon: Calendar,
    color: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5',
  },
  {
    id: 'BONAFIDE',
    category: 'BONAFIDE',
    label: 'Bonafide Certificate',
    desc: 'Official certified document for scholarship, education loan, or passport',
    icon: FileCheck,
    color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
  },
  {
    id: 'COMPLAINT',
    category: 'COMPLAINT',
    label: 'Maintenance Complaint',
    desc: 'Report room electrical, plumbing, carpentry, or Wi-Fi breakdown',
    icon: Wrench,
    color: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5',
  },
  {
    id: 'GATE_PASS',
    category: 'GATE_PASS',
    label: 'Gate Pass',
    desc: 'Campus day outpass for market, coaching, or medical visits (QR & PIN)',
    icon: Key,
    color: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5',
  },
  {
    id: 'TRACK_REQUEST',
    category: 'TRACK_REQUEST',
    label: 'Check Existing Request',
    desc: 'Inspect live status and timeline of your submitted tickets and leaves',
    icon: Search,
    color: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5',
  },
  {
    id: 'ROUTINE',
    category: 'ROUTINE',
    label: 'Timetable & Routine',
    desc: 'Today’s schedule, period timings, room allocations, and faculty',
    icon: Clock,
    color: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5',
  },
  {
    id: 'NOTICE',
    category: 'NOTICE',
    label: 'Campus Notices',
    desc: 'Official university circulars, exam notifications, and schedules',
    icon: Bell,
    color: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5',
  },
  {
    id: 'ATTENDANCE',
    category: 'ATTENDANCE',
    label: 'Attendance Standing',
    desc: 'Check subject percentages, 75% exam cutoff, and safe bunk calculations',
    icon: GraduationCap,
    color: 'border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/5',
  },
  {
    id: 'CONFUSED',
    category: 'CONFUSED',
    label: "I'm Not Sure",
    desc: 'Explain what you want to achieve and Nexora will route you to the right desk',
    icon: HelpCircle,
    color: 'border-slate-500/30 text-slate-600 dark:text-slate-400 bg-slate-500/5',
  },
];

interface Step2Option {
  id: string;
  label: string;
  desc: string;
  targetCategory: string;
  targetSubcategory?: string;
  actionUrlOverride?: string;
  actionLabelOverride?: string;
  requirements?: string[];
  processSteps?: string[];
  whatHappensNext?: string[];
  responsibleRole?: string;
  sla?: string;
}

const STEP_2_QUESTIONS: Record<string, { question: string; options: Step2Option[] }> = {
  HOSTEL_LEAVE: {
    question: 'What type of hostel absence do you require?',
    options: [
      {
        id: 'leave_home',
        label: 'Home Vacation / Family Travel',
        desc: 'Overnight journey home or vacation leave exceeding 24 hours',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'LEAVE',
        actionUrlOverride: '/student/leave',
        actionLabelOverride: 'Apply for Hostel Leave',
        requirements: [
          'Confirmed travel start and return dates',
          'Parent / Guardian phone number reachable for verification',
          'Explicit parental consent confirmation',
          'Hostel room and block registration',
        ],
        processSteps: [
          'Submit digital Leave Application on Nexora at least 24 hours prior to travel',
          'Hostel Warden receives instant dispatch and inspects room clearance',
          'Parent consent phone verification conducted for leaves over 3 days',
          'Warden grants digital endorsement with cryptographic authorization',
          'Present approved leave at Main Gate security scanner upon departure',
        ],
        whatHappensNext: [
          'Warden receives immediate notification with 12-hour SLA response clock',
          'Upon warden approval, departure turnstile clearance is enabled at Gate 1 & 2',
          'When returning, security scans your ID to record return timestamp automatically',
        ],
        responsibleRole: 'Hostel Block Warden',
        sla: 'Within 12 Hours (Emergency: 2h)',
      },
      {
        id: 'leave_emergency',
        label: 'Emergency / Medical Leave',
        desc: 'Urgent medical absence or family emergency requiring immediate exit',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'LEAVE',
        actionUrlOverride: '/student/leave',
        actionLabelOverride: 'Apply for Urgent Leave',
        requirements: [
          'Medical prescription or reason for urgent departure',
          'Reachable parent contact number',
          'Room caretaker intimation',
        ],
        processSteps: [
          'Select "Emergency / Medical" as reason in leave form',
          'Hostel warden alerted via priority notification',
          'Fast-track verification processed within 2 hours',
          'Exit enabled at turnstile immediately upon approval',
        ],
        whatHappensNext: [
          'Priority notification dispatched to Block Caretaker and Warden',
          'Medical condonation ledger updated if absence exceeds 3 days',
        ],
        responsibleRole: 'Hostel Block Warden & Campus Health Officer',
        sla: '2 Hours (Emergency SLA)',
      },
    ],
  },
  BONAFIDE: {
    question: 'What is the purpose of your Bonafide Certificate?',
    options: [
      {
        id: 'bonafide_scholarship',
        label: 'Scholarship Application (State / NSP)',
        desc: 'Official proof of enrollment for PRERANA, Medhabruti, or Central Sector Portal',
        targetCategory: 'CERTIFICATE',
        targetSubcategory: 'BONAFIDE',
        actionUrlOverride: '/student/documents?purpose=Scholarship',
        actionLabelOverride: 'Start Scholarship Bonafide',
        requirements: [
          'Active student registration number (Roll Number)',
          'Current academic branch and semester details',
          'Fee dues clearance in accounts ledger',
        ],
        processSteps: [
          'Submit digital Bonafide request selecting "Scholarship"',
          'Academic Affairs Cell validates enrollment standing and attendance rate',
          'Digital certificate generated with HMAC QR verification code',
          'Download signed PDF from Documents & Bonafide tab',
          'Submit to Nodal Scholarship Officer for biometric endorsement',
        ],
        whatHappensNext: [
          'Academic Cell processes digital signature within 24 to 48 hours',
          'Unique verification link generated for government portal scrutiny',
        ],
        responsibleRole: 'Academic Affairs Officer (Window 3, Admin Block)',
        sla: '24 to 48 Working Hours',
      },
      {
        id: 'bonafide_bank',
        label: 'Bank Education Loan / Account Opening',
        desc: 'Mandatory verification document for nationalized and private bank loans',
        targetCategory: 'CERTIFICATE',
        targetSubcategory: 'BONAFIDE',
        actionUrlOverride: '/student/documents?purpose=Bank',
        actionLabelOverride: 'Apply for Bank Bonafide',
        requirements: [
          'Student identity card and roll number',
          'Bank name and loan branch details',
        ],
        processSteps: [
          'Submit Bonafide request with purpose "Bank"',
          'Academic Officer verifies active standing',
          'Download certified PDF with digital stamp and QR verification',
          'Physical embossed seal can be stamped at Window 3 if mandated by bank',
        ],
        whatHappensNext: [
          'Issued PDF stored securely in your permanent student vault',
          'Public URL resolves live validity status when scanned by bank managers',
        ],
        responsibleRole: 'Academic Operations Officer',
        sla: '24 to 48 Hours',
      },
      {
        id: 'bonafide_internship',
        label: 'Summer Internship NOC / Recommendation',
        desc: 'Institutional No-Objection Certificate verifying student absence permission',
        targetCategory: 'INTERNSHIP',
        targetSubcategory: 'NOC',
        actionUrlOverride: '/student/documents?purpose=Internship',
        actionLabelOverride: 'Apply for Internship NOC',
        requirements: [
          'Company offer letter or official selection email',
          'Internship start and end dates',
          'Attendance standing >= 75%',
        ],
        processSteps: [
          'Apply for Bonafide selecting purpose "Internship"',
          'Academic Officer verifies absence does not clash with semester exams',
          'Digital NOC issued with departmental clearance endorsement',
        ],
        whatHappensNext: [
          'PDF generated and copied to Training & Placement Cell records',
        ],
        responsibleRole: 'Academic Affairs & T&P Cell',
        sla: '48 Hours',
      },
    ],
  },
  COMPLAINT: {
    question: 'What kind of facility or room issue are you experiencing?',
    options: [
      {
        id: 'comp_electrical',
        label: 'Electrical Breakdown (Fan, Light, Switch, Geyser)',
        desc: 'Sparking switch, broken fan capacitor, non-functional light, or power outage',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'COMPLAINT',
        actionUrlOverride: '/student/requests/new',
        actionLabelOverride: 'Log Electrical Complaint',
        requirements: [
          'Hostel block and exact room/floor number',
          'Description of breakdown (e.g. fan sparking, fuse blown)',
        ],
        processSteps: [
          'Describe issue under New Complaint on Nexora',
          'Automatic keyword router dispatches ticket to Senior Electrician (Ramesh Kumar)',
          'Technician visits room during operating hours (9 AM – 6 PM)',
          'Upon repair, technician logs resolution notes',
          'Student confirms work completion and submits 1–5 star rating',
        ],
        whatHappensNext: [
          'Electrician receives mobile dispatch notification with room location',
          'SLA timer starts immediately: Urgent repairs within 4h, Normal within 24h',
        ],
        responsibleRole: 'Estate Maintenance Wing (Electrical Section)',
        sla: 'Urgent: 4 Hours | Normal: 24 Hours',
      },
      {
        id: 'comp_plumbing',
        label: 'Plumbing Issue (Tap Leak, Pipe Burst, Choked Drain)',
        desc: 'Leaking faucet, washroom drainage overflow, or no water supply',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'COMPLAINT',
        actionUrlOverride: '/student/requests/new',
        actionLabelOverride: 'Log Plumbing Complaint',
        requirements: [
          'Hostel room and floor area',
          'Specific description of leak or blockage',
        ],
        processSteps: [
          'Log complaint with priority (Urgent for pipe burst, Normal for minor tap leak)',
          'Routed automatically to Estate Plumber (Suresh Pradhan)',
          'Technician attends to repair and records parts replaced',
          'Student verifies resolution in room',
        ],
        whatHappensNext: [
          'Automatic assignment to dedicated plumbing personnel with real-time tracking',
        ],
        responsibleRole: 'Estate Maintenance Wing (Plumbing Section)',
        sla: 'Urgent: 4 Hours | Normal: 24 Hours',
      },
      {
        id: 'comp_network',
        label: 'Wi-Fi 6 & IT Connectivity Problem',
        desc: 'SSID disconnection, captive portal redirect failure, or MAC address registration',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'COMPLAINT',
        actionUrlOverride: '/student/requests/new',
        actionLabelOverride: 'Log Wi-Fi Issue',
        requirements: [
          'Device physical MAC address',
          'Hostel wing and room location',
        ],
        processSteps: [
          'Submit IT support ticket with device MAC address',
          'Computer Center network engineer inspects access point connectivity',
          'Captive portal authorization reset performed remotely',
        ],
        whatHappensNext: [
          'Network operations desk verifies signal strength and updates ticket status',
        ],
        responsibleRole: 'Computer Center & IT Wing (Room 004, CSE Block)',
        sla: 'Same Day (9 AM – 5 PM)',
      },
    ],
  },
  GATE_PASS: {
    question: 'What type of gate pass do you need to generate?',
    options: [
      {
        id: 'pass_market',
        label: 'Market Visit / Short City Errands',
        desc: 'Daytime campus exit for study materials, medical pharmacy, or groceries',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'GATE_PASS',
        actionUrlOverride: '/student/gate-pass',
        actionLabelOverride: 'Apply for Gate Pass',
        requirements: [
          'Stated destination and purpose',
          'Departure and return time within curfew (Return by 8:30 PM for seniors, 7:30 PM for freshers)',
        ],
        processSteps: [
          'Fill Gate Pass destination and return window',
          'Hostel Warden receives instant digital dispatch',
          'Upon review, dynamic HMAC QR code and 4-digit PIN are generated',
          'Present QR code or PIN at Gate 1 or Gate 2 scanner',
          'Security verifies and logs outbound and inbound timestamps',
        ],
        whatHappensNext: [
          'Warden receives approval prompt with 2–4 hour SLA',
          'Once approved, active pass appears on your dashboard ready for scanning',
        ],
        responsibleRole: 'Hostel Warden & Main Gate Security',
        sla: '2 to 4 Hours',
      },
    ],
  },
  TRACK_REQUEST: {
    question: 'Which submitted records do you wish to inspect?',
    options: [
      {
        id: 'track_all',
        label: 'View All Active & Historical Requests',
        desc: 'Check live status of complaints, leaves, bonafide requests, and passes',
        targetCategory: 'GENERAL',
        actionUrlOverride: '/student/requests',
        actionLabelOverride: 'Open Requests Ledger',
        requirements: [
          'Authenticated student login session',
          'Request ticket number (e.g. NX-10291) if querying a specific ticket',
        ],
        processSteps: [
          'Navigate to My Requests to inspect live progress cards',
          'Review status badges: SUBMITTED, ASSIGNED, IN_PROGRESS, APPROVED, RESOLVED',
          'Click on any request to view timeline and assigned officer details',
        ],
        whatHappensNext: [
          'Live database synchronization displays current status verified by backend',
        ],
        responsibleRole: 'Central Operations Command Center',
        sla: 'Real-Time Telemetry',
      },
    ],
  },
  ROUTINE: {
    question: 'What timetable information are you looking for?',
    options: [
      {
        id: 'rout_today',
        label: "Today's Schedule & Room Numbers",
        desc: 'Inspect period hours, lecture halls, and assigned faculty for today',
        targetCategory: 'ROUTINE',
        targetSubcategory: 'ROUTINE',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: "View Today's Routine",
        requirements: ['Active student cohort (Branch & Year)'],
        processSteps: [
          'Open Academic Hub or ask Copilot "What classes do I have today?"',
          'Review period timings, room allocations (e.g. LH-101), and faculty',
          'Report 5 minutes prior to period commencement',
        ],
        whatHappensNext: [
          'Attendance recorded digitally by subject faculty at start of lecture',
        ],
        responsibleRole: 'Academic Department Faculty & Timetable Coordinator',
        sla: 'Instant View',
      },
      {
        id: 'rout_weekly',
        label: 'Full Weekly Branch Timetable Grid',
        desc: 'Comprehensive Monday-to-Friday schedule including labs and tutorials',
        targetCategory: 'ROUTINE',
        targetSubcategory: 'ROUTINE',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: 'Open Weekly Timetable',
        requirements: ['Student semester registration'],
        processSteps: [
          'Access complete weekly grid under Academic Hub',
          'Check lab session timings and elective subject batches',
        ],
        whatHappensNext: ['Synchronized weekly from central academic database'],
        responsibleRole: 'Academic Dean Office',
        sla: 'Instant View',
      },
    ],
  },
  NOTICE: {
    question: 'What announcements do you need to view?',
    options: [
      {
        id: 'not_circulars',
        label: 'Official Circulars & Exam Notifications',
        desc: 'BPUT university guidelines, semester registration cutoffs, and holiday notices',
        targetCategory: 'NOTICE',
        targetSubcategory: 'NOTICE',
        actionUrlOverride: '/student/notices',
        actionLabelOverride: 'Browse Campus Notices',
        requirements: ['Enrolled student account'],
        processSteps: [
          'Browse targeted notice board filtered by branch, year, and urgency',
          'Inspect high-priority circulars signed by Dean / Registrar',
        ],
        whatHappensNext: [
          'Urgent notices push broadcast alerts to student dashboards and mobile views',
        ],
        responsibleRole: 'Academic Registrar & Notice Cell',
        sla: 'Live Notice Stream',
      },
    ],
  },
  ATTENDANCE: {
    question: 'What attendance assistance do you require?',
    options: [
      {
        id: 'att_standing',
        label: 'Check 75% Cutoff & Mathematical Margin',
        desc: 'Inspect overall percentage, subject-wise ledger, and safe class bunk calculation',
        targetCategory: 'ACADEMIC_REQUEST',
        targetSubcategory: 'ATTENDANCE',
        actionUrlOverride: '/student/attendance',
        actionLabelOverride: 'Open Attendance Ledger',
        requirements: [
          'Student roll number linked to active semester enrollment',
          'Official attendance records updated by course instructors',
        ],
        processSteps: [
          'Open Attendance Ledger to view subject-by-subject attendance',
          'Inspect mathematical margin: safe upcoming misses (if >= 75%) or required consecutive classes (if < 75%)',
          'Consult faculty coordinator if discrepancy exists',
        ],
        whatHappensNext: [
          'Official admit card generation requires minimum 75% attendance in each registered subject',
        ],
        responsibleRole: 'Department Academic Coordinator & Course Faculty',
        sla: 'Updated Weekly Post-Lecture',
      },
      {
        id: 'att_condonation',
        label: 'Medical Condonation Guidelines (65%–74.9%)',
        desc: 'Procedures for formal attendance relaxation on certified hospitalization grounds',
        targetCategory: 'ACADEMIC_REQUEST',
        targetSubcategory: 'ATTENDANCE',
        actionUrlOverride: '/student/attendance',
        actionLabelOverride: 'Review Condonation Policy',
        requirements: [
          'Registered medical fitness certificate and hospital discharge slip',
          'Submission within 7 calendar days of returning to campus',
          'Minimum 65% attendance before condonation review',
        ],
        processSteps: [
          'Submit medical certificates to Academic Affairs Cell (Window 3)',
          'Academic Committee scrutinizes hospital documentation',
          'Up to 10% condonation recorded in university ERP',
        ],
        whatHappensNext: [
          'Condoned classes marked EXCUSED in attendance ledger, restoring exam eligibility',
        ],
        responsibleRole: 'Academic Cell Committee',
        sla: '5 Working Days Post-Submission',
      },
    ],
  },
  CONFUSED: {
    question: 'What are you trying to accomplish?',
    options: [
      {
        id: 'conf_leave',
        label: 'I need to travel home or out of campus',
        desc: 'Apply for multi-day hostel leave or same-day exit gate pass',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'LEAVE',
        actionUrlOverride: '/student/leave',
        actionLabelOverride: 'Go to Hostel Leave',
        requirements: ['Travel dates', 'Parent contact number'],
        processSteps: ['Submit digital leave request', 'Warden review', 'Gate turnstile exit'],
        responsibleRole: 'Hostel Block Warden',
        sla: '12 Hours',
      },
      {
        id: 'conf_cert',
        label: 'I need an official certificate or proof of study',
        desc: 'Bonafide certificate for scholarship, bank loan, passport, or internship',
        targetCategory: 'CERTIFICATE',
        targetSubcategory: 'BONAFIDE',
        actionUrlOverride: '/student/documents?purpose=Scholarship',
        actionLabelOverride: 'Apply for Bonafide',
        requirements: ['Student roll number', 'Stated purpose'],
        processSteps: ['Submit request', 'Academic officer certification', 'Download verified PDF'],
        responsibleRole: 'Academic Affairs Cell',
        sla: '24–48 Hours',
      },
      {
        id: 'conf_repair',
        label: 'Something is broken in my hostel room',
        desc: 'Fan, light, tap, plumbing, door lock, or Wi-Fi problem',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'COMPLAINT',
        actionUrlOverride: '/student/requests/new',
        actionLabelOverride: 'Log Room Repair',
        requirements: ['Room number', 'Breakdown description'],
        processSteps: ['Log ticket', 'Automatic dispatch to technician', 'Repair and verification'],
        responsibleRole: 'Estate Maintenance Wing',
        sla: '4h Urgent / 24h Normal',
      },
      {
        id: 'conf_attendance',
        label: 'I need to check if I can sit for examinations',
        desc: 'Verify if your current attendance clears the mandatory 75% cutoff',
        targetCategory: 'ACADEMIC_REQUEST',
        targetSubcategory: 'ATTENDANCE',
        actionUrlOverride: '/student/attendance',
        actionLabelOverride: 'Check Attendance Status',
        requirements: ['Roll number'],
        processSteps: ['Open attendance ledger', 'Review safe misses or needed classes'],
        responsibleRole: 'Academic Coordinator',
        sla: 'Instant View',
      },
    ],
  },
};

export default function StudentGuidancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubOption, setSelectedSubOption] = useState<Step2Option | null>(null);

  const [guidanceItems, setGuidanceItems] = useState<any[]>([]);
  const [resolvedItem, setResolvedItem] = useState<any | null>(null);
  const [loadingGuidance, setLoadingGuidance] = useState(true);

  // Live verified backend telemetry state
  const [liveRequests, setLiveRequests] = useState<any[]>([]);
  const [liveGatePasses, setLiveGatePasses] = useState<any[]>([]);
  const [liveAttendance, setLiveAttendance] = useState<any | null>(null);
  const [liveRoutine, setLiveRoutine] = useState<any | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  useEffect(() => {
    const fetchGuidanceDb = async () => {
      setLoadingGuidance(true);
      const res = await apiRequest('/student/guidance');
      if (res.success && res.data) {
        setGuidanceItems(res.data);
      }
      setLoadingGuidance(false);
    };
    fetchGuidanceDb();
  }, []);

  // Fetch live verified records when user reaches Step 3
  useEffect(() => {
    if (currentStep === 3) {
      const fetchVerifiedTelemetry = async () => {
        setLoadingTelemetry(true);
        try {
          const [reqRes, gpRes, attRes, routRes] = await Promise.all([
            apiRequest('/requests/my'),
            apiRequest('/gate-passes/my'),
            apiRequest('/student/attendance'),
            apiRequest('/student/routine'),
          ]);
          if (reqRes.success && reqRes.data) setLiveRequests(reqRes.data);
          if (gpRes.success && gpRes.data) setLiveGatePasses(gpRes.data);
          if (attRes.success && attRes.data) setLiveAttendance(attRes.data);
          if (routRes.success && routRes.data) setLiveRoutine(routRes.data);
        } catch (err) {
          console.warn('[Process Navigator] Could not fetch live telemetry:', err);
        } finally {
          setLoadingTelemetry(false);
        }
      };
      fetchVerifiedTelemetry();
    }
  }, [currentStep]);

  useEffect(() => {
    const queryCat = searchParams.get('category');
    if (queryCat && STEP_1_OPTIONS.some((o) => o.category === queryCat.toUpperCase())) {
      setSelectedCategory(queryCat.toUpperCase());
      setCurrentStep(2);
    }
  }, [searchParams]);

  const handleSelectStep1 = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubOption(null);
    setResolvedItem(null);
    setCurrentStep(2);
  };

  const handleSelectStep2 = (option: Step2Option) => {
    setSelectedSubOption(option);

    const match = guidanceItems.find((item) => {
      if (option.targetSubcategory && item.subcategory === option.targetSubcategory) {
        return true;
      }
      if (item.category === option.targetCategory) {
        return true;
      }
      return false;
    });

    setResolvedItem({
      title: option.label,
      category: option.targetCategory,
      subcategory: option.targetSubcategory,
      description: option.desc,
      requiredDocs: option.requirements || match?.requiredDocs || [
        'Student Roll Number & ID Card',
        'Academic Year and Branch Registration',
        'Stated Purpose & Supporting Details',
      ],
      processSteps: option.processSteps || match?.processSteps || [
        'Access the official Nexora campus service module',
        'Fill in verified student information',
        'Submit request for departmental review',
        'Track live progress on your dashboard',
      ],
      whatHappensNext: option.whatHappensNext || [
        'Ticket dispatched to responsible office with SLA timer activated',
        'Real-time status updates broadcast to your student portal',
      ],
      responsibleRole: option.responsibleRole || match?.responsibleRole || 'Academic Operations Officer',
      turnaroundSla: option.sla || '24 to 48 Hours',
      actionUrl: option.actionUrlOverride || match?.actionUrl || '/student/dashboard',
      actionLabel: option.actionLabelOverride || match?.actionLabel || 'Proceed to Form',
    });

    setCurrentStep(3);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedCategory(null);
    setSelectedSubOption(null);
    setResolvedItem(null);
  };

  const step2Config = selectedCategory ? STEP_2_QUESTIONS[selectedCategory] : null;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-12 animate-tab-fade">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden bg-surface border border-border dark:bg-gradient-to-r dark:from-[#171427] dark:via-[#1a1f33] dark:to-[#141b2c] dark:border-[#5B20A0]/50 dark:hover:border-[#7A3DB8] dark:shadow-xl dark:shadow-[#5B20A0]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary dark:bg-[#1b2234] dark:border-[#18C5D8]/40 dark:text-[#18C5D8] text-[10px] font-mono font-bold uppercase tracking-wider mb-2.5">
              <Compass size={13} />
              <span>Campus Navigator &amp; Process Guide</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              Campus Process Navigator
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Find verified requirements, official department workflows, and live request status for every campus procedure.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {currentStep > 1 && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-surface-hover border border-border text-xs font-semibold text-foreground transition active:scale-95 shadow-xs"
              >
                <RotateCcw size={13} />
                <span>Start Over</span>
              </button>
            )}
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2 max-w-md">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                currentStep >= 1
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface-secondary text-muted-foreground border border-border'
              }`}
            >
              1
            </span>
            <span className={`text-xs font-semibold ${currentStep === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Select Task
            </span>
          </div>

          <div className="h-0.5 w-10 sm:w-16 bg-border" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                currentStep >= 2
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface-secondary text-muted-foreground border border-border'
              }`}
            >
              2
            </span>
            <span className={`text-xs font-semibold ${currentStep === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Clarify Requirement
            </span>
          </div>

          <div className="h-0.5 w-10 sm:w-16 bg-border" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                currentStep >= 3
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-surface-secondary text-muted-foreground border border-border'
              }`}
            >
              3
            </span>
            <span className={`text-xs font-semibold ${currentStep === 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Verified Workflow &amp; Form
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: What campus procedure do you want to navigate? */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-tab-fade">
          <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
            <div>
              <div className="text-[11px] uppercase font-mono font-bold text-primary tracking-wider mb-1">
                STEP 1 OF 3 • SELECT CAMPUS PROCEDURE
              </div>
              <h2 className="text-base sm:text-xl font-bold text-foreground tracking-tight">
                What campus task do you want to complete?
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose an official procedure below to inspect verified prerequisites, turnaround times, and direct form links.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {STEP_1_OPTIONS.map((opt) => {
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectStep1(opt.category)}
                    className={`p-4 sm:p-5 rounded-2xl bg-surface hover:bg-surface-secondary border ${opt.color} text-left transition-all duration-150 flex flex-col justify-between group shadow-xs active:scale-[0.99]`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={20} />
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all"
                      />
                    </div>

                    <div>
                      <div className="font-bold text-sm text-foreground group-hover:text-primary transition">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Clarification based on selection */}
      {currentStep === 2 && step2Config && (
        <div className="space-y-4 animate-tab-fade">
          <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="text-[11px] uppercase font-mono font-bold text-primary tracking-wider mb-1">
                  STEP 2 OF 3 • CLARIFICATION &amp; PURPOSE
                </div>
                <h2 className="text-base sm:text-xl font-bold text-foreground tracking-tight">
                  {step2Config.question}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {step2Config.options.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectStep2(sub)}
                  className="w-full p-4 sm:p-5 rounded-2xl bg-surface hover:bg-surface-secondary border border-border hover:border-primary/60 text-left transition flex items-center justify-between gap-4 group shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-foreground group-hover:text-primary transition flex items-center gap-2">
                      <span>{sub.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                      {sub.desc}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-surface-secondary border border-border text-muted-foreground group-hover:text-primary-foreground group-hover:bg-primary group-hover:border-primary flex items-center justify-center shrink-0 transition">
                    <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Result, Verified Workflow & Live Telemetry Verification */}
      {currentStep === 3 && resolvedItem && (
        <div className="space-y-6 animate-tab-fade">
          <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
            {/* Resolution Banner */}
            <div className="border-b border-border pb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold mb-3 shadow-xs">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>VERIFIED CAMPUS WORKFLOW &amp; PREREQUISITES</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                {resolvedItem.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                {resolvedItem.description}
              </p>
            </div>

            {/* LIVE VERIFIED BACKEND TELEMETRY PANEL (Requirement #6: Display actual status verified by backend) */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 dark:bg-[#141b2c] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary dark:text-[#18C5D8] uppercase tracking-wider">
                  <Sparkles size={14} />
                  <span>Verified Live Records (Current Session)</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Synchronized from Central Database
                </span>
              </div>

              {loadingTelemetry ? (
                <div className="text-xs text-muted-foreground animate-pulse py-2">
                  Checking verified records...
                </div>
              ) : selectedCategory === 'GATE_PASS' ? (
                <div>
                  {liveGatePasses.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs text-foreground">
                        You have <strong>{liveGatePasses.length} gate pass(es)</strong> on record.
                      </div>
                      <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold">
                            Destination: {liveGatePasses[0].destination}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Status: <span className="font-mono font-bold text-primary">{liveGatePasses[0].gateStatus}</span> • PIN: <code className="font-mono font-bold text-foreground">{liveGatePasses[0].passPin}</code>
                          </div>
                        </div>
                        <Link
                          href="/student/gate-pass"
                          className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-xs font-bold text-primary hover:underline"
                        >
                          View Pass &rarr;
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No active gate passes on record. You can apply for a day outpass using the button below.
                    </div>
                  )}
                </div>
              ) : selectedCategory === 'ATTENDANCE' ? (
                <div>
                  {liveAttendance ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div className="text-xs text-foreground">
                          Current Overall Attendance:{' '}
                          <strong className="text-sm font-mono text-primary">
                            {liveAttendance.overall?.percentage}%
                          </strong>{' '}
                          ({liveAttendance.overall?.present} / {liveAttendance.overall?.total} classes)
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            liveAttendance.overall?.isAboveThreshold
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {liveAttendance.overall?.isAboveThreshold ? 'Eligible (>=75%)' : 'Shortage (<75%)'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {liveAttendance.overall?.insight || 'Attendance is updated weekly following completed lectures.'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Attendance records synchronizing...</div>
                  )}
                </div>
              ) : selectedCategory === 'ROUTINE' ? (
                <div>
                  {liveRoutine ? (
                    <div className="text-xs text-foreground">
                      Scheduled for <strong>{liveRoutine.today}</strong>: <strong>{liveRoutine.todayClasses?.length || 0} classes</strong>.
                      {liveRoutine.todayClasses?.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          Next: {liveRoutine.todayClasses[0].subjectName} ({liveRoutine.todayClasses[0].startTime}) in Room {liveRoutine.todayClasses[0].room}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Class routine verified against academic timetable.</div>
                  )}
                </div>
              ) : (
                <div>
                  {liveRequests.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-xs text-foreground">
                        You have <strong>{liveRequests.length} active/recent request(s)</strong> in the system:
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Latest: <strong>[{liveRequests[0].requestNumber}]</strong> {liveRequests[0].title} — <span className="font-mono text-primary">{liveRequests[0].status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No active requests currently pending. Proceed below to submit a new verified application.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Structured Breakdown: Required Info & Process */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Required Documents / Information */}
              <div className="bg-surface-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase font-mono tracking-wider">
                  <FileText size={15} />
                  <span>Mandatory Prerequisites &amp; Documents</span>
                </div>

                <div className="space-y-2">
                  {Array.isArray(resolvedItem.requiredDocs) && resolvedItem.requiredDocs.length > 0 ? (
                    resolvedItem.requiredDocs.map((doc: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{doc}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">Standard student identity verification.</div>
                  )}
                </div>
              </div>

              {/* End-to-End Campus Process */}
              <div className="bg-surface-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase font-mono tracking-wider">
                  <Clock size={15} />
                  <span>Step-by-Step Procedure</span>
                </div>

                <div className="space-y-2 text-xs">
                  {Array.isArray(resolvedItem.processSteps) && resolvedItem.processSteps.length > 0 ? (
                    resolvedItem.processSteps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-foreground">
                        <span className="w-5 h-5 rounded-full bg-surface text-primary border border-border font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">1. Fill application 2. Review 3. Decision.</div>
                  )}
                </div>
              </div>
            </div>

            {/* WHAT HAPPENS NEXT SECTION (Requirement #5) */}
            <div className="bg-surface-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase font-mono tracking-wider">
                <ArrowRight size={15} />
                <span>What Happens Next (Post-Submission Lifecycle)</span>
              </div>
              <div className="space-y-2 text-xs text-foreground">
                {Array.isArray(resolvedItem.whatHappensNext) && resolvedItem.whatHappensNext.length > 0 ? (
                  resolvedItem.whatHappensNext.map((nextItem: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">{nextItem}</span>
                    </div>
                  ))
                ) : (
                  <div>
                    Your application is reviewed by the responsible department, and you will receive digital notification upon decision.
                  </div>
                )}
              </div>
            </div>

            {/* Department Ownership & Verification SLA */}
            <div className="p-4 rounded-xl bg-surface-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-foreground">
                <Shield size={16} className="text-primary shrink-0" />
                <span>
                  Responsible Authority:{' '}
                  <strong className="text-foreground">{resolvedItem.responsibleRole}</strong>
                </span>
              </div>

              <div className="text-muted-foreground text-[11px]">
                Standard Turnaround SLA:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {resolvedItem.turnaroundSla}
                </strong>
              </div>
            </div>

            {/* FINAL ACTION AREA: Connect directly to existing Nexora form */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground text-xs font-semibold transition"
              >
                &larr; Explore Other Process
              </button>

              <Link
                href={resolvedItem.actionUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                <span>{resolvedItem.actionLabel || 'Start Application'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
