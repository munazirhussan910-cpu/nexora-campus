'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { PortalGuard } from '@/components/layout/PortalGuard';
import {
  LayoutDashboard,
  Calendar,
  Bell,
  Clock,
  Compass,
  FileCheck,
  User,
} from 'lucide-react';

const academicNavItems: NavItem[] = [
  { label: 'Academic Dashboard', href: '/academic/dashboard', icon: LayoutDashboard },
  { label: 'Daily Routine', href: '/academic/routine', icon: Calendar },
  { label: 'Academic Notices', href: '/academic/notices', icon: Bell },
  { label: 'Academic Deadlines', href: '/academic/deadlines', icon: Clock },
  { label: 'Guidance Content', href: '/academic/guidance', icon: Compass, badge: 'NEW' },
  { label: 'Certificate Approvals', href: '/academic/approvals', icon: FileCheck },
  { label: 'Officer Profile', href: '/academic/profile', icon: User },
];

export default function AcademicLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['ACADEMIC_OFFICER', 'ADMIN']} portalTitle="Academic Operations Desk">
      <div className="min-h-screen bg-background flex flex-col overflow-x-hidden text-foreground">
        <Navbar
          portalName="ACADEMIC OPERATIONS"
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
          <Sidebar
            items={academicNavItems}
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
