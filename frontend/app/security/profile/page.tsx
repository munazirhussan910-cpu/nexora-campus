'use client';

import React from 'react';
import { ProfileViewAndEditor } from '@/components/profile/ProfileViewAndEditor';

export default function SecurityProfilePage() {
  return (
    <ProfileViewAndEditor
      portalTitle="Security Officer Profile"
      portalSubtitle="Gate sentry credentials, post authorization, and station assignments."
      roleBadgeColor="from-cyan-600 to-blue-800"
    />
  );
}
