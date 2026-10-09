'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
    id: 'CERTIFICATE',
    category: 'CERTIFICATE',
    label: 'Certificate',
    desc: 'Bonafide, enrollment proof, bank verification, passport documentation',
    icon: FileCheck,
    color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
  },
  {
    id: 'ACADEMIC_REQUEST',
    category: 'ACADEMIC_REQUEST',
    label: 'Academic Request',
    desc: 'Timetable discrepancy, attendance condonation, subject corrections',
    icon: BookOpen,
    color: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5',
  },
  {
    id: 'INTERNSHIP',
    category: 'INTERNSHIP',
    label: 'Internship',
    desc: 'Summer training NOC, company offer letters, absence permission',
    icon: Briefcase,
    color: 'border-purple-500/30 text-purple-600 dark:text-purple-300 bg-purple-500/5',
  },
  {
    id: 'SCHOLARSHIP',
    category: 'SCHOLARSHIP',
    label: 'Scholarship',
    desc: 'NSP verification, state portal certification, fee structure proof',
    icon: DollarSign,
    color: 'border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5',
  },
  {
    id: 'EXAMINATION',
    category: 'EXAMINATION',
    label: 'Examination',
    desc: 'Exam form registration, admit card guidelines, schedule & backlogs',
    icon: FlaskConical,
    color: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5',
  },
  {
    id: 'HOSTEL',
    category: 'HOSTEL',
    label: 'Hostel',
    desc: 'Outstation leave, exit gate pass, room plumbing & electrical repair',
    icon: Building,
    color: 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/5',
  },
  {
    id: 'ROUTINE',
    category: 'ROUTINE',
    label: 'Academic Routine',
    desc: 'Daily lecture schedule, room allocations, faculty timetable',
    icon: Calendar,
    color: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5',
  },
  {
    id: 'NOTICE',
    category: 'NOTICE',
    label: 'Academic Notice',
    desc: 'Official university circulars, mid-semester guidelines, holidays',
    icon: Bell,
    color: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5',
  },
  {
    id: 'CONFUSED',
    category: 'CONFUSED',
    label: "I'm not sure",
    desc: 'Tell us what you want to achieve and we will route you to the right desk',
    icon: HelpCircle,
    color: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5',
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
}

