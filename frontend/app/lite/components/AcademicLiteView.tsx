'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  GraduationCap,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  Check,
  X,
  RotateCw,
  Award,
} from 'lucide-react';
import { LiteRejectModal } from './LiteRejectModal';

interface AcademicLiteViewProps {
  currentUser: any;
  isOnline: boolean;
  setMsg: (msg: { type: 'info' | 'success' | 'error'; text: string } | null) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function AcademicLiteView({
  currentUser,
  isOnline,
  setMsg,
  getStatusBadge,
}: AcademicLiteViewProps) {
  const [tab, setTab] = useState<'PENDING' | 'ISSUED' | 'REJECTED'>('PENDING');
  const [academicData, setAcademicData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBonafide, setSelectedBonafide] = useState<any | null>(null);
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchAcademicData = async (bypassCache = false) => {
    setLoading(true);
    try {
      const res = await apiRequest('/academic/dashboard', { useCache: !bypassCache });
      if (res.success && res.data) {
        setAcademicData(res.data);
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to load academic dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicData(false);
  }, []);

  const metrics = academicData?.metrics || {
    pendingApprovals: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalRequests: 0,
  };

  const pendingRequests = academicData?.pendingRequests || [];
  const recentlyApproved = academicData?.recentlyApproved || [];
  const recentlyRejected = academicData?.recentlyRejected || [];

  const handleApprove = async (id: string, reqNum: string) => {
    setApprovingId(id);
    const res = await apiRequest(`/bonafide/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setMsg({
        type: 'success',
        text: `Certificate ${res.data?.certificateId || 'NX-BON'} generated and certified!`,
      });
      fetchAcademicData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Certificate generation failed.' });
    }
    setApprovingId(null);
  };

  const handleOpenReject = (b: any) => {
    setSelectedBonafide(b);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedBonafide) return;
    setSubmittingReject(true);

    const res = await apiRequest(`/bonafide/${selectedBonafide.id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    if (res.success) {
      setMsg({
        type: 'success',
        text: `Request ${selectedBonafide.request?.requestNumber} rejected with official reason.`,
      });
      setRejectModalOpen(false);
      setSelectedBonafide(null);
      fetchAcademicData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Rejection failed.' });
    }
    setSubmittingReject(false);
  };

  return (
    <div className="space-y-4">
      {/* 4 Academic KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Pending Review</span>
          <span className="font-mono text-lg font-bold text-amber-400 block">{metrics.pendingApprovals}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Issued</span>
          <span className="font-mono text-lg font-bold text-emerald-400 block">{metrics.approvedCount}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Rejected</span>
          <span className="font-mono text-lg font-bold text-rose-400 block">{metrics.rejectedCount}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Total Volume</span>
          <span className="font-mono text-lg font-bold text-cyan-400 block">{metrics.totalRequests}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setTab('PENDING')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            tab === 'PENDING'
              ? 'bg-teal-500 text-black shadow-md'
              : 'bg-[#121622] text-gray-300 border border-[#232a3d]'
          }`}
        >
          <FileCheck size={14} />
          <span>Pending Approvals ({pendingRequests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('ISSUED')}
          className={`py-2.5 px-3 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            tab === 'ISSUED'
              ? 'bg-teal-500 text-black shadow-md'
              : 'bg-[#121622] text-gray-300 border border-[#232a3d]'
          }`}
        >
          <Award size={14} />
          <span>Issued ({recentlyApproved.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('REJECTED')}
          className={`py-2.5 px-3 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            tab === 'REJECTED'
              ? 'bg-teal-500 text-black shadow-md'
              : 'bg-[#121622] text-gray-300 border border-[#232a3d]'
          }`}
        >
          <XCircle size={14} />
          <span>Rejected ({recentlyRejected.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING QUEUE */}
      {tab === 'PENDING' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-teal-400" />
              <h2 className="font-bold text-sm text-white">Certificate Approvals Queue</h2>
            </div>
            <button
              type="button"
              onClick={() => fetchAcademicData(true)}
              disabled={loading}
              className="p-1 rounded-lg bg-[#181f2f] text-gray-300"
            >
              <RotateCw size={12} className={loading ? 'animate-spin text-teal-400' : ''} />
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 space-y-1">
              <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
              <p className="font-semibold text-gray-300">All academic requests reviewed</p>
              <p className="text-gray-500 text-[11px]">No pending student certificates requiring authority signature.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((b: any) => {
                const student = b.request?.requester?.student;
                const isApproving = approvingId === b.id;

                return (
                  <article
                    key={b.id}
                    className="p-3.5 rounded-xl bg-[#161b2a] border border-[#242e44] hover:border-[#334666] transition space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#d4af37] text-xs">{b.request?.requestNumber}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          PENDING REVIEW
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-white text-xs">
                        {student?.fullName || b.request?.requester?.username} ({student?.rollNumber || 'N/A'})
                      </div>
                      <div className="text-gray-300 text-[11px] mt-0.5">
                        Course: B.Tech {student?.branch?.name || 'Engineering'} {student?.year ? `(Year ${student.year})` : ''}
                      </div>
                      <div className="text-gray-200 font-semibold text-[11px] mt-1">
                        Purpose: <strong className="text-teal-300 font-sans">{b.purpose}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1.5 border-t border-[#20293d]">
                      <button
                        type="button"
                        disabled={isApproving}
                        onClick={() => handleApprove(b.id, b.request?.requestNumber)}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-1 min-h-[40px] disabled:opacity-50 active:scale-[0.98]"
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>{isApproving ? 'Generating PDF...' : 'Approve & Sign PDF'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isApproving}
                        onClick={() => handleOpenReject(b)}
                        className="py-2 px-3.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1 min-h-[40px] disabled:opacity-50 active:scale-[0.98]"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: ISSUED CERTIFICATES */}
      {tab === 'ISSUED' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <h2 className="font-bold text-sm text-white border-b border-[#232a3d] pb-2.5 flex items-center gap-2">
            <Award size={16} className="text-emerald-400" />
            <span>Officially Issued &amp; Digitally Certified Documents</span>
          </h2>

          {recentlyApproved.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">No approved certificates recorded yet.</div>
          ) : (
            <div className="space-y-2.5">
              {recentlyApproved.map((b: any) => (
                <div key={b.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-mono font-bold text-emerald-400">{b.certificateId || b.request?.requestNumber}</div>
                      <div className="font-semibold text-white mt-0.5">{b.request?.requester?.student?.fullName} ({b.request?.requester?.student?.rollNumber})</div>
                      <div className="text-gray-400 text-[11px]">Purpose: {b.purpose}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                      VALID
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-[#20293d]">
                    {b.documentUrl && (
                      <a
                        href={`/api/bonafide/${b.id}/download`}
                        download
                        className="flex-1 py-1.5 rounded-lg bg-[#182030] hover:bg-[#202b40] text-gold border border-[#d4af37]/30 text-center font-bold text-[11px] flex items-center justify-center gap-1 min-h-[38px]"
                      >
                        <Download size={13} />
                        <span>Download PDF</span>
                      </a>
                    )}
                    {b.certificateId && (
                      <Link
                        href={`/verify/${b.certificateId}`}
                        target="_blank"
                        className="flex-1 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-center font-bold text-[11px] flex items-center justify-center gap-1 min-h-[38px]"
                      >
                        <ExternalLink size={12} />
                        <span>Online Verify</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: REJECTED */}
      {tab === 'REJECTED' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <h2 className="font-bold text-sm text-white border-b border-[#232a3d] pb-2.5 flex items-center gap-2">
            <XCircle size={16} className="text-rose-400" />
            <span>Declined Applications Register</span>
          </h2>

          {recentlyRejected.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">No rejected applications recorded.</div>
          ) : (
            <div className="space-y-2.5">
              {recentlyRejected.map((b: any) => {
                const reason = b.request?.rejectionReason || b.request?.statusHistory?.[0]?.comment || 'Criteria not met';
                return (
                  <div key={b.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-1.5 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-rose-400">{b.request?.requestNumber}</span>
                      <span className="text-[10px] text-rose-300 font-mono">REJECTED</span>
                    </div>
                    <div className="font-semibold text-white">{b.request?.requester?.student?.fullName}</div>
                    <div className="text-gray-400 text-[11px]">Purpose: {b.purpose}</div>
                    <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px] font-mono mt-1">
                      Reason: {reason}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Shared Reject Modal */}
      <LiteRejectModal
        isOpen={rejectModalOpen}
        title="Reject Certificate Request"
        requestNumber={selectedBonafide?.request?.requestNumber}
        studentName={selectedBonafide?.request?.requester?.student?.fullName}
        summaryLabel="Purpose"
        summaryValue={selectedBonafide?.purpose}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedBonafide(null);
        }}
        onConfirm={handleConfirmReject}
        submitting={submittingReject}
      />
    </div>
  );
}
