'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { PortalGuard } from '@/components/layout/PortalGuard';
import {
  LayoutDashboard,
  GraduationCap,
  Inbox,
  PlusCircle,
  Key,
  FileCheck,
  Calendar,
  Bell,
  User,
  CheckCircle2,
  Sparkles,
  Users,
  HeartHandshake,
  Compass,
} from 'lucide-react';

const studentNavItems: NavItem[] = [
  // 1. Overview
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, group: 'Overview' },

  // 2. Campus Requests
  { label: 'My Requests', href: '/student/requests', icon: Inbox, group: 'Campus Requests' },
  { label: '+ New Complaint', href: '/student/requests/new', icon: PlusCircle, group: 'Campus Requests' },
  { label: 'Gate Pass (QR & PIN)', href: '/student/gate-pass', icon: Key, group: 'Campus Requests' },
  { label: 'Documents & Bonafide', href: '/student/documents', icon: FileCheck, group: 'Campus Requests' },
  { label: 'Hostel Leave', href: '/student/leave', icon: Calendar, group: 'Campus Requests' },

  // 3. Academics & Guidance
  { label: 'Guidance Mode', href: '/student/guidance', icon: Compass, badge: 'GUIDE', group: 'Academics & Guidance' },
  { label: 'Nexora Copilot', href: '/student/copilot', icon: Sparkles, badge: 'AI', group: 'Academics & Guidance' },
  { label: 'Academic Hub', href: '/student/academics', icon: GraduationCap, group: 'Academics & Guidance' },
  { label: 'My Attendance', href: '/student/attendance', icon: CheckCircle2, group: 'Academics & Guidance' },

  // 4. Community & Mentorship
  { label: 'Senior Guides', href: '/student/mentors', icon: Users, badge: 'PEER', group: 'Community & Mentors' },
  { label: 'My Mentor Profile', href: '/student/mentor-profile', icon: HeartHandshake, group: 'Community & Mentors' },
  { label: 'Campus Notices', href: '/student/notices', icon: Bell, group: 'Community & Mentors' },

  // 5. Account
  { label: 'Student Profile', href: '/student/profile', icon: User, group: 'Account' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['STUDENT', 'ADMIN']} portalTitle="Student Portal">
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
    </PortalGuard>
  );
}
