'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  FileCheck,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

export default function AcademicApprovalsPage() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
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

  const fetchPending = async () => {
    setLoading(true);
    setActionError('');
    const res = await apiRequest('/bonafide/pending');
    if (res.success && res.data) {
      setPendingRequests(res.data);
    } else {
      setActionError(res.error?.message || 'Failed to fetch pending requests');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
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
      await fetchPending();
    } else {
      setActionError(res.error?.message || 'Approval failed.');
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
      await fetchPending();
    } else {
      setRejectValidationErr(res.error?.message || 'Failed to reject request.');
    }
    setSubmittingReject(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/academic/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition mb-2 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Academic Dashboard</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Certificate &amp; Academic Approvals
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Evaluate pending certificate requests and grant or decline official authorizations.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171c2b] border border-[#263047] text-xs font-semibold text-gray-300 hover:text-white transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-teal-400' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Action Messages */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="p-1 hover:bg-emerald-900/50 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="p-1 hover:bg-rose-900/50 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main List */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <FileCheck size={18} className="text-teal-400" />
            <h2 className="text-sm font-bold text-white">Pending Requests ({pendingRequests.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading pending requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-400" />
            <div className="font-semibold text-gray-300">All clear!</div>
            <div className="text-gray-500">No pending academic certificate requests.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#222838]">
            {pendingRequests.map((b: any) => {
              const student = b.request?.requester?.student;
              const isApproving = approvingId === b.id;

              return (
                <div
                  key={b.id}
                  className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5">
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
                    </div>
                    <div className="text-gray-200">
                      Purpose: <strong className="text-white">{b.purpose}</strong> • Course:{' '}
                      <span className="text-gray-300">
                        B.Tech {student?.branch?.name || 'Engineering'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Requested: {new Date(b.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={() => handleApprove(b.id, b.request?.requestNumber)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
                    >
                      <Check size={14} className="stroke-[3]" />
                      <span>{isApproving ? 'Approving...' : 'Approve & Generate PDF'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={() => handleOpenRejectModal(b)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800 text-rose-300 font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
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

      {/* REJECTION MODAL */}
      {rejectModalOpen && selectedBonafide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#121624] border border-[#2b354d] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle size={20} />
                <h3 className="text-base font-bold text-white">Reject Certificate Request</h3>
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
                  placeholder="Enter specific reason for rejection..."
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition resize-none"
                  autoFocus
                />
                <div className="flex justify-between text-[11px] text-gray-500 mt-1 font-mono">
                  <span>Reason is transmitted to student ticket.</span>
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
                  className="px-4 py-2 rounded-xl bg-[#171c2a] hover:bg-[#20273a] text-gray-300 hover:text-white border border-[#273248] font-semibold text-xs transition"
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
