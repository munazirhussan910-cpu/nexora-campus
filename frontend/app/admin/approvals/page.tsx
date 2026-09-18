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
} from 'lucide-react';

export default function AdminApprovalsPage() {
  const [bonafides, setBonafides] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBonafide, setSelectedBonafide] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectValidationErr, setRejectValidationErr] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setActionError('');
    const [bonRes, gpRes, leaveRes] = await Promise.all([
      apiRequest('/bonafide/pending'),
      apiRequest('/gate-passes/pending'),
      apiRequest('/leaves/pending'),
    ]);

    if (bonRes.success && bonRes.data) setBonafides(bonRes.data);
    if (gpRes.success && gpRes.data) setGatePasses(gpRes.data);
    if (leaveRes.success && leaveRes.data) setLeaves(leaveRes.data);
    setLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Central Campus Approvals Hub</h1>
        <p className="text-xs text-gray-400">
          Authorize student Bonafide certificates, review gate passes, and approve hostel leaves.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="p-1 hover:bg-emerald-900/50 rounded">
            <X size={13} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="p-1 hover:bg-rose-900/50 rounded">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Flagship: Bonafide Certificate Approvals */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <FileCheck size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Pending Bonafide Certificate Requests</h2>
          </div>
          <span className="text-xs font-mono text-gold bg-[#1e2538] px-2 py-0.5 rounded border border-[#323d57]">
            {bonafides.length} pending
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading certificate requests...</div>
        ) : bonafides.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">No pending certificate requests to review.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {bonafides.map((b) => (
              <div
                key={b.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-gold">{b.request?.requestNumber}</span>
                    <span className="font-bold text-gray-100">{b.request?.requester?.student?.fullName}</span>
                    <span className="font-mono text-gray-400">({b.request?.requester?.student?.rollNumber})</span>
                  </div>
                  <div className="text-gray-200">
                    Purpose: <strong>{b.purpose}</strong> • Course: B.Tech {b.request?.requester?.student?.branch?.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Requested on: {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveBonafide(b.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow transition active:scale-95"
                  >
                    <Check size={14} className="stroke-[3]" /> Approve &amp; Generate PDF
                  </button>

                  <button
                    onClick={() => handleOpenRejectModal(b)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800 text-rose-300 font-bold text-xs shadow transition active:scale-95"
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
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Pending Gate Pass Applications</h2>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            {gatePasses.length} pending
          </span>
        </div>

        {gatePasses.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No pending gate passes.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {gatePasses.map((gp) => (
              <div key={gp.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">{gp.request?.requestNumber}</span>
                    <span className="font-bold text-gray-100">{gp.request?.requester?.student?.fullName}</span>
                  </div>
                  <div className="text-gray-300 mt-0.5">Destination: {gp.destination} • {gp.reason}</div>
                </div>
                <button
                  onClick={() => handleApproveGatePass(gp.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs shadow transition"
                >
                  Approve Pass
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaves Queue */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" />
            <h2 className="text-sm font-bold text-white">Pending Leave Requests</h2>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
            {leaves.length} pending
          </span>
        </div>

        {leaves.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No pending leave applications.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {leaves.map((l) => (
              <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-300">{l.request?.requestNumber}</span>
                    <span className="font-bold text-gray-100">{l.request?.requester?.student?.fullName}</span>
                  </div>
                  <div className="text-gray-300 mt-0.5">
                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} • {l.reason}
                  </div>
                </div>
                <button
                  onClick={() => handleApproveLeave(l.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition"
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
                <span className="font-mono font-bold text-gold">
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
