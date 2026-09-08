'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StaffSlaPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSla = async () => {
      setLoading(true);
      const res = await apiRequest('/complaints/assigned');
      if (res.success && res.data) {
        setTasks(res.data);
      }
      setLoading(false);
    };
    fetchSla();
  }, []);

  const openTasks = tasks.filter(
    (t) => !['RESOLVED', 'CONFIRMED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(t.status)
  );

  const ageingBreakdown = {
    '< 12h': openTasks.filter((t) => t.sla?.ageingBracket === '< 12h').length,
    '12–24h': openTasks.filter((t) => t.sla?.ageingBracket === '12–24h').length,
    '24–48h': openTasks.filter((t) => t.sla?.ageingBracket === '24–48h').length,
    '> 48h': openTasks.filter((t) => t.sla?.ageingBracket === '> 48h').length,
  };

  const breachedTasks = openTasks.filter((t) => t.sla?.status === 'BREACHED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Technician SLA Performance &amp; Ageing</h1>
        <p className="text-xs text-gray-400">
          Monitor response time compliance, resolution deadlines, and active ticket ageing brackets.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Work Orders"
          value={openTasks.length}
          subtitle="Currently assigned to you"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Fresh (< 12h)"
          value={ageingBreakdown['< 12h']}
          subtitle="Healthy compliance window"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Approaching (12-24h)"
          value={ageingBreakdown['12–24h']}
          subtitle="Resolution expected today"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue (> 24h)"
          value={ageingBreakdown['24–48h'] + ageingBreakdown['> 48h']}
          subtitle="Exceeded benchmark SLA"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Ageing Brackets Visual Grid */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white">Active Ticket Ageing Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Under 12 Hours</span>
            <span className="font-mono text-2xl font-bold text-emerald-300">{ageingBreakdown['< 12h']}</span>
            <span className="text-[10px] text-gray-400 block mt-1">Normal Priority</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800">
            <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">12 – 24 Hours</span>
            <span className="font-mono text-2xl font-bold text-blue-300">{ageingBreakdown['12–24h']}</span>
            <span className="text-[10px] text-gray-400 block mt-1">Moderate Ageing</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800">
            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">24 – 48 Hours</span>
            <span className="font-mono text-2xl font-bold text-amber-300">{ageingBreakdown['24–48h']}</span>
            <span className="text-[10px] text-gray-400 block mt-1">At Risk Target</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Over 48 Hours</span>
            <span className="font-mono text-2xl font-bold text-rose-300">{ageingBreakdown['> 48h']}</span>
            <span className="text-[10px] text-gray-400 block mt-1">Critical Escalation</span>
          </div>
        </div>
      </div>

      {/* Overdue Alerts Table */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400" />
          Attention Required: Overdue Tasks
        </h2>

        {breachedTasks.length === 0 ? (
          <div className="text-xs text-gray-400 py-6 text-center">
            No overdue tasks! All current work orders are well within SLA compliance limits.
          </div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {breachedTasks.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-400">{t.requestNumber}</span>
                    <StatusBadge status={t.status} size="sm" />
                    <span className="font-semibold text-gray-200">{t.title}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Location: {t.location}</div>
                </div>
                <SLAIndicator sla={t.sla} compact />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
