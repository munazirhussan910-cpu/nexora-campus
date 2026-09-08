'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Calendar, Check, X, Phone, User } from 'lucide-react';

export default function WardenLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    const res = await apiRequest('/leaves/pending');
    if (res.success && res.data) {
      setLeaves(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (id: string) => {
    const res = await apiRequest(`/leaves/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg('Leave request approved.');
      fetchLeaves();
    }
  };

  const handleReject = async (id: string) => {
    const res = await apiRequest(`/leaves/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Rejected after parental verification call' }),
    });
    if (res.success) {
      setActionMsg('Leave request rejected.');
      fetchLeaves();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Hostel Leave Applications</h1>
        <p className="text-xs text-gray-400">
          Review vacation and emergency absence applications submitted by hostel residents.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
          {actionMsg}
        </div>
      )}

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No pending leave applications.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181b26] transition text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-300">
                      {l.request?.requestNumber}
                    </span>
                    <span className="font-bold text-gray-100">
                      {l.request?.requester?.student?.fullName}
                    </span>
                    <span className="font-mono text-gray-400">
                      ({l.request?.requester?.student?.rollNumber})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#202535] text-gray-300 border border-[#2d364d] text-[10px]">
                      Room: {l.request?.requester?.student?.hostelRoom?.roomNumber || '204'}
                    </span>
                  </div>

                  <div className="text-gray-200">
                    Period: <strong>{new Date(l.startDate).toLocaleDateString()}</strong> to <strong>{new Date(l.endDate).toLocaleDateString()}</strong>
                  </div>
                  <div className="text-gray-400 text-[11px]">{l.reason}</div>

                  <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Phone size={12} /> Emergency Contact: {l.emergencyContact}
                    </span>
                    <span>•</span>
                    <span>Parental Consent: {l.parentConsent ? 'Affirmed' : 'Not Affirmed'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(l.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs shadow transition"
                  >
                    <Check size={14} /> Approve Leave
                  </button>
                  <button
                    onClick={() => handleReject(l.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs transition"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
