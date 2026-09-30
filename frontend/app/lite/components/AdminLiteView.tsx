'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Layers,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  Bell,
  AlertOctagon,
  Check,
  X,
  RotateCw,
  Plus,
  ArrowRight,
  Shield,
  FileCheck,
  Key,
  Calendar,
} from 'lucide-react';
import { LiteRejectModal } from './LiteRejectModal';
import { LiteNoticeCreateModal } from './LiteNoticeCreateModal';

interface AdminLiteViewProps {
  currentUser: any;
  isOnline: boolean;
  setMsg: (msg: { type: 'info' | 'success' | 'error'; text: string } | null) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function AdminLiteView({
  currentUser,
  isOnline,
  setMsg,
  getStatusBadge,
}: AdminLiteViewProps) {
  const [tab, setTab] = useState<'OVERVIEW' | 'QUEUE' | 'APPROVALS' | 'STAFF' | 'NOTICES'>('OVERVIEW');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [pendingBonafides, setPendingBonafides] = useState<any[]>([]);
  const [pendingGatePasses, setPendingGatePasses] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectItem, setSelectedRejectItem] = useState<{
    id: string;
    type: 'BONAFIDE' | 'GATE_PASS' | 'LEAVE';
    requestNumber: string;
    studentName: string;
  } | null>(null);
  const [submittingReject, setSubmittingReject] = useState(false);

