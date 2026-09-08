"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class RoutingService {
    /**
     * Deterministic keyword routing based on database routing rules.
     * e.g. "tap leak in bathroom" -> Plumbing -> Ramesh (PLUMBING)
     *      "fan spark" -> Electrical -> Suresh (ELECTRICAL)
     */
    static async routeComplaint(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        // Fetch active routing rules from database
        const rules = await prisma_1.default.routingRule.findMany({
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
        const candidateStaff = await prisma_1.default.staff.findFirst({
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
exports.RoutingService = RoutingService;
