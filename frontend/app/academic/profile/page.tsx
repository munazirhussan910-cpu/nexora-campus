'use client';

import React from 'react';
import { ProfileViewAndEditor } from '@/components/profile/ProfileViewAndEditor';

export default function AcademicProfilePage() {
  return (
    <ProfileViewAndEditor
      portalTitle="Academic Officer Profile"
      portalSubtitle="Official academic credentials, certificate signing authority, and department details."
      roleBadgeColor="from-teal-500 to-emerald-700"
    />
  );
}
