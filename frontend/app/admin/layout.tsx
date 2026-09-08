'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import {
  LayoutDashboard,
  Layers,
  CheckSquare,
  AlertOctagon,
  Clock,
  Wrench,
  Users,
  Bell,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

const adminNavItems: NavItem[] = [
  { label: 'Command Center', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Campus Requests', href: '/admin/requests', icon: Layers },
  { label: 'Approvals Hub', href: '/admin/approvals', icon: CheckSquare },
  { label: 'Recurring Issues', href: '/admin/recurring-issues', icon: AlertOctagon },
  { label: 'SLA Intelligence', href: '/admin/sla', icon: Clock },
  { label: 'Staff Management', href: '/admin/staff', icon: Wrench },
  { label: 'Student Directory', href: '/admin/students', icon: Users },
  { label: 'Targeted Notices', href: '/admin/notices', icon: Bell },
  { label: 'Immutable Audit Logs', href: '/admin/audit', icon: FileSpreadsheet },
  { label: 'System Configuration', href: '/admin/configuration', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1118] flex flex-col">
      <Navbar portalName="COMMAND CENTER" />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar items={adminNavItems} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
