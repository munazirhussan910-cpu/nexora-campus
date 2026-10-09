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
  User,
} from 'lucide-react';

const adminNavItems: NavItem[] = [
  // 1. Command & Intelligence
  {
    label: 'Command Center',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    group: 'Command & Intelligence',
  },
  {
    label: 'Recurring Issues',
    href: '/admin/recurring-issues',
    icon: AlertOctagon,
    badge: 'SEC 44',
    group: 'Command & Intelligence',
  },
  {
    label: 'SLA Intelligence',
    href: '/admin/sla',
    icon: Clock,
    group: 'Command & Intelligence',
  },

  // 2. Operational Workflows
  {
    label: 'Campus Requests',
    href: '/admin/requests',
    icon: Layers,
    group: 'Operations Hub',
  },
  {
    label: 'Approvals Hub',
    href: '/admin/approvals',
    icon: CheckSquare,
    group: 'Operations Hub',
  },

  // 3. Directory & Staff
  {
    label: 'Staff Management',
    href: '/admin/staff',
    icon: Wrench,
    group: 'Campus Rosters',
  },
  {
    label: 'Student Directory',
    href: '/admin/students',
    icon: Users,
    group: 'Campus Rosters',
  },

  // 4. Governance & System
  {
    label: 'Targeted Notices',
    href: '/admin/notices',
    icon: Bell,
    group: 'Governance & Security',
  },
  {
    label: 'Audit Ledger',
    href: '/admin/audit',
    icon: FileSpreadsheet,
    group: 'Governance & Security',
  },
  {
    label: 'System Configuration',
    href: '/admin/configuration',
    icon: Settings,
    group: 'Governance & Security',
  },
  {
    label: 'Admin Profile',
    href: '/admin/profile',
    icon: User,
    group: 'Account',
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['ADMIN']} portalTitle="Admin Command Center">
      <div className="min-h-screen bg-background flex flex-col overflow-x-hidden text-foreground">
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
          <main className="flex-1 p-3 sm:p-5 lg:p-7 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </PortalGuard>
  );
}
