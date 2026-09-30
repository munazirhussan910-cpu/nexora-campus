'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavItem } from '@/components/layout/Sidebar';
import { PortalGuard } from '@/components/layout/PortalGuard';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['ADMIN']} portalTitle="Admin Command Center">
      <div className="min-h-screen bg-[#0a0d14] flex flex-col overflow-x-hidden text-[#edeef2]">
        <Navbar
          portalName="COMMAND CENTER"
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
          <Sidebar
            items={adminNavItems}
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
