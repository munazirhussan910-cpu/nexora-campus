'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { LayoutDashboard, Key, Calendar, Wrench, Users, Bell, User } from 'lucide-react';

const wardenNavItems: NavItem[] = [
  { label: 'Hostel Dashboard', href: '/warden/dashboard', icon: LayoutDashboard },
  { label: 'Gate Pass Approvals', href: '/warden/gate-passes', icon: Key },
  { label: 'Leave Applications', href: '/warden/leaves', icon: Calendar },
  { label: 'Hostel Complaints', href: '/warden/complaints', icon: Wrench },
  { label: 'Student Directory', href: '/warden/students', icon: Users },
  { label: 'Hostel Notices', href: '/warden/notices', icon: Bell },
  { label: 'Warden Profile', href: '/warden/profile', icon: User },
];

export default function WardenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1118] flex flex-col">
      <Navbar portalName="HOSTEL WARDEN DESK" />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar items={wardenNavItems} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
