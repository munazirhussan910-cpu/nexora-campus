'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import {
  Key,
  Calendar,
  Wrench,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  User,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141722] border border-[#282f42] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
            Hostel Residential Oversight
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Warden Desk: {user?.fullName || 'Dr. S. K. Mohapatra'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Jurisdiction: <span className="text-emerald-400 font-semibold">Hostel Block B (Men&apos;s Residential Wing)</span>
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
          {actionMsg}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          subtitle="Requires maintenance escalation"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Pending Gate Passes Queue */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Pending Gate Pass Applications</h2>
          </div>
          <Link href="/warden/gate-passes" className="text-xs text-gold hover:underline font-medium">
            View All ({pendingGatePasses.length})
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading applications...</div>
        ) : pendingGatePasses.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">No pending gate passes to review.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {pendingGatePasses.map((gp) => (
              <div key={gp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">
                      {gp.request?.requestNumber}
                    </span>
                    <span className="font-semibold text-gray-100">
                      {gp.request?.requester?.student?.fullName || 'Student'}
                    </span>
                    <span className="text-gray-400 font-mono text-[11px]">
                      ({gp.request?.requester?.student?.rollNumber})
                    </span>
                  </div>
                  <div className="text-gray-300">
                    Destination: <strong>{gp.destination}</strong> • Reason: {gp.reason}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Departure: {new Date(gp.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Return: {new Date(gp.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveGatePass(gp.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleRejectGatePass(gp.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs transition"
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
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-purple-400" />
            <h2 className="text-sm font-bold text-white">Pending Leave Requests</h2>
          </div>
          <Link href="/warden/leaves" className="text-xs text-gold hover:underline font-medium">
            View All ({pendingLeaves.length})
          </Link>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No pending leave applications.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {pendingLeaves.map((l) => (
              <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-300">
                      {l.request?.requestNumber}
                    </span>
                    <span className="font-semibold text-gray-100">
                      {l.request?.requester?.student?.fullName}
                    </span>
                  </div>
                  <div className="text-gray-300 mt-0.5">
                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} • {l.reason}
                  </div>
                  <div className="text-[11px] text-gray-400">Emergency: {l.emergencyContact}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveLeave(l.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition"
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
