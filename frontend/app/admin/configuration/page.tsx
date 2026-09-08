'use client';

import React from 'react';
import { Settings, Shield, Wrench, Clock, Database, CheckCircle2, Server } from 'lucide-react';

export default function AdminConfigurationPage() {
  const routingRules = [
    { category: 'Plumbing', keywords: 'tap, pipe, leak, water, drain, flush, basin, shower, sink', spec: 'PLUMBING', assigned: 'Ramesh Kumar' },
    { category: 'Electrical', keywords: 'fan, light, switch, socket, power, bulb, short, wiring, ac', spec: 'ELECTRICAL', assigned: 'Suresh Verma' },
    { category: 'Carpentry', keywords: 'door, window, lock, handle, table, chair, bed, almirah', spec: 'CARPENTRY', assigned: 'Maintenance Carpentry' },
    { category: 'Network', keywords: 'wifi, internet, lan, ethernet, router, network, speed', spec: 'IT', assigned: 'Network Ops Center' },
    { category: 'Cleanliness', keywords: 'garbage, dustbin, clean, sweep, washroom, dirty', spec: 'GENERAL', assigned: 'Sanitation Cell' },
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">System Configuration &amp; Rule Engine</h1>
        <p className="text-xs text-gray-400">
          Inspection of deterministic routing tables, SLA policies, and operational thresholds.
        </p>
      </div>

      {/* System Status Card */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server size={16} className="text-emerald-400" /> Platform Architecture &amp; Engine Status
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#181b26] p-3.5 rounded-xl border border-[#282f42]">
            <span className="text-[10px] text-gray-500 block uppercase">Request Engine</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 size={13} /> ONLINE
            </span>
          </div>

          <div className="bg-[#181b26] p-3.5 rounded-xl border border-[#282f42]">
            <span className="text-[10px] text-gray-500 block uppercase">Cryptographic QR</span>
            <span className="font-bold text-cyan-400 flex items-center gap-1 mt-1">
              <CheckCircle2 size={13} /> HMAC-SHA256
            </span>
          </div>

          <div className="bg-[#181b26] p-3.5 rounded-xl border border-[#282f42]">
            <span className="text-[10px] text-gray-500 block uppercase">Database Relational</span>
            <span className="font-bold text-gold flex items-center gap-1 mt-1">
              <CheckCircle2 size={13} /> PRISMA ORM
            </span>
          </div>

          <div className="bg-[#181b26] p-3.5 rounded-xl border border-[#282f42]">
            <span className="text-[10px] text-gray-500 block uppercase">SLA Ageing Monitor</span>
            <span className="font-bold text-purple-400 flex items-center gap-1 mt-1">
              <CheckCircle2 size={13} /> SECTION 43/44
            </span>
          </div>
        </div>
      </div>

      {/* Deterministic Keyword Routing Table */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Wrench size={16} className="text-amber-400" /> Deterministic Complaint Routing Rules
        </h2>
        <p className="text-xs text-gray-400">
          Incoming complaints are analyzed against these exact regex keywords to allocate specialized technicians without requiring non-deterministic external AI dependencies.
        </p>

        <div className="divide-y divide-[#282f42] text-xs">
          {routingRules.map((r, i) => (
            <div key={i} className="py-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gold text-sm">{r.category}</span>
                <span className="text-gray-400 font-mono text-[11px]">Specialization: {r.spec}</span>
              </div>
              <div className="text-gray-300 font-mono text-[11px] bg-[#181b26] p-2 rounded border border-[#262c3e]">
                Keywords: {r.keywords}
              </div>
              <div className="text-[11px] text-emerald-400">Primary Assignee: {r.assigned}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Policies */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock size={16} className="text-gold" /> SLA Target Resolution Benchmarks
        </h2>

        <div className="divide-y divide-[#282f42] text-xs">
          {slaPolicies.map((p, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-gray-200">{p.type}</div>
                <div className="text-gray-400 text-[11px]">{p.desc}</div>
              </div>
              <div className="font-mono font-bold text-gold text-right shrink-0">
                {p.maxHours} Hours SLA
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
