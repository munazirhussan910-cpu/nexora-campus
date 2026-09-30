'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { PortalGuard } from '@/components/layout/PortalGuard';
import { LayoutDashboard, CheckSquare, Clock, History, User } from 'lucide-react';

const staffNavItems: NavItem[] = [
  { label: 'Work Orders Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'My Assigned Tasks', href: '/staff/tasks', icon: CheckSquare },
  { label: 'SLA Performance & Ageing', href: '/staff/sla', icon: Clock },
  { label: 'Task History & Ratings', href: '/staff/history', icon: History },
  { label: 'Technician Profile', href: '/staff/profile', icon: User },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['STAFF', 'ADMIN']} portalTitle="Maintenance Operations">
      <div className="min-h-screen bg-[#0a0d14] flex flex-col overflow-x-hidden text-[#edeef2]">
        <Navbar
          portalName="MAINTENANCE OPERATIONS"
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
          <Sidebar
            items={staffNavItems}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </PortalGuard>
  );
}
