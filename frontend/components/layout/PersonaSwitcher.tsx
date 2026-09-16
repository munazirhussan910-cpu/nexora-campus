'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { User, Wrench, Shield, Key, FileCheck, Smartphone, Monitor, ChevronUp, ChevronDown } from 'lucide-react';

export function PersonaSwitcher() {
  const { user, switchPersona } = useAuth();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // On small screens, keep collapsed by default to avoid blocking content
      setCollapsed(window.innerWidth < 768);
    }
  }, []);

  const personas = [
    { key: 'aryan', label: 'Aryan (Student)', role: 'STUDENT', icon: User, color: 'hover:border-blue-500' },
    { key: 'ramesh', label: 'Ramesh (Plumber)', role: 'STAFF', icon: Wrench, color: 'hover:border-amber-500' },
    { key: 'warden', label: 'Warden (Block B)', role: 'WARDEN', icon: Shield, color: 'hover:border-emerald-500' },
    { key: 'security', label: 'Security (Gate)', role: 'SECURITY', icon: Key, color: 'hover:border-cyan-500' },
    { key: 'admin', label: 'Chief Admin', role: 'ADMIN', icon: Shield, color: 'hover:border-purple-500' },
  ];

  return (
    <aside aria-label="Demo persona switcher" className="fixed bottom-3 right-3 z-50 flex flex-col items-end">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#141722]/95 border border-[#d4af37]/50 shadow-2xl backdrop-blur-md text-xs text-gray-200 hover:border-[#d4af37] transition-all group active:scale-95"
          title="Open Demo Persona Switcher"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-semibold text-[11px] tracking-wide text-gray-200 group-hover:text-[#d4af37] transition">
            Demo Personas
          </span>
          {user && (
            <span className="text-[10px] bg-[#22283a] text-gold px-1.5 py-0.5 rounded border border-[#3d4661] font-mono">
              {user.role}
            </span>
          )}
          <ChevronUp size={14} className="text-gray-400 group-hover:text-white transition" />
        </button>
      ) : (
        <div className="bg-[#141722]/95 border border-[#2e3447] shadow-2xl rounded-2xl p-3 backdrop-blur-md text-xs text-gray-200 max-w-[calc(100vw-1.5rem)] sm:max-w-md animate-tab-fade">
          <div className="flex items-center justify-between gap-3 border-b border-[#282f42] pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold tracking-wide text-gray-200 text-xs">DEMO PERSONA SWITCHER</span>
              {user && (
                <span className="text-[10px] bg-[#22283a] text-gold px-1.5 py-0.5 rounded border border-[#3d4661] truncate font-mono">
                  {user.role} ({user.fullName?.split(' ')[0] || user.username})
                </span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 hover:bg-[#22283a] rounded-lg text-gray-400 hover:text-white transition shrink-0"
              title="Minimize Switcher"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {personas.map((p) => {
              const Icon = p.icon;
              const isActive = user?.role === p.role && (
                p.key === 'aryan' ? user.username === 'aryan' :
                p.key === 'ramesh' ? user.username === 'ramesh' :
                p.key === 'warden' ? user.username === 'warden_b' :
                p.key === 'security' ? user.username === 'security_gate1' :
                p.key === 'admin' ? user.username === 'admin' : false
              );

              return (
                <button
                  key={p.key}
                  onClick={() => switchPersona(p.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all active:scale-95 ${
                    isActive
                      ? 'bg-[#262c3f] border-[#d4af37] text-white font-semibold shadow-sm'
                      : 'bg-[#181b26] border-[#2e3447] text-gray-300 ' + p.color
                  }`}
                >
                  <Icon size={12} className={isActive ? 'text-[#d4af37]' : 'text-gray-400'} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#282f42] text-[11px] text-gray-400">
            <span className="text-gray-500">Quick Modes:</span>
            <div className="flex items-center gap-2">
              <Link href="/lite" className="flex items-center gap-1 hover:text-white transition">
                <Smartphone size={12} className="text-amber-400" />
                <span>Nexora Lite</span>
              </Link>
              <span>•</span>
              <Link href="/kiosk" className="flex items-center gap-1 hover:text-white transition">
                <Monitor size={12} className="text-cyan-400" />
                <span>Kiosk</span>
              </Link>
              <span>•</span>
              <Link href="/verify/NX-BON-2026-00199" className="flex items-center gap-1 hover:text-white transition">
                <FileCheck size={12} className="text-emerald-400" />
                <span>Verify Doc</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
