'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { PortalGuard } from '@/components/layout/PortalGuard';
import { LayoutDashboard, CheckSquare, History, BarChart3, Calendar } from 'lucide-react';

const facultyNavItems: NavItem[] = [
  { label: 'Teacher Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
  { label: 'Take Attendance', href: '/faculty/attendance/take', icon: CheckSquare },
  { label: 'Attendance History', href: '/faculty/attendance/history', icon: History },
  { label: 'Subject Attendance', href: '/faculty/attendance/subjects', icon: BarChart3 },
  { label: 'Day-wise Attendance', href: '/faculty/attendance/day-wise', icon: Calendar },
];

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['STAFF', 'FACULTY', 'ADMIN']} portalTitle="Faculty Attendance Portal">
      <div className="min-h-screen bg-[#0a0d14] flex flex-col overflow-x-hidden text-[#edeef2]">
        <Navbar
          portalName="FACULTY ATTENDANCE"
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
          <Sidebar
            items={facultyNavItems}
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
