'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
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
  Award,
  FileText,
  RefreshCw,
  XCircle,
  Shield,
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

  const loadData = async () => {
    setLoading(true);
    setActionError('');
    const res = await apiRequest('/academic/dashboard');
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setActionError(res.error?.message || 'Failed to fetch academic dashboard data');
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
      await loadData();
    } else {
      setRejectValidationErr(res.error?.message || 'Failed to reject request. Please retry.');
    }
    setSubmittingReject(false);
  };

  const metrics = data?.metrics || {
    pendingApprovals: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalRequests: 0,
  };

  const pendingRequests = data?.pendingRequests || [];
  const recentlyApproved = data?.recentlyApproved || [];
  const recentlyRejected = data?.recentlyRejected || [];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-teal-500/35 text-teal-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
              <GraduationCap size={12} />
              <span>Academic Registry &amp; Certification Authority</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Academic Officer Command Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Authorize official Bonafide certificates, generate tamper-evident verifiable PDF credentials, and manage academic requests.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171c2b] border border-[#263047] hover:border-teal-500/40 text-xs font-semibold text-gray-300 hover:text-white transition active:scale-95 disabled:opacity-50"
              title="Refresh queue"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-teal-400' : ''} />
              <span>Refresh</span>
            </button>
          </div>
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

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Pending Certificate Approvals"
          value={metrics.pendingApprovals}
          icon={Clock}
          color="amber"
          trend={`${metrics.pendingApprovals} awaiting review`}
        />
        <StatCard
          title="Certificates Issued"
          value={metrics.approvedCount}
          icon={Award}
          color="emerald"
          trend="Certified &amp; PDF generated"
        />
        <StatCard
          title="Rejected Requests"
          value={metrics.rejectedCount}
          icon={XCircle}
          color="rose"
          trend="Declined with reason"
        />
        <StatCard
          title="Total Applications"
          value={metrics.totalRequests}
          icon={FileText}
          color="cyan"
          trend="Academic document volume"
        />
      </div>

      {/* SECTION 1: Pending Academic & Bonafide Requests Queue */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <FileCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Pending Certificate Approvals Queue
              </h2>
              <p className="text-[11px] text-gray-400">
                Review student credentials, verify academic eligibility, and authorize digital signature.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/80">
            {pendingRequests.length} pending
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500 space-y-2">
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>Loading pending certificate requests...</div>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-400" />
            <div className="font-semibold text-gray-300">All caught up!</div>
            <div className="text-gray-500">No pending academic certificate requests requiring review.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#222838]">
            {pendingRequests.map((b: any) => {
              const student = b.request?.requester?.student;
              const isApproving = approvingId === b.id;

              return (
                <div
                  key={b.id}
                  className="py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs transition"
                >
                  <div className="space-y-1.5 min-w-0">
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
                        PENDING REVIEW
                      </span>
                    </div>

                    <div className="text-gray-200 text-xs">
                      Purpose: <strong className="text-white">{b.purpose}</strong> • Course:{' '}
                      <span className="text-gray-300">
                        B.Tech {student?.branch?.name || 'Engineering'}
                        {student?.year ? `, Year ${student.year}` : ''}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 font-mono">
                      Requested on: {new Date(b.createdAt).toLocaleDateString()} at{' '}
                      {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Dual Action Area: [ ✓ Approve & Generate PDF ] [ Reject ] */}
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={() => handleApprove(b.id, b.request?.requestNumber)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-950/30 transition active:scale-95 disabled:opacity-50"
                      title="Authorize and digitally certify request"
                    >
                      <Check size={14} className="stroke-[3]" />
                      <span>{isApproving ? 'Generating PDF...' : 'Approve & Generate PDF'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={() => handleOpenRejectModal(b)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800 text-rose-300 font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
                      title="Decline request with official reason"
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

      {/* SECTION 2: Recently Approved Certificates */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">Recently Approved Certificates</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            {recentlyApproved.length} verified
          </span>
        </div>

        {recentlyApproved.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No approved certificates recorded yet.</div>
        ) : (
          <div className="divide-y divide-[#222838]">
            {recentlyApproved.map((b: any) => {
              const student = b.request?.requester?.student;

              return (
                <div
                  key={b.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-emerald-400">
                        {b.certificateId || b.request?.requestNumber}
                      </span>
                      <span className="font-bold text-gray-100">
                        {student?.fullName || b.request?.requester?.username}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 inline-flex items-center gap-1">
                        <CheckCircle2 size={11} /> ISSUED &amp; CERTIFIED
                      </span>
                    </div>
                    <div className="text-gray-300">
                      Purpose: {b.purpose} • Course: B.Tech {student?.branch?.name || 'Engineering'}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Issued:{' '}
                      {b.generatedAt
                        ? new Date(b.generatedAt).toLocaleDateString()
                        : new Date(b.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {b.documentUrl && (
                      <a
                        href={`/api/bonafide/${b.id}/download`}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#202b40] text-[#d4af37] border border-[#d4af37]/30 transition font-semibold"
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </a>
                    )}
                    {b.certificateId && (
                      <Link
                        href={`/verify/${b.certificateId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 transition font-semibold"
                      >
                        <ExternalLink size={12} />
                        <span>Verify</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Recently Rejected Requests */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-rose-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">Recently Rejected Applications</h2>
          </div>
          <span className="text-xs font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
            {recentlyRejected.length} declined
          </span>
        </div>

        {recentlyRejected.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No rejected applications recorded.</div>
        ) : (
          <div className="divide-y divide-[#222838]">
            {recentlyRejected.map((b: any) => {
              const student = b.request?.requester?.student;
              const reason =
                b.request?.rejectionReason ||
                b.request?.statusHistory?.[0]?.comment ||
                'Eligibility criteria not met';

              return (
                <div
                  key={b.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-rose-400">
                        {b.request?.requestNumber}
                      </span>
                      <span className="font-bold text-gray-100">
                        {student?.fullName || b.request?.requester?.username}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80">
                        REJECTED
                      </span>
                    </div>
                    <div className="text-gray-300">
                      Purpose: {b.purpose} • Course: B.Tech {student?.branch?.name || 'Engineering'}
                    </div>
                    <div className="text-rose-300/90 bg-rose-950/40 px-3 py-1 rounded-lg border border-rose-800/40 text-[11px] font-mono mt-1">
                      Reason: {reason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REJECTION CONFIRMATION MODAL */}
      {rejectModalOpen && selectedBonafide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-tab-fade"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
        >
          <div className="bg-[#121624] border border-[#2b354d] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle size={20} />
                <h3 id="reject-modal-title" className="text-base font-bold text-white">
                  Reject Certificate Request
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseRejectModal}
                className="p-1 rounded-lg hover:bg-[#1b2234] text-gray-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Request Summary */}
            <div className="bg-[#0e111a] border border-[#212739] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Request Number:</span>
                <span className="font-mono font-bold text-[#d4af37]">
                  {selectedBonafide.request?.requestNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Student:</span>
                <span className="font-bold text-white">
                  {selectedBonafide.request?.requester?.student?.fullName ||
                    selectedBonafide.request?.requester?.username}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Purpose:</span>
                <span className="text-gray-200">{selectedBonafide.purpose}</span>
              </div>
            </div>

            {/* Rejection Form */}
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
                  placeholder="Enter specific reason for rejecting this certificate request..."
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition resize-none"
                  autoFocus
                />
                <div className="flex justify-between text-[11px] text-gray-500 mt-1 font-mono">
                  <span>A clear reason will be sent to the student.</span>
                  <span>{rejectionReason.length}/500</span>
                </div>
              </div>

              {rejectValidationErr && (
                <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{rejectValidationErr}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#212739]">
                <button
                  type="button"
                  onClick={handleCloseRejectModal}
                  disabled={submittingReject}
                  className="px-4 py-2 rounded-xl bg-[#171c2a] hover:bg-[#20273a] text-gray-300 hover:text-white border border-[#273248] font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject || !rejectionReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
