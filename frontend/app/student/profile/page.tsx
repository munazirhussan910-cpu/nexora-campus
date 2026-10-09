'use client';

import React from 'react';
import { ProfileViewAndEditor } from '@/components/profile/ProfileViewAndEditor';

export default function StudentProfilePage() {
  return (
    <ProfileViewAndEditor
      portalTitle="Student Digital Identity"
      portalSubtitle="Official academic enrollment record, branch credentials, and residential hostel room allocation verified by Nexora Campus Registry."
      roleBadgeColor="from-[#d4af37] via-[#b89528] to-[#8a6e1a]"
    />
  );
}
