'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/status/StatusBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import {
  Wrench,
  Key,
  FileCheck,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const [reqRes, gpRes] = await Promise.all([
        apiRequest('/requests/my'),
        apiRequest('/gate-passes/my'),
      ]);

      if (reqRes.success && reqRes.data) setRequests(reqRes.data);
      if (gpRes.success && gpRes.data) setGatePasses(gpRes.data);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const activeRequests = requests.filter(
    (r) => !['RESOLVED', 'CONFIRMED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(r.status)
  );

  const pendingApprovals = requests.filter((r) => r.status === 'PENDING_APPROVAL');

  const resolvedRequests = requests.filter((r) =>
    ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(r.status)
  );

  const latestApprovedGatePass = gatePasses.find(
    (gp) => gp.gateStatus === 'APPROVED' || gp.gateStatus === 'DEPARTED'
  );

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141722] border border-[#282f42] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold font-bold mb-1">
            Student Operations Desk
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Welcome back, {user?.fullName || user?.username || 'Aryan'}!
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Roll: <span className="text-gray-200 font-mono font-semibold">{user?.rollNumber || '220101048'}</span> • {user?.hostelBlock || 'Block B'} / Room {user?.roomNumber || '204'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/student/requests/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold text-black font-bold text-xs hover:bg-[#c49f2e] transition shadow"
          >
            <Plus size={14} /> + New Complaint
          </Link>
          <Link
            href="/student/gate-pass"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#22283a] border border-[#3d4661] text-gray-200 text-xs hover:text-white transition"
          >
            <Key size={14} className="text-cyan-400" /> Apply Gate Pass
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Requests"
          value={activeRequests.length}
          subtitle="In flight or in progress"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          subtitle="Awaiting warden / admin"
          icon={Wrench}
          color="amber"
        />
        <StatCard
          title="Resolved"
          value={resolvedRequests.length}
          subtitle="Successfully completed"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Total Lifetime"
          value={requests.length}
          subtitle="Tracked in Request Engine"
          icon={FileCheck}
          color="gold"
        />
      </div>

      {/* Active Gate Pass Highlight Card (if exists) */}
      {latestApprovedGatePass && (
        <div className="bg-gradient-to-r from-[#121c2b] to-[#141722] border border-cyan-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ACTIVE APPROVED GATE PASS READY FOR GATE
              </div>
              <h2 className="text-lg font-bold text-white">
                Destination: {latestApprovedGatePass.destination}
              </h2>
              <p className="text-xs text-gray-400 max-w-md">
                Reason: {latestApprovedGatePass.reason}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs">
                <div className="bg-[#1a2335] px-3 py-1.5 rounded-lg border border-[#2b3954]">
                  <span className="text-gray-400 block text-[10px]">VERIFICATION PIN</span>
                  <span className="font-mono font-extrabold text-base text-cyan-300 tracking-wider">
                    {latestApprovedGatePass.passPin}
                  </span>
                </div>
                <div className="bg-[#1a2335] px-3 py-1.5 rounded-lg border border-[#2b3954]">
                  <span className="text-gray-400 block text-[10px]">VALID UNTIL</span>
                  <span className="font-mono font-semibold text-xs text-gray-200">
                    {new Date(latestApprovedGatePass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Graphic */}
            <div className="bg-white p-3 rounded-xl shadow-lg flex flex-col items-center shrink-0">
              <QRCodeSVG
                value={latestApprovedGatePass.qrTokenHash || latestApprovedGatePass.passPin}
                size={110}
                level="M"
              />
              <span className="text-[10px] text-gray-800 font-mono mt-1 font-bold">
                SCAN AT MAIN GATE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Launchpad */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/student/requests/new"
          className="p-4 rounded-xl bg-[#141722] border border-[#282f42] hover:border-amber-500/60 transition group text-left flex flex-col justify-between"
        >
          <Wrench size={22} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-bold text-xs text-gray-100">+ New Complaint</div>
            <div className="text-[11px] text-gray-400">Plumbing, electrical, room repairs</div>
          </div>
        </Link>

        <Link
          href="/student/gate-pass"
          className="p-4 rounded-xl bg-[#141722] border border-[#282f42] hover:border-cyan-500/60 transition group text-left flex flex-col justify-between"
        >
          <Key size={22} className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-bold text-xs text-gray-100">+ Gate Pass</div>
            <div className="text-[11px] text-gray-400">QR pass &amp; emergency PIN</div>
          </div>
        </Link>

        <Link
          href="/student/documents"
          className="p-4 rounded-xl bg-[#141722] border border-[#282f42] hover:border-emerald-500/60 transition group text-left flex flex-col justify-between"
        >
          <FileCheck size={22} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-bold text-xs text-gray-100">+ Bonafide Cert</div>
            <div className="text-[11px] text-gray-400">Digital certified PDF download</div>
          </div>
        </Link>

        <Link
          href="/student/leave"
          className="p-4 rounded-xl bg-[#141722] border border-[#282f42] hover:border-purple-500/60 transition group text-left flex flex-col justify-between"
        >
          <Calendar size={22} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-bold text-xs text-gray-100">+ Hostel Leave</div>
            <div className="text-[11px] text-gray-400">Multi-day vacation leave approval</div>
          </div>
        </Link>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gold" />
            <h2 className="text-sm font-bold text-gray-200">Recent Requests &amp; Live Tracking</h2>
          </div>
          <Link
            href="/student/requests"
            className="text-xs text-gold hover:underline font-medium flex items-center gap-1"
          >
            View All ({requests.length}) <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500 text-xs">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-xs">
            No campus requests created yet. Click above to log your first ticket!
          </div>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 6).map((req) => (
              <Link
                key={req.id}
                href={`/student/requests/${req.id}`}
                className="block bg-[#181b26] border border-[#282f42] hover:border-[#3d4661] rounded-xl p-3.5 transition group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-100 group-hover:text-gold transition">
                      {req.requestNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#22283a] text-gray-300 border border-[#323b52]">
                      {req.requestType?.name || req.requestTypeId}
                    </span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                  <SLAIndicator sla={req.sla} compact />
                </div>

                <div className="text-xs font-medium text-gray-200 mb-1">
                  {req.title}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>Loc: {req.location || 'Campus'}</span>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
