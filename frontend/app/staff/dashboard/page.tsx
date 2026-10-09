'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatGridSkeleton, CardSkeleton } from '@/components/ui/SkeletonLoader';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  User,
  Briefcase,
} from 'lucide-react';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await apiRequest('/complaints/assigned');
    if (res.success && res.data) {
      setTasks(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const assignedTasks = tasks.filter((t) => t.status === 'ASSIGNED');
  const inProgressTasks = tasks.filter((t) => ['ACCEPTED', 'IN_PROGRESS'].includes(t.status));
  const overdueTasks = tasks.filter(
    (t) => t.sla?.isOverdue && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status)
  );
  const completedTasks = tasks.filter((t) => ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status));

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 animate-tab-fade">
      {/* Technician Welcome Header */}
      <div className="bg-surface border border-border dark:bg-[#121624] dark:border-[#232b3f] dark:shadow-xl dark:shadow-black/15 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:bg-[#1b2234] dark:border-amber-500/35 dark:text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <Wrench size={12} />
              <span>Facility Maintenance &amp; Repair Desk</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              Hello, {user?.fullName || 'Ramesh Kumar'}!
            </h1>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground mt-2 font-mono">
              <span>
                Unit: <strong className="text-foreground font-bold">{user?.department || 'Maintenance'} ({user?.specialization || 'PLUMBING'})</strong>
              </span>
              <span className="opacity-40">•</span>
              <span>
                Emp ID: <strong className="text-foreground">{user?.employeeId || 'STF-PLUMB-01'}</strong>
              </span>
              <span className="opacity-40">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>On Duty</span>
              </span>
            </div>
          </div>

          <Link
            href="/staff/tasks"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black dark:shadow-md dark:shadow-amber-950/20 font-bold text-xs shadow-xs active:scale-95 transition-all duration-150 shrink-0"
          >
            <Briefcase size={15} />
            <span>View Work Queue ({tasks.length})</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      {loading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Assigned"
            value={assignedTasks.length}
            subtitle="New tasks awaiting acceptance"
            icon={Wrench}
            color="amber"
          />
          <StatCard
            title="In Progress"
            value={inProgressTasks.length}
            subtitle="Active on-site repair jobs"
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Overdue"
            value={overdueTasks.length}
            subtitle="Critical SLA target breached"
            icon={AlertTriangle}
            color="rose"
          />
          <StatCard
            title="Resolved"
            value={completedTasks.length}
            subtitle="Completed maintenance jobs"
            icon={CheckCircle2}
            color="emerald"
          />
        </div>
      )}

      {/* Active Work Queue List */}
      <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Wrench size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Active Assigned Tasks (Priority Queue)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Actionable repair orders requiring on-site verification and dispatch
              </p>
            </div>
          </div>

          <Link
            href="/staff/tasks"
            className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1 group transition"
          >
            <span>Full Task Board</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <CardSkeleton count={4} />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No maintenance tasks assigned"
            description="All scheduled facility maintenance jobs are currently completed. Great job!"
            icon={Wrench}
          />
        ) : (
          <div className="divide-y divide-border">
            {tasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-surface-secondary/50 transition-colors rounded-xl px-2"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {task.requestNumber}
                    </span>
                    <StatusBadge status={task.status} size="sm" />
                    <PriorityBadge priority={task.priority} />
                    <span className="text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-[10px] font-mono">
                      {task.complaint?.category || 'General'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground tracking-tight leading-snug">
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono flex-wrap">
                    <span className="flex items-center gap-1 text-foreground">
                      <MapPin size={12} className="text-primary" />
                      <strong>{task.location || 'Hostel Room'}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User size={12} className="opacity-70" />
                      Requester: {task.requester?.student?.fullName || task.requester?.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <SLAIndicator sla={task.sla} compact />
                  <Link
                    href={`/staff/tasks/${task.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-surface-secondary text-primary border border-border hover:border-primary font-bold transition-all shadow-xs active:scale-95"
                  >
                    <span>Open Task</span>
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
