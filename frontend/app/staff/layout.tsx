'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { LayoutDashboard, CheckSquare, Clock, History, User } from 'lucide-react';

const staffNavItems: NavItem[] = [
  { label: 'Work Orders Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'My Assigned Tasks', href: '/staff/tasks', icon: CheckSquare },
  { label: 'SLA Performance & Ageing', href: '/staff/sla', icon: Clock },
  { label: 'Task History & Ratings', href: '/staff/history', icon: History },
  { label: 'Technician Profile', href: '/staff/profile', icon: User },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1118] flex flex-col">
      <Navbar portalName="FACILITY &amp; MAINTENANCE STAFF" />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar items={staffNavItems} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
