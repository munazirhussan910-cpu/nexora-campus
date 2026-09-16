'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatGridSkeleton, CardSkeleton } from '@/components/ui/SkeletonLoader';
import {
  Key,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
  Clock,
  Shield,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Security Top Bar */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-cyan-500/35 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
              <Shield size={12} />
              <span>Main Gate Security Clearance</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Duty Officer: {user?.fullName || 'Vikram Singh'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl font-mono">
              Post: <strong className="text-cyan-400">Campus Gate 1 (Main Entrance &amp; Exit)</strong>
            </p>
          </div>

          <Link
            href="/security/scan"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-xl shadow-cyan-950/40 active:scale-95 transition-all duration-150 shrink-0"
          >
            <QrCode size={20} />
            <span>OPEN GATE SCANNER (QR / PIN)</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      {loading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            subtitle="Hostel standard curfew"
            icon={Clock}
            color="purple"
          />
        </div>
      )}

      {/* Currently Departed Students Roster */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] text-cyan-400 flex items-center justify-center">
              <Activity size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Students Currently Off-Campus (Departed)
              </h2>
              <p className="text-[11px] text-gray-400">
                Active passes requiring return scanning prior to curfew
              </p>
            </div>
          </div>

          <Link
            href="/security/scan"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 group transition"
          >
            <span>Scan Return Arrival</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <CardSkeleton count={3} />
        ) : activeDepartures.length === 0 ? (
          <EmptyState
            title="No students currently off-campus"
            description="All active student gate passes are either returned or awaiting departure."
            icon={ShieldCheck}
          />
        ) : (
          <div className="divide-y divide-[#202638]">
            {activeDepartures.map((req) => (
              <div
                key={req.id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-[#161a29] transition-colors rounded-xl px-2"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-cyan-300">{req.requestNumber}</span>
                    <span className="font-bold text-white text-sm">
                      {req.requester?.student?.fullName || req.requester?.username}
                    </span>
                    <span className="font-mono text-gray-400 text-[11px]">
                      ({req.requester?.student?.rollNumber})
                    </span>
                    <StatusBadge status="DEPARTED" size="sm" />
                  </div>

                  <div className="text-gray-300">
                    Destination: <strong className="text-white">{req.gatePass?.destination || 'City'}</strong> • Reason: {req.description}
                  </div>

                  <div className="text-[11px] text-gray-500 font-mono">
                    Authorized Exit: {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#22293d]">
                  <div className="text-left sm:text-right text-[11px] text-gray-400 font-mono">
                    <div>
                      Return By:{' '}
                      <strong className="text-gray-200">
                        {req.gatePass?.expectedReturnTime
                          ? new Date(req.gatePass.expectedReturnTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Curfew'}
                      </strong>
                    </div>
                    <div className="font-mono text-cyan-300 font-bold">
                      PIN: {req.gatePass?.passPin}
                    </div>
                  </div>

                  <Link
                    href={`/security/scan?pin=${req.gatePass?.passPin}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-xs shadow transition active:scale-95"
                  >
                    <span>Mark Return</span>
                    <ArrowRight size={13} />
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
