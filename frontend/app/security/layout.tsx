'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { LayoutDashboard, QrCode, Activity, User } from 'lucide-react';

const securityNavItems: NavItem[] = [
  { label: 'Security Command', href: '/security/dashboard', icon: LayoutDashboard },
  { label: 'Gate Pass Verification (QR / PIN)', href: '/security/scan', icon: QrCode },
  { label: 'Live Gate Activity Log', href: '/security/activity', icon: Activity },
  { label: 'Officer Profile', href: '/security/profile', icon: User },
];

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col overflow-x-hidden text-[#edeef2]">
      <Navbar
        portalName="MAIN GATE SECURITY"
        onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          items={securityNavItems}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
