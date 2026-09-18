'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';
import { LogOut, Menu, X, User } from 'lucide-react';

export interface NavbarProps {
  portalName: string;
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ portalName, onMenuClick, isMobileMenuOpen }: NavbarProps) {
  const { user, logout } = useAuth();

  // Helper to extract student/user initials for avatar badge
  const getInitials = (name?: string, fallback = 'ST') => {
    if (!name) return fallback;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Determine profile route based on user role
  const profileHref = user?.role === 'STUDENT'
    ? '/student/profile'
    : user?.role === 'ACADEMIC_OFFICER'
    ? '/academic/profile'
    : `/${user?.role?.toLowerCase() || 'student'}/profile`;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d101a]/92 backdrop-blur-md border-b border-[#21273a] shadow-sm shadow-black/30 transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Left: Mobile Menu Trigger + Brand Logo & Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-xl bg-[#141824] border border-[#262e42] text-gray-300 hover:text-white hover:border-[#3d4866] hover:bg-[#1b2131] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] active:scale-95 transition-all duration-150 shrink-0"
              aria-label={isMobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              aria-expanded={isMobileMenuOpen}
              title={isMobileMenuOpen ? 'Close Navigation' : 'Open Navigation'}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-xl p-1 -m-1 transition-all"
            title="Nexora Campus Home"
          >
            {/* Logo Mark with gold border & hover scale */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md border border-[#d4af37]/40 bg-[#141824] group-hover:border-[#d4af37] group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all duration-200 shrink-0">
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
              <div className="font-extrabold tracking-wider text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 text-white leading-tight">
                <span className="tracking-wide">NEXORA</span>
                <span className="text-gray-400 font-semibold hidden xs:inline tracking-normal">CAMPUS</span>
                
                {/* Institutional Portal Badge */}
                <span className="text-[10px] tracking-wider uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[#1b2234] text-[#d4af37] border border-[#d4af37]/35 shadow-xs inline-flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_6px_#d4af37]" />
                  <span className="hidden sm:inline">{portalName}</span>
                  <span className="sm:hidden">{portalName.includes('STUDENT') ? 'STUDENT' : portalName.split(' ')[0]}</span>
                </span>
              </div>
              <div className="text-[10px] text-gray-400 font-medium tracking-tight hidden lg:block mt-0.5">
                ONE PLATFORM FOR EVERY CAMPUS REQUEST
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Notification Bell + Student Profile + Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <NotificationBell />

          {user && (
            <div className="flex items-center gap-2 border-l border-[#242b3d] pl-2 sm:pl-3">
              {/* Profile Card / Pill */}
              <Link
                href={profileHref}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#141824] hover:bg-[#1b2131] border border-[#262e42] hover:border-[#3d4866] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] active:scale-95 transition-all duration-150 group"
                title="View Student Profile"
                aria-label={`Student profile for ${user.fullName || user.username}`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1f2638] border border-[#d4af37]/40 text-[#d4af37] font-mono font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-[#d4af37] group-hover:shadow-[0_0_8px_rgba(212,175,55,0.2)] transition-all">
                  {getInitials(user.fullName || user.username)}
                </div>

                <div className="text-left hidden md:block leading-tight">
                  <div className="text-xs font-semibold text-gray-200 group-hover:text-white transition">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                    <span>{user.rollNumber || user.role}</span>
                    {user.hostelBlock && <span className="text-gray-500">• {user.hostelBlock}</span>}
                  </div>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                className="p-2 rounded-xl bg-[#141824] hover:bg-rose-950/20 border border-[#262e42] hover:border-rose-800/60 text-gray-400 hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95 transition-all duration-150 shrink-0"
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
