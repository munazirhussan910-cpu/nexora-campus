'use client';

import React from 'react';
import { Settings, Shield, Wrench, Clock, Database, CheckCircle2, Server, Cpu } from 'lucide-react';

export default function AdminConfigurationPage() {
  const routingRules = [
    {
      category: 'Plumbing',
      keywords: 'tap, pipe, leak, water, drain, flush, basin, shower, sink',
      spec: 'PLUMBING',
      assigned: 'Ramesh Kumar',
    },
    {
      category: 'Electrical',
      keywords: 'fan, light, switch, socket, power, bulb, short, wiring, ac',
      spec: 'ELECTRICAL',
      assigned: 'Suresh Verma',
    },
    {
      category: 'Carpentry',
      keywords: 'door, window, lock, handle, table, chair, bed, almirah',
      spec: 'CARPENTRY',
      assigned: 'Maintenance Carpentry',
    },
    {
      category: 'Network',
      keywords: 'wifi, internet, lan, ethernet, router, network, speed',
      spec: 'IT',
      assigned: 'Network Ops Center',
    },
    {
      category: 'Cleanliness',
      keywords: 'garbage, dustbin, clean, sweep, washroom, dirty',
      spec: 'GENERAL',
      assigned: 'Sanitation Cell',
    },
  ];

  const slaPolicies = [
    { type: 'COMPLAINT (URGENT)', maxHours: 4, desc: 'Urgent burst pipes, electrical short circuits' },
    { type: 'COMPLAINT (HIGH)', maxHours: 8, desc: 'Single room water supply failure, fan regulator' },
    { type: 'COMPLAINT (NORMAL)', maxHours: 24, desc: 'Standard furniture, minor leaks, non-critical' },
    { type: 'GATE PASS', maxHours: 4, desc: 'Warden approval turnaround for exit passes' },
    { type: 'HOSTEL LEAVE', maxHours: 12, desc: 'Multi-day leave verification and approval' },
    { type: 'BONAFIDE CERTIFICATE', maxHours: 48, desc: 'Digital certification, registry check & signing' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-[#21273a] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
            Engine Rules &amp; Policies
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          System Configuration &amp; Rule Engine
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Inspection of deterministic routing tables, SLA policies, and operational thresholds.
        </p>
      </div>

      {/* System Status Card */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl space-y-4">
        <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
          <Server size={16} className="text-emerald-400" /> Platform Architecture &amp; Engine Status
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 text-xs">
          <div className="bg-[#171d2c] p-3 sm:p-3.5 rounded-xl border border-[#263148]">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Request Engine</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 mt-1 font-mono text-xs">
              <CheckCircle2 size={13} /> ONLINE
            </span>
          </div>

          <div className="bg-[#171d2c] p-3 sm:p-3.5 rounded-xl border border-[#263148]">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Cryptographic QR</span>
            <span className="font-bold text-cyan-400 flex items-center gap-1.5 mt-1 font-mono text-xs">
              <CheckCircle2 size={13} /> HMAC-SHA256
            </span>
          </div>

          <div className="bg-[#171d2c] p-3 sm:p-3.5 rounded-xl border border-[#263148]">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Database Relational</span>
            <span className="font-bold text-[#d4af37] flex items-center gap-1.5 mt-1 font-mono text-xs">
              <CheckCircle2 size={13} /> PRISMA ORM
            </span>
          </div>

          <div className="bg-[#171d2c] p-3 sm:p-3.5 rounded-xl border border-[#263148]">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">SLA Ageing Monitor</span>
            <span className="font-bold text-purple-400 flex items-center gap-1.5 mt-1 font-mono text-xs">
              <CheckCircle2 size={13} /> SECTION 43/44
            </span>
          </div>
        </div>
      </div>

      {/* Deterministic Keyword Routing Table */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Wrench size={16} className="text-amber-400" /> Deterministic Complaint Routing Rules
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Incoming complaints are analyzed against these exact regex keywords to allocate specialized
            technicians without requiring non-deterministic external AI dependencies.
          </p>
        </div>

        <div className="divide-y divide-[#1e2538] text-xs">
          {routingRules.map((r, i) => (
            <div key={i} className="py-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-[#d4af37] text-xs sm:text-sm">{r.category}</span>
                <span className="text-slate-400 font-mono text-[11px] bg-[#161c29] px-2 py-0.5 rounded border border-[#252f44]">
                  Specialization: {r.spec}
                </span>
              </div>
              <div className="text-slate-300 font-mono text-[11px] bg-[#161b28] p-2.5 rounded-xl border border-[#242c3e] leading-relaxed break-words">
                Keywords: {r.keywords}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">
                Primary Assignee: <strong className="text-white font-sans">{r.assigned}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Policies */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl space-y-4">
        <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
          <Clock size={16} className="text-[#d4af37]" /> SLA Target Resolution Benchmarks
        </h2>

        <div className="divide-y divide-[#1e2538] text-xs">
          {slaPolicies.map((p, i) => (
            <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-slate-200">{p.type}</div>
                <div className="text-slate-400 text-[11px]">{p.desc}</div>
              </div>
              <div className="font-mono font-bold text-[#d4af37] text-left sm:text-right shrink-0">
                {p.maxHours} Hours Target SLA
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
