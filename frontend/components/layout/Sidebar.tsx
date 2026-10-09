'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, X, Shield, ArrowRight, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  group?: string;
}

interface SidebarProps {
  items: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ items, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Close drawer on route change
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [pathname]);

  // Close drawer on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Group items by group attribute if provided
  const hasGroups = items.some((item) => !!item.group);

  const renderNavList = (itemList: NavItem[]) => (
    <div className="flex flex-col gap-1 w-full">
      {itemList.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        // Custom badge styling based on content
        const getBadgeStyle = (b: number | string) => {
          const str = String(b).toUpperCase();
          if (str === 'NEW' || str === 'GUIDE') {
            return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35';
          }
          if (str === 'AI') {
            return 'bg-[#5B20A0]/30 text-purple-300 border-[#7A3DB8]/50';
          }
          if (str === 'PEER') {
            return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
          }
          return 'bg-[#1e2538] text-slate-300 border-[#2e374f]';
        };

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
              isActive
                ? 'bg-gradient-to-r from-[#5B20A0]/25 to-[#18C5D8]/10 text-white border border-[#7A3DB8]/40 shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-[#151a2a] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                size={16}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-[#18C5D8]' : 'text-slate-500 group-hover:text-slate-200'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 transition-all ${getBadgeStyle(
                  item.badge
                )}`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  const navContent = hasGroups ? (
    <nav className="flex flex-col gap-4 w-full">
      {Array.from(new Set(items.map((i) => i.group || 'General'))).map((grp) => {
        const groupItems = items.filter((i) => (i.group || 'General') === grp);
        return (
          <div key={grp} className="space-y-1">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider px-3 mb-1.5">
              {grp}
            </div>
            {renderNavList(groupItems)}
          </div>
        );
      })}
    </nav>
  ) : (
    <nav className="flex flex-col gap-1.5 w-full">
      <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider px-3 mb-1">
        Menu
      </div>
      {renderNavList(items)}
    </nav>
  );

  // Profile link based on role
  const profileLink = user?.role === 'STUDENT' ? '/student/profile' : `/${user?.role?.toLowerCase() || 'student'}/profile`;

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex flex-col justify-between w-64 md:min-h-[calc(100vh-65px)] bg-[#0d101a] border-r border-[#21273a] p-3.5 sm:p-4 shrink-0">
        <div className="space-y-4 overflow-y-auto no-scrollbar pr-0.5">
          {navContent}
        </div>

        {/* User Identity / Operational Status Footer */}
        {user && (
          <div className="pt-3 border-t border-[#21273a] text-[11px] text-slate-400 shrink-0">
            <Link
              href={profileLink}
              className="block bg-[#121624] hover:bg-[#171d30] border border-[#232a3d] hover:border-[#384562] rounded-xl p-3 transition group"
              title="View your profile"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="font-semibold text-slate-200 text-xs group-hover:text-white transition">
                    {user.fullName?.split(' ')[0] || user.username}
                  </span>
                </div>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#1e2538] text-[#18C5D8] border border-[#2e374f]">
                  {user.role}
                </span>
              </div>
              <div className="text-slate-400 text-[10px] font-mono truncate">
                {user.rollNumber ? `Roll: ${user.rollNumber}` : user.department || 'Nexora Campus'}
                {user.hostelBlock ? ` • ${user.hostelBlock}` : ''}
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Slide-Over (visible on mobile only when isOpen=true) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            className="relative flex flex-col justify-between w-72 max-w-[85vw] h-full bg-[#0d101a] border-r border-[#242c3f] p-4 shadow-2xl z-50 overflow-y-auto animate-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#5B20A0]/30 border border-[#7A3DB8]/40 flex items-center justify-center text-[#18C5D8]">
                    <Shield size={14} />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    Campus Navigation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-[#141824] border border-[#262e42] text-slate-400 hover:text-white transition"
                  aria-label="Close navigation"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Student Identity Banner inside Drawer */}
              {user && (
                <Link
                  href={profileLink}
                  onClick={onClose}
                  className="block bg-[#121624] hover:bg-[#181e30] border border-[#232a3d] rounded-xl p-3 transition"
                >
                  <div className="text-xs font-bold text-white leading-tight truncate">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {user.rollNumber ? `Roll: ${user.rollNumber}` : user.role} • {user.branch || user.department || 'Campus'}
                  </div>
                </Link>
              )}

              {/* Navigation Items */}
              {navContent}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[#21273a] text-[10px] text-slate-400 flex items-center justify-between">
              <span>Nexora Campus</span>
              <span className="font-mono text-[#18C5D8]">v2.4 Pro</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