  // Notice creation modal
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  const fetchAdminData = async (bypassCache = false) => {
    setLoading(true);
    try {
      const [dashRes, staffRes, bonRes, gpRes, leaveRes, notRes] = await Promise.all([
        apiRequest('/admin/dashboard', { useCache: !bypassCache }),
        apiRequest('/admin/staff', { useCache: !bypassCache }),
        apiRequest('/bonafide/pending', { useCache: !bypassCache }),
        apiRequest('/gate-passes/pending', { useCache: !bypassCache }),
        apiRequest('/leaves/pending', { useCache: !bypassCache }),
        apiRequest('/notices?lite=true&limit=10', { useCache: !bypassCache }),
      ]);

      if (dashRes.success && dashRes.data) setDashboardData(dashRes.data);
      if (staffRes.success && Array.isArray(staffRes.data)) setStaffList(staffRes.data);
      if (bonRes.success && Array.isArray(bonRes.data)) setPendingBonafides(bonRes.data);
      if (gpRes.success && Array.isArray(gpRes.data)) setPendingGatePasses(gpRes.data);
      if (leaveRes.success && Array.isArray(leaveRes.data)) setPendingLeaves(leaveRes.data);
      if (notRes.success && Array.isArray(notRes.data)) setNotices(notRes.data);
    } catch {
      setMsg({ type: 'error', text: 'Error syncing admin operations data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(false);
  }, []);

  const metrics = dashboardData?.metrics || {
    totalRequests: 0,
    openRequests: 0,
    overdueRequests: 0,
    pendingApprovals: 0,
    resolvedToday: 0,
    activeStaff: 0,
  };

  const recurringIssues = dashboardData?.recurringIssues || [];
  const recentRequests = dashboardData?.recentRequests || [];

  // Approval Handlers
  const handleApproveBonafide = async (id: string, reqNum: string) => {
    const res = await apiRequest(`/bonafide/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setMsg({ type: 'success', text: `Certificate for ${reqNum} approved & generated!` });
      fetchAdminData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Approval failed.' });
    }
  };

  const handleApproveGatePass = async (id: string, reqNum: string) => {
    const res = await apiRequest(`/gate-passes/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setMsg({ type: 'success', text: `Gate Pass ${reqNum} approved! QR/PIN issued.` });
      fetchAdminData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Approval failed.' });
    }
  };

  const handleApproveLeave = async (id: string, reqNum: string) => {
    const res = await apiRequest(`/leaves/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setMsg({ type: 'success', text: `Hostel Leave ${reqNum} approved.` });
      fetchAdminData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Approval failed.' });
    }
  };

  const handleOpenReject = (id: string, type: 'BONAFIDE' | 'GATE_PASS' | 'LEAVE', reqNum: string, studentName: string) => {
    setSelectedRejectItem({ id, type, requestNumber: reqNum, studentName });
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedRejectItem) return;
    setSubmittingReject(true);

    let endpoint = '';
    if (selectedRejectItem.type === 'BONAFIDE') endpoint = `/bonafide/${selectedRejectItem.id}/reject`;
    else if (selectedRejectItem.type === 'GATE_PASS') endpoint = `/gate-passes/${selectedRejectItem.id}/reject`;
    else if (selectedRejectItem.type === 'LEAVE') endpoint = `/leaves/${selectedRejectItem.id}/reject`;

    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: `Request ${selectedRejectItem.requestNumber} rejected with reason.` });
      setRejectModalOpen(false);
      setSelectedRejectItem(null);
      fetchAdminData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Rejection failed.' });
    }
    setSubmittingReject(false);
  };

  const navTabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: Layers },
    { id: 'QUEUE', label: 'Live Queue', icon: Clock, count: recentRequests.length },
    { id: 'APPROVALS', label: 'Approvals', icon: CheckCircle2, count: pendingBonafides.length + pendingGatePasses.length + pendingLeaves.length },
    { id: 'STAFF', label: 'Staff Load', icon: Wrench, count: staffList.length },
    { id: 'NOTICES', label: 'Notices', icon: Bell, count: notices.length },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Core Admin KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Open Requests</span>
          <span className="font-mono text-lg font-bold text-amber-400 block">{metrics.openRequests}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Overdue</span>
          <span className="font-mono text-lg font-bold text-rose-400 block">{metrics.overdueRequests}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Approvals</span>
          <span className="font-mono text-lg font-bold text-gold block">{metrics.pendingApprovals}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Active Staff</span>
          <span className="font-mono text-lg font-bold text-purple-400 block">{metrics.activeStaff}</span>
        </div>
      </div>

      {/* SLA Alert Banner if Overdue */}
      {metrics.overdueRequests > 0 && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700 text-xs text-rose-200 flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span className="truncate">
              <strong>SLA Alert:</strong> {metrics.overdueRequests} campus requests breached deadline
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTab('QUEUE')}
            className="px-2.5 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-bold text-[11px] shrink-0 active:scale-95"
          >
            Review Queue
          </button>
        </div>
      )}

      {/* Section 44 Alert if Recurring issues */}
      {recurringIssues.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-700 text-xs text-amber-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertOctagon size={16} className="text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>Section 44 Alert:</strong> {recurringIssues[0]?.hostelBlock} {recurringIssues[0]?.category} ({recurringIssues[0]?.complaintCount} in 14d)
            </span>
          </div>
          <Link
            href="/admin/recurring-issues"
            className="px-2.5 py-1 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-white font-bold text-[11px] shrink-0"
          >
            Inspect
          </Link>
        </div>
      )}

      {/* Segmented Navigation Menu */}
      <div className="relative">
        <nav
          role="tablist"
          aria-label="Admin operations navigation"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs scroll-smooth snap-x touch-pan-x"
        >
          {navTabs.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;

            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(item.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition whitespace-nowrap font-medium text-xs snap-start min-h-[44px] touch-manipulation active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  isActive
                    ? 'bg-gold text-black font-bold shadow-md'
                    : 'bg-[#121622] text-gray-300 hover:text-white border border-[#232a3d] hover:border-[#35405c]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-black shrink-0' : 'text-gray-400 shrink-0'} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-black text-gold' : 'bg-[#1f283d] text-gray-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {tab === 'OVERVIEW' && (
        <section className="space-y-3.5">
          {/* Category Breakdown Progress */}
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Wrench size={13} className="text-amber-400" />
              <span>Complaints by Infrastructure Category</span>
            </h3>
            <div className="space-y-2 pt-1">
              {dashboardData?.categoryBreakdown?.map((cat: any) => {
                const total = metrics.totalRequests || 1;
                const pct = Math.round((cat.count / total) * 100);
                return (
                  <div key={cat.category} className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-300 text-[11px]">
                      <span>{cat.category}</span>
                      <span className="font-mono text-gold font-bold">{cat.count} tickets</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#181d2e] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#d4af37]"
                        style={{ width: `${Math.min(pct * 2.5, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Approvals Summary Card */}
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gold" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Pending Approvals Breakdown</h3>
              </div>
              <button
                type="button"
                onClick={() => setTab('APPROVALS')}
                className="text-xs text-gold hover:underline font-semibold flex items-center gap-1"
              >
                <span>Review All</span> <ArrowRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-[#161b2a] p-2.5 rounded-xl border border-[#26334a] text-center">
                <span className="text-[10px] text-cyan-400 block font-sans">Gate Pass</span>
                <span className="text-base font-bold text-white">{pendingGatePasses.length}</span>
              </div>
              <div className="bg-[#161b2a] p-2.5 rounded-xl border border-[#26334a] text-center">
                <span className="text-[10px] text-purple-400 block font-sans">Leave</span>
                <span className="text-base font-bold text-white">{pendingLeaves.length}</span>
              </div>
              <div className="bg-[#161b2a] p-2.5 rounded-xl border border-[#26334a] text-center">
                <span className="text-[10px] text-emerald-400 block font-sans">Bonafide</span>
                <span className="text-base font-bold text-white">{pendingBonafides.length}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: LIVE REQUEST QUEUE */}
      {tab === 'QUEUE' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232a3d] pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gold" />
              <h2 className="font-bold text-sm text-white">Live Campus Request Stream</h2>
            </div>
            <button
              type="button"
              onClick={() => fetchAdminData(true)}
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#181f2f] hover:bg-[#20293d] border border-[#28354c] text-gray-300 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Refresh"
            >
              <RotateCw size={13} className={loading ? 'animate-spin text-gold' : ''} />
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No active campus requests.</div>
          ) : (
            <div className="space-y-2.5">
              {recentRequests.map((req: any) => (
                <article
                  key={req.id}
                  className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] hover:border-[#354363] transition space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-gold text-xs">{req.requestNumber}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1e2538] text-gray-300 border border-[#2c3750]">
                        {req.requestType?.code}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>
                    {req.sla?.isOverdue && (
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-xs">{req.title}</h3>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-1 border-t border-[#20293d]">
                    <span>Loc: {req.location || 'Campus'}</span>
                    <span>Staff: {req.assignedStaff?.staff?.fullName || 'Pending'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: APPROVALS */}
      {tab === 'APPROVALS' && (
        <section className="space-y-3.5">
          {/* Gate Passes Queue */}
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
              <div className="flex items-center gap-2">
                <Key size={15} className="text-cyan-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Pending Gate Passes ({pendingGatePasses.length})</h3>
              </div>
            </div>

            {pendingGatePasses.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-500">No pending gate passes.</div>
            ) : (
              <div className="space-y-2.5">
                {pendingGatePasses.map((gp) => (
                  <div key={gp.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-mono font-bold text-cyan-300">{gp.request?.requestNumber}</div>
                        <div className="font-semibold text-white">{gp.request?.requester?.student?.fullName} ({gp.request?.requester?.student?.rollNumber})</div>
                        <div className="text-gray-400 text-[11px]">To: {gp.destination} • {gp.reason}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-[#20293d]">
                      <button
                        type="button"
                        onClick={() => handleApproveGatePass(gp.id, gp.request?.requestNumber)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] min-h-[38px]"
                      >
                        Approve Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(gp.id, 'GATE_PASS', gp.request?.requestNumber, gp.request?.requester?.student?.fullName)}
                        className="flex-1 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-[11px] min-h-[38px]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaves Queue */}
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-purple-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Pending Leaves ({pendingLeaves.length})</h3>
              </div>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-500">No pending leave requests.</div>
            ) : (
              <div className="space-y-2.5">
                {pendingLeaves.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2 text-xs">
                    <div>
                      <div className="font-mono font-bold text-purple-300">{l.request?.requestNumber}</div>
                      <div className="font-semibold text-white">{l.request?.requester?.student?.fullName}</div>
                      <div className="text-gray-400 text-[11px]">{new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} • {l.reason}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-[#20293d]">
                      <button
                        type="button"
                        onClick={() => handleApproveLeave(l.id, l.request?.requestNumber)}
                        className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] min-h-[38px]"
                      >
                        Approve Leave
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(l.id, 'LEAVE', l.request?.requestNumber, l.request?.requester?.student?.fullName)}
                        className="flex-1 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-[11px] min-h-[38px]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bonafide Queue */}
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
              <div className="flex items-center gap-2">
                <FileCheck size={15} className="text-emerald-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Pending Bonafide Certificates ({pendingBonafides.length})</h3>
              </div>
            </div>

            {pendingBonafides.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-500">No pending bonafide requests.</div>
            ) : (
              <div className="space-y-2.5">
                {pendingBonafides.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2 text-xs">
                    <div>
                      <div className="font-mono font-bold text-gold">{b.request?.requestNumber}</div>
                      <div className="font-semibold text-white">{b.request?.requester?.student?.fullName} ({b.request?.requester?.student?.rollNumber})</div>
                      <div className="text-gray-400 text-[11px]">Purpose: {b.purpose}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-[#20293d]">
                      <button
                        type="button"
                        onClick={() => handleApproveBonafide(b.id, b.request?.requestNumber)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] min-h-[38px]"
                      >
                        Approve &amp; Sign
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(b.id, 'BONAFIDE', b.request?.requestNumber, b.request?.requester?.student?.fullName)}
                        className="flex-1 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-[11px] min-h-[38px]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 4: STAFF WORKLOAD */}
      {tab === 'STAFF' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-purple-400" />
              <h2 className="font-bold text-sm text-white">Technician Workload Roster</h2>
            </div>
            <span className="text-xs font-mono text-gray-400">{staffList.length} staff</span>
          </div>

          <div className="space-y-2.5">
            {staffList.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white text-xs">{s.fullName}</div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    {s.designation} • <span className="text-amber-400">{s.specialization || 'GENERAL'}</span>
                  </div>
                </div>

                <div className="text-right font-mono text-xs shrink-0">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    s.activeTasks > 5 ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-[#1e2538] text-cyan-300 border border-[#2c3750]'
                  }`}>
                    {s.activeTasks} active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 5: NOTICES */}
      {tab === 'NOTICES' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gold" />
              <h2 className="font-bold text-sm text-white">Campus Notices ({notices.length})</h2>
            </div>
            <button
              type="button"
              onClick={() => setNoticeModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold hover:bg-[#c49f2e] text-black font-bold text-xs shadow min-h-[36px]"
            >
              <Plus size={13} />
              <span>Create Notice</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {notices.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-1 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-white text-xs">{n.title}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(n.publishedAt || n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">{n.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shared Reject Modal */}
      <LiteRejectModal
        isOpen={rejectModalOpen}
        title={`Reject ${selectedRejectItem?.type?.replace('_', ' ') || 'Request'}`}
        requestNumber={selectedRejectItem?.requestNumber}
        studentName={selectedRejectItem?.studentName}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedRejectItem(null);
        }}
        onConfirm={handleConfirmReject}
        submitting={submittingReject}
      />

      {/* Shared Notice Creation Modal */}
      <LiteNoticeCreateModal
        isOpen={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
        onNoticeCreated={() => {
          setMsg({ type: 'success', text: 'Notice successfully published to campus!' });
          fetchAdminData(true);
        }}
      />
    </div>
  );
}
