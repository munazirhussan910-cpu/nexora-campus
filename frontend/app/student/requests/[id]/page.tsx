'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { Timeline } from '@/components/tables/Timeline';
import {
  ArrowLeft,
  User,
  Wrench,
  Clock,
  CheckCircle2,
  Star,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Check,
  Circle,
  XCircle,
} from 'lucide-react';

export default function StudentRequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirmation & Rating states
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [rateSuccess, setRateSuccess] = useState('');

  const fetchRequest = async () => {
    setLoading(true);
    const res = await apiRequest(`/requests/${requestId}`);
    if (res.success && res.data) {
      setRequest(res.data);
    } else {
      setError(res.error?.message || 'Failed to load request details');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (requestId) fetchRequest();
  }, [requestId]);

  const handleConfirm = async () => {
    const res = await apiRequest(`/complaints/${requestId}/confirm`, {
      method: 'POST',
    });
    if (res.success) {
      fetchRequest();
    }
  };

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRating(true);
    const res = await apiRequest(`/complaints/${requestId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
    if (res.success) {
      setRateSuccess('Thank you! Your feedback has been recorded and ticket marked as closed.');
      fetchRequest();
    }
    setSubmittingRating(false);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
        <span>Loading request telemetry and live audit timeline...</span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="py-20 text-center text-xs text-rose-400 max-w-md mx-auto space-y-4">
        <AlertCircle size={32} className="mx-auto text-rose-500" />
        <div className="font-bold text-sm text-white">{error || 'Request record not found'}</div>
        <div>
          <Link
            href="/student/requests"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#141824] border border-[#232b3f] text-[#d4af37] hover:text-white transition"
          >
            <ArrowLeft size={14} /> Back to My Requests
          </Link>
        </div>
      </div>
    );
  }

  const isComplaint = request.requestType?.code === 'COMPLAINT';
  const isResolvedOrConfirmed = request.status === 'RESOLVED' || request.status === 'CONFIRMED';
  const hasRated = !!request.complaint?.studentRating;

  // Lifecycle mapping based on real backend status:
  // SUBMITTED → ROUTED → ASSIGNED → IN PROGRESS → RESOLVED → CLOSED
  const stages = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'ROUTED', label: 'Routed' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'CLOSED', label: 'Closed' },
  ];

  const getStageIndex = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_APPROVAL':
      case 'SUBMITTED':
        return 0;
      case 'ROUTED':
      case 'ACCEPTED':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
      case 'DEPARTED':
        return 3;
      case 'RESOLVED':
      case 'CONFIRMED':
        return 4;
      case 'CLOSED':
        return 5;
      default:
        return 0;
    }
  };

  const isRejected = ['REJECTED', 'CANCELLED', 'EXPIRED', 'REVOKED'].includes(request.status);
  const currentStageIndex = isRejected ? -1 : getStageIndex(request.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Back Button */}
      <Link
        href="/student/requests"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to My Requests</span>
      </Link>

      {/* Header Card */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21273a] pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-base font-extrabold text-[#d4af37] tracking-wide">
                {request.requestNumber}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-[#182030] text-gray-200 border border-[#2b364d]">
                {request.requestType?.name}
              </span>
              <StatusBadge status={request.status} size="md" />
              <PriorityBadge priority={request.priority} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
              {request.title}
            </h1>
          </div>

          <div className="text-left sm:text-right text-xs text-gray-400 font-mono shrink-0">
            <div>Logged: {new Date(request.createdAt).toLocaleDateString()}</div>
            {request.completedAt && (
              <div className="text-emerald-400 font-bold mt-0.5">
                Completed: {new Date(request.completedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Request Lifecycle Step Indicator */}
        <div className="bg-[#0e111a] border border-[#212739] rounded-2xl p-4 sm:p-5">
          <div className="text-[10px] uppercase font-mono font-bold text-gray-400 tracking-wider mb-4">
            Request Lifecycle Tracking
          </div>

          {isRejected ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              <XCircle size={16} className="text-rose-400 shrink-0" />
              <span>
                Request has been <strong>{request.status}</strong>. Please review administrative notes or resubmit if required.
              </span>
            </div>
          ) : (
            <div className="relative flex items-center justify-between w-full overflow-x-auto no-scrollbar py-2">
              {stages.map((stage, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="flex-1 flex flex-col items-center relative min-w-[65px]">
                    {/* Connecting line */}
                    {idx > 0 && (
                      <div
                        className={`absolute top-3.5 -left-1/2 w-full h-[2px] -z-0 ${
                          idx <= currentStageIndex ? 'bg-[#d4af37]' : 'bg-[#21283a]'
                        }`}
                      />
                    )}

                    {/* Step Node */}
                    <div
                      className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        isPassed
                          ? 'bg-[#d4af37] text-black shadow-xs shadow-[#d4af37]/30'
                          : isCurrent
                          ? 'bg-[#1b2234] border-2 border-[#d4af37] text-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                          : 'bg-[#141824] border border-[#252c40] text-gray-500'
                      }`}
                    >
                      {isPassed ? (
                        <Check size={13} className="stroke-[3]" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] sm:text-[11px] mt-2 font-mono text-center truncate ${
                        isCurrent
                          ? 'text-[#d4af37] font-bold'
                          : isPassed
                          ? 'text-gray-200 font-medium'
                          : 'text-gray-500'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SLA Bar */}
        <SLAIndicator sla={request.sla} />

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div className="bg-[#161a29] p-4 sm:p-5 rounded-2xl border border-[#232b3f] space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-[#d4af37] block">
              Request Metadata
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} className="text-gray-500 shrink-0" />
              <span>Location: <strong className="text-white">{request.location || 'Campus'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={14} className="text-gray-500 shrink-0" />
              <span>Target Due: <strong className="text-white">{request.dueAt ? new Date(request.dueAt).toLocaleString() : 'Standard SLA'}</strong></span>
            </div>
            {request.complaint?.category && (
              <div className="flex items-center gap-2 text-gray-300">
                <Wrench size={14} className="text-amber-400 shrink-0" />
                <span>Category: <strong className="text-white">{request.complaint.category}</strong></span>
              </div>
            )}
          </div>

          <div className="bg-[#161a29] p-4 sm:p-5 rounded-2xl border border-[#232b3f] space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-cyan-400 block">
              Assigned Maintenance Staff
            </span>
            {request.assignedStaff?.staff ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-gray-100 font-semibold text-sm">
                  <User size={15} className="text-[#d4af37]" />
                  <span>{request.assignedStaff.staff.fullName}</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  {request.assignedStaff.staff.designation || 'Campus Technician'}
                </div>
                {request.assignedStaff.staff.phone && (
                  <div className="text-[11px] text-gray-400 font-mono">
                    Tel: <strong className="text-cyan-300">{request.assignedStaff.staff.phone}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic py-2">
                No technician assigned yet. Awaiting auto-routing.
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#161a29] p-4 sm:p-5 rounded-2xl border border-[#232b3f]">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-gray-400 block mb-1.5">
            Student Complaint Description
          </span>
          <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        {/* Resolution Notes if Resolved */}
        {request.complaint?.resolutionNotes && (
          <div className="bg-emerald-950/30 border border-emerald-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-400 block mb-1.5">
              Technician Resolution Notes
            </span>
            <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
              {request.complaint.resolutionNotes}
            </p>
          </div>
        )}

        {/* Student Rating / Confirmation Box */}
        {isComplaint && isResolvedOrConfirmed && !hasRated && (
          <div className="bg-[#161d2d] border border-[#d4af37]/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#d4af37]">Confirm &amp; Rate Resolution</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Inspect the technician's completed repair work and register your feedback.
                </p>
              </div>
              {request.status === 'RESOLVED' && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow transition active:scale-95 shrink-0"
                >
                  Confirm Fixed
                </button>
              )}
            </div>

            <form onSubmit={handleRate} className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300 font-medium">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-gold transition hover:scale-110 active:scale-95"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        size={18}
                        className={star <= rating ? 'fill-[#d4af37] text-[#d4af37]' : 'text-gray-600'}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold font-mono text-[#d4af37] ml-2">{rating} / 5 Stars</span>
              </div>

              <div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Comments on technician promptness and repair quality..."
                  className="w-full bg-[#121624] border border-[#252d42] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] h-20 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRating}
                className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-extrabold text-xs transition active:scale-95 disabled:opacity-50 shadow-md shadow-[#d4af37]/20"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating & Close Ticket'}
              </button>
            </form>
          </div>
        )}

        {hasRated && (
          <div className="bg-[#161a29] border border-[#232b3f] p-4 sm:p-5 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">Your Rating:</span>
              <div className="flex items-center gap-0.5 text-[#d4af37]">
                {[...Array(request.complaint.studentRating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-[#d4af37]" />
                ))}
              </div>
              <span className="font-bold font-mono text-[#d4af37]">({request.complaint.studentRating}/5)</span>
            </div>
            {request.complaint.studentFeedback && (
              <span className="text-gray-400 italic">"{request.complaint.studentFeedback}"</span>
            )}
          </div>
        )}
      </div>

      {/* Live Timeline Section */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex items-center gap-2.5 border-b border-[#21273a] pb-4 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#182030] text-[#d4af37] flex items-center justify-center">
            <Clock size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Immutable Request Audit Timeline
            </h2>
            <p className="text-[11px] text-gray-400">
              Cryptographically verified event logs and lifecycle state transitions
            </p>
          </div>
        </div>

        <Timeline history={request.timeline || []} />
      </div>
    </div>
  );
}
