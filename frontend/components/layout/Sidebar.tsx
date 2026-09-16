'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, X, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
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

  const navContent = (
    <nav className="flex flex-col gap-1.5 w-full">
      <div className="text-[10px] uppercase font-mono font-bold text-gray-400 tracking-wider px-3 mb-1">
        Menu
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
              isActive
                ? 'bg-[#1b2234] text-[#d4af37] border border-[#d4af37]/35 shadow-xs font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-[#161a27] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                size={16}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-[#d4af37]' : 'text-gray-400 group-hover:text-gray-200'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#22283a] text-gray-200 border border-[#30384d] shrink-0">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex flex-col justify-between w-64 md:min-h-[calc(100vh-65px)] bg-[#0f121d] border-r border-[#21273a] p-4 shrink-0">
        <div className="space-y-4">
          {navContent}
        </div>

        {/* Student Desk Operational Status */}
        {user && (
          <div className="pt-4 border-t border-[#21273a] text-[11px] text-gray-400">
            <div className="bg-[#141824] border border-[#232a3d] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-gray-200 text-xs">Student Portal</span>
              </div>
              <div className="text-gray-400 text-[10px] font-mono truncate">
                {user.rollNumber || '220101048'} • {user.hostelBlock || 'Block B'}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Slide-Over (visible on mobile only when isOpen=true) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
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
                  <Shield size={16} className="text-[#d4af37]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    Campus Navigation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-[#141824] border border-[#262e42] text-gray-400 hover:text-white transition"
                  aria-label="Close navigation"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Student Identity Banner inside Drawer */}
              {user && (
                <div className="bg-[#141824] border border-[#232a3d] rounded-xl p-3">
                  <div className="text-xs font-bold text-white leading-tight truncate">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                    Roll: {user.rollNumber || '220101048'} • {user.hostelBlock || 'Block B'}
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              {navContent}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[#21273a] text-[10px] text-gray-400 flex items-center justify-between">
              <span>Nexora Campus OS</span>
              <span className="font-mono text-[#d4af37]">v1.0.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
