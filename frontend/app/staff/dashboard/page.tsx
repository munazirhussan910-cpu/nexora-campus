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
  Shield,
  Briefcase,
  Layers,
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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Technician Welcome Header */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-amber-500/35 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
              <Wrench size={12} />
              <span>Facility Maintenance &amp; Repair Desk</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.fullName || 'Ramesh Kumar'}!
            </h1>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-400 mt-2 font-mono">
              <span className="text-gray-300">
                Unit: <strong className="text-white font-bold">{user?.department || 'Maintenance'} ({user?.specialization || 'PLUMBING'})</strong>
              </span>
              <span className="text-gray-600">•</span>
              <span>
                Emp ID: <strong className="text-gray-300">{user?.employeeId || 'STF-PLUMB-01'}</strong>
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400 font-semibold">On Duty</span>
            </div>
          </div>

          <Link
            href="/staff/tasks"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-950/20 active:scale-95 transition-all duration-150 shrink-0"
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
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] text-amber-400 flex items-center justify-center">
              <Wrench size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Active Assigned Tasks (Priority Queue)
              </h2>
              <p className="text-[11px] text-gray-400">
                Actionable repair orders requiring on-site verification and dispatch
              </p>
            </div>
          </div>

          <Link
            href="/staff/tasks"
            className="text-xs text-[#d4af37] hover:text-[#e4c257] font-semibold inline-flex items-center gap-1 group transition"
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
          <div className="divide-y divide-[#202638]">
            {tasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-[#161a29] transition-colors rounded-xl px-2"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-amber-300">
                      {task.requestNumber}
                    </span>
                    <StatusBadge status={task.status} size="sm" />
                    <PriorityBadge priority={task.priority} />
                    <span className="text-gray-300 font-medium px-2 py-0.5 rounded-full bg-[#181d2e] border border-[#273146] text-[10px] font-mono">
                      {task.complaint?.category || 'General'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono flex-wrap">
                    <span className="flex items-center gap-1 text-gray-300">
                      <MapPin size={12} className="text-amber-400" />
                      <strong>{task.location || 'Hostel Room'}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <User size={12} className="text-gray-500" />
                      Requester: {task.requester?.student?.fullName || task.requester?.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#22293d]">
                  <SLAIndicator sla={task.sla} compact />
                  <Link
                    href={`/staff/tasks/${task.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#182030] hover:bg-[#202b40] text-[#d4af37] hover:text-[#e4c257] border border-[#d4af37]/35 font-bold transition-all shadow-xs active:scale-95"
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
