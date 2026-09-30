'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Shield,
  Phone,
  UserCheck,
  Check,
  X,
} from 'lucide-react';
import { CancelRequestModal } from '@/components/modals/CancelRequestModal';

export default function StudentLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingLeave, setCancellingLeave] = useState<any>(null);

  // Form states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('+91 9876500001 (Father)');
  const [parentConsent, setParentConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    const res = await apiRequest('/leaves/my');
    if (res.success && res.data) {
      setLeaves(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
    const today = new Date();
    const start = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const res = await apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
        emergencyContact,
        parentConsent,
      }),
    });

    if (res.success) {
      setSuccess('Leave request submitted to Hostel Warden for formal verification.');
      setReason('');
      fetchLeaves();
    } else {
      setError(res.error?.message || 'Failed to submit leave request');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-purple-500/35 text-purple-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
          <Shield size={12} />
          <span>Hostel Administration &amp; Residential Services</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Hostel Leave Applications
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
          Apply for overnight leaves, semester vacations, and emergency home travel with warden approval tracking and parent verification.
        </p>
      </div>

      {/* Leave Application Form */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex items-center gap-3.5 border-b border-[#21273a] pb-5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Apply for Hostel Leave
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Leaves exceeding 24 hours require warden approval and logged parental consent.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
                Start Date <span className="text-[#d4af37]">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
                End Date <span className="text-[#d4af37]">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
                Emergency Parent / Guardian Contact <span className="text-[#d4af37]">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-3.5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. +91 9876500001 (Father)"
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
              Reason for Leave <span className="text-[#d4af37]">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending family wedding / semester break travel home..."
              className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition h-24"
            />
          </div>

          {/* Parental Consent Checkbox */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#161a29] border border-[#242c3f]">
            <input
              type="checkbox"
              id="consent"
              checked={parentConsent}
              onChange={(e) => setParentConsent(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-[#38435d] bg-[#1a2031] text-[#d4af37] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-gray-300 font-medium cursor-pointer select-none leading-relaxed">
              I confirm that my parent or legal guardian has provided explicit consent for this leave period and can be reached at the emergency phone number provided above.
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-950/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Leave Records List */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#28354f] text-[#d4af37] flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Leave Request History
              </h2>
              <p className="text-[11px] text-gray-400">
                Audit record of residential leaves and warden signatures
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-[#161a28] border border-[#232a3d] animate-pulse"
              />
            ))}
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#161a28] border border-[#262e42] flex items-center justify-center text-gray-500">
              <Calendar size={22} />
            </div>
            <div>
              <div className="font-semibold text-gray-300">No hostel leave requests found</div>
              <div className="text-gray-500 mt-0.5">Apply above when planning overnight or vacation travel.</div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#202638]">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-gray-100">
                      {l.request?.requestNumber}
                    </span>
                    <StatusBadge status={l.status} size="sm" />
                  </div>

                  <div className="font-semibold text-sm text-gray-200">
                    {new Date(l.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' '}to{' '}
                    {new Date(l.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  <div className="text-[11px] text-gray-400">{l.reason}</div>

                  <div className="text-[10px] text-gray-500 font-mono mt-1">
                    Emergency Contact: <span className="text-gray-400">{l.emergencyContact}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] text-gray-400 font-mono space-y-1.5 shrink-0">
                  {l.approvedBy && (
                    <div className="text-emerald-400 font-medium">
                      Reviewed by {l.approver?.staff?.fullName || 'Hostel Warden'}
                    </div>
                  )}
                  <div className="text-gray-500">
                    Applied: {new Date(l.createdAt).toLocaleDateString()}
                  </div>
                  {l.status === 'PENDING_APPROVAL' && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setCancellingLeave(l)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/70 text-rose-300 font-bold text-[11px] transition active:scale-95 shadow-xs"
                      >
                        <X size={12} className="text-rose-400" />
                        <span>Cancel Request</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CancelRequestModal
        isOpen={!!cancellingLeave}
        onClose={() => setCancellingLeave(null)}
        onConfirm={async (reason) => {
          if (!cancellingLeave) return;
          const targetId = cancellingLeave.requestId || cancellingLeave.id;
          const res = await apiRequest(`/leaves/${targetId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
          });
          if (res.success) {
            setSuccess('Leave request cancelled successfully.');
            fetchLeaves();
          } else {
            throw new Error(res.error?.message || 'Failed to cancel leave request');
          }
        }}
        requestNumber={cancellingLeave?.request?.requestNumber}
        title={cancellingLeave ? `Hostel Leave: ${cancellingLeave.reason}` : undefined}
      />
    </div>
  );
}