const STEP_2_QUESTIONS: Record<string, { question: string; options: Step2Option[] }> = {
  CERTIFICATE: {
    question: 'What type of certificate or verification do you need?',
    options: [
      {
        id: 'cert_bonafide',
        label: 'Bonafide Certificate',
        desc: 'For scholarship, bank account opening, hackathon participation, or passport',
        targetCategory: 'CERTIFICATE',
        targetSubcategory: 'BONAFIDE',
        actionUrlOverride: '/student/documents?purpose=Scholarship',
        actionLabelOverride: 'Start Bonafide Application',
      },
      {
        id: 'cert_other',
        label: 'Other Academic Certificate / Clearance',
        desc: 'Custom verification or institutional character certification',
        targetCategory: 'GENERAL',
        actionUrlOverride: '/student/documents?purpose=Other',
        actionLabelOverride: 'Request Academic Clearance',
      },
      {
        id: 'cert_unsure',
        label: "I'm not sure",
        desc: 'I need to check requirements for my application',
        targetCategory: 'CERTIFICATE',
        targetSubcategory: 'BONAFIDE',
      },
    ],
  },
  ACADEMIC_REQUEST: {
    question: 'What kind of academic issue or request do you have?',
    options: [
      {
        id: 'acad_attendance',
        label: 'Attendance Discrepancy / Condonation',
        desc: 'Check missed lectures, medical exemption, or percentage review',
        targetCategory: 'ACADEMIC_REQUEST',
        targetSubcategory: 'ATTENDANCE',
        actionUrlOverride: '/student/attendance',
        actionLabelOverride: 'Review Attendance Ledger',
      },
      {
        id: 'acad_routine',
        label: 'Routine or Classroom Clarification',
        desc: 'Look up classroom halls, lab timings, or teacher allocations',
        targetCategory: 'ROUTINE',
        targetSubcategory: 'ROUTINE',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: 'View Class Routine',
      },
      {
        id: 'acad_office',
        label: 'Contact Academic Office',
        desc: 'Consult Academic Officer Prof. Sanjeev Mohanty in Administrative Block',
        targetCategory: 'GENERAL',
        actionUrlOverride: '/student/dashboard',
        actionLabelOverride: 'Open Student Desk',
      },
    ],
  },
  INTERNSHIP: {
    question: 'What documentation is required for your internship?',
    options: [
      {
        id: 'intern_noc',
        label: 'Internship NOC & Recommendation',
        desc: 'Formal institutional clearance letter verifying dates and absence clearance',
        targetCategory: 'INTERNSHIP',
        targetSubcategory: 'NOC',
        actionUrlOverride: '/student/documents?purpose=Internship',
        actionLabelOverride: 'Apply for Internship NOC',
      },
      {
        id: 'intern_routine',
        label: 'Class Routine & Exam Date Verification',
        desc: 'Verify that your internship period does not overlap with semester exams',
        targetCategory: 'ROUTINE',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: 'Check Exam & Class Schedule',
      },
      {
        id: 'intern_unsure',
        label: "I'm not sure",
        desc: 'Guide me through the standard internship approval process',
        targetCategory: 'INTERNSHIP',
        targetSubcategory: 'NOC',
      },
    ],
  },
  SCHOLARSHIP: {
    question: 'What scholarship documentation is requested by the portal?',
    options: [
      {
        id: 'sch_bonafide',
        label: 'Bonafide Certificate for Scholarship',
        desc: 'Required by National Scholarship Portal (NSP) and State Post-Matric portals',
        targetCategory: 'SCHOLARSHIP',
        targetSubcategory: 'SCHOLARSHIP',
        actionUrlOverride: '/student/documents?purpose=Scholarship',
        actionLabelOverride: 'Apply for Scholarship Bonafide',
      },
      {
        id: 'sch_fee',
        label: 'Fee Structure & Enrolment Certificate',
        desc: 'Official fee breakdown slip and term admission receipt',
        targetCategory: 'CERTIFICATE',
        targetSubcategory: 'BONAFIDE',
        actionUrlOverride: '/student/documents?purpose=Scholarship',
        actionLabelOverride: 'Start Certificate Request',
      },
      {
        id: 'sch_deadline',
        label: 'Check Scholarship Verification Deadline',
        desc: 'Confirm the university last date for online portal verification',
        targetCategory: 'NOTICE',
        actionUrlOverride: '/student/dashboard',
        actionLabelOverride: 'View Upcoming Deadlines',
      },
    ],
  },
  EXAMINATION: {
    question: 'What examination support are you looking for?',
    options: [
      {
        id: 'exam_form',
        label: 'Mid-Semester Exam Registration & Form',
        desc: 'Registration rules, subject code verification, and backlog paper details',
        targetCategory: 'EXAMINATION',
        targetSubcategory: 'EXAM_FORM',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: 'Open Academic Hub',
      },
      {
        id: 'exam_routine',
        label: 'Exam Schedule & Hall Allocation',
        desc: 'Check subject test dates, timings, and examination room assignments',
        targetCategory: 'ROUTINE',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: 'View Academic Timetable',
      },
      {
        id: 'exam_attendance',
        label: '75% Attendance Eligibility Check',
        desc: 'Verify if your current subject percentages clear the university exam cutoff',
        targetCategory: 'ACADEMIC_REQUEST',
        targetSubcategory: 'ATTENDANCE',
        actionUrlOverride: '/student/attendance',
        actionLabelOverride: 'Check Attendance Status',
      },
    ],
  },
  HOSTEL: {
    question: 'Which hostel workflow do you need to initiate?',
    options: [
      {
        id: 'hostel_leave',
        label: 'Hostel Leave Application',
        desc: 'Multi-day outstation leave with parental consent and warden approval',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'LEAVE',
        actionUrlOverride: '/student/leave',
        actionLabelOverride: 'Apply for Hostel Leave',
      },
      {
        id: 'hostel_gatepass',
        label: 'Campus Exit Gate Pass',
        desc: 'Day pass for market visits, coaching, library, or short errands (QR & PIN)',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'GATE_PASS',
        actionUrlOverride: '/student/gate-pass',
        actionLabelOverride: 'Apply for Gate Pass',
      },
      {
        id: 'hostel_complaint',
        label: 'Room Repair & Maintenance',
        desc: 'Plumbing leak, broken fan/switch, furniture carpentry, WiFi issue',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'COMPLAINT',
        actionUrlOverride: '/student/requests/new',
        actionLabelOverride: 'Log Maintenance Complaint',
      },
    ],
  },
  ROUTINE: {
    question: 'What routine details do you need to look up?',
    options: [
      {
        id: 'rout_today',
        label: "Today's Class Schedule & Room Details",
        desc: 'See which lectures are active today, classroom numbers, and faculty',
        targetCategory: 'ROUTINE',
        targetSubcategory: 'ROUTINE',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: "View Today's Routine",
      },
      {
        id: 'rout_weekly',
        label: 'Complete Weekly Branch Timetable',
        desc: 'Full Mon-Fri schedule covering core lectures, labs, and tutorials',
        targetCategory: 'ROUTINE',
        targetSubcategory: 'ROUTINE',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: 'View Weekly Schedule',
      },
    ],
  },
  NOTICE: {
    question: 'What notice or circular are you seeking?',
    options: [
      {
        id: 'not_circular',
        label: 'Official Campus Circulars & Exam Dates',
        desc: 'Academic guidelines, registration schedules, and holiday announcements',
        targetCategory: 'NOTICE',
        targetSubcategory: 'NOTICE',
        actionUrlOverride: '/student/notices',
        actionLabelOverride: 'View Campus Notices',
      },
    ],
  },
  CONFUSED: {
    question: 'What are you trying to accomplish?',
    options: [
      {
        id: 'conf_intern',
        label: 'I need something for an internship',
        desc: 'Apply for official No-Objection Certificate (NOC) and absence clearance',
        targetCategory: 'INTERNSHIP',
        targetSubcategory: 'NOC',
        actionUrlOverride: '/student/documents?purpose=Internship',
        actionLabelOverride: 'Apply for Internship NOC',
      },
      {
        id: 'conf_scholar',
        label: 'I need something for a scholarship',
        desc: 'State or National scholarship verification document with digital seal',
        targetCategory: 'SCHOLARSHIP',
        targetSubcategory: 'SCHOLARSHIP',
        actionUrlOverride: '/student/documents?purpose=Scholarship',
        actionLabelOverride: 'Apply for Scholarship Bonafide',
      },
      {
        id: 'conf_exam',
        label: 'I need something for an exam',
        desc: 'Exam form submission, subject registration check, or attendance eligibility',
        targetCategory: 'EXAMINATION',
        targetSubcategory: 'EXAM_FORM',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: 'Check Exam Details',
      },
      {
        id: 'conf_cert',
        label: 'I need a certificate',
        desc: 'Official institutional Bonafide certificate for banking or identification',
        targetCategory: 'CERTIFICATE',
        targetSubcategory: 'BONAFIDE',
        actionUrlOverride: '/student/documents?purpose=Scholarship',
        actionLabelOverride: 'Start Bonafide Application',
      },
      {
        id: 'conf_routine',
        label: 'I need academic information',
        desc: 'Lecture schedules, classroom hall numbers, attendance rates, or circulars',
        targetCategory: 'ROUTINE',
        targetSubcategory: 'ROUTINE',
        actionUrlOverride: '/student/academics',
        actionLabelOverride: 'Open Academic Hub',
      },
      {
        id: 'conf_repair',
        label: 'I need to repair something in my hostel room',
        desc: 'Tap leak, broken switch, door hinge, fan repair, or washroom cleaning',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'COMPLAINT',
        actionUrlOverride: '/student/requests/new',
        actionLabelOverride: 'Log Room Complaint',
      },
      {
        id: 'conf_leave',
        label: 'I need to leave campus for a trip or market',
        desc: 'Day exit gate pass (QR/PIN) or multi-day outstation hostel leave',
        targetCategory: 'HOSTEL',
        targetSubcategory: 'LEAVE',
        actionUrlOverride: '/student/leave',
        actionLabelOverride: 'Apply for Leave / Pass',
      },
      {
        id: 'conf_office',
        label: 'I need to contact the academic office',
        desc: 'Direct consultation with Academic Officer Prof. Sanjeev Mohanty',
        targetCategory: 'GENERAL',
        actionUrlOverride: '/student/dashboard',
        actionLabelOverride: 'Go to Student Dashboard',
      },
      {
        id: 'conf_other',
        label: 'Something else',
        desc: 'General inquiry or campus support ticket',
        targetCategory: 'GENERAL',
        actionUrlOverride: '/student/requests/new',
        actionLabelOverride: 'Create Campus Request',
      },
    ],
  },
};

