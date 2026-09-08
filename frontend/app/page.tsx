'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldCheck,
  FileCheck,
  QrCode,
  Wrench,
  Key,
  Layers,
  ArrowRight,
  Sparkles,
  Smartphone,
  Monitor,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const { user, switchPersona } = useAuth();

  const personas = [
    {
      key: 'aryan',
      name: 'Aryan Khan',
      role: 'STUDENT',
      desc: 'Apply complaints, track gate pass QR & PIN, request Bonafide certificate',
      href: '/student/dashboard',
      color: 'border-blue-700/60 hover:border-blue-500 bg-blue-950/20',
      badge: 'B.Tech CSE • Room B-204',
    },
    {
      key: 'ramesh',
      name: 'Ramesh Kumar',
      role: 'STAFF',
      desc: 'Receive auto-routed plumbing tasks, accept, start work, submit resolution notes',
      href: '/staff/dashboard',
      color: 'border-amber-700/60 hover:border-amber-500 bg-amber-950/20',
      badge: 'Senior Plumber • Maintenance',
    },
    {
      key: 'warden',
      name: 'Dr. S. K. Mohapatra',
      role: 'WARDEN',
      desc: 'Review and approve gate passes with expiring QR, review leaves, view hostel complaints',
      href: '/warden/dashboard',
      color: 'border-emerald-700/60 hover:border-emerald-500 bg-emerald-950/20',
      badge: 'Chief Warden • Block B',
    },
    {
      key: 'security',
      name: 'Vikram Singh',
      role: 'SECURITY',
      desc: 'Scan QR tokens or enter 4-digit PINs at main gate, mark departed & returned',
      href: '/security/dashboard',
      color: 'border-cyan-700/60 hover:border-cyan-500 bg-cyan-950/20',
      badge: 'Main Gate Security Officer',
    },
    {
      key: 'admin',
      name: 'Dr. Ananya Ray',
      role: 'ADMIN',
      desc: 'Campus cockpit, SLA ageing monitoring, Section 44 recurring issue detection, audit logs',
      href: '/admin/dashboard',
      color: 'border-purple-700/60 hover:border-purple-500 bg-purple-950/20',
      badge: 'Campus Operations Director',
    },
  ];

  const features = [
    {
      icon: Layers,
      title: 'Nexora Request Engine',
      desc: 'Centralized lifecycle managing IDs (NX-10291), status transitions, SLA ageing, and audit trail.',
    },
    {
      icon: Wrench,
      title: 'Deterministic Keyword Routing',
      desc: 'Immediate classification of tap/leak/water to Plumbing and fan/spark to Electrical with auto-assignment.',
    },
    {
      icon: QrCode,
      title: 'Cryptographic QR & PIN Gate Passes',
      desc: 'Signed expiring QR tokens + fallback 4-digit numeric PINs verified live at the gate.',
    },
    {
      icon: FileCheck,
      title: 'Dynamic Bonafide PDFs & Public Verify',
      desc: 'One-click generated official certificates with embedded QR codes verified at /verify/[id].',
    },
    {
      icon: Activity,
      title: 'Section 44 Recurring Issue Intelligence',
      desc: 'Detects repeated complaints (e.g. Block B Plumbing with 7 issues in 14 days) automatically.',
    },
    {
      icon: Smartphone,
      title: 'Nexora Lite & Kiosk Mode',
      desc: 'Ultra-fast low-bandwidth text interface and touch kiosk with roll number lookups.',
    },
  ];

  return (
    <main className="min-h-screen bg-[#0f1118] text-white selection:bg-[#d4af37] selection:text-black">
      {/* Top Banner */}
      <div className="bg-[#181b26] border-b border-[#282f42] py-2 px-4 text-center text-xs text-gray-400">
        <span className="font-semibold text-gold">BPUT HACKATHON 2026</span> • Problem Statement: Attendance, Mess, Hostel, Repeat: Campus Life, Debugged
      </div>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e2230] border border-[#3d4661] text-xs font-medium text-gold mb-6 shadow-sm">
          <Sparkles size={14} />
          <span>PRODUCTION-MINDED CENTRALIZED CAMPUS PLATFORM</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
          ONE PLATFORM FOR <br />
          <span className="bg-gradient-to-r from-[#d4af37] via-[#f7e089] to-[#d4af37] bg-clip-text text-transparent">
            EVERY CAMPUS REQUEST.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Nexora Campus replaces paper complaint books, physical gate registers, manual leave paperwork, and WhatsApp chaos with a unified, role-based operations engine.
        </p>

        {/* Demo Fast-Switch Buttons */}
        <div className="bg-[#141722] border border-[#2e3447] rounded-2xl p-6 max-w-5xl mx-auto shadow-2xl mb-16 text-left">
          <div className="flex items-center justify-between border-b border-[#282f42] pb-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Select Persona for Immediate Interactive Demo
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Click any persona to log in instantly with full role-based permissions and mock data.
              </p>
            </div>
            <Link
              href="/login"
              className="text-xs text-gold hover:underline font-medium flex items-center gap-1"
            >
              Manual Login <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {personas.map((p) => (
              <button
                key={p.key}
                onClick={() => switchPersona(p.key)}
                className={`p-4 rounded-xl border transition-all text-left group flex flex-col justify-between ${p.color}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-gray-100 group-hover:text-gold transition">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-gray-300 border border-white/10">
                      {p.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mb-2 leading-relaxed">
                    {p.desc}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 font-mono pt-2 border-t border-white/5 flex items-center justify-between">
                  <span>{p.badge}</span>
                  <ArrowRight size={12} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}

            {/* Public Features Card */}
            <div className="p-4 rounded-xl border border-[#2e3447] bg-[#181b26] flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-gray-100 mb-1">
                  Public & Alternative Modes
                </div>
                <div className="text-[11px] text-gray-400 mb-3">
                  Check out the zero-login public portals:
                </div>
                <div className="space-y-1.5 text-xs">
                  <Link href="/lite" className="flex items-center justify-between p-2 rounded bg-[#1f2434] hover:bg-[#282f45] transition">
                    <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                      <Smartphone size={13} /> Nexora Lite (&lt;25KB)
                    </span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link href="/kiosk" className="flex items-center justify-between p-2 rounded bg-[#1f2434] hover:bg-[#282f45] transition">
                    <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                      <Monitor size={13} /> Campus Kiosk Mode
                    </span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link href="/verify/NX-BON-2026-00199" className="flex items-center justify-between p-2 rounded bg-[#1f2434] hover:bg-[#282f45] transition">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                      <FileCheck size={13} /> Certificate Verification
                    </span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto text-left">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-[#181b26] border border-[#282f42] rounded-xl p-5 hover:border-[#3d4661] transition"
              >
                <div className="w-9 h-9 rounded-lg bg-[#22283a] border border-[#3d4661] flex items-center justify-center text-gold mb-3.5">
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-sm text-gray-100 mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#282f42] py-8 text-center text-xs text-gray-500">
        <div>NEXORA CAMPUS — ONE PLATFORM FOR EVERY CAMPUS REQUEST</div>
        <div className="mt-1">Developed for BPUT Hackathon 2026 • Full-Stack Modular Architecture</div>
      </footer>
    </main>
  );
}
