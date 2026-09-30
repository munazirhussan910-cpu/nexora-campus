'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

interface PortalGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  portalTitle?: string;
}

export function PortalGuard({
  children,
  allowedRoles,
  portalTitle = 'Campus Portal',
}: PortalGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={28} className="animate-spin text-[#d4af37]" />
        <span className="text-xs font-mono">Verifying campus credentials...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (!allowedRoles.includes(user.role)) {
    const roleDashboard =
      user.role === 'STUDENT'
        ? '/student/dashboard'
        : user.role === 'STAFF'
        ? '/staff/dashboard'
        : user.role === 'WARDEN'
        ? '/warden/dashboard'
        : user.role === 'SECURITY'
        ? '/security/dashboard'
        : user.role === 'ACADEMIC_OFFICER'
        ? '/academic/dashboard'
        : user.role === 'ADMIN'
        ? '/admin/dashboard'
        : '/login';

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#141722] border border-rose-900/60 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={24} />
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight mb-2">
            403 — Restricted Campus Area
          </h2>

          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Your account is authenticated as <strong className="text-white font-mono">{user.role}</strong>. You do not have authorization to access the {portalTitle}.
          </p>

          <Link
            href={roleDashboard}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c2233] hover:bg-[#252e44] border border-[#d4af37]/40 text-xs font-semibold text-[#d4af37] transition active:scale-95 shadow-sm w-full"
          >
            <ArrowLeft size={14} />
            <span>Return to My Authorized Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
