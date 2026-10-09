'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, X, Shield } from 'lucide-react';
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

  const activeStyles =
    'bg-primary/10 text-primary border border-primary/25 shadow-xs font-semibold dark:bg-[#7C3AED]/20 dark:text-[#DDD6FE] dark:border-[#7C3AED]/45 dark:shadow-[0_0_12px_rgba(124,58,237,0.18)]';

  const renderNavList = (itemList: NavItem[]) => (
    <div className="flex flex-col gap-1 w-full">
      {itemList.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        // Custom badge styling based on content
        const getBadgeStyle = (b: number | string) => {
          const str = String(b).toUpperCase();
          if (str === 'NEW' || str === 'GUIDE') {
            return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
          }
          if (str === 'AI') {
            return 'bg-primary/15 text-primary border-primary/30';
          }
          if (str === 'PEER') {
            return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
          }
          if (str === 'SEC 44' || str === 'ALERT') {
            return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse font-bold';
          }
          return 'bg-surface-secondary text-muted-foreground border-border';
        };

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between gap-3 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-medium transition-all duration-150 group ${
              isActive
                ? activeStyles
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-secondary border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                size={16}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-primary dark:text-[#C4B5FD]' : 'text-muted-foreground group-hover:text-foreground'
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
            <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider px-3 mb-1.5 opacity-80">
              {grp}
            </div>
            {renderNavList(groupItems)}
          </div>
        );
      })}
    </nav>
  ) : (
    <nav className="flex flex-col gap-1.5 w-full">
      <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider px-3 mb-1 opacity-80">
        Menu
      </div>
      {renderNavList(items)}
    </nav>
  );

  // Profile link based on role
  const profileLink =
    user?.role === 'STUDENT'
      ? '/student/profile'
      : user?.role === 'ACADEMIC_OFFICER'
      ? '/academic/profile'
      : `/${user?.role?.toLowerCase() || 'student'}/profile`;

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex flex-col justify-between w-60 lg:w-64 md:min-h-[calc(100vh-65px)] bg-sidebar border-r border-border p-3 sm:p-3.5 shrink-0 transition-colors">
        <div className="space-y-4 overflow-y-auto no-scrollbar pr-0.5">
          {navContent}
        </div>

        {/* User Identity / Operational Status Footer */}
        {user && (
          <div className="pt-3 border-t border-border text-[11px] text-muted-foreground shrink-0">
            <Link
              href={profileLink}
              className="block bg-surface-secondary/70 hover:bg-surface-secondary border border-border hover:border-primary/40 rounded-xl p-2.5 sm:p-3 transition group"
              title="View your profile"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs shrink-0" />
                  <span className="font-semibold text-foreground text-xs group-hover:text-primary transition truncate">
                    {user.fullName?.split(' ')[0] || user.username}
                  </span>
                </div>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 bg-surface border-border text-foreground">
                  {user.role}
                </span>
              </div>
              <div className="text-muted-foreground text-[10px] font-mono truncate">
                {user.department ||
                  user.specialization ||
                  (user.rollNumber ? `Roll: ${user.rollNumber}` : 'Campus Operations')}
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
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            className="relative flex flex-col justify-between w-72 max-w-[85vw] h-full bg-sidebar border-r border-border p-3.5 sm:p-4 shadow-2xl z-50 overflow-y-auto animate-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                    <Shield size={14} />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Campus Navigation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-surface-secondary border border-border text-muted-foreground hover:text-foreground transition"
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
                  className="block bg-surface-secondary/70 hover:bg-surface-secondary border border-border rounded-xl p-3 transition"
                >
                  <div className="text-xs font-bold text-foreground leading-tight truncate">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
                    {user.role} • {user.department || user.specialization || 'Campus Operations'}
                  </div>
                </Link>
              )}

              {/* Navigation Items */}
              {navContent}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-border text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Nexora Campus</span>
              <span className="font-mono text-primary font-semibold">Command Center</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
