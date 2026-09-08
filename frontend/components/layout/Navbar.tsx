'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';
import { LogOut, ShieldAlert, UserCheck, Layers } from 'lucide-react';

interface NavbarProps {
  portalName: string;
}

export function Navbar({ portalName }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#141722]/90 backdrop-blur-md border-b border-[#282f42] px-4 py-2.5 sm:px-6">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8c7322] flex items-center justify-center font-bold text-black text-sm shadow-md group-hover:scale-105 transition-transform">
              NX
            </div>
            <div>
              <div className="font-bold tracking-wider text-sm sm:text-base flex items-center gap-1.5 text-white">
                NEXORA CAMPUS
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#202638] text-gold border border-[#3d4661]">
                  {portalName}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 hidden sm:block">
                ONE PLATFORM FOR EVERY CAMPUS REQUEST
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          {user && (
            <div className="flex items-center gap-2 border-l border-[#282f42] pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-gray-200 leading-tight">
                  {user.fullName || user.username}
                </div>
                <div className="text-[10px] text-gray-400">
                  {user.role} {user.rollNumber ? `• ${user.rollNumber}` : ''}
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="p-2 rounded-lg bg-[#181b26] border border-[#282f42] text-gray-400 hover:text-rose-400 hover:border-rose-900 transition"
                title="Logout"
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
