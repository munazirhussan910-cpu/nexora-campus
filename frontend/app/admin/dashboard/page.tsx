'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  AlertOctagon,
  ArrowRight,
  Activity,
  Wrench,
  Shield,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const res = await apiRequest('/admin/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const metrics = data?.metrics || {
    totalRequests: 0,
    openRequests: 0,
    overdueRequests: 0,
    pendingApprovals: 0,
    resolvedToday: 0,
    activeStaff: 0,
    recurringIssueCount: 0,
  };

  const recurring = data?.recurringIssues || [];

  return (
    <div className="space-y-6">
      {/* Cockpit Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400">
              CAMPUS OPERATIONS COCKPIT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Central Command Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Autonomous monitoring across residential hostels, academic facilities, and security gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/recurring-issues"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs shadow transition"
          >
            <AlertOctagon size={14} />
            <span>Recurring Issues ({recurring.length})</span>
          </Link>
          <Link
            href="/admin/approvals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold text-black font-bold text-xs hover:bg-[#c49f2e] transition shadow"
          >
            <CheckCircle2 size={14} />
            <span>Approvals Hub ({metrics.pendingApprovals})</span>
          </Link>
        </div>
      </div>

      {/* Primary Cockpit Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Open Requests"
          value={metrics.openRequests}
          subtitle="Active campus load"
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Overdue"
          value={metrics.overdueRequests}
          subtitle="Target breached"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Approvals"
          value={metrics.pendingApprovals}
          subtitle="Gate / leave / cert"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Resolved Today"
          value={metrics.resolvedToday}
          subtitle="Fixed in last 24h"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Active Staff"
          value={metrics.activeStaff}
          subtitle="Technicians on duty"
          icon={Wrench}
          color="purple"
        />
        <StatCard
          title="Recurring Clusters"
          value={metrics.recurringIssueCount}
          subtitle="Section 44 alerts"
          icon={AlertOctagon}
          color="rose"
        />
      </div>

      {/* SECTION 44: RECURRING ISSUE DETECTION ALERT CARD */}
      {recurring.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/50 via-[#1c1822] to-[#141722] border-2 border-rose-800 rounded-2xl p-6 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-400 font-extrabold text-sm">
              <AlertOctagon size={20} className="animate-bounce" />
              <span>OPERATIONAL ALERT: RECURRING CAMPUS ISSUE DETECTED (SECTION 44)</span>
            </div>
            <Link
              href="/admin/recurring-issues"
              className="text-xs font-bold text-rose-300 hover:text-white underline flex items-center gap-1"
            >
              Analyze Cluster <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            {recurring.slice(0, 3).map((issue: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#18151f] p-4 rounded-xl border border-rose-900/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-100 text-sm">{issue.hostelBlock}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    {issue.complaintCount} Complaints
                  </span>
                </div>
                <div className="text-gray-300 font-medium">Category: {issue.category}</div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Detection Window: {issue.periodDays} Days
                </div>
                <p className="text-[11px] text-rose-200/90 pt-1 leading-relaxed">
                  {issue.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Middle Split: Category Breakdown + Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench size={16} className="text-amber-400" />
            Complaints by Infrastructure Category
          </h2>

          <div className="space-y-3 pt-2">
            {data?.categoryBreakdown?.map((cat: any) => {
              const total = metrics.totalRequests || 1;
              const pct = Math.round((cat.count / total) * 100);

              return (
                <div key={cat.category} className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span className="font-medium">{cat.category}</span>
                    <span className="font-mono font-bold text-gold">{cat.count} tickets</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1e2434] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-gold"
                      style={{ width: `${Math.min(pct * 2, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Operational Stream */}
        <div className="lg:col-span-2 bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Live Campus Request Stream</h2>
            </div>
            <Link href="/admin/requests" className="text-xs text-gold hover:underline font-medium">
              View All Requests &gt;
            </Link>
          </div>

          <div className="divide-y divide-[#282f42]">
            {data?.recentRequests?.map((req: any) => (
              <div
                key={req.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#181b26] transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-gold">{req.requestNumber}</span>
                    <StatusBadge status={req.status} size="sm" />
                    <PriorityBadge priority={req.priority} />
                    <span className="text-gray-400 text-[11px] font-mono">
                      {req.location || 'Campus'}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-200">{req.title}</div>
                  <div className="text-[11px] text-gray-500">
                    Requester: {req.requester?.student?.fullName || req.requester?.username} • Assigned:{' '}
                    {req.assignedStaff?.staff?.fullName || 'Pending'}
                  </div>
                </div>

                <div className="shrink-0">
                  <SLAIndicator sla={req.sla} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
