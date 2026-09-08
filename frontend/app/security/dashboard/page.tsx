'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Key, QrCode, ArrowRight, ShieldCheck, Activity, Users, Clock } from 'lucide-react';

export default function SecurityDashboardPage() {
  const { user } = useAuth();
  const [activeDepartures, setActiveDepartures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityStats = async () => {
      setLoading(true);
      const res = await apiRequest('/requests?type=GATE_PASS&status=DEPARTED');
      if (res.success && res.data) {
        setActiveDepartures(res.data);
      }
      setLoading(false);
    };

    fetchSecurityStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141722] border border-[#282f42] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-1">
            Main Gate Security Command
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Duty Officer: {user?.fullName || 'Vikram Singh'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Post: <span className="text-cyan-400 font-semibold">Campus Gate 1 (Main Entrance &amp; Exit)</span>
          </p>
        </div>

        <Link
          href="/security/scan"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm shadow-xl transition"
        >
          <QrCode size={18} /> OPEN GATE SCANNER (QR / PIN)
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Students Outside"
          value={activeDepartures.length}
          subtitle="Departed campus via pass"
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Gate Verification"
          value="ACTIVE"
          subtitle="Cryptographic HMAC online"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Fallback Mode"
          value="READY"
          subtitle="4-digit numeric PIN verified"
          icon={Key}
          color="amber"
        />
        <StatCard
          title="Current Curfew"
          value="10:00 PM"
          subtitle="Hostel Block standard limit"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Currently Departed Students Roster */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Students Currently Off-Campus (Departed)</h2>
          </div>
          <Link href="/security/scan" className="text-xs text-cyan-400 hover:underline font-medium">
            Scan Return &gt;
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading departed students...</div>
        ) : activeDepartures.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No students are currently outside on active gate passes.
          </div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {activeDepartures.map((req) => (
              <div
                key={req.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">{req.requestNumber}</span>
                    <span className="font-bold text-gray-100">{req.requester?.student?.fullName}</span>
                    <span className="font-mono text-gray-400">({req.requester?.student?.rollNumber})</span>
                    <StatusBadge status="DEPARTED" size="sm" />
                  </div>
                  <div className="text-gray-300 mt-0.5">
                    Destination: {req.gatePass?.destination || 'City'} • Reason: {req.description}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-[11px] text-gray-400">
                    <div>Return By: <strong className="text-gray-200">{req.gatePass?.expectedReturnTime ? new Date(req.gatePass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Curfew'}</strong></div>
                    <div className="font-mono text-cyan-300">PIN: {req.gatePass?.passPin}</div>
                  </div>

                  <Link
                    href={`/security/scan?pin=${req.gatePass?.passPin}`}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs shadow transition"
                  >
                    Mark Return
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
