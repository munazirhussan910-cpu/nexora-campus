'use client';

import React from 'react';
import { ProfileViewAndEditor } from '@/components/profile/ProfileViewAndEditor';

export default function FacultyProfilePage() {
  return (
    <ProfileViewAndEditor
      portalTitle="Faculty Member Profile"
      portalSubtitle="University teaching credentials, assigned courses, and department details."
      roleBadgeColor="from-indigo-500 to-indigo-700"
    />
  );
}
