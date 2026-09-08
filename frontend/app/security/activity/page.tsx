'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Activity, Clock, ShieldCheck, ArrowRight, User } from 'lucide-react';

export default function SecurityActivityPage() {
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      const res = await apiRequest('/requests?type=GATE_PASS');
      if (res.success && res.data) {
        setPasses(res.data);
      }
      setLoading(false);
    };
    fetchActivity();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Live Campus Gate Activity</h1>
        <p className="text-xs text-gray-400">
          Chronological event ledger of all gate passes, departure exits, and arrival scans.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading activity ledger...</div>
        ) : passes.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No gate passes recorded.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {passes.map((p) => (
              <div
                key={p.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#181b26] transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">{p.requestNumber}</span>
                    <span className="font-bold text-gray-100">{p.requester?.student?.fullName}</span>
                    <span className="font-mono text-gray-400">({p.requester?.student?.rollNumber})</span>
                    <StatusBadge status={p.status} size="sm" />
                  </div>

                  <div className="text-gray-300">
                    Destination: <strong>{p.gatePass?.destination || p.title}</strong>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    Departure Time: {new Date(p.createdAt).toLocaleTimeString()} • Curfew: {p.dueAt ? new Date(p.dueAt).toLocaleTimeString() : 'Standard'}
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-400 font-mono">
                  {p.completedAt ? (
                    <div className="text-emerald-400 font-bold">RETURNED AT {new Date(p.completedAt).toLocaleTimeString()}</div>
                  ) : p.status === 'DEPARTED' ? (
                    <div className="text-cyan-400 font-bold">CURRENTLY OFF CAMPUS</div>
                  ) : (
                    <div className="text-gray-500">Status: {p.status}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
