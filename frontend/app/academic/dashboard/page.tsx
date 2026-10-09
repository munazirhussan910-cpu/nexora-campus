'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import {
  GraduationCap,
  FileCheck,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Download,
  Calendar,
  Bell,
  Compass,
  Plus,
  RefreshCw,
  XCircle,
  MapPin,
  User,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export default function AcademicDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBonafide, setSelectedBonafide] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectValidationErr, setRejectValidationErr] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Quick Routine Modal State
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [newRoutine, setNewRoutine] = useState({
    subjectId: '',
    branchId: '',
    year: 2,
    semester: 3,
    section: 'A',
    day: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    room: 'CSE-204',
    faculty: 'Prof. Sanjeev Mohanty',
    type: 'LECTURE' as 'LECTURE' | 'LAB' | 'TUTORIAL',
  });
  const [submittingRoutine, setSubmittingRoutine] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setActionError('');
    const [dashRes, subRes, brRes] = await Promise.all([
      apiRequest('/academic/dashboard'),
      apiRequest('/academic/subjects'),
      apiRequest('/academic/branches'),
    ]);

    if (dashRes.success && dashRes.data) {
      setData(dashRes.data);
    } else {
      setActionError(dashRes.error?.message || 'Failed to fetch academic dashboard data');
    }

    if (subRes.success && subRes.data) {
      setSubjectsList(subRes.data);
      if (subRes.data.length > 0 && !newRoutine.subjectId) {
        setNewRoutine((prev) => ({
          ...prev,
          subjectId: subRes.data[0].id,
          branchId: subRes.data[0].branchId || prev.branchId,
        }));
      }
    }

    if (brRes.success && brRes.data) {
      setBranchesList(brRes.data);
      if (brRes.data.length > 0 && !newRoutine.branchId) {
        setNewRoutine((prev) => ({ ...prev, branchId: brRes.data[0].id }));
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, requestNumber: string) => {
    setApprovingId(id);
    setActionMsg('');
    setActionError('');

    const res = await apiRequest(`/bonafide/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg(
        `Certificate (${res.data?.certificateId || 'NX-BON'}) for request ${requestNumber} approved & generated successfully!`
      );
      await loadData();
    } else {
      setActionError(res.error?.message || 'Approval failed. Please try again.');
    }
    setApprovingId(null);
  };

  const handleOpenRejectModal = (b: any) => {
    setSelectedBonafide(b);
    setRejectionReason('');
    setRejectValidationErr('');
    setRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedBonafide(null);
    setRejectionReason('');
    setRejectValidationErr('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rejectionReason.trim();

    if (!trimmed) {
      setRejectValidationErr('Please enter a rejection reason.');
      return;
    }

    setSubmittingReject(true);
    setRejectValidationErr('');

    const res = await apiRequest(`/bonafide/${selectedBonafide.id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: trimmed }),
    });

    if (res.success) {
      setActionMsg(
        `Request ${selectedBonafide.request?.requestNumber} rejected. Student has been notified with the reason.`
      );
      handleCloseRejectModal();
      await loadData();
    } else {
      setRejectValidationErr(res.error?.message || 'Failed to reject request. Please retry.');
    }
    setSubmittingReject(false);
  };

  const handleCreateQuickRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRoutine(true);
    setActionError('');

    const res = await apiRequest('/academic/routine', {
      method: 'POST',
      body: JSON.stringify(newRoutine),
    });

    if (res.success) {
      setActionMsg('New routine session scheduled successfully!');
      setRoutineModalOpen(false);
      await loadData();
    } else {
      setActionError(res.error?.message || 'Failed to schedule routine entry.');
    }
    setSubmittingRoutine(false);
  };

  const metrics = data?.metrics || {
    pendingApprovals: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalRequests: 0,
    totalSubjects: 0,
    todayClasses: 0,
    upcomingDeadlines: 0,
    guidanceArticles: 0,
  };

  const todayClasses = data?.todayClasses || [];
  const pendingRequests = data?.pendingRequests || [];
  const upcomingDeadlines = data?.deadlines || [];
  const recentUpdates = data?.recentUpdates || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Academic Operations Banner */}
      <div className="relative overflow-hidden bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-[#d4af37]/35 text-[#d4af37] text-[10px] font-mono font-bold uppercase tracking-wider mb-2.5 shadow-xs">
              <GraduationCap size={13} className="text-[#d4af37]" />
              <span>Academic Operations Command Center</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, Academic Officer.
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Oversee daily lecture schedules, publish targeted circulars, monitor cohort deadlines, certify credentials, and configure guidance flows.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setRoutineModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow-md shadow-[#d4af37]/15 transition active:scale-95"
            >
              <Plus size={14} />
              <span>+ Add Routine</span>
            </button>

            <Link
              href="/academic/notices"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#171c2b] border border-[#263047] hover:border-[#d4af37]/40 text-xs font-semibold text-gray-200 hover:text-white transition active:scale-95"
            >
              <Bell size={13} className="text-amber-400" />
              <span>Publish Notice</span>
            </Link>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#171c2b] border border-[#263047] hover:border-gray-500 text-gray-300 hover:text-white transition active:scale-95 disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#d4af37]' : ''} />
            </button>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-[#1f2638] flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <span className="text-[11px] font-mono uppercase text-gray-500 mr-2">Quick Actions:</span>
          <Link
            href="/academic/routine"
            className="px-3 py-1.5 rounded-xl bg-[#171e2e] hover:bg-[#20293d] border border-[#28354c] text-gray-300 hover:text-white transition inline-flex items-center gap-1.5"
          >
            <Calendar size={13} className="text-cyan-400" />
            <span>Manage Routine</span>
          </Link>
          <Link
            href="/academic/notices"
            className="px-3 py-1.5 rounded-xl bg-[#171e2e] hover:bg-[#20293d] border border-[#28354c] text-gray-300 hover:text-white transition inline-flex items-center gap-1.5"
          >
            <Bell size={13} className="text-amber-400" />
            <span>Academic Notices</span>
          </Link>
          <Link
            href="/academic/deadlines"
            className="px-3 py-1.5 rounded-xl bg-[#171e2e] hover:bg-[#20293d] border border-[#28354c] text-gray-300 hover:text-white transition inline-flex items-center gap-1.5"
          >
            <Clock size={13} className="text-purple-400" />
            <span>Upcoming Deadlines</span>
          </Link>
          <Link
            href="/academic/guidance"
            className="px-3 py-1.5 rounded-xl bg-[#171e2e] hover:bg-[#20293d] border border-[#28354c] text-gray-300 hover:text-white transition inline-flex items-center gap-1.5"
          >
            <Compass size={13} className="text-[#d4af37]" />
            <span>Guidance Content</span>
          </Link>
          <Link
            href="/academic/approvals"
            className="px-3 py-1.5 rounded-xl bg-[#171e2e] hover:bg-[#20293d] border border-[#28354c] text-gray-300 hover:text-white transition inline-flex items-center gap-1.5"
          >
            <FileCheck size={13} className="text-emerald-400" />
            <span>View All Requests</span>
          </Link>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-tab-fade">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button
            onClick={() => setActionMsg('')}
            className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-400 hover:text-white transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between gap-3 animate-tab-fade">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError('')}
            className="p-1 hover:bg-rose-900/50 rounded-lg text-rose-400 hover:text-white transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Overview StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/academic/approvals" className="block transition group">
          <StatCard
            title="Pending Academic Requests"
            value={loading ? '—' : metrics.pendingApprovals}
            icon={FileCheck}
            color="amber"
            trend={`${metrics.pendingApprovals} certificates awaiting approval`}
          />
        </Link>
        <Link href="/academic/notices" className="block transition group">
          <StatCard
            title="Today's Notices & Circulars"
            value={loading ? '—' : metrics.recentUpdates}
            icon={Bell}
            color="cyan"
            trend="Active broadcast circulars"
          />
        </Link>
        <Link href="/academic/deadlines" className="block transition group">
          <StatCard
            title="Upcoming Deadlines"
            value={loading ? '—' : metrics.upcomingDeadlines}
            icon={Clock}
            color="purple"
            trend="Monitored academic cutoffs"
          />
        </Link>
        <Link href="/academic/guidance" className="block transition group">
          <StatCard
            title="Guidance Articles"
            value={loading ? '—' : metrics.guidanceArticles}
            icon={Compass}
            color="gold"
            trend="Active student decision-trees"
          />
        </Link>
      </div>

      {/* SECTION 1: TODAY'S ACADEMIC ROUTINE */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15 space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Today&apos;s Academic Routine ({data?.todayDay || 'ACTIVE DAY'})
              </h2>
              <p className="text-[11px] text-gray-400">
                Scheduled campus lectures, laboratory sessions, and tutorial halls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRoutineModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d4af37] text-black font-bold text-xs hover:bg-[#e4c257] transition shadow"
            >
              <Plus size={13} />
              <span>+ Add Routine</span>
            </button>
            <Link
              href="/academic/routine"
              className="text-xs text-[#d4af37] hover:text-[#e4c257] font-semibold hidden sm:inline-flex items-center gap-1"
            >
              <span>Manage Full Routine</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500 animate-pulse">Loading today&apos;s routine...</div>
        ) : todayClasses.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
            <Clock size={20} className="text-gray-500" />
            <div className="text-gray-300 font-semibold">No classes scheduled for today ({data?.todayDay})</div>
            <div className="text-gray-500">Click &ldquo;+ Add Routine&rdquo; to add a session.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayClasses.map((c: any) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-[#161a29] border border-[#242b3e] hover:border-[#38435f] transition space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#d4af37] bg-[#1d2334] px-2.5 py-1 rounded-lg border border-[#2d3850]">
                    {c.startTime} – {c.endTime}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      c.type === 'LAB'
                        ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                        : c.type === 'TUTORIAL'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                        : 'bg-blue-950 text-blue-300 border border-blue-700/60'
                    }`}
                  >
                    {c.type || 'LECTURE'}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-white text-sm truncate">{c.subject?.name}</div>
                  <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                    Code: <strong className="text-gray-300">{c.subject?.code}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1f2538] text-gray-400 font-mono">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <MapPin size={11} className="text-cyan-400" />
                    {c.room}
                  </span>
                  <span className="flex items-center gap-1 text-gray-300 truncate max-w-[140px]">
                    <User size={11} className="text-gray-500" />
                    {c.faculty || c.subject?.faculty || 'Faculty'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: PENDING CERTIFICATE & ACADEMIC REQUESTS */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15 space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <FileCheck size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Pending Certificate Approvals Queue
              </h2>
              <p className="text-[11px] text-gray-400">
                Verify student eligibility, approve tamper-evident PDF credentials, or decline with feedback
              </p>
            </div>
          </div>

          <Link
            href="/academic/approvals"
            className="text-xs text-[#d4af37] hover:text-[#e4c257] font-semibold inline-flex items-center gap-1"
          >
            <span>View All Approvals ({metrics.pendingApprovals})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading pending requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-400" />
            <div className="font-semibold text-gray-300">All clear!</div>
            <div className="text-gray-500">No pending academic certificate requests requiring review.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#20273a]">
            {pendingRequests.slice(0, 5).map((b: any) => {
              const student = b.request?.requester?.student;
              const isApproving = approvingId === b.id;

              return (
                <div
                  key={b.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[#d4af37]">
                        {b.request?.requestNumber}
                      </span>
                      <span className="font-bold text-white text-sm">
                        {student?.fullName || b.request?.requester?.username}
                      </span>
                      {student?.rollNumber && (
                        <span className="font-mono text-gray-400 text-xs">
                          ({student.rollNumber})
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80">
                        PENDING
                      </span>
                    </div>

                    <div className="text-gray-300">
                      Purpose: <strong className="text-white">{b.purpose}</strong> • Cohort:{' '}
                      <span className="text-gray-300">
                        B.Tech {student?.branch?.code || 'Engineering'}, Year {student?.year || 2}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 font-mono">
                      Requested: {new Date(b.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={() => handleApprove(b.id, b.request?.requestNumber)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <Check size={14} className="stroke-[3]" />
                      <span>{isApproving ? 'Generating PDF...' : 'Approve & Issue'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={() => handleOpenRejectModal(b)}
                      className="px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800 text-rose-300 font-bold text-xs shadow transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <X size={14} className="stroke-[2.5]" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: SPLIT WIDGETS - UPCOMING DEADLINES & RECENT NOTICES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Deadlines Widget */}
        <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-purple-400" />
              <h2 className="text-sm font-bold text-white">Upcoming Academic Deadlines</h2>
            </div>
            <Link
              href="/academic/deadlines"
              className="text-xs text-[#d4af37] hover:underline font-semibold"
            >
              + Add Deadline
            </Link>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">No active academic deadlines set.</div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 4).map((d: any) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl bg-[#161a29] border border-[#242b3e] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-white truncate">{d.title}</div>
                    <div className="text-[11px] text-gray-400 truncate">{d.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-purple-300">
                      {new Date(d.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {d.targetYear ? `Year ${d.targetYear}` : 'All Students'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notices Widget */}
        <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-amber-400" />
              <h2 className="text-sm font-bold text-white">Active Notices &amp; Circulars</h2>
            </div>
            <Link
              href="/academic/notices"
              className="text-xs text-[#d4af37] hover:underline font-semibold"
            >
              + Publish Notice
            </Link>
          </div>

          {recentUpdates.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">No published notices.</div>
          ) : (
            <div className="space-y-3">
              {recentUpdates.slice(0, 4).map((n: any) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-[#161a29] border border-[#242b3e] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate">{n.title}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        n.priority === 'URGENT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                          : 'bg-blue-950 text-blue-300 border border-blue-700/60'
                      }`}
                    >
                      {n.priority}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[11px] line-clamp-1">{n.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUICK ROUTINE CREATION MODAL */}
      {routineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-tab-fade">
          <div className="bg-[#121624] border border-[#2a344c] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Calendar size={18} />
                <h3 className="text-base font-bold text-white">Schedule New Routine Session</h3>
              </div>
              <button
                type="button"
                onClick={() => setRoutineModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1b2234] text-gray-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateQuickRoutine} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Subject</label>
                <select
                  required
                  value={newRoutine.subjectId}
                  onChange={(e) => {
                    const sel = subjectsList.find((s) => s.id === e.target.value);
                    setNewRoutine((prev) => ({
                      ...prev,
                      subjectId: e.target.value,
                      branchId: sel ? sel.branchId : prev.branchId,
                      faculty: sel?.faculty || prev.faculty,
                    }));
                  }}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {subjectsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name} ({s.branch?.code || 'CSE'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Session Type</label>
                  <select
                    value={newRoutine.type}
                    onChange={(e: any) => setNewRoutine({ ...newRoutine, type: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="LECTURE">Lecture</option>
                    <option value="LAB">Lab Session</option>
                    <option value="TUTORIAL">Tutorial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Day of Week</label>
                  <select
                    value={newRoutine.day}
                    onChange={(e) => setNewRoutine({ ...newRoutine, day: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Start Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    pattern="^([01]\d|2[0-3]):[0-5]\d$"
                    value={newRoutine.startTime}
                    onChange={(e) => setNewRoutine({ ...newRoutine, startTime: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">End Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    pattern="^([01]\d|2[0-3]):[0-5]\d$"
                    value={newRoutine.endTime}
                    onChange={(e) => setNewRoutine({ ...newRoutine, endTime: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Room / Lab Hall</label>
                  <input
                    type="text"
                    required
                    value={newRoutine.room}
                    onChange={(e) => setNewRoutine({ ...newRoutine, room: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Faculty Name</label>
                  <input
                    type="text"
                    required
                    value={newRoutine.faculty}
                    onChange={(e) => setNewRoutine({ ...newRoutine, faculty: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212739]">
                <button
                  type="button"
                  onClick={() => setRoutineModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#171c2a] text-gray-300 border border-[#273248]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRoutine}
                  className="px-5 py-2 rounded-xl bg-[#d4af37] text-black font-bold hover:bg-[#e4c257] shadow transition"
                >
                  {submittingRoutine ? 'Scheduling...' : 'Save Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectModalOpen && selectedBonafide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-tab-fade">
          <div className="bg-[#121624] border border-[#2b354d] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle size={20} />
                <h3 className="text-base font-bold text-white">Reject Certificate Application</h3>
              </div>
              <button
                onClick={handleCloseRejectModal}
                className="p-1 rounded-lg hover:bg-[#1b2234] text-gray-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#0e111a] border border-[#212739] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Request Number:</span>
                <span className="font-mono font-bold text-[#d4af37]">
                  {selectedBonafide.request?.requestNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Student:</span>
                <span className="font-bold text-white">
                  {selectedBonafide.request?.requester?.student?.fullName ||
                    selectedBonafide.request?.requester?.username}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Purpose:</span>
                <span className="text-gray-200">{selectedBonafide.purpose}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Reason for rejection: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectValidationErr) setRejectValidationErr('');
                  }}
                  rows={4}
                  maxLength={500}
                  placeholder="Provide specific reason (e.g. Inadequate attendance, incorrect purpose selected)..."
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 resize-none"
                  autoFocus
                />
              </div>

              {rejectValidationErr && (
                <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{rejectValidationErr}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#212739]">
                <button
                  type="button"
                  onClick={handleCloseRejectModal}
                  disabled={submittingReject}
                  className="px-4 py-2 rounded-xl bg-[#171c2a] text-gray-300 border border-[#273248]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject || !rejectionReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
                >
                  {submittingReject ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
