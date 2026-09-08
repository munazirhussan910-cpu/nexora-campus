'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { User, Wrench, Shield, Key, FileCheck, Smartphone, Monitor, ChevronUp, ChevronDown } from 'lucide-react';

export function PersonaSwitcher() {
  const { user, switchPersona } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const personas = [
    { key: 'aryan', label: 'Aryan (Student)', role: 'STUDENT', icon: User, color: 'hover:border-blue-500' },
    { key: 'ramesh', label: 'Ramesh (Plumber)', role: 'STAFF', icon: Wrench, color: 'hover:border-amber-500' },
    { key: 'warden', label: 'Warden (Block B)', role: 'WARDEN', icon: Shield, color: 'hover:border-emerald-500' },
    { key: 'security', label: 'Security (Gate)', role: 'SECURITY', icon: Key, color: 'hover:border-cyan-500' },
    { key: 'admin', label: 'Chief Admin', role: 'ADMIN', icon: Shield, color: 'hover:border-purple-500' },
  ];

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end">
      <div className="bg-[#141722] border border-[#2e3447] shadow-2xl rounded-xl p-2.5 backdrop-blur-md text-xs text-gray-200">
        <div className="flex items-center justify-between gap-3 border-b border-[#282f42] pb-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide text-gray-300">DEMO PERSONA SWITCHER</span>
            {user && (
              <span className="text-[10px] bg-[#22283a] text-gold px-1.5 py-0.5 rounded border border-[#3d4661]">
                {user.role} ({user.fullName?.split(' ')[0] || user.username})
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-[#22283a] rounded text-gray-400 hover:text-white"
            title={collapsed ? 'Expand Switcher' : 'Collapse Switcher'}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {!collapsed && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-2">
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
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-[#262c3f] border-gold text-white font-medium shadow-sm'
                        : 'bg-[#181b26] border-[#2e3447] text-gray-300 ' + p.color
                    }`}
                  >
                    <Icon size={12} className={isActive ? 'text-gold' : 'text-gray-400'} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#282f42] text-[11px] text-gray-400">
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
          </>
        )}
      </div>
    </div>
  );
}
