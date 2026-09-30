'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Shield,
  Key,
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Check,
  X,
  RotateCw,
  Phone,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { LiteRejectModal } from './LiteRejectModal';

interface WardenLiteViewProps {
  currentUser: any;
  isOnline: boolean;
  setMsg: (msg: { type: 'info' | 'success' | 'error'; text: string } | null) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function WardenLiteView({
  currentUser,
  isOnline,
  setMsg,
  getStatusBadge,
}: WardenLiteViewProps) {
  const [tab, setTab] = useState<'APPROVALS' | 'COMPLAINTS' | 'NOTICES'>('APPROVALS');
  const [pendingGatePasses, setPendingGatePasses] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [hostelComplaints, setHostelComplaints] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectItem, setSelectedRejectItem] = useState<{
    id: string;
    type: 'GATE_PASS' | 'LEAVE';
    requestNumber: string;
    studentName: string;
  } | null>(null);
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchWardenData = async (bypassCache = false) => {
    setLoading(true);
    try {
      const [gpRes, leaveRes, compRes, notRes] = await Promise.all([
        apiRequest('/gate-passes/pending', { useCache: !bypassCache }),
        apiRequest('/leaves/pending', { useCache: !bypassCache }),
        apiRequest('/requests?type=COMPLAINT&hostel=Block%20B', { useCache: !bypassCache }),
        apiRequest('/notices?lite=true&limit=10', { useCache: !bypassCache }),
      ]);

      if (gpRes.success && Array.isArray(gpRes.data)) setPendingGatePasses(gpRes.data);
      if (leaveRes.success && Array.isArray(leaveRes.data)) setPendingLeaves(leaveRes.data);
      if (compRes.success && Array.isArray(compRes.data)) setHostelComplaints(compRes.data);
      if (notRes.success && Array.isArray(notRes.data)) setNotices(notRes.data);
    } catch {
      setMsg({ type: 'error', text: 'Failed to sync hostel warden data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardenData(false);
  }, []);

  const handleApproveGatePass = async (id: string, reqNum: string) => {
    const res = await apiRequest(`/gate-passes/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setMsg({ type: 'success', text: `Gate Pass ${reqNum} approved! QR token and PIN issued.` });
      fetchWardenData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Approval failed.' });
    }
  };

  const handleApproveLeave = async (id: string, reqNum: string) => {
    const res = await apiRequest(`/leaves/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setMsg({ type: 'success', text: `Hostel Leave ${reqNum} approved.` });
      fetchWardenData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Approval failed.' });
    }
  };

  const handleOpenReject = (id: string, type: 'GATE_PASS' | 'LEAVE', reqNum: string, studentName: string) => {
    setSelectedRejectItem({ id, type, requestNumber: reqNum, studentName });
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedRejectItem) return;
    setSubmittingReject(true);

    const endpoint = selectedRejectItem.type === 'GATE_PASS'
      ? `/gate-passes/${selectedRejectItem.id}/reject`
      : `/leaves/${selectedRejectItem.id}/reject`;

    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: `Request ${selectedRejectItem.requestNumber} rejected with reason.` });
      setRejectModalOpen(false);
      setSelectedRejectItem(null);
      fetchWardenData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to reject application.' });
    }
    setSubmittingReject(false);
  };

  const overdueComplaints = hostelComplaints.filter(
    (c) => c.sla?.isOverdue && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(c.status)
  );

  return (
    <div className="space-y-4">
      {/* 4 Warden KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Pending Passes</span>
          <span className="font-mono text-lg font-bold text-cyan-400 block">{pendingGatePasses.length}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Pending Leave</span>
          <span className="font-mono text-lg font-bold text-purple-400 block">{pendingLeaves.length}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Hostel Issues</span>
          <span className="font-mono text-lg font-bold text-amber-400 block">{hostelComplaints.length}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Overdue</span>
          <span className="font-mono text-lg font-bold text-rose-400 block">{overdueComplaints.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setTab('APPROVALS')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            tab === 'APPROVALS'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'bg-[#121622] text-gray-300 border border-[#232a3d]'
          }`}
        >
          <Shield size={14} />
          <span>Action Required ({pendingGatePasses.length + pendingLeaves.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('COMPLAINTS')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            tab === 'COMPLAINTS'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'bg-[#121622] text-gray-300 border border-[#232a3d]'
          }`}
        >
          <Wrench size={14} />
          <span>Hostel Issues ({hostelComplaints.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('NOTICES')}
          className={`py-2.5 px-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            tab === 'NOTICES'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'bg-[#121622] text-gray-300 border border-[#232a3d]'
          }`}
        >
          <Bell size={14} />
          <span>Notices ({notices.length})</span>
        </button>
      </div>

      {/* TAB 1: APPROVALS */}
      {tab === 'APPROVALS' && (
        <section className="space-y-3.5">
          {/* Gate Passes Queue */}
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
              <div className="flex items-center gap-2">
                <Key size={15} className="text-cyan-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Pending Gate Passes ({pendingGatePasses.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => fetchWardenData(true)}
                disabled={loading}
                className="p-1 rounded-lg bg-[#181f2f] text-gray-300"
              >
                <RotateCw size={12} className={loading ? 'animate-spin text-cyan-400' : ''} />
              </button>
            </div>

            {pendingGatePasses.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-500">No pending curfew passes.</div>
            ) : (
              <div className="space-y-2.5">
                {pendingGatePasses.map((gp) => (
                  <div key={gp.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-300">{gp.request?.requestNumber}</span>
                        <span className="font-mono text-gray-400 text-[10px]">
                          Room {gp.request?.requester?.student?.hostelRoom?.roomNumber || '204'}
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs mt-0.5">{gp.request?.requester?.student?.fullName} ({gp.request?.requester?.student?.rollNumber})</div>
                      <div className="text-gray-300 text-[11px] mt-1">
                        To: <strong>{gp.destination}</strong> • Reason: {gp.reason}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Exit: {new Date(gp.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Return: {new Date(gp.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1.5 border-t border-[#20293d]">
                      <button
                        type="button"
                        onClick={() => handleApproveGatePass(gp.id, gp.request?.requestNumber)}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-1 min-h-[40px]"
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>Approve Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(gp.id, 'GATE_PASS', gp.request?.requestNumber, gp.request?.requester?.student?.fullName)}
                        className="flex-1 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1 min-h-[40px]"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave Applications Queue */}
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-purple-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Pending Leave Applications ({pendingLeaves.length})</h3>
              </div>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-500">No pending leave requests.</div>
            ) : (
              <div className="space-y-2.5">
                {pendingLeaves.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-purple-300">{l.request?.requestNumber}</span>
                        <span className="font-mono text-gray-400 text-[10px]">
                          Room {l.request?.requester?.student?.hostelRoom?.roomNumber || '204'}
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs mt-0.5">{l.request?.requester?.student?.fullName}</div>
                      <div className="text-gray-300 text-[11px] mt-1">
                        Dates: {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                      </div>
                      <div className="text-gray-400 text-[11px]">{l.reason}</div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-1">
                        <Phone size={10} className="text-amber-400" />
                        <span>Emergency: {l.emergencyContact}</span>
                        <span>•</span>
                        <span>Consent: {l.parentConsent ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1.5 border-t border-[#20293d]">
                      <button
                        type="button"
                        onClick={() => handleApproveLeave(l.id, l.request?.requestNumber)}
                        className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-1 min-h-[40px]"
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>Approve Leave</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(l.id, 'LEAVE', l.request?.requestNumber, l.request?.requester?.student?.fullName)}
                        className="flex-1 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1 min-h-[40px]"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: HOSTEL COMPLAINTS */}
      {tab === 'COMPLAINTS' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-amber-400" />
              <h2 className="font-bold text-sm text-white">Hostel Block B Issues ({hostelComplaints.length})</h2>
            </div>
            {overdueComplaints.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                {overdueComplaints.length} overdue
              </span>
            )}
          </div>

          {hostelComplaints.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No complaints reported in Hostel Block B.</div>
          ) : (
            <div className="space-y-2.5">
              {hostelComplaints.map((c) => {
                const isOverdue = c.sla?.isOverdue && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(c.status);
                return (
                  <article
                    key={c.id}
                    className={`p-3 rounded-xl border transition space-y-1 text-xs ${
                      isOverdue ? 'bg-rose-950/20 border-rose-800' : 'bg-[#161b2a] border-[#242e44]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-amber-300 text-xs">{c.requestNumber}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1e2538] text-gray-300 border border-[#2c3750]">
                          {c.complaint?.category || 'General'}
                        </span>
                        {getStatusBadge(c.status)}
                      </div>
                      {isOverdue && (
                        <span className="text-[10px] font-bold font-mono text-rose-400">OVERDUE</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-xs">{c.title}</h3>
                    <div className="flex justify-between text-[11px] text-gray-400 pt-1 border-t border-[#20293d]">
                      <span>Room: {c.location || 'Block B'}</span>
                      <span>Assigned: {c.assignedStaff?.staff?.fullName || 'Pending'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: NOTICES */}
      {tab === 'NOTICES' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#232a3d] pb-2.5">
            <Bell size={16} className="text-emerald-400" />
            <h2 className="font-bold text-sm text-white">Hostel Operational Notices</h2>
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
        title={`Reject ${selectedRejectItem?.type === 'GATE_PASS' ? 'Gate Pass' : 'Hostel Leave'}`}
        requestNumber={selectedRejectItem?.requestNumber}
        studentName={selectedRejectItem?.studentName}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedRejectItem(null);
        }}
        onConfirm={handleConfirmReject}
        submitting={submittingReject}
      />
    </div>
  );
}
