'use client';

import React from 'react';
import { ProfileViewAndEditor } from '@/components/profile/ProfileViewAndEditor';

export default function WardenProfilePage() {
  return (
    <ProfileViewAndEditor
      portalTitle="Hostel Warden Profile"
      portalSubtitle="Official residential authority credentials, assigned hostel block, and campus housing oversight."
      roleBadgeColor="from-emerald-500 to-teal-700"
    />
  );
}
