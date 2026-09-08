import prisma from '../config/prisma';

export interface RouteResult {
  category: string;
  department: string;
  specialization: string;
  assignedStaffUserId?: string;
  assignedStaffName?: string;
}

export class RoutingService {
  /**
   * Deterministic keyword routing based on database routing rules.
   * e.g. "tap leak in bathroom" -> Plumbing -> Ramesh (PLUMBING)
   *      "fan spark" -> Electrical -> Suresh (ELECTRICAL)
   */
  static async routeComplaint(title: string, description: string): Promise<RouteResult> {
    const text = `${title} ${description}`.toLowerCase();

    // Fetch active routing rules from database
    const rules = await prisma.routingRule.findMany({
      where: { isActive: true },
    });

    let bestRule = rules[0] || {
      category: 'General Maintenance',
      department: 'Maintenance',
      targetSpecialization: 'GENERAL',
    };

    let maxMatchCount = 0;

    for (const rule of rules) {
      const keywords = rule.keywords.split(',').map((k) => k.trim().toLowerCase());
      let count = 0;
      for (const kw of keywords) {
        if (kw && text.includes(kw)) {
          count++;
        }
      }
      if (count > maxMatchCount) {
        maxMatchCount = count;
        bestRule = rule;
      }
    }

    // Now find available staff member matching the specialization
    const candidateStaff = await prisma.staff.findFirst({
      where: {
        specialization: bestRule.targetSpecialization,
        user: { isActive: true },
      },
      include: {
        user: true,
      },
    });

    return {
      category: bestRule.category,
      department: bestRule.department,
      specialization: bestRule.targetSpecialization,
      assignedStaffUserId: candidateStaff ? candidateStaff.userId : undefined,
      assignedStaffName: candidateStaff ? candidateStaff.fullName : undefined,
    };
  }
}
