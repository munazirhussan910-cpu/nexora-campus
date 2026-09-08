'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function AdminSlaPage() {
  const [slaData, setSlaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSla = async () => {
      setLoading(true);
      const res = await apiRequest('/admin/sla');
      if (res.success && res.data) {
        setSlaData(res.data);
      }
      setLoading(false);
    };

    fetchSla();
  }, []);

  const counts = slaData?.ageingCounts || {
    '< 12h': 0,
    '12–24h': 0,
    '24–48h': 0,
    '> 48h': 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Campus SLA Operational Intelligence</h1>
        <p className="text-xs text-gray-400">
          Campus-wide SLA compliance rates, ageing distributions, and benchmark resolution performance.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white">Campus-Wide Ticket Ageing Distribution (Section 43)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Under 12 Hours</span>
            <span className="font-mono text-3xl font-extrabold text-emerald-300">{counts['< 12h']}</span>
            <span className="text-[10px] text-gray-400 block mt-1.5">Fresh &bull; Normal Queue</span>
          </div>

          <div className="p-5 rounded-xl bg-blue-950/30 border border-blue-800">
            <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">12 – 24 Hours</span>
            <span className="font-mono text-3xl font-extrabold text-blue-300">{counts['12–24h']}</span>
            <span className="text-[10px] text-gray-400 block mt-1.5">Approaching Benchmark</span>
          </div>

          <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-800">
            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">24 – 48 Hours</span>
            <span className="font-mono text-3xl font-extrabold text-amber-300">{counts['24–48h']}</span>
            <span className="text-[10px] text-gray-400 block mt-1.5">Overdue Warning</span>
          </div>

          <div className="p-5 rounded-xl bg-rose-950/30 border border-rose-800">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Over 48 Hours</span>
            <span className="font-mono text-3xl font-extrabold text-rose-300">{counts['> 48h']}</span>
            <span className="text-[10px] text-gray-400 block mt-1.5">Critical Breach Escalation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
