'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Wrench,
  Key,
  FileCheck,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Plus,
  Copy,
  Check,
  Inbox,
  MapPin,
  GraduationCap,
  Sparkles,
  Compass,
  Bell,
  Briefcase,
  DollarSign,
  Users,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [academicOverview, setAcademicOverview] = useState<any>(null);
  const [todayRoutine, setTodayRoutine] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [classUpdates, setClassUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPin, setCopiedPin] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const [reqRes, gpRes, acadRes, routRes, deadRes, updRes] = await Promise.all([
        apiRequest('/requests/my'),
        apiRequest('/gate-passes/my'),
        apiRequest('/student/academic-overview'),
        apiRequest('/student/routine'),
        apiRequest('/student/deadlines'),
        apiRequest('/student/class-updates'),
      ]);

      if (reqRes.success && reqRes.data) setRequests(reqRes.data);
      if (gpRes.success && gpRes.data) setGatePasses(gpRes.data);
      if (acadRes.success && acadRes.data) setAcademicOverview(acadRes.data);
      if (routRes.success && routRes.data) setTodayRoutine(routRes.data);
      if (deadRes.success && deadRes.data) setDeadlines(deadRes.data);
      if (updRes.success && updRes.data) setClassUpdates(updRes.data);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const activeRequests = requests.filter(
    (r) => !['RESOLVED', 'CONFIRMED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(r.status)
  );

  const pendingApprovals = requests.filter((r) => r.status === 'PENDING_APPROVAL');

  const resolvedRequests = requests.filter((r) =>
    ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(r.status)
  );

  const latestApprovedGatePass = gatePasses.find(
    (gp) => gp.gateStatus === 'APPROVED' || gp.gateStatus === 'DEPARTED'
  );

  const handleCopyPin = (pin: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const todayClasses = todayRoutine?.todayClasses || [];
  const attendanceOverall = academicOverview?.overall;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 animate-tab-fade">
      {/* 1. PERSONALIZED WELCOME & STUDENT PROFILE SUMMARY */}
      <div className="relative overflow-hidden bg-surface dark:bg-gradient-to-br dark:from-[#121624] dark:via-[#151b2e] dark:to-[#0e121e] border border-border dark:border-[#232b3f] dark:hover:border-[#323d57] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs dark:shadow-xl dark:shadow-black/30 transition-all duration-300">
        {/* Subtle decorative glow in dark mode */}
        <div className="hidden dark:block absolute -top-24 -right-24 w-72 h-72 bg-[#5B20A0]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden dark:block absolute -bottom-24 -left-24 w-72 h-72 bg-[#18C5D8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary dark:bg-[#5B20A0]/20 dark:border-[#7A3DB8]/40 dark:text-[#18C5D8] text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Student Desk</span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground bg-surface-secondary dark:bg-[#161a29] px-2.5 py-0.5 rounded-full border border-border dark:border-[#242b3e]">
                {currentDateFormatted}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || user?.username || 'Student'} 👋
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Here&apos;s an overview of your campus requests, academic schedule, and official hostel passes.
            </p>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-muted-foreground pt-1 font-mono">
              <span>
                Roll: <strong className="text-foreground font-bold">{user?.rollNumber || '220101048'}</strong>
              </span>
              <span className="opacity-40">•</span>
              <span>
                Cohort: <strong className="text-foreground font-bold">{user?.branch || 'CSE'} — Year {user?.year || 2}</strong>
              </span>
              <span className="opacity-40">•</span>
              <span>
                Hostel: <strong className="text-foreground">{user?.hostelBlock || 'Block B'}</strong> / Room <strong className="text-foreground">{user?.roomNumber || '204'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Hero CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <Link
              href="/student/guidance"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground dark:bg-[#5B20A0] dark:hover:bg-[#6e28c3] dark:text-white dark:border dark:border-[#7A3DB8]/40 dark:shadow-lg dark:shadow-[#5B20A0]/25 font-bold text-xs shadow-xs active:scale-95 transition-all duration-150"
              title="Launch structured Guidance Mode"
            >
              <Compass size={15} className="dark:text-[#18C5D8]" />
              <span>Guidance Mode</span>
            </Link>

            <Link
              href="/student/requests/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground dark:bg-[#141824] dark:hover:bg-[#1a2133] dark:border-[#2b364d] dark:text-slate-200 dark:hover:text-white text-xs font-semibold active:scale-95 transition-all duration-150"
              title="Submit a campus maintenance complaint"
            >
              <Plus size={14} className="text-primary dark:text-[#18C5D8]" />
              <span>+ New Complaint</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. COPILOT & GUIDANCE MODE ENTRY POINTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guidance Mode Launcher */}
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface border border-border hover:border-primary/50 dark:bg-gradient-to-r dark:from-[#171427] dark:via-[#1a1f33] dark:to-[#141b2c] dark:border-[#5B20A0]/50 dark:hover:border-[#7A3DB8] dark:shadow-xl dark:shadow-[#5B20A0]/10 shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:bg-[#5B20A0]/20 dark:border-[#7A3DB8]/40 dark:text-[#18C5D8] text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <Compass size={12} />
              <span>Campus Process Navigator</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Not sure which campus form you need?
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Step-by-step guidance to the correct campus application, required documents, and responsible officer.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <Link href="/student/guidance?category=CERTIFICATE" className="hover:text-primary transition underline underline-offset-2">Bonafide</Link>
              <span>•</span>
              <Link href="/student/guidance?category=INTERNSHIP" className="hover:text-primary transition underline underline-offset-2">Internship</Link>
              <span>•</span>
              <Link href="/student/guidance?category=HOSTEL" className="hover:text-primary transition underline underline-offset-2">Leave</Link>
            </div>
            <Link
              href="/student/guidance"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground dark:bg-[#5B20A0] dark:hover:bg-[#6c28be] dark:text-white dark:border dark:border-[#7A3DB8]/50 text-xs font-bold shadow-xs active:scale-95 transition"
            >
              <span>Start</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Nexora Copilot Launcher */}
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface border border-border hover:border-primary/50 dark:bg-gradient-to-r dark:from-[#171427] dark:via-[#1a1f33] dark:to-[#141b2c] dark:border-[#5B20A0]/50 dark:hover:border-[#7A3DB8] dark:shadow-xl dark:shadow-[#5B20A0]/10 shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/25 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <Sparkles size={12} className="text-violet-600 dark:text-violet-400" />
              <span>Nexora Copilot AI</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Need immediate answers or automated drafting?
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Ask Copilot to check attendance margins, summarize timetable schedules, or create pre-filled tickets.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted-foreground">Connected to verified campus records</span>
            <Link
              href="/student/copilot"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-hover border border-border text-foreground text-xs font-bold active:scale-95 transition"
            >
              <span>Open Chat</span>
              <ArrowRight size={13} className="text-primary" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. KEY STATS COCKPIT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Pending Approvals"
          value={loading ? '—' : pendingApprovals.length}
          subtitle="Awaiting officer / warden"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Active Requests"
          value={loading ? '—' : activeRequests.length}
          subtitle="In flight or in progress"
          icon={Wrench}
          color="cyan"
        />
        <StatCard
          title="Completed"
          value={loading ? '—' : resolvedRequests.length}
          subtitle="Successfully closed"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Attendance"
          value={loading ? '—' : attendanceOverall ? `${attendanceOverall.percentage}%` : '85%'}
          subtitle={attendanceOverall ? (attendanceOverall.isAboveThreshold ? 'Above 75% cutoff' : 'Under 75% cutoff') : 'Official ledger'}
          icon={GraduationCap}
          color={attendanceOverall && !attendanceOverall.isAboveThreshold ? 'rose' : 'purple'}
        />
      </div>

      {/* 4. ACTIVE APPROVED GATE PASS (Conditional Highlight) */}
      {latestApprovedGatePass && (
        <div className="relative overflow-hidden bg-surface border-2 border-primary/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 dark:bg-[#18C5D8]/15 dark:text-[#18C5D8] dark:border-[#18C5D8]/40">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>ACTIVE APPROVED GATE PASS • READY FOR SCAN</span>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                  Destination: {latestApprovedGatePass.destination}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl line-clamp-2">
                  Reason: {latestApprovedGatePass.reason}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                <div className="bg-surface-secondary px-3.5 py-2 rounded-xl border border-border dark:bg-[#162133] dark:border-cyan-800/50 flex items-center gap-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono font-semibold text-muted-foreground block leading-tight">
                      Verification PIN
                    </span>
                    <span className="font-mono font-black text-lg sm:text-xl text-primary dark:text-[#18C5D8] tracking-wider">
                      {latestApprovedGatePass.passPin}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(latestApprovedGatePass.passPin)}
                    className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-foreground transition shrink-0"
                    title="Copy PIN to clipboard"
                    aria-label="Copy PIN"
                  >
                    {copiedPin ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="bg-surface-secondary px-3.5 py-2 rounded-xl border border-border text-left">
                  <span className="text-[10px] uppercase font-mono font-semibold text-muted-foreground block leading-tight">
                    Valid Return Until
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-foreground block pt-0.5">
                    {new Date(latestApprovedGatePass.expectedReturnTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <Link
                  href="/student/gate-pass"
                  className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1 ml-auto"
                >
                  View Pass Details <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-md flex flex-col items-center shrink-0 border border-border">
              <QRCodeSVG
                value={latestApprovedGatePass.qrTokenHash || latestApprovedGatePass.passPin}
                size={110}
                level="M"
              />
              <span className="text-[10px] text-gray-900 font-mono font-black mt-2 tracking-wider">
                SCAN AT MAIN GATE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. ATTENDANCE SUMMARY & TODAY'S TIMETABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary Widget */}
        <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    Attendance Summary
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Required institutional cutoff: 75%
                  </p>
                </div>
              </div>

              <Link
                href="/student/attendance"
                className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">Loading attendance data...</div>
            ) : attendanceOverall ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-surface-secondary border border-border">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Overall Attendance</div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-foreground mt-0.5">
                      {attendanceOverall.percentage}%
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        attendanceOverall.isAboveThreshold
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {attendanceOverall.isAboveThreshold ? 'Eligible' : 'At Risk'}
                    </span>
                    <div className="text-[10px] text-muted-foreground font-mono mt-1">
                      {attendanceOverall.present} / {attendanceOverall.total} classes attended
                    </div>
                  </div>
                </div>

                {attendanceOverall.insight && (
                  <p className="text-xs text-muted-foreground leading-relaxed px-1">
                    {attendanceOverall.insight}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Attendance records are synchronizing with the central academic server.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>BPUT Examination Regulations</span>
            <Link href="/student/attendance" className="text-primary hover:underline font-semibold">
              Subject Breakdown &rarr;
            </Link>
          </div>
        </div>

        {/* Today's Timetable Widget */}
        <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    {todayRoutine?.today ? `${todayRoutine.today} Routine` : "Today's Routine"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {user?.branch || 'CSE'} • Year {user?.year || 2}
                  </p>
                </div>
              </div>

              <Link
                href="/student/academics"
                className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
              >
                <span>Full Timetable</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">Loading timetable...</div>
            ) : todayClasses.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No classes scheduled for today. Check your weekly timetable for upcoming lectures.
              </div>
            ) : (
              <div className="space-y-2">
                {todayClasses.slice(0, 3).map((cls: any, idx: number) => (
                  <div
                    key={cls.id || idx}
                    className="p-3 rounded-xl bg-surface-secondary border border-border hover:border-primary/40 transition space-y-1 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-surface px-2 py-0.5 rounded border border-border">
                        {cls.timeDisplay || `${cls.startTime} – ${cls.endTime}`}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          cls.type === 'LAB'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {cls.type || 'LECTURE'}
                      </span>
                    </div>

                    <div className="font-bold text-foreground text-xs group-hover:text-primary transition truncate">
                      {cls.subjectName || cls.subject}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1 text-foreground">
                        <MapPin size={11} className="text-primary" />
                        Room {cls.room}
                      </span>
                      <span className="truncate max-w-[140px]">{cls.faculty}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Room allocations verified</span>
            <Link href="/student/academics" className="text-primary hover:underline font-semibold">
              Weekly Grid &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 6. QUICK ACTIONS LAUNCHPAD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs uppercase font-mono font-bold text-muted-foreground tracking-wider">
            Quick Actions
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">1-Click Service Access</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Link
            href="/student/guidance"
            className="p-4 rounded-2xl bg-surface border border-border hover:border-primary hover:bg-surface-secondary active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Compass size={18} />
              </div>
              <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition">
                Guidance Mode
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Step-by-step form finder
              </div>
            </div>
          </Link>

          <Link
            href="/student/documents"
            className="p-4 rounded-2xl bg-surface border border-border hover:border-emerald-500 hover:bg-surface-secondary active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck size={18} />
              </div>
              <ArrowRight size={13} className="text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                Apply Bonafide
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Certified digital PDF
              </div>
            </div>
          </Link>

          <Link
            href="/student/gate-pass"
            className="p-4 rounded-2xl bg-surface border border-border hover:border-cyan-500 hover:bg-surface-secondary active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Key size={18} />
              </div>
              <ArrowRight size={13} className="text-muted-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                Gate Pass
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                QR &amp; PIN outpass
              </div>
            </div>
          </Link>

          <Link
            href="/student/leave"
            className="p-4 rounded-2xl bg-surface border border-border hover:border-purple-500 hover:bg-surface-secondary active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar size={18} />
              </div>
              <ArrowRight size={13} className="text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                Hostel Leave
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Outstation permission
              </div>
            </div>
          </Link>

          <Link
            href="/student/requests/new"
            className="p-4 rounded-2xl bg-surface border border-border hover:border-amber-500 hover:bg-surface-secondary active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench size={18} />
              </div>
              <ArrowRight size={13} className="text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                Maintenance
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Hostel repairs &amp; fixes
              </div>
            </div>
          </Link>

          <Link
            href="/student/mentors"
            className="p-4 rounded-2xl bg-surface border border-border hover:border-indigo-500 hover:bg-surface-secondary active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
              <ArrowRight size={13} className="text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                Senior Guides
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Peer guidance network
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 7. RECENT CAMPUS REQUESTS (Table on Desktop, Cards on Mobile) */}
      <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Recent Campus Requests
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Live status tracking and audit trail across campus departments
              </p>
            </div>
          </div>

          <Link
            href="/student/requests"
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 group transition"
          >
            <span>View All ({requests.length})</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-surface-secondary border border-border animate-pulse"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No campus requests yet"
            description="You haven't submitted any campus requests or maintenance tickets yet."
            icon={Inbox}
            actionText="Submit First Request"
            actionHref="/student/requests/new"
            secondaryActionText="Guidance Mode"
            secondaryActionHref="/student/guidance"
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-mono text-[11px]">
                    <th className="pb-3 font-semibold">Request</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Submitted</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">SLA</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-surface-secondary/60 transition group">
                      <td className="py-3.5 pr-4">
                        <div className="font-mono font-bold text-foreground group-hover:text-primary transition">
                          {req.requestNumber}
                        </div>
                        <div className="text-muted-foreground font-medium truncate max-w-xs sm:max-w-sm mt-0.5">
                          {req.title}
                        </div>
                        {req.location && (
                          <div className="text-[10px] text-muted-foreground/80 font-mono flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {req.location}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-secondary text-foreground border border-border">
                          {req.requestType?.name || req.requestTypeId || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-muted-foreground text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 pr-4">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="py-3.5 pr-4">
                        <SLAIndicator sla={req.sla} compact />
                      </td>
                      <td className="py-3.5 text-right font-mono">
                        <Link
                          href={`/student/requests/${req.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-primary text-[11px] font-semibold transition"
                        >
                          <span>View</span>
                          <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2.5">
              {requests.slice(0, 5).map((req) => (
                <Link
                  key={req.id}
                  href={`/student/requests/${req.id}`}
                  className="block bg-surface border border-border hover:border-primary/50 hover:bg-surface-secondary/40 rounded-xl p-3.5 transition-all duration-150 group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition">
                      {req.requestNumber}
                    </span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition line-clamp-1 mb-1.5">
                    {req.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-2 border-t border-border">
                    <span>
                      {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary font-semibold">
                      <span>Details</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 8. CAMPUS NOTICES & DEADLINES */}
      <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Campus Updates &amp; Notices
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Official circulars &amp; academic milestones
              </p>
            </div>
          </div>

          <Link
            href="/student/notices"
            className="text-xs text-primary hover:underline font-semibold"
          >
            All Notices ({classUpdates.length + deadlines.length})
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">Loading updates...</div>
        ) : classUpdates.length === 0 && deadlines.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No recent circulars or urgent deadlines for your cohort.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Prioritize Deadlines */}
            {deadlines.slice(0, 3).map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl bg-surface-secondary border border-border hover:border-primary/40 transition space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground text-xs">{d.title}</span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      d.isUrgent
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}
                  >
                    {d.daysLeft === 0 ? 'DUE TODAY' : `${d.daysLeft}d left`}
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] line-clamp-2">{d.description}</p>
              </div>
            ))}

            {/* Class Updates / Notices */}
            {classUpdates.slice(0, 3).map((upd) => (
              <div
                key={upd.id}
                className="p-3.5 rounded-xl bg-surface-secondary border border-border hover:border-primary/40 transition space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground text-xs truncate">
                    {upd.headline || upd.rawTitle}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      upd.priority === 'URGENT'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {upd.priority || 'NOTICE'}
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] line-clamp-2">{upd.content}</p>
                <div className="text-[10px] text-muted-foreground/75 font-mono pt-0.5">
                  By {upd.author || 'Academic Office'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
