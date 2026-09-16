'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  Wrench,
  Shield,
  Key,
  FileCheck,
  Smartphone,
  Monitor,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export function PersonaSwitcher() {
  const pathname = usePathname();
  const { user, switchPersona } = useAuth();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Small screens default to collapsed to prevent overlapping UI
      setCollapsed(window.innerWidth < 768);
    }
  }, []);

  // Do not render floating switcher on Lite route to prevent UI overlap and reduce DOM complexity
  if (pathname === '/lite' || pathname?.startsWith('/lite/')) {
    return null;
  }

  const personas = [
    { key: 'aryan', label: 'Aryan', roleDesc: 'Student', role: 'STUDENT', icon: User, color: 'hover:border-blue-500/80 hover:text-blue-400' },
    { key: 'ramesh', label: 'Ramesh', roleDesc: 'Staff / Tech', role: 'STAFF', icon: Wrench, color: 'hover:border-amber-500/80 hover:text-amber-400' },
    { key: 'warden', label: 'Warden', roleDesc: 'Hostel B', role: 'WARDEN', icon: Shield, color: 'hover:border-emerald-500/80 hover:text-emerald-400' },
    { key: 'security', label: 'Security', roleDesc: 'Main Gate', role: 'SECURITY', icon: Key, color: 'hover:border-cyan-500/80 hover:text-cyan-400' },
    { key: 'admin', label: 'Chief Admin', roleDesc: 'Director', role: 'ADMIN', icon: Shield, color: 'hover:border-purple-500/80 hover:text-purple-400' },
  ];

  return (
    <aside aria-label="Demo persona switcher" className="fixed bottom-3 right-3 z-50 flex flex-col items-end">
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#121624]/95 border border-[#d4af37]/45 shadow-2xl backdrop-blur-md text-xs text-gray-200 hover:border-[#d4af37] hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all group active:scale-95"
          title="Open Demo Persona Switcher"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold text-[11px] tracking-wide text-gray-200 group-hover:text-[#d4af37] transition">
            Demo Mode
          </span>
          {user && (
            <span className="text-[10px] bg-[#1a2133] text-[#d4af37] px-2 py-0.5 rounded-full border border-[#d4af37]/35 font-mono font-bold">
              {user.role}
            </span>
          )}
          <ChevronUp size={14} className="text-gray-400 group-hover:text-white transition" />
        </button>
      ) : (
        <div className="bg-[#101422]/98 border border-[#262f44] shadow-2xl shadow-black/60 rounded-2xl p-3.5 backdrop-blur-md text-xs text-gray-200 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm animate-tab-fade">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[#212739] pb-2.5 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold tracking-wider text-white text-[11px] uppercase font-mono">
                DEMO MODE
              </span>
              {user && (
                <span className="text-[10px] bg-[#182030] text-[#d4af37] px-2 py-0.5 rounded-full border border-[#d4af37]/30 truncate font-mono font-bold">
                  {user.role} ({user.fullName?.split(' ')[0] || user.username})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1 hover:bg-[#1b2234] rounded-lg text-gray-400 hover:text-white transition shrink-0"
              title="Minimize Switcher"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Persona Buttons */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {personas.map((p) => {
              const Icon = p.icon;
              const isActive =
                user?.role === p.role &&
                (p.key === 'aryan'
                  ? user.username === 'aryan'
                  : p.key === 'ramesh'
                  ? user.username === 'ramesh'
                  : p.key === 'warden'
                  ? user.username === 'warden_b'
                  : p.key === 'security'
                  ? user.username === 'security_gate1'
                  : p.key === 'admin'
                  ? user.username === 'admin'
                  : false);

              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => switchPersona(p.key)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all active:scale-95 ${
                    isActive
                      ? 'bg-[#1e2538] border-[#d4af37] text-white font-bold shadow-xs'
                      : 'bg-[#141824] border-[#22293b] text-gray-300 ' + p.color
                  }`}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 ${isActive ? 'text-[#d4af37]' : 'text-gray-400'}`}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[11px] leading-tight">
                      {p.label}
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono">
                      {p.roleDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Simulation Modes */}
          <div className="pt-2.5 border-t border-[#212739] flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span className="text-gray-500 text-[10px] font-mono uppercase">Quick:</span>
            <div className="flex items-center gap-2.5">
              <Link
                href="/lite"
                className="flex items-center gap-1 hover:text-white transition"
                title="PWA mobile offline mode"
              >
                <Smartphone size={12} className="text-amber-400" />
                <span>Lite</span>
              </Link>
              <span className="text-gray-700">•</span>
              <Link
                href="/kiosk"
                className="flex items-center gap-1 hover:text-white transition"
                title="Campus Kiosk view"
              >
                <Monitor size={12} className="text-cyan-400" />
                <span>Kiosk</span>
              </Link>
              <span className="text-gray-700">•</span>
              <Link
                href="/verify/NX-BON-2026-00199"
                className="flex items-center gap-1 hover:text-white transition"
                title="Public Bonafide verification"
              >
                <FileCheck size={12} className="text-emerald-400" />
                <span>Verify</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