export default function StudentGuidancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubOption, setSelectedSubOption] = useState<Step2Option | null>(null);

  const [guidanceItems, setGuidanceItems] = useState<any[]>([]);
  const [resolvedItem, setResolvedItem] = useState<any | null>(null);
  const [loadingGuidance, setLoadingGuidance] = useState(true);

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

    if (match) {
      setResolvedItem({
        ...match,
        actionUrl: option.actionUrlOverride || match.actionUrl,
        actionLabel: option.actionLabelOverride || match.actionLabel,
      });
    } else {
      setResolvedItem({
        title: option.label,
        category: option.targetCategory,
        description: option.desc,
        requiredDocs: [
          'Student Roll Number & ID Card',
          'Current Semester and Branch details',
          'Application Purpose and Supporting proof (if applicable)',
        ],
        processSteps: [
          'Access the relevant Nexora campus service module',
          'Fill in required operational and student information',
          'Submit the ticket to the responsible department',
          'Track live request progress on your dashboard',
          'Receive official status update upon review',
        ],
        responsibleRole:
          option.targetCategory === 'HOSTEL'
            ? 'Hostel Warden / Staff'
            : 'Academic Operations Officer',
        actionUrl: option.actionUrlOverride || '/student/dashboard',
        actionLabel: option.actionLabelOverride || 'Proceed to Process',
      });
    }

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
              Student Guidance Mode
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Tell us what you are trying to do, and Nexora will guide you to the correct verified campus workflow.
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
              Select Need
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
              Resolution &amp; Form
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: What do you need help with? */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-tab-fade">
          <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
            <div>
              <div className="text-[11px] uppercase font-mono font-bold text-primary tracking-wider mb-1">
                STEP 1 OF 3
              </div>
              <h2 className="text-base sm:text-xl font-bold text-foreground tracking-tight">
                What do you need help with?
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select the campus area or topic you want to proceed with. If you are uncertain, pick &ldquo;I&apos;m not sure&rdquo;.
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
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
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
                  STEP 2 OF 3 • CLARIFICATION
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

      {/* STEP 3: Result & Direct Campus Form Connection */}
      {currentStep === 3 && resolvedItem && (
        <div className="space-y-6 animate-tab-fade">
          <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
            {/* Resolution Banner */}
            <div className="border-b border-border pb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold mb-3 shadow-xs">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>IDENTIFIED WORKFLOW &amp; REQUIREMENTS</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                You need: {resolvedItem.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                {resolvedItem.description}
              </p>
            </div>

            {/* Structured Breakdown: Required Info & Process */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Required Documents / Information */}
              <div className="bg-surface-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase font-mono tracking-wider">
                  <FileText size={15} />
                  <span>Required Information &amp; Documents</span>
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
                  <span>End-to-End Process Workflow</span>
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

            {/* Department Ownership & Verification SLA */}
            <div className="p-4 rounded-xl bg-surface-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-foreground">
                <Shield size={16} className="text-primary shrink-0" />
                <span>
                  Responsible Office:{' '}
                  <strong className="text-foreground">
                    {resolvedItem.responsibleRole === 'ACADEMIC_OFFICER'
                      ? 'Academic Operations Officer (Prof. Sanjeev Mohanty)'
                      : resolvedItem.responsibleRole === 'WARDEN'
                      ? 'Hostel Warden'
                      : resolvedItem.responsibleRole === 'SECURITY'
                      ? 'Campus Gate Security'
                      : 'Campus Operations Staff'}
                  </strong>
                </span>
              </div>

              <div className="text-muted-foreground text-[11px]">
                Standard Turnaround SLA: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">24 – 48 Hours</strong>
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
