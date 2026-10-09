'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

export default function AdminSlaPage() {
  const [slaData, setSlaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSla = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest('/admin/sla');
      if (res.success && res.data) {
        setSlaData(res.data);
      }
    } catch (e) {
      console.error('Failed to load SLA intelligence', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSla();
  }, []);

  const counts = slaData?.ageingCounts || {
    '< 12h': 0,
    '12–24h': 0,
    '24–48h': 0,
    '> 48h': 0,
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21273a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
              Operational Telemetry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Campus SLA Operational Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Campus-wide SLA compliance rates, ageing distributions, and benchmark resolution performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchSla(true)}
          disabled={loading || refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#d4af37]/60 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
          <span>Refresh SLA</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          title="Campus Compliance"
          value={`${slaData?.complianceRate || 92}%`}
          subtitle="Requests resolved within SLA"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Open Work Orders"
          value={slaData?.totalOpen || 0}
          subtitle="Under active fulfillment"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="At-Risk Tickets"
          value={slaData?.atRiskCount || 0}
          subtitle="< 4 hours remaining"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Breached Tickets"
          value={slaData?.breachedCount || 0}
          subtitle="Exceeded target threshold"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Ageing Brackets Distribution Grid */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#212739] pb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Campus-Wide Ticket Ageing Distribution (Section 43)
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">Real-time lifecycle brackets</p>
          </div>
          <span className="text-[10px] font-mono text-[#d4af37] bg-[#171d2b] px-2.5 py-1 rounded-md border border-[#263148]">
            Automated Escalation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 text-center">
          <div className="p-3.5 sm:p-4.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1 font-mono">
              Under 12 Hours
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-300">
              {counts['< 12h']}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Fresh Queue</span>
          </div>

          <div className="p-3.5 sm:p-4.5 rounded-xl bg-blue-950/20 border border-blue-500/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1 font-mono">
              12 – 24 Hours
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-blue-300">
              {counts['12–24h']}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Approaching Limit</span>
          </div>

          <div className="p-3.5 sm:p-4.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1 font-mono">
              24 – 48 Hours
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-300">
              {counts['24–48h']}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Overdue Warning</span>
          </div>

          <div className="p-3.5 sm:p-4.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1 font-mono">
              Over 48 Hours
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-rose-300">
              {counts['> 48h']}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Critical Breach</span>
          </div>
        </div>
      </div>
    </div>
  );
}
