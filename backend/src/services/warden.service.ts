import prisma from '../config/prisma';

export interface WardenBlockInfo {
  id: string;
  name: string;
}

/**
 * Resolves the hostel block assigned to a Warden user.
 * Resolution precedence:
 * 1. Direct match by HostelBlock.wardenName with Staff.fullName or user.fullName
 * 2. Staff.designation containing block name (e.g. "Chief Warden Block B", "Warden Block B")
 * 3. User email or username containing block identifier (e.g. "warden.b@nexora.edu", "warden_b")
 */
export async function getWardenHostelBlock(user: any): Promise<WardenBlockInfo | null> {
  if (!user) return null;

  const staff = await prisma.staff.findUnique({
    where: { userId: user.id },
  });

  const staffName = (staff?.fullName || user.fullName || '').trim();
  const designation = (staff?.designation || '').trim();
  const email = (user.email || '').trim().toLowerCase();
  const username = (user.username || '').trim().toLowerCase();

  const allBlocks = await prisma.hostelBlock.findMany();

  // 1. Direct match by HostelBlock.wardenName
  if (staffName) {
    for (const b of allBlocks) {
      if (
        b.wardenName &&
        (b.wardenName.toLowerCase().includes(staffName.toLowerCase()) ||
          staffName.toLowerCase().includes(b.wardenName.toLowerCase()))
      ) {
        return { id: b.id, name: b.name };
      }
    }
  }

  // 2. Match by designation (e.g. "Chief Warden Block B")
  if (designation) {
    for (const b of allBlocks) {
      if (designation.toLowerCase().includes(b.name.toLowerCase())) {
        return { id: b.id, name: b.name };
      }
    }
  }

  // 3. Match by email or username (e.g. "warden.b@nexora.edu", "warden_b")
  for (const b of allBlocks) {
    const letter = b.name.replace(/hostel\s*/i, '').replace(/block\s*/i, '').trim().toLowerCase();
    if (letter) {
      if (
        email.includes(`warden.${letter}@`) ||
        email.includes(`warden_${letter}@`) ||
        email.includes(`warden${letter}@`) ||
        username === `warden_${letter}` ||
        username === `warden.${letter}` ||
        username === `warden${letter}`
      ) {
        return { id: b.id, name: b.name };
      }
    }
  }

  return null;
}
