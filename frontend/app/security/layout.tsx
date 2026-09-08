'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { LayoutDashboard, QrCode, Key, Activity, User } from 'lucide-react';

const securityNavItems: NavItem[] = [
  { label: 'Security Command', href: '/security/dashboard', icon: LayoutDashboard },
  { label: 'Gate Pass Verification (QR / PIN)', href: '/security/scan', icon: QrCode },
  { label: 'Live Gate Activity Log', href: '/security/activity', icon: Activity },
  { label: 'Officer Profile', href: '/security/profile', icon: User },
];

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1118] flex flex-col">
      <Navbar portalName="MAIN GATE SECURITY CONTROL" />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar items={securityNavItems} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
