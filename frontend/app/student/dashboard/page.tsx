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
  Copy,
  Check,
  Inbox,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPin, setCopiedPin] = useState(false);

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

  const handleCopyPin = (pin: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Student Welcome Header Card */}
      <div className="relative overflow-hidden bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/20">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-[#d4af37]/35 text-[#d4af37] text-[10px] font-mono font-bold uppercase tracking-wider mb-2.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_6px_#d4af37]" />
              <span>Student Operations Desk</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Aryan'} 👋
            </h1>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-400 mt-2 font-mono">
              <span className="text-gray-300">
                Roll: <strong className="text-white font-bold">{user?.rollNumber || '220101048'}</strong>
              </span>
              <span className="text-gray-600">•</span>
              <span>
                Hostel: <strong className="text-gray-300">{user?.hostelBlock || 'Block B'}</strong> / Room <strong className="text-gray-300">{user?.roomNumber || '204'}</strong>
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400 font-semibold">Active Term</span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            <Link
              href="/student/requests/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow-md shadow-[#d4af37]/15 active:scale-95 transition-all duration-150"
              title="Log a new campus service ticket"
            >
              <Plus size={15} />
              <span>+ New Complaint</span>
            </Link>

            <Link
              href="/student/gate-pass"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#171d2b] hover:bg-[#202738] border border-[#2b364d] text-cyan-300 hover:text-cyan-200 text-xs font-semibold active:scale-95 transition-all duration-150"
              title="Apply for a campus exit gate pass"
            >
              <Key size={14} className="text-cyan-400" />
              <span>Apply Gate Pass</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Requests"
          value={loading ? '—' : activeRequests.length}
          subtitle="In flight or in progress"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? '—' : pendingApprovals.length}
          subtitle="Awaiting warden / admin"
          icon={Wrench}
          color="amber"
        />
        <StatCard
          title="Resolved"
          value={loading ? '—' : resolvedRequests.length}
          subtitle="Successfully closed"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Total Lifetime"
          value={loading ? '—' : requests.length}
          subtitle="All submissions"
          icon={FileCheck}
          color="gold"
        />
      </div>

      {/* Active Gate Pass Card (High-Priority Real-Time Pass) */}
      {latestApprovedGatePass && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#101827] via-[#121c2d] to-[#151c27] border border-cyan-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-cyan-950/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3.5 text-center md:text-left w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-600/70 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>ACTIVE APPROVED GATE PASS • READY FOR SCAN</span>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Destination: {latestApprovedGatePass.destination}
                </h2>
                <p className="text-xs text-gray-300 mt-1 max-w-xl line-clamp-2">
                  Reason: {latestApprovedGatePass.reason}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                {/* Offline PIN Block with Copy action */}
                <div className="bg-[#162133] px-3.5 py-2 rounded-xl border border-cyan-800/50 flex items-center gap-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono font-semibold text-gray-400 block leading-tight">
                      Verification PIN
                    </span>
                    <span className="font-mono font-black text-lg sm:text-xl text-cyan-300 tracking-wider">
                      {latestApprovedGatePass.passPin}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(latestApprovedGatePass.passPin)}
                    className="p-1.5 rounded-lg bg-[#1f2d45] hover:bg-[#283a59] text-cyan-300 transition shrink-0"
                    title="Copy PIN to clipboard"
                    aria-label="Copy PIN"
                  >
                    {copiedPin ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Valid Until Block */}
                <div className="bg-[#162133] px-3.5 py-2 rounded-xl border border-cyan-800/50 text-left">
                  <span className="text-[10px] uppercase font-mono font-semibold text-gray-400 block leading-tight">
                    Valid Return Until
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-gray-200 block pt-0.5">
                    {new Date(latestApprovedGatePass.expectedReturnTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <Link
                  href="/student/gate-pass"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 ml-auto"
                >
                  View Details <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* High-Contrast QR Code Presentation */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col items-center shrink-0 border-2 border-cyan-400/40">
              <QRCodeSVG
                value={latestApprovedGatePass.qrTokenHash || latestApprovedGatePass.passPin}
                size={115}
                level="M"
              />
              <span className="text-[10px] text-gray-900 font-mono font-black mt-2 tracking-wider">
                SCAN AT MAIN GATE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Launchpad Action Cards */}
      <div>
        <div className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider mb-3 px-1">
          Quick Campus Services
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/student/requests/new"
            className="p-4 sm:p-5 rounded-2xl bg-[#121624] border border-[#232a3d] hover:border-amber-500/50 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench size={18} />
              </div>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-white transition">
                + New Complaint
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                Hostel repairs, plumbing, electrical
              </div>
            </div>
          </Link>

          <Link
            href="/student/gate-pass"
            className="p-4 sm:p-5 rounded-2xl bg-[#121624] border border-[#232a3d] hover:border-cyan-500/50 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Key size={18} />
              </div>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-white transition">
                Gate Pass
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                Exit QR pass &amp; warden authorization
              </div>
            </div>
          </Link>

          <Link
            href="/student/documents"
            className="p-4 sm:p-5 rounded-2xl bg-[#121624] border border-[#232a3d] hover:border-emerald-500/50 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck size={18} />
              </div>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-white transition">
                Bonafide Cert
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                Certified digital PDF download
              </div>
            </div>
          </Link>

          <Link
            href="/student/leave"
            className="p-4 sm:p-5 rounded-2xl bg-[#121624] border border-[#232a3d] hover:border-purple-500/50 hover:bg-[#161c2d] active:scale-[0.98] transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar size={18} />
              </div>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-white transition">
                Hostel Leave
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                Vacation &amp; multi-day leave application
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#28354f] text-[#d4af37] flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Recent Requests &amp; Live Tracking
              </h2>
              <p className="text-[11px] text-gray-400">
                Continuous SLA monitoring and technician assignment tracking
              </p>
            </div>
          </div>

          <Link
            href="/student/requests"
            className="text-xs text-[#d4af37] hover:text-[#e4c257] font-semibold flex items-center gap-1 group transition"
          >
            <span>View All ({requests.length})</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[#161a28] border border-[#232a3d] animate-pulse"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#161a28] border border-[#262e42] flex items-center justify-center text-gray-500">
              <Inbox size={22} />
            </div>
            <div>
              <div className="font-semibold text-gray-300">No campus requests created yet</div>
              <div className="text-gray-500 mt-0.5">Click above to log your first ticket or request!</div>
            </div>
            <Link
              href="/student/requests/new"
              className="mt-1 px-4 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs hover:bg-[#e4c257] transition shadow"
            >
              + Create First Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {requests.slice(0, 6).map((req) => (
              <Link
                key={req.id}
                href={`/student/requests/${req.id}`}
                className="block bg-[#161a29] border border-[#232b3f] hover:border-[#38435f] hover:bg-[#1a2033] rounded-xl p-3.5 sm:p-4 transition-all duration-150 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-100 group-hover:text-[#d4af37] transition">
                        {req.requestNumber}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e2538] text-gray-300 border border-[#2e374f]">
                        {req.requestType?.name || req.requestTypeId}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>

                    <div className="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-white transition truncate">
                      {req.title}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-gray-500" />
                        {req.location || 'Campus'}
                      </span>
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#22293d]">
                    <SLAIndicator sla={req.sla} compact />
                    <div className="w-7 h-7 rounded-lg bg-[#1a2033] border border-[#2b354d] flex items-center justify-center text-gray-400 group-hover:text-[#d4af37] group-hover:border-[#d4af37]/40 transition">
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
