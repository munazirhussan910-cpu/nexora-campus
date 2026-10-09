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
  ExternalLink,
  GraduationCap,
  Sparkles,
  Compass,
  Bell,
  User,
  HelpCircle,
  Briefcase,
  DollarSign,
  Users,
  ChevronRight,
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

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 animate-tab-fade">
      {/* 1. HERO / WELCOME SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#121624] via-[#151b2e] to-[#0e121e] border border-[#232b3f] hover:border-[#323d57] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/30 transition-all duration-300">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#5B20A0]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#18C5D8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5B20A0]/20 border border-[#7A3DB8]/40 text-[#18C5D8] text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18C5D8] shadow-[0_0_6px_#18C5D8]" />
                <span>Student Desk</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-[#161a29] px-2.5 py-0.5 rounded-full border border-[#242b3e]">
                {currentDateFormatted}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || user?.username || 'Student'} 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Here&apos;s an overview of your campus requests, academic schedule, and official hostel passes.
            </p>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-400 pt-1 font-mono">
              <span className="text-slate-300">
                Roll: <strong className="text-white font-bold">{user?.rollNumber || '220101048'}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Cohort: <strong className="text-white font-bold">{user?.branch || 'CSE'} — Year {user?.year || 2}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Hostel: <strong className="text-slate-200">{user?.hostelBlock || 'Block B'}</strong> / Room <strong className="text-slate-200">{user?.roomNumber || '204'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Hero CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <Link
              href="/student/guidance"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B20A0] hover:bg-[#6e28c3] text-white font-bold text-xs shadow-lg shadow-[#5B20A0]/25 border border-[#7A3DB8]/40 active:scale-95 transition-all duration-150"
              title="Launch structured Guidance Mode"
            >
              <Compass size={15} className="text-[#18C5D8]" />
              <span>Guidance Mode</span>
            </Link>

            <Link
              href="/student/requests/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2133] border border-[#2b364d] text-slate-200 hover:text-white text-xs font-semibold active:scale-95 transition-all duration-150"
              title="Submit a campus maintenance complaint"
            >
              <Plus size={14} className="text-[#18C5D8]" />
              <span>+ New Complaint</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. FLAGSHIP GUIDANCE MODE HIGHLIGHT CARD */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#171427] via-[#1a1f33] to-[#141b2c] border border-[#5B20A0]/50 hover:border-[#7A3DB8] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-[#5B20A0]/10 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#5B20A0]/30 to-[#18C5D8]/10 border border-[#7A3DB8]/50 text-[#18C5D8] flex items-center justify-center shrink-0 shadow-lg shadow-[#5B20A0]/20">
              <Compass size={28} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1b2234] border border-[#18C5D8]/40 text-[#18C5D8] text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
                <Sparkles size={11} className="text-[#18C5D8]" />
                <span>CAMPUS PROCESS NAVIGATOR</span>
              </div>
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-white tracking-tight">
                Not sure which form or process you need?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                Answer a few quick questions and Nexora will guide you directly to the correct campus form, required documents, responsible desk, and next steps.
              </p>
            </div>
          </div>

          <Link
            href="/student/guidance"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5B20A0] hover:bg-[#6c28be] text-white font-bold text-xs shadow-lg shadow-[#5B20A0]/30 border border-[#7A3DB8]/50 transition-all active:scale-95 shrink-0"
          >
            <span>Start Guidance</span>
            <ArrowRight size={15} className="text-[#18C5D8]" />
          </Link>
        </div>

        {/* Quick Guidance Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#232d44]">
          <span className="text-[11px] font-mono font-semibold text-slate-400 mr-1">
            Common workflows:
          </span>
          <Link
            href="/student/guidance?category=CERTIFICATE"
            className="text-[11px] px-3 py-1 rounded-full bg-[#141a29] hover:bg-[#1a2338] border border-[#26334a] hover:border-[#18C5D8]/50 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            <FileCheck size={12} className="text-emerald-400" />
            <span>Bonafide Certificate</span>
          </Link>
          <Link
            href="/student/guidance?category=INTERNSHIP"
            className="text-[11px] px-3 py-1 rounded-full bg-[#141a29] hover:bg-[#1a2338] border border-[#26334a] hover:border-[#18C5D8]/50 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            <Briefcase size={12} className="text-purple-400" />
            <span>Internship NOC</span>
          </Link>
          <Link
            href="/student/guidance?category=SCHOLARSHIP"
            className="text-[11px] px-3 py-1 rounded-full bg-[#141a29] hover:bg-[#1a2338] border border-[#26334a] hover:border-[#18C5D8]/50 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            <DollarSign size={12} className="text-cyan-400" />
            <span>Scholarship Verification</span>
          </Link>
          <Link
            href="/student/guidance?category=CONFUSED"
            className="text-[11px] px-3 py-1 rounded-full bg-[#1d1624] hover:bg-[#281e33] border border-rose-800/40 text-rose-300 hover:text-white transition flex items-center gap-1.5"
          >
            <HelpCircle size={12} className="text-rose-400" />
            <span>Help me decide</span>
          </Link>
        </div>
      </div>

      {/* 3. STATISTICS CARDS */}
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
          title="Campus Notices"
          value={loading ? '—' : classUpdates.length + deadlines.length}
          subtitle="Official announcements"
          icon={Bell}
          color="purple"
        />
      </div>

      {/* 4. ACTIVE APPROVED GATE PASS (Conditional Highlight) */}
      {latestApprovedGatePass && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#101827] via-[#121c2d] to-[#151c27] border border-[#18C5D8]/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-cyan-950/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3.5 text-center md:text-left w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#18C5D8]/15 text-[#18C5D8] border border-[#18C5D8]/40 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#18C5D8] animate-pulse" />
                <span>ACTIVE APPROVED GATE PASS • READY FOR SCAN</span>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Destination: {latestApprovedGatePass.destination}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl line-clamp-2">
                  Reason: {latestApprovedGatePass.reason}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                <div className="bg-[#162133] px-3.5 py-2 rounded-xl border border-cyan-800/50 flex items-center gap-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block leading-tight">
                      Verification PIN
                    </span>
                    <span className="font-mono font-black text-lg sm:text-xl text-[#18C5D8] tracking-wider">
                      {latestApprovedGatePass.passPin}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(latestApprovedGatePass.passPin)}
                    className="p-1.5 rounded-lg bg-[#1f2d45] hover:bg-[#283a59] text-cyan-300 transition shrink-0"
                    title="Copy PIN to clipboard"
                  >
                    {copiedPin ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="bg-[#162133] px-3.5 py-2 rounded-xl border border-cyan-800/50 text-left">
                  <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block leading-tight">
                    Valid Return Until
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-slate-200 block pt-0.5">
                    {new Date(latestApprovedGatePass.expectedReturnTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <Link
                  href="/student/gate-pass"
                  className="text-xs text-[#18C5D8] hover:underline font-semibold inline-flex items-center gap-1 ml-auto"
                >
                  View Pass Details <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col items-center shrink-0 border-2 border-[#18C5D8]/40">
              <QRCodeSVG
                value={latestApprovedGatePass.qrTokenHash || latestApprovedGatePass.passPin}
                size={115}
                level="M"
              />
              <span className="text-[10px] text-gray-900 font-mono font-black mt-2 tracking-wider">
                SCAN AT MAIN GATE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. QUICK ACTIONS LAUNCHPAD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
            Quick Actions
          </div>
          <span className="text-[11px] text-slate-500 font-mono">1-Click Service Access</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Link
            href="/student/guidance"
            className="p-4 rounded-2xl bg-[#121624] border border-[#232b3f] hover:border-[#5B20A0]/70 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#5B20A0]/20 border border-[#7A3DB8]/40 text-[#18C5D8] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Compass size={18} />
              </div>
              <ArrowRight size={13} className="text-slate-500 group-hover:text-[#18C5D8] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-white transition">
                Guidance Mode
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Step-by-step form finder
              </div>
            </div>
          </Link>

          <Link
            href="/student/documents"
            className="p-4 rounded-2xl bg-[#121624] border border-[#232b3f] hover:border-emerald-500/60 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck size={18} />
              </div>
              <ArrowRight size={13} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-white transition">
                Apply Bonafide
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Certified digital PDF
              </div>
            </div>
          </Link>

          <Link
            href="/student/gate-pass"
            className="p-4 rounded-2xl bg-[#121624] border border-[#232b3f] hover:border-cyan-500/60 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#18C5D8] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Key size={18} />
              </div>
              <ArrowRight size={13} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-white transition">
                Gate Pass
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                QR &amp; PIN outpass
              </div>
            </div>
          </Link>

          <Link
            href="/student/leave"
            className="p-4 rounded-2xl bg-[#121624] border border-[#232b3f] hover:border-purple-500/60 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar size={18} />
              </div>
              <ArrowRight size={13} className="text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-white transition">
                Hostel Leave
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Outstation permission
              </div>
            </div>
          </Link>

          <Link
            href="/student/requests/new"
            className="p-4 rounded-2xl bg-[#121624] border border-[#232b3f] hover:border-amber-500/60 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench size={18} />
              </div>
              <ArrowRight size={13} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-white transition">
                Maintenance
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Hostel repairs &amp; fixes
              </div>
            </div>
          </Link>

          <Link
            href="/student/mentors"
            className="p-4 rounded-2xl bg-[#121624] border border-[#232b3f] hover:border-indigo-500/60 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
              <ArrowRight size={13} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-white transition">
                Senior Guides
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Peer guidance network
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 6. RECENT REQUESTS (Table on Desktop, Cards on Mobile) */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B20A0]/20 border border-[#7A3DB8]/40 text-[#18C5D8] flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Recent Campus Requests
              </h2>
              <p className="text-[11px] text-slate-400">
                Live status tracking and audit trail across campus departments
              </p>
            </div>
          </div>

          <Link
            href="/student/requests"
            className="text-xs text-[#18C5D8] hover:underline font-semibold flex items-center gap-1 group transition"
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
                className="h-16 rounded-xl bg-[#161a28] border border-[#232b3f] animate-pulse"
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
                  <tr className="border-b border-[#20273a] text-slate-400 font-mono text-[11px]">
                    <th className="pb-3 font-semibold">Request</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Submitted</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">SLA</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2538]">
                  {requests.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-[#161c2d] transition group">
                      <td className="py-3.5 pr-4">
                        <div className="font-mono font-bold text-white group-hover:text-[#18C5D8] transition">
                          {req.requestNumber}
                        </div>
                        <div className="text-slate-300 font-medium truncate max-w-xs sm:max-w-sm mt-0.5">
                          {req.title}
                        </div>
                        {req.location && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {req.location}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b2234] text-slate-300 border border-[#2b354d]">
                          {req.requestType?.name || req.requestTypeId || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-slate-400 text-[11px]">
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1b2234] hover:bg-[#5B20A0]/30 border border-[#2c364e] hover:border-[#7A3DB8] text-[#18C5D8] text-[11px] font-semibold transition"
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
                  className="block bg-[#161a29] border border-[#232b3f] hover:border-[#38435f] hover:bg-[#1a2033] rounded-xl p-3.5 transition-all duration-150 group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-[#18C5D8] transition">
                      {req.requestNumber}
                    </span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white transition line-clamp-1 mb-1.5">
                    {req.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-[#1f2538]">
                    <span className="text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#18C5D8] font-semibold">
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

      {/* 7. ACADEMIC SCHEDULE & NOTICE CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Routine Widget */}
        <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
          <div className="flex items-center justify-between border-b border-[#21273a] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[#18C5D8] flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {todayRoutine?.today ? `${todayRoutine.today} Routine` : "Today's Routine"}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {user?.branch || 'CSE'} • Year {user?.year || 2}
                </p>
              </div>
            </div>

            <Link
              href="/student/academics"
              className="text-xs text-[#18C5D8] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>Full Timetable</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500 animate-pulse">Loading routine...</div>
          ) : todayClasses.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No classes scheduled for today. Check your weekly timetable for upcoming lectures.
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayClasses.slice(0, 3).map((cls: any, idx: number) => (
                <div
                  key={cls.id || idx}
                  className="p-3 rounded-xl bg-[#161a29] border border-[#242b3e] hover:border-[#38435f] transition space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#18C5D8] bg-[#1a2133] px-2 py-0.5 rounded border border-[#28354f]">
                      {cls.timeDisplay || `${cls.startTime} – ${cls.endTime}`}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        cls.type === 'LAB'
                          ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                          : 'bg-blue-950 text-blue-300 border border-blue-700/60'
                      }`}
                    >
                      {cls.type || 'LECTURE'}
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs group-hover:text-[#18C5D8] transition truncate">
                    {cls.subjectName || cls.subject}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <MapPin size={10} className="text-[#18C5D8]" />
                      {cls.room}
                    </span>
                    <span className="truncate max-w-[150px]">{cls.faculty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campus Notices / Deadlines Card */}
        <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
          <div className="flex items-center justify-between border-b border-[#21273a] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#5B20A0]/20 border border-[#7A3DB8]/40 text-purple-300 flex items-center justify-center">
                <Bell size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Campus Updates &amp; Notices
                </h2>
                <p className="text-[11px] text-slate-400">
                  Official circulars &amp; academic milestones
                </p>
              </div>
            </div>

            <Link
              href="/student/notices"
              className="text-xs text-[#18C5D8] hover:underline font-semibold"
            >
              All Notices
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500 animate-pulse">Loading updates...</div>
          ) : classUpdates.length === 0 && deadlines.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No recent circulars or urgent deadlines for your cohort.
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Prioritize Deadlines */}
              {deadlines.slice(0, 2).map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl bg-[#161a29] border border-[#242b3e] hover:border-[#38435f] transition space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs">{d.title}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                        d.isUrgent
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                          : 'bg-[#5B20A0]/30 text-purple-300 border border-[#7A3DB8]/50'
                      }`}
                    >
                      {d.daysLeft === 0 ? 'DUE TODAY' : `${d.daysLeft}d left`}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-1">{d.description}</p>
                </div>
              ))}

              {/* Class Updates / Notices */}
              {classUpdates.slice(0, 2).map((upd) => (
                <div
                  key={upd.id}
                  className="p-3 rounded-xl bg-[#161a29] border border-[#242b3e] hover:border-[#38435f] transition space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs truncate">
                      {upd.headline || upd.rawTitle}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                        upd.priority === 'URGENT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                      }`}
                    >
                      {upd.priority || 'NOTICE'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-1">{upd.content}</p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    By {upd.author || 'Academic Office'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
