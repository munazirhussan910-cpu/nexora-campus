'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import {
  LayoutDashboard,
  Inbox,
  PlusCircle,
  Key,
  FileCheck,
  Calendar,
  Bell,
  User,
} from 'lucide-react';

const studentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'My Requests', href: '/student/requests', icon: Inbox },
  { label: '+ New Complaint', href: '/student/requests/new', icon: PlusCircle },
  { label: 'Gate Pass (QR & PIN)', href: '/student/gate-pass', icon: Key },
  { label: 'Documents & Bonafide', href: '/student/documents', icon: FileCheck },
  { label: 'Hostel Leave', href: '/student/leave', icon: Calendar },
  { label: 'Campus Notices', href: '/student/notices', icon: Bell },
  { label: 'Student Profile', href: '/student/profile', icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col overflow-x-hidden text-[#edeef2]">
      <Navbar
        portalName="STUDENT PORTAL"
        onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          items={studentNavItems}
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
