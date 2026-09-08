'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  User,
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
  const overdueTasks = tasks.filter((t) => t.sla?.isOverdue && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status));
  const completedTasks = tasks.filter((t) => ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141722] border border-[#282f42] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
            Maintenance &amp; Facility Operations Desk
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Hello, {user?.fullName || 'Ramesh Kumar'}!
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Designation: <span className="text-gray-200 font-semibold">{user?.department || 'Maintenance'} ({user?.specialization || 'PLUMBING'})</span> • Emp ID: {user?.employeeId || 'STF-PLUMB-01'}
          </p>
        </div>

        <Link
          href="/staff/tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow transition"
        >
          <Wrench size={14} /> View Work Queue ({tasks.length})
        </Link>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Active Work Queue List */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white">Active Assigned Tasks (Priority Queue)</h2>
          </div>
          <Link href="/staff/tasks" className="text-xs text-gold hover:underline font-medium flex items-center gap-1">
            Full Tasks View <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading assigned tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No maintenance tasks currently assigned. Great job!
          </div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {tasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-amber-300">
                      {task.requestNumber}
                    </span>
                    <StatusBadge status={task.status} size="sm" />
                    <PriorityBadge priority={task.priority} />
                    <span className="text-gray-400 font-medium">
                      Category: <strong>{task.complaint?.category}</strong>
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-gray-100">{task.title}</h3>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-gray-500" /> {task.location || 'Hostel Room'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-gray-500" /> {task.requester?.student?.fullName || task.requester?.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <SLAIndicator sla={task.sla} compact />
                  <Link
                    href={`/staff/tasks/${task.id}`}
                    className="px-3 py-1.5 rounded-lg bg-[#1f2638] hover:bg-[#28324a] text-gold border border-[#3d4661] transition font-bold"
                  >
                    Open Task
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
