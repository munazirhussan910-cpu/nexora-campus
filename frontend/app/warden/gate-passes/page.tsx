'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Key, Check, X, Search, Clock } from 'lucide-react';

export default function WardenGatePassesPage() {
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchPasses = async () => {
    setLoading(true);
    const res = await apiRequest('/gate-passes/pending');
    if (res.success && res.data) {
      setPasses(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const handleApprove = async (id: string) => {
    const res = await apiRequest(`/gate-passes/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg('Gate pass approved successfully! QR Token and PIN generated.');
      fetchPasses();
    }
  };

  const handleReject = async (id: string) => {
    const res = await apiRequest(`/gate-passes/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Disapproved by Warden' }),
    });
    if (res.success) {
      setActionMsg('Gate pass rejected.');
      fetchPasses();
    }
  };

  const filtered = passes.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const num = p.request?.requestNumber?.toLowerCase().includes(q);
      const student = p.request?.requester?.student?.fullName?.toLowerCase().includes(q);
      const roll = p.request?.requester?.student?.rollNumber?.toLowerCase().includes(q);
      const dest = p.destination?.toLowerCase().includes(q);
      if (!num && !student && !roll && !dest) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Gate Pass Review Hub</h1>
          <p className="text-xs text-gray-400">
            Review and digitally sign gate exit applications for hostel residents.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, roll, or destination..."
            className="w-full bg-[#141722] border border-[#282f42] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
          {actionMsg}
        </div>
      )}

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No pending gate passes found.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {filtered.map((gp) => (
              <div
                key={gp.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181b26] transition text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">
                      {gp.request?.requestNumber}
                    </span>
                    <span className="font-bold text-gray-100">
                      {gp.request?.requester?.student?.fullName}
                    </span>
                    <span className="font-mono text-gray-400">
                      ({gp.request?.requester?.student?.rollNumber})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#202535] text-gray-300 border border-[#2d364d] text-[10px]">
                      Room: {gp.request?.requester?.student?.hostelRoom?.roomNumber || '204'}
                    </span>
                  </div>

                  <div className="text-gray-200">
                    Destination: <strong>{gp.destination}</strong>
                  </div>
                  <div className="text-gray-400 text-[11px]">{gp.reason}</div>

                  <div className="text-[11px] text-gray-500 pt-1">
                    Scheduled Departure: {new Date(gp.departureTime).toLocaleString()} • Expected Return: {new Date(gp.expectedReturnTime).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(gp.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs shadow transition"
                  >
                    <Check size={14} /> Approve Pass
                  </button>
                  <button
                    onClick={() => handleReject(gp.id)}
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
