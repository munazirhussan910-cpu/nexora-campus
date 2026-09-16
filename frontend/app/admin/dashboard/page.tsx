'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatGridSkeleton, CardSkeleton } from '@/components/ui/SkeletonLoader';
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
  Radio,
  FileCheck,
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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Cockpit Top Bar */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-purple-500/35 text-purple-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Campus Operations Cockpit</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Central Command Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Autonomous oversight and SLA telemetry across residential hostels, academic wings, and perimeter gates.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            <Link
              href="/admin/recurring-issues"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 font-bold text-xs shadow transition active:scale-95"
            >
              <AlertOctagon size={14} />
              <span>Recurring Issues ({recurring.length})</span>
            </Link>
            <Link
              href="/admin/approvals"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow-md shadow-[#d4af37]/20 transition active:scale-95"
            >
              <CheckCircle2 size={14} />
              <span>Approvals Hub ({metrics.pendingApprovals})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Cockpit Metrics Grid */}
      {loading ? (
        <StatGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
            title="Recurring"
            value={metrics.recurringIssueCount}
            subtitle="Section 44 alerts"
            icon={AlertOctagon}
            color="rose"
          />
        </div>
      )}

      {/* SECTION 44: RECURRING ISSUE DETECTION ALERT CARD */}
      {recurring.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/50 via-[#181522] to-[#121624] border border-rose-700/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-rose-950/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-800/40 pb-3">
            <div className="flex items-center gap-2.5 text-rose-300 font-extrabold text-sm tracking-tight">
              <div className="p-1.5 rounded-lg bg-rose-900/60 text-rose-300">
                <AlertOctagon size={18} className="animate-pulse" />
              </div>
              <span>OPERATIONAL ALERT: RECURRING ISSUE DETECTED (SECTION 44)</span>
            </div>
            <Link
              href="/admin/recurring-issues"
              className="text-xs font-bold text-rose-300 hover:text-white underline inline-flex items-center gap-1 shrink-0"
            >
              Analyze Clusters <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 text-xs">
            {recurring.slice(0, 3).map((issue: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#15131f] p-4 rounded-xl border border-rose-900/70 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{issue.hostelBlock}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700">
                    {issue.complaintCount} Complaints
                  </span>
                </div>
                <div className="text-gray-300 font-medium">Category: {issue.category}</div>
                <div className="text-[10px] text-gray-500 font-mono">
                  Detection Window: {issue.periodDays} Days
                </div>
                <p className="text-[11px] text-rose-200/90 leading-relaxed pt-1">
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
        <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#21273a] pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#182030] text-amber-400 flex items-center justify-center">
              <Wrench size={16} />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Complaints by Infrastructure
            </h2>
          </div>

          <div className="space-y-3.5 pt-1">
            {data?.categoryBreakdown?.map((cat: any) => {
              const total = metrics.totalRequests || 1;
              const pct = Math.round((cat.count / total) * 100);

              return (
                <div key={cat.category} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span className="font-medium">{cat.category}</span>
                    <span className="font-mono font-bold text-[#d4af37]">{cat.count} tickets</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#181d2e] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#d4af37] transition-all duration-500"
                      style={{ width: `${Math.min(pct * 2, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Operational Stream */}
        <div className="lg:col-span-2 bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
          <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#182030] text-emerald-400 flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Live Campus Request Stream
              </h2>
            </div>
            <Link
              href="/admin/requests"
              className="text-xs text-[#d4af37] hover:text-[#e4c257] font-semibold inline-flex items-center gap-1 group transition"
            >
              <span>View All Requests</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <CardSkeleton count={4} />
          ) : !data?.recentRequests?.length ? (
            <EmptyState title="No active requests" description="Everything is currently clear across the campus." />
          ) : (
            <div className="divide-y divide-[#202638]">
              {data.recentRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#161a29] transition-colors rounded-xl px-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#d4af37]">{req.requestNumber}</span>
                      <StatusBadge status={req.status} size="sm" />
                      <PriorityBadge priority={req.priority} />
                      <span className="text-gray-400 text-[10px] font-mono">
                        {req.location || 'Campus'}
                      </span>
                    </div>
                    <div className="font-semibold text-gray-200 truncate">{req.title}</div>
                    <div className="text-[11px] text-gray-500 font-mono">
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
          )}
        </div>
      </div>
    </div>
  );
}
