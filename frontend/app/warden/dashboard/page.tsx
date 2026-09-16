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
  Calendar,
  Wrench,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  User,
  Shield,
  Clock,
  Home,
  CheckCircle2,
} from 'lucide-react';

export default function WardenDashboardPage() {
  const { user } = useAuth();
  const [pendingGatePasses, setPendingGatePasses] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [gpRes, leaveRes, compRes] = await Promise.all([
      apiRequest('/gate-passes/pending'),
      apiRequest('/leaves/pending'),
      apiRequest('/requests?type=COMPLAINT&hostel=Block B'),
    ]);

    if (gpRes.success && gpRes.data) setPendingGatePasses(gpRes.data);
    if (leaveRes.success && leaveRes.data) setPendingLeaves(leaveRes.data);
    if (compRes.success && compRes.data) setComplaints(compRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveGatePass = async (id: string) => {
    const res = await apiRequest(`/gate-passes/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg('Gate pass approved! QR token and PIN dispatched to student.');
      loadData();
    }
  };

  const handleRejectGatePass = async (id: string) => {
    const res = await apiRequest(`/gate-passes/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Rejected by Warden during curfew review' }),
    });
    if (res.success) {
      setActionMsg('Gate pass rejected.');
      loadData();
    }
  };

  const handleApproveLeave = async (id: string) => {
    const res = await apiRequest(`/leaves/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg('Hostel leave approved successfully.');
      loadData();
    }
  };

  const overdueComplaints = complaints.filter(
    (c) => c.sla?.isOverdue && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(c.status)
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Warden Desk Header */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-emerald-500/35 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
              <Shield size={12} />
              <span>Hostel Residential Oversight</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Warden Desk: {user?.fullName || 'Dr. S. K. Mohapatra'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl font-mono">
              Residential Jurisdiction: <strong className="text-emerald-400">Hostel Block B (Men&apos;s Residential Wing)</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/warden/gate-passes"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow transition active:scale-95"
            >
              <Key size={14} />
              <span>Review Gate Passes ({pendingGatePasses.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm animate-tab-fade">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span className="font-semibold">{actionMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      {loading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Pending Passes"
            value={pendingGatePasses.length}
            subtitle="Gate exit authorizations"
            icon={Key}
            color="cyan"
          />
          <StatCard
            title="Pending Leave"
            value={pendingLeaves.length}
            subtitle="Overnight absence requests"
            icon={Calendar}
            color="purple"
          />
          <StatCard
            title="Hostel Complaints"
            value={complaints.length}
            subtitle="Block B maintenance tickets"
            icon={Wrench}
            color="amber"
          />
          <StatCard
            title="Overdue Complaints"
            value={overdueComplaints.length}
            subtitle="Requires escalation"
            icon={AlertTriangle}
            color="rose"
          />
        </div>
      )}

      {/* Pending Gate Passes Queue */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] text-cyan-400 flex items-center justify-center">
              <Key size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Pending Gate Pass Applications
              </h2>
              <p className="text-[11px] text-gray-400">
                Authorize or reject curfew exit passes for Hostel Block B
              </p>
            </div>
          </div>

          <Link
            href="/warden/gate-passes"
            className="text-xs text-[#d4af37] hover:text-[#e4c257] font-semibold inline-flex items-center gap-1 group transition"
          >
            <span>All Passes ({pendingGatePasses.length})</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <CardSkeleton count={3} />
        ) : pendingGatePasses.length === 0 ? (
          <EmptyState
            title="No pending gate passes"
            description="All student exit applications have been reviewed."
            icon={Key}
          />
        ) : (
          <div className="divide-y divide-[#202638]">
            {pendingGatePasses.map((gp) => (
              <div
                key={gp.id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-[#161a29] transition-colors rounded-xl px-2"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-cyan-300">
                      {gp.request?.requestNumber}
                    </span>
                    <span className="font-bold text-gray-100 text-sm">
                      {gp.request?.requester?.student?.fullName || 'Student'}
                    </span>
                    <span className="text-gray-400 font-mono text-[11px]">
                      ({gp.request?.requester?.student?.rollNumber})
                    </span>
                  </div>

                  <div className="text-gray-200">
                    Destination: <strong className="text-white">{gp.destination}</strong> • Reason: {gp.reason}
                  </div>

                  <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 flex-wrap">
                    <span>Dep: {new Date(gp.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Return: {new Date(gp.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#22293d]">
                  <button
                    type="button"
                    onClick={() => handleApproveGatePass(gp.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-xs active:scale-95 transition-all"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectGatePass(gp.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs active:scale-95 transition-all"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Leaves Queue */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] text-purple-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Pending Leave Applications
              </h2>
              <p className="text-[11px] text-gray-400">
                Multi-day residential absences requiring warden sign-off
              </p>
            </div>
          </div>

          <Link
            href="/warden/leaves"
            className="text-xs text-[#d4af37] hover:text-[#e4c257] font-semibold inline-flex items-center gap-1 group transition"
          >
            <span>All Leaves ({pendingLeaves.length})</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {pendingLeaves.length === 0 ? (
          <EmptyState
            title="No pending leave applications"
            description="There are currently no overnight absence requests awaiting approval."
            icon={Calendar}
          />
        ) : (
          <div className="divide-y divide-[#202638]">
            {pendingLeaves.map((l) => (
              <div
                key={l.id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-[#161a29] transition-colors rounded-xl px-2"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-purple-300">
                      {l.request?.requestNumber}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {l.request?.requester?.student?.fullName}
                    </span>
                  </div>

                  <div className="text-gray-200">
                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} • {l.reason}
                  </div>

                  <div className="text-[11px] text-gray-400 font-mono">
                    Emergency Contact: <strong className="text-gray-300">{l.emergencyContact}</strong>
                  </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#22293d]">
                  <button
                    type="button"
                    onClick={() => handleApproveLeave(l.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-xs active:scale-95 transition-all"
                  >
                    <Check size={14} /> Approve Leave
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
