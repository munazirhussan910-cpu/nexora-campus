'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, Menu, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export interface NavbarProps {
  portalName: string;
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ portalName, onMenuClick, isMobileMenuOpen }: NavbarProps) {
  const { user, logout } = useAuth();

  // Determine profile route based on user role
  const profileHref =
    user?.role === 'STUDENT'
      ? '/student/profile'
      : user?.role === 'ACADEMIC_OFFICER'
      ? '/academic/profile'
      : `/${user?.role?.toLowerCase() || 'student'}/profile`;

  return (
    <header className="sticky top-0 z-40 w-full bg-header/90 backdrop-blur-md border-b border-border shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        {/* Left: Mobile Menu Trigger + Brand Logo & Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-xl bg-surface-secondary hover:bg-surface-hover border border-border text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 transition-all duration-150 shrink-0"
              aria-label={isMobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              aria-expanded={isMobileMenuOpen}
              title={isMobileMenuOpen ? 'Close Navigation' : 'Open Navigation'}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 -m-1 transition-all"
            title="Nexora Campus Home"
          >
            {/* Logo Mark with responsive border & subtle hover scale */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-xs border border-border bg-surface group-hover:border-primary group-hover:scale-105 transition-all duration-200 shrink-0">
              <Image
                src="/Logo.png"
                alt="Nexora Campus Logo"
                width={34}
                height={34}
                className="w-full h-full object-contain p-0.5"
                priority
              />
            </div>

            {/* Brand Titles */}
            <div className="min-w-0">
              <div className="font-extrabold tracking-wider text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 text-foreground leading-tight">
                <span className="tracking-wide">NEXORA</span>
                <span className="text-muted-foreground font-semibold hidden xs:inline tracking-normal">
                  CAMPUS
                </span>

                {/* Institutional Portal Badge */}
                <span className="text-[10px] tracking-wider uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-xs inline-flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="hidden sm:inline">{portalName}</span>
                  <span className="sm:hidden">
                    {portalName.includes('COMMAND')
                      ? 'ADMIN'
                      : portalName.includes('STUDENT')
                      ? 'STUDENT'
                      : portalName.split(' ')[0]}
                  </span>
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium tracking-tight hidden lg:block mt-0.5">
                MODERN CAMPUS OPERATIONS PLATFORM
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Theme Switcher + Notification Bell + Profile + Sign Out */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <ThemeToggle />
          <NotificationBell />

          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-border pl-1.5 sm:pl-2.5">
              {/* Profile Card / Pill */}
              <Link
                href={profileHref}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 transition-all duration-150 group"
                title="View Profile"
                aria-label={`Profile for ${user.fullName || user.username}`}
              >
                <Avatar
                  src={user.profilePhotoUrl}
                  name={user.fullName || user.username}
                  size="sm"
                  shape="rounded"
                  className="bg-primary/10 border border-primary/25 text-primary group-hover:border-primary transition-all"
                />

                <div className="text-left hidden md:block leading-tight">
                  <div className="text-xs font-semibold text-foreground group-hover:text-primary transition truncate max-w-[120px]">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                    <span>{user.rollNumber || user.role}</span>
                    {user.hostelBlock && <span className="opacity-70">• {user.hostelBlock}</span>}
                  </div>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                className="p-2 rounded-xl bg-surface hover:bg-rose-500/10 border border-border hover:border-rose-500/30 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95 transition-all duration-150 shrink-0"
                title="Sign out of campus portal"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
