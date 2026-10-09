'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  GraduationCap,
} from 'lucide-react';

export function PersonaSwitcher() {
  const pathname = usePathname();
  const { user, switchPersona } = useAuth();
  const [collapsed, setCollapsed] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Default to collapsed on screens < 768px
      setCollapsed(window.innerWidth < 768);
    }
  }, []);

  // Close when clicking outside if expanded on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !collapsed
      ) {
        setCollapsed(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !collapsed) {
        setCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [collapsed]);

  // Do not render floating switcher on Lite route
  if (pathname === '/lite' || pathname?.startsWith('/lite/')) {
    return null;
  }

  const personas = [
    { key: 'aryan', label: 'Aryan', roleDesc: 'Student', role: 'STUDENT', icon: User, color: 'hover:border-blue-500/80 hover:text-blue-500' },
    { key: 'ramesh', label: 'Ramesh', roleDesc: 'Staff / Tech', role: 'STAFF', icon: Wrench, color: 'hover:border-amber-500/80 hover:text-amber-500' },
    { key: 'warden', label: 'Warden', roleDesc: 'Hostel B', role: 'WARDEN', icon: Shield, color: 'hover:border-emerald-500/80 hover:text-emerald-500' },
    { key: 'security', label: 'Security', roleDesc: 'Main Gate', role: 'SECURITY', icon: Key, color: 'hover:border-cyan-500/80 hover:text-cyan-500' },
    { key: 'academic', label: 'Academic Officer', roleDesc: 'Certificates', role: 'ACADEMIC_OFFICER', icon: GraduationCap, color: 'hover:border-teal-500/80 hover:text-teal-500' },
    { key: 'faculty', label: 'Dr. Tripathy', roleDesc: 'Faculty / Attendance', role: 'STAFF', icon: GraduationCap, color: 'hover:border-indigo-500/80 hover:text-indigo-500' },
    { key: 'admin', label: 'Chief Admin', roleDesc: 'Director', role: 'ADMIN', icon: Shield, color: 'hover:border-purple-500/80 hover:text-purple-500' },
  ];

  return (
    <aside
      ref={containerRef}
      aria-label="Demo persona switcher"
      className="fixed bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-50 flex flex-col items-end print:hidden"
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-surface/95 dark:bg-[#121624]/95 border border-border hover:border-primary shadow-lg backdrop-blur-md text-xs text-foreground transition-all group active:scale-95"
          title="Open Demo Persona Switcher"
          aria-expanded={false}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-extrabold text-[10px] sm:text-[11px] tracking-wide text-foreground group-hover:text-primary transition">
            Demo Mode
          </span>
          {user && (
            <span className="text-[9px] sm:text-[10px] bg-surface-secondary text-primary px-1.5 py-0.5 rounded-full border border-border font-mono font-bold shrink-0">
              {user.role}
            </span>
          )}
          <ChevronUp size={13} className="text-muted-foreground group-hover:text-foreground transition shrink-0" />
        </button>
      ) : (
        <div className="bg-surface/98 dark:bg-[#101422]/98 border border-border shadow-2xl rounded-2xl p-3 sm:p-3.5 backdrop-blur-md text-xs text-foreground w-[calc(100vw-1.25rem)] sm:w-88 md:w-96 max-w-sm animate-tab-fade">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold tracking-wider text-foreground text-[10px] sm:text-[11px] uppercase font-mono">
                DEMO PERSONA
              </span>
              {user && (
                <span className="text-[9px] sm:text-[10px] bg-surface-secondary text-primary px-2 py-0.5 rounded-full border border-border truncate font-mono font-bold">
                  {user.role} ({user.fullName?.split(' ')[0] || user.username})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1 hover:bg-surface-secondary rounded-lg text-muted-foreground hover:text-foreground transition shrink-0"
              title="Minimize Switcher"
              aria-label="Minimize Switcher"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Persona Buttons */}
          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
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
                  : p.key === 'academic'
                  ? user.username === 'academic'
                  : p.key === 'faculty'
                  ? user.username === 'faculty'
                  : p.key === 'admin'
                  ? user.username === 'admin'
                  : false);

              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => switchPersona(p.key)}
                  className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl border text-left text-xs transition-all active:scale-95 min-w-0 ${
                    isActive
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                      : 'bg-surface-secondary/70 border-border text-foreground ' + p.color
                  }`}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-bold text-[10px] sm:text-[11px] leading-tight">
                      {p.label}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono truncate">
                      {p.roleDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Simulation Modes */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground font-medium">
            <span className="text-[10px] font-mono uppercase">Quick:</span>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/lite"
                className="flex items-center gap-1 hover:text-foreground transition"
                title="PWA mobile offline mode"
              >
                <Smartphone size={11} className="text-amber-500" />
                <span>Lite</span>
              </Link>
              <span className="opacity-40">•</span>
              <Link
                href="/kiosk"
                className="flex items-center gap-1 hover:text-foreground transition"
                title="Campus Kiosk view"
              >
                <Monitor size={11} className="text-cyan-500" />
                <span>Kiosk</span>
              </Link>
              <span className="opacity-40">•</span>
              <Link
                href="/verify/NX-BON-2026-00199"
                className="flex items-center gap-1 hover:text-foreground transition"
                title="Public Bonafide verification"
              >
                <FileCheck size={11} className="text-emerald-500" />
                <span>Verify</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
