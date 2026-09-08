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
      <div className="py-20 text-center text-xs text-gray-500">
        Loading request details and live timeline...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="py-16 text-center text-xs text-rose-400">
        {error || 'Request not found'}
        <div className="mt-4">
          <Link href="/student/requests" className="text-gold hover:underline">
            &larr; Back to My Requests
          </Link>
        </div>
      </div>
    );
  }

  const isComplaint = request.requestType?.code === 'COMPLAINT';
  const isResolvedOrConfirmed = request.status === 'RESOLVED' || request.status === 'CONFIRMED';
  const hasRated = !!request.complaint?.studentRating;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/student/requests"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
      >
        <ArrowLeft size={14} /> Back to My Requests
      </Link>

      {/* Header Card */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282f42] pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-mono text-base font-extrabold text-gold tracking-wide">
                {request.requestNumber}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-[#202535] text-gray-200 border border-[#2e374d]">
                {request.requestType?.name}
              </span>
              <StatusBadge status={request.status} size="md" />
              <PriorityBadge priority={request.priority} />
            </div>
            <h1 className="text-lg font-bold text-white leading-snug">{request.title}</h1>
          </div>

          <div className="text-right text-xs text-gray-500 font-mono">
            <div>Created: {new Date(request.createdAt).toLocaleString()}</div>
            {request.completedAt && (
              <div className="text-emerald-400">
                Completed: {new Date(request.completedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* SLA Bar */}
        <SLAIndicator sla={request.sla} />

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Request Metadata
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} className="text-gray-500" />
              <span>Location: <strong>{request.location || 'Campus'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={14} className="text-gray-500" />
              <span>Due Date: <strong>{request.dueAt ? new Date(request.dueAt).toLocaleString() : 'Standard'}</strong></span>
            </div>
            {request.complaint?.category && (
              <div className="flex items-center gap-2 text-gray-300">
                <Wrench size={14} className="text-amber-400" />
                <span>Routed Category: <strong>{request.complaint.category}</strong></span>
              </div>
            )}
          </div>

          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Assigned Maintenance Staff
            </span>
            {request.assignedStaff?.staff ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-200 font-semibold">
                  <User size={14} className="text-gold" />
                  <span>{request.assignedStaff.staff.fullName}</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  {request.assignedStaff.staff.designation}
                </div>
                {request.assignedStaff.staff.phone && (
                  <div className="text-[11px] text-gray-500 font-mono">
                    Tel: {request.assignedStaff.staff.phone}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic">No technician assigned yet.</div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Description
          </span>
          <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        {/* Resolution Notes if Resolved */}
        {request.complaint?.resolutionNotes && (
          <div className="bg-emerald-950/30 border border-emerald-800 p-4 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Technician Resolution Notes
            </span>
            <p className="text-xs text-emerald-200 leading-relaxed">
              {request.complaint.resolutionNotes}
            </p>
          </div>
        )}

        {/* Student Rating / Confirmation Box */}
        {isComplaint && isResolvedOrConfirmed && !hasRated && (
          <div className="bg-[#1c2130] border border-gold/40 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gold">Confirm &amp; Rate Resolution</h3>
                <p className="text-xs text-gray-400">
                  Please inspect the technician's work, confirm resolution, and provide feedback.
                </p>
              </div>
              {request.status === 'RESOLVED' && (
                <button
                  onClick={handleConfirm}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs shadow transition"
                >
                  Confirm Fixed
                </button>
              )}
            </div>

            <form onSubmit={handleRate} className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-gold transition hover:scale-110"
                    >
                      <Star
                        size={18}
                        className={star <= rating ? 'fill-[#d4af37]' : 'text-gray-600'}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-gold ml-2">{rating} / 5 Stars</span>
              </div>

              <div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Optional comments on technician promptness and quality..."
                  className="w-full bg-[#141722] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 h-16"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRating}
                className="px-4 py-2 rounded-lg bg-gold text-black font-bold text-xs hover:bg-[#c49f2e] transition disabled:opacity-50"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating & Close Ticket'}
              </button>
            </form>
          </div>
        )}

        {hasRated && (
          <div className="bg-[#181b26] border border-[#282f42] p-4 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">Your Rating:</span>
              <div className="flex items-center gap-0.5 text-gold">
                {[...Array(request.complaint.studentRating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-[#d4af37]" />
                ))}
              </div>
              <span className="font-bold text-gold">({request.complaint.studentRating}/5)</span>
            </div>
            {request.complaint.studentFeedback && (
              <span className="text-gray-400 italic">"{request.complaint.studentFeedback}"</span>
            )}
          </div>
        )}
      </div>

      {/* Live Timeline Section (Section 73) */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-[#282f42] pb-3 mb-5">
          <Clock size={16} className="text-gold" />
          <h2 className="text-sm font-bold text-white">Immutable Request Audit Timeline</h2>
        </div>

        <Timeline history={request.timeline || []} />
      </div>
    </div>
  );
}
