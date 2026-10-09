'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function UniversalProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (
      user.role === 'FACULTY' ||
      (user.role === 'STAFF' &&
        (user.email === 'faculty@nexora.edu' ||
          user.username === 'faculty' ||
          user.specialization?.includes('FACULTY') ||
          user.department?.toLowerCase().includes('computer science')))
    ) {
      router.replace('/faculty/profile');
      return;
    }

    switch (user.role) {
      case 'STUDENT':
        router.replace('/student/profile');
        break;
      case 'STAFF':
        router.replace('/staff/profile');
        break;
      case 'WARDEN':
        router.replace('/warden/profile');
        break;
      case 'SECURITY':
        router.replace('/security/profile');
        break;
      case 'ACADEMIC_OFFICER':
        router.replace('/academic/profile');
        break;
      case 'ADMIN':
        router.replace('/admin/profile');
        break;
      default:
        router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-6 text-sm text-gray-400">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <span>Loading your profile...</span>
      </div>
    </div>
  );
}
