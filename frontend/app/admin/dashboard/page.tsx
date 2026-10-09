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
  Wrench,
  AlertOctagon,
  ArrowRight,
  Activity,
  Shield,
  RefreshCw,
  Building,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  Hammer,
} from 'lucide-react';

interface MetricState {
  totalRequests: number;
  openRequests: number;
  overdueRequests: number;
  pendingApprovals: number;
  resolvedToday: number;
  activeStaff: number;
  recurringIssueCount: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streamFilter, setStreamFilter] = useState<'ALL' | 'COMPLAINT' | 'GATE_PASS' | 'LEAVE' | 'BONAFIDE'>('ALL');

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest('/admin/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Failed to load command center data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics: MetricState = data?.metrics || {
    totalRequests: 0,
    openRequests: 0,
    overdueRequests: 0,
    pendingApprovals: 0,
    resolvedToday: 0,
    activeStaff: 0,
    recurringIssueCount: 0,
  };

  const recurring = data?.recurringIssues || [];
  const rawRequests = data?.recentRequests || [];

  const filteredRequests = rawRequests.filter((r: any) => {
    if (streamFilter === 'ALL') return true;
    return r.requestType?.code === streamFilter;
  });

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('plumb') || c.includes('water')) return Droplets;
    if (c.includes('elect') || c.includes('power')) return Zap;
    if (c.includes('carpent') || c.includes('wood') || c.includes('door')) return Hammer;
    if (c.includes('net') || c.includes('wifi') || c.includes('lan')) return Wifi;
    if (c.includes('clean') || c.includes('sanitat') || c.includes('mess')) return Trash2;
    return Wrench;
  };

  const totalBreakdownCount =
    data?.categoryBreakdown?.reduce((acc: number, c: any) => acc + c.count, 0) ||
    metrics.totalRequests ||
    1;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 animate-tab-fade">
      {/* 1. COCKPIT HERO EXECUTIVE BANNER */}
      <div className="relative overflow-hidden bg-surface border border-border dark:bg-[#121624] dark:border-[#232b3f] dark:shadow-xl dark:shadow-black/15 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Title & Status Description */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary dark:bg-[#1b2234] dark:border-purple-500/35 dark:text-purple-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Central Operations Engine</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground bg-surface-secondary px-2 py-0.5 rounded-md border border-border">
                Bhubaneswar Campus
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-tight">
              Central Command Center
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Autonomous telemetry, Section 44 systemic pattern detection, and executive operations
              governance across residential hostel blocks, academic wings, and campus perimeter gates.
            </p>

            {/* Quick Operational Status Pills */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-secondary border border-border text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Telemetry: ONLINE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-secondary border border-border">
                <Building size={11} className="text-primary" />
                4 Hostel Blocks Monitored
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-secondary border border-border">
                <Shield size={11} className="text-cyan-600 dark:text-cyan-400" />
                Sentry QR Engine Active
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              disabled={loading || refreshing}
              className="p-2.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-muted-foreground hover:text-foreground transition active:scale-95 disabled:opacity-50 shrink-0 shadow-xs"
              title="Refresh telemetry stream"
              aria-label="Refresh telemetry stream"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-primary' : ''} />
            </button>

            <Link
              href="/admin/recurring-issues"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold text-xs shadow-xs transition active:scale-95 whitespace-nowrap"
            >
              <AlertOctagon size={14} className={recurring.length > 0 ? 'text-rose-500 animate-pulse' : ''} />
              <span>Section 44 Alerts</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-rose-600 text-white font-bold">
                {recurring.length}
              </span>
            </Link>

            <Link
              href="/admin/approvals"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground dark:bg-[#d4af37] dark:hover:bg-[#e4c257] dark:text-black dark:shadow-md dark:shadow-[#d4af37]/20 font-bold text-xs shadow-xs transition active:scale-95 whitespace-nowrap"
            >
              <CheckCircle2 size={14} />
              <span>Approvals Hub</span>
              {metrics.pendingApprovals > 0 && (
                <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-primary-foreground text-primary font-bold">
                  {metrics.pendingApprovals}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY METRICS COCKPIT GRID (6 RESPONSIVE CARDS) */}
      {loading ? (
        <StatGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-4">
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
            subtitle="Last 24h closures"
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

      {/* 3. SECTION 44: RECURRING ISSUE DETECTION ALERT CARD */}
      {recurring.length > 0 && (
        <div className="bg-rose-500/5 dark:bg-rose-950/30 border border-rose-500/25 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold text-xs sm:text-sm tracking-tight">
              <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertOctagon size={16} className="animate-pulse" />
              </div>
              <span className="leading-snug">
                OPERATIONAL ALERT: RECURRING INFRASTRUCTURE CLUSTERS (SECTION 44)
              </span>
            </div>
            <Link
              href="/admin/recurring-issues"
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              <span>Analyze Clusters ({recurring.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {recurring.slice(0, 3).map((issue: any, idx: number) => (
              <div
                key={idx}
                className="bg-surface dark:bg-[#15131f] p-3.5 sm:p-4 rounded-xl border border-border dark:border-rose-900/70 space-y-2 shadow-xs hover:border-rose-400 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-foreground text-xs sm:text-sm truncate">
                    {issue.hostelBlock}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 shrink-0">
                    {issue.complaintCount} Complaints
                  </span>
                </div>
                <div className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                  <span className="font-mono text-[11px]">Category:</span>
                  <span className="font-semibold text-foreground">{issue.category}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Detection Window: {issue.periodDays || 14} Days
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5 line-clamp-2">
                  {issue.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MIDDLE SPLIT: INFRASTRUCTURE COMPLAINT ANALYTICS + LIVE STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: Complaints by Infrastructure (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <Wrench size={15} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                    Complaints by Infrastructure
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Incident distribution breakdown
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground bg-surface-secondary px-2 py-0.5 rounded border border-border">
                {data?.categoryBreakdown?.length || 0} Categories
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {data?.categoryBreakdown?.length ? (
                data.categoryBreakdown.map((cat: any) => {
                  const CategoryIcon = getCategoryIcon(cat.category);
                  const count = cat.count || 0;
                  const pct = Math.max(1, Math.round((count / totalBreakdownCount) * 100));

                  return (
                    <div key={cat.category} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-1.5 truncate">
                          <CategoryIcon size={12} className="text-primary shrink-0" />
                          <span className="font-semibold text-foreground truncate">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                          <span className="text-[10px]">{pct}%</span>
                          <span className="font-bold text-foreground">{count}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden border border-border">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No registered complaint category telemetry available.
                </div>
              )}
            </div>
          </div>

          {/* Quick Infrastructure Summary Box */}
          <div className="p-3 rounded-xl bg-surface-secondary border border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span className="font-mono">Total Workloads Tracked</span>
            <span className="font-mono font-bold text-foreground text-xs">
              {metrics.totalRequests} Tickets
            </span>
          </div>
        </div>

        {/* Right Column: Live Operational Stream (8 cols) */}
        <div className="lg:col-span-8 bg-surface border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-xs space-y-4">
          {/* Header & Quick Stream Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Activity size={15} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Live Campus Request Stream
                </h2>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Real-time ticket lifecycle telemetry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/requests"
                className="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1 group transition shrink-0"
              >
                <span>View All Requests</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Filter Pills for Fast Stream Triage */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { key: 'ALL', label: 'All Requests' },
              { key: 'COMPLAINT', label: 'Complaints' },
              { key: 'GATE_PASS', label: 'Gate Passes' },
              { key: 'LEAVE', label: 'Hostel Leaves' },
              { key: 'BONAFIDE', label: 'Certificates' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStreamFilter(f.key as any)}
                className={`px-3 py-1 rounded-xl text-[11px] font-mono font-medium transition active:scale-95 whitespace-nowrap ${
                  streamFilter === f.key
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'bg-surface-secondary text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Request List */}
          {loading ? (
            <CardSkeleton count={4} />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title="No active requests in this filter"
              description="No current operational requests match the selected category."
            />
          ) : (
            <div className="divide-y divide-border -mx-1">
              {filteredRequests.slice(0, 5).map((req: any) => (
                <div
                  key={req.id}
                  className="py-3 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-surface-secondary/50 transition-colors rounded-xl"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-extrabold text-primary">
                        {req.requestNumber}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-secondary text-foreground border border-border">
                        {req.requestType?.name || req.requestType?.code || 'REQUEST'}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                      <PriorityBadge priority={req.priority} />
                      <span className="text-muted-foreground text-[10px] font-mono truncate max-w-[150px] sm:max-w-xs">
                        📍 {req.location || 'Campus Wide'}
                      </span>
                    </div>

                    <div className="font-semibold text-foreground truncate">{req.title}</div>

                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 flex-wrap">
                      <span>
                        Student: <strong className="text-foreground">{req.requester?.student?.fullName || req.requester?.username}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Assigned:{' '}
                        <strong className={req.assignedStaff ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}>
                          {req.assignedStaff?.staff?.fullName || 'Pending Dispatch'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <SLAIndicator sla={req.sla} compact />
                    <Link
                      href={`/admin/requests`}
                      className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] text-foreground font-mono transition"
                    >
                      Manage
                    </Link>
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