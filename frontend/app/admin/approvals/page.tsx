'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import {
  FileCheck,
  Key,
  Calendar,
  Check,
  X,
  ExternalLink,
  Download,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminApprovalsPage() {
  const [bonafides, setBonafides] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBonafide, setSelectedBonafide] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectValidationErr, setRejectValidationErr] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const loadData = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setActionError('');

    try {
      const [bonRes, gpRes, leaveRes] = await Promise.all([
        apiRequest('/bonafide/pending'),
        apiRequest('/gate-passes/pending'),
        apiRequest('/leaves/pending'),
      ]);

      if (bonRes.success && bonRes.data) setBonafides(bonRes.data);
      if (gpRes.success && gpRes.data) setGatePasses(gpRes.data);
      if (leaveRes.success && leaveRes.data) setLeaves(leaveRes.data);
    } catch (e) {
      console.error('Failed to load approvals data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveBonafide = async (id: string) => {
    setActionMsg('');
    setActionError('');
    const res = await apiRequest(`/bonafide/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg(`Bonafide Certificate (${res.data.certificateId}) officially generated & certified!`);
      loadData();
    } else {
      setActionError(res.error?.message || 'Failed to approve certificate.');
    }
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

    if (trimmed.length > 500) {
      setRejectValidationErr('Rejection reason must not exceed 500 characters.');
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
      loadData();
    } else {
      setRejectValidationErr(res.error?.message || 'Failed to reject certificate.');
    }
    setSubmittingReject(false);
  };

  const handleApproveGatePass = async (id: string) => {
    const res = await apiRequest(`/gate-passes/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg('Gate pass approved! QR token and PIN dispatched to student.');
      loadData();
    }
  };

  const handleApproveLeave = async (id: string) => {
    const res = await apiRequest(`/leaves/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg('Hostel leave approved.');
      loadData();
    }
  };

  const totalPending = bonafides.length + gatePasses.length + leaves.length;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21273a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
              Authoritative Gateway
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Central Campus Approvals Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Authorize student Bonafide certificates, review gate passes, and approve hostel leaves.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-[#141824] border border-[#273043] font-mono text-xs font-bold text-slate-300">
            Total Pending: <strong className="text-[#d4af37]">{totalPending}</strong>
          </span>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="p-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#d4af37]/60 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50"
            title="Refresh queues"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="truncate">{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="p-1 hover:bg-emerald-900/50 rounded-lg shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span className="truncate">{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="p-1 hover:bg-rose-900/50 rounded-lg shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Flagship: Bonafide Certificate Approvals */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#212739] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] text-emerald-400 border border-[#27324d] flex items-center justify-center shrink-0">
              <FileCheck size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Pending Bonafide Certificate Requests
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Institutional scholarship & verification certs
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#d4af37] bg-[#1a2133] px-2.5 py-0.5 rounded-full border border-[#2d3a54]">
            {bonafides.length} pending
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading certificate requests...</div>
        ) : bonafides.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No pending certificate requests to review.</div>
        ) : (
          <div className="divide-y divide-[#1e2538] -mx-1">
            {bonafides.map((b) => (
              <div
                key={b.id}
                className="py-3.5 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#161a29] transition-colors rounded-xl"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-[#d4af37]">{b.request?.requestNumber}</span>
                    <span className="font-bold text-slate-100">{b.request?.requester?.student?.fullName}</span>
                    <span className="font-mono text-slate-400">({b.request?.requester?.student?.rollNumber})</span>
                  </div>
                  <div className="text-slate-300">
                    Purpose: <strong className="text-white">{b.purpose}</strong> • Course: B.Tech{' '}
                    {b.request?.requester?.student?.branch?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Requested on: {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproveBonafide(b.id)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow transition active:scale-95"
                  >
                    <Check size={14} className="stroke-[3]" /> Approve &amp; Generate PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRejectModal(b)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs shadow transition active:scale-95"
                  >
                    <X size={14} className="stroke-[2.5]" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gate Passes Queue */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#212739] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] text-cyan-400 border border-[#27324d] flex items-center justify-center shrink-0">
              <Key size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Pending Gate Pass Applications
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">Perimeter exit &amp; re-entry passes</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800">
            {gatePasses.length} pending
          </span>
        </div>

        {gatePasses.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">No pending gate passes.</div>
        ) : (
          <div className="divide-y divide-[#1e2538] -mx-1">
            {gatePasses.map((gp) => (
              <div
                key={gp.id}
                className="py-3 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#161a29] transition-colors rounded-xl"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-cyan-300">{gp.request?.requestNumber}</span>
                    <span className="font-bold text-slate-100">{gp.request?.requester?.student?.fullName}</span>
                  </div>
                  <div className="text-slate-300">Destination: {gp.destination} • {gp.reason}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApproveGatePass(gp.id)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow transition active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  Approve Pass
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaves Queue */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#212739] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] text-purple-400 border border-[#27324d] flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Pending Hostel Leave Requests
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">Multi-day vacation &amp; emergency absences</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800">
            {leaves.length} pending
          </span>
        </div>

        {leaves.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">No pending leave requests.</div>
        ) : (
          <div className="divide-y divide-[#1e2538] -mx-1">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="py-3 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#161a29] transition-colors rounded-xl"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-purple-300">{l.request?.requestNumber}</span>
                    <span className="font-bold text-slate-100">{l.request?.requester?.student?.fullName}</span>
                  </div>
                  <div className="text-slate-300">
                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} •{' '}
                    {l.reason}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApproveLeave(l.id)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow transition active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  Approve Leave
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REJECTION MODAL */}
      {rejectModalOpen && selectedBonafide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#121624] border border-[#2b354d] rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle size={20} />
                <h3 className="text-base font-bold text-white">Reject Certificate Request</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseRejectModal}
                className="p-1 rounded-lg hover:bg-[#1b2234] text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#0e111a] border border-[#212739] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Request Number:</span>
                <span className="font-mono font-bold text-[#d4af37]">
                  {selectedBonafide.request?.requestNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Student:</span>
                <span className="font-bold text-white">
                  {selectedBonafide.request?.requester?.student?.fullName ||
                    selectedBonafide.request?.requester?.username}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Purpose:</span>
                <span className="text-slate-200">{selectedBonafide.purpose}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
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
                  placeholder="Enter specific reason for rejection..."
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition resize-none"
                  autoFocus
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                  <span>Student will be notified of this reason.</span>
                  <span>{rejectionReason.length}/500</span>
                </div>
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
                  className="px-4 py-2 rounded-xl bg-[#171c2a] hover:bg-[#20273a] text-slate-300 hover:text-white border border-[#273248] font-semibold text-xs transition"
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
