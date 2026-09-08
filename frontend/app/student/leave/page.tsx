'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StudentLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setSuccess('Leave request submitted to Hostel Warden for formal review.');
      setReason('');
      fetchLeaves();
    } else {
      setError(res.error?.message || 'Failed to submit leave request');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Hostel Leave Applications</h1>
        <p className="text-xs text-gray-400">
          Apply for overnight and vacation leaves with warden review and emergency contact verification.
        </p>
      </div>

      {/* Leave Application Form */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Calendar size={16} className="text-purple-400" /> Apply for Hostel Leave
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Leaves exceeding 24 hours require warden approval and parent notification.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} /> <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Emergency Parent / Guardian Contact</label>
              <input
                type="text"
                required
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. +91 9876500001 (Father)"
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="consent"
                checked={parentConsent}
                onChange={(e) => setParentConsent(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-gold focus:ring-0"
              />
              <label htmlFor="consent" className="text-xs text-gray-300 font-medium">
                Parent / Guardian has provided written/verbal consent
              </label>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Reason for Leave</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending sister's wedding ceremony in home town..."
              className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white h-20"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Leave Records Table */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-gray-100 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-gold" /> Leave History
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading leave records...</div>
        ) : leaves.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">No leave requests found.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {leaves.map((l) => (
              <div key={l.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-gray-200">{l.request?.requestNumber}</span>
                    <StatusBadge status={l.status} size="sm" />
                  </div>
                  <div className="font-semibold text-gray-200">
                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-[11px] text-gray-400">{l.reason}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Emergency Contact: {l.emergencyContact}</div>
                </div>

                <div className="text-right text-[11px] text-gray-400">
                  {l.approvedBy && (
                    <div className="text-emerald-400 font-medium">
                      Reviewed by {l.approver?.staff?.fullName || 'Warden'}
                    </div>
                  )}
                  <div className="text-gray-500">Applied: {new Date(l.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
