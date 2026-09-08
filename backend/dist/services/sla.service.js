"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class SlaService {
    /**
     * Calculates SLA hours based on request type, priority, and category
     */
    static async calculateDueAt(requestTypeCode, priority = 'NORMAL', category) {
        const reqType = await prisma_1.default.requestType.findUnique({
            where: { code: requestTypeCode },
        });
        let maxHours = reqType?.slaHours || 24;
        // Check specific SLA rules
        if (reqType) {
            const specificRule = await prisma_1.default.slaRule.findFirst({
                where: {
                    requestTypeId: reqType.id,
                    priority: priority,
                    isActive: true,
                    ...(category ? { category } : {}),
                },
            });
            if (specificRule) {
                maxHours = specificRule.maxHours;
            }
            else {
                // Fallback priority adjustments
                if (priority === 'URGENT')
                    maxHours = Math.max(4, Math.floor(maxHours / 4));
                else if (priority === 'HIGH')
                    maxHours = Math.max(8, Math.floor(maxHours / 2));
                else if (priority === 'LOW')
                    maxHours = maxHours * 2;
            }
        }
        const dueAt = new Date(Date.now() + maxHours * 60 * 60 * 1000);
        return { dueAt, maxHours };
    }
    /**
     * Computes SLA status and ageing bracket for a request
     */
    static computeSla(request) {
        const now = new Date();
        const created = new Date(request.createdAt);
        const due = request.dueAt ? new Date(request.dueAt) : new Date(created.getTime() + 24 * 60 * 60 * 1000);
        const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        let ageingBracket = '< 12h';
        if (ageHours > 48)
            ageingBracket = '> 48h';
        else if (ageHours > 24)
            ageingBracket = '24–48h';
        else if (ageHours > 12)
            ageingBracket = '12–24h';
        if (request.completedAt) {
            const isBreached = new Date(request.completedAt) > due;
            return {
                dueAt: due,
                maxHours: Math.round((due.getTime() - created.getTime()) / (1000 * 60 * 60)),
                isOverdue: isBreached,
                hoursRemaining: 0,
                ageingBracket,
                status: isBreached ? 'BREACHED' : 'COMPLETED',
            };
        }
        const msRemaining = due.getTime() - now.getTime();
        const hoursRemaining = Math.round(msRemaining / (1000 * 60 * 60));
        const isOverdue = msRemaining < 0;
        let status = 'ON_TRACK';
        if (isOverdue) {
            status = 'BREACHED';
        }
        else if (hoursRemaining <= 4) {
            status = 'AT_RISK';
        }
        return {
            dueAt: due,
            maxHours: Math.round((due.getTime() - created.getTime()) / (1000 * 60 * 60)),
            isOverdue,
            hoursRemaining,
            ageingBracket,
            status,
        };
    }
    /**
     * Computes campus-wide SLA metrics for Admin Command Center
     */
    static async getCampusSlaMetrics() {
        const openRequests = await prisma_1.default.request.findMany({
            where: {
                status: {
                    in: ['SUBMITTED', 'ROUTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PENDING_APPROVAL'],
                },
            },
        });
        const ageingCounts = {
            '< 12h': 0,
            '12–24h': 0,
            '24–48h': 0,
            '> 48h': 0,
        };
        let breachedCount = 0;
        let atRiskCount = 0;
        let onTrackCount = 0;
        for (const r of openRequests) {
            const sla = this.computeSla(r);
            ageingCounts[sla.ageingBracket]++;
            if (sla.status === 'BREACHED')
                breachedCount++;
            else if (sla.status === 'AT_RISK')
                atRiskCount++;
            else
                onTrackCount++;
        }
        return {
            totalOpen: openRequests.length,
            breachedCount,
            atRiskCount,
            onTrackCount,
            complianceRate: openRequests.length > 0
                ? Math.round(((openRequests.length - breachedCount) / openRequests.length) * 100)
                : 100,
            ageingCounts,
        };
    }
}
exports.SlaService = SlaService;
