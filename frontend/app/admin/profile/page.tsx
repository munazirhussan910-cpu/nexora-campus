'use client';

import React from 'react';
import { ProfileViewAndEditor } from '@/components/profile/ProfileViewAndEditor';

export default function AdminProfilePage() {
  return (
    <ProfileViewAndEditor
      portalTitle="Campus Director & Administrator Profile"
      portalSubtitle="Campus command center credentials, system administration authority, and executive communications."
      roleBadgeColor="from-purple-500 to-indigo-700"
    />
  );
}
