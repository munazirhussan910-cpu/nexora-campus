'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { PortalGuard } from '@/components/layout/PortalGuard';
import { LayoutDashboard, FileCheck, User } from 'lucide-react';

const academicNavItems: NavItem[] = [
  { label: 'Academic Dashboard', href: '/academic/dashboard', icon: LayoutDashboard },
  { label: 'Certificate Approvals', href: '/academic/approvals', icon: FileCheck },
  { label: 'Officer Profile', href: '/academic/profile', icon: User },
];

export default function AcademicLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['ACADEMIC_OFFICER', 'ADMIN']} portalTitle="Academic Cell">
      <div className="min-h-screen bg-[#0a0d14] flex flex-col overflow-x-hidden text-[#edeef2]">
        <Navbar
          portalName="ACADEMIC CELL"
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
