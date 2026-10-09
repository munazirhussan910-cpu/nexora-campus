'use client';

import React from 'react';
import { ProfileViewAndEditor } from '@/components/profile/ProfileViewAndEditor';

export default function StaffProfilePage() {
  return (
    <ProfileViewAndEditor
      portalTitle="Maintenance Staff Profile"
      portalSubtitle="Campus technician credentials, operational department, and assigned specialization."
      roleBadgeColor="from-amber-500 to-amber-700"
    />
  );
}
