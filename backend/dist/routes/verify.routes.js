"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const router = (0, express_1.Router)();
// GET /api/verify/document/:certificateId - Public verification endpoint
router.get('/document/:certificateId', async (req, res, next) => {
    try {
        const certificateId = String(req.params.certificateId);
        const doc = await prisma_1.default.document.findUnique({
            where: { documentNumber: certificateId },
            include: {
                owner: {
                    include: {
                        branch: true,
                    },
                },
                issuer: {
                    include: {
                        staff: true,
                    },
                },
            },
        });
        if (!doc) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'DOCUMENT_NOT_FOUND',
                    message: 'No official campus document found matching this Certificate ID.',
                },
            });
            return;
        }
        // Safe public payload (minimum necessary information)
        res.json({
            success: true,
            data: {
                verified: doc.status === 'VALID',
                status: doc.status,
                certificateId: doc.documentNumber,
                documentType: doc.documentType,
                studentName: doc.owner.fullName,
                rollNumber: doc.owner.rollNumber,
                course: `B.Tech ${doc.owner.branch.name}`,
                year: doc.owner.year,
                issuedAt: doc.issuedAt,
                expiresAt: doc.expiresAt,
                issuedBy: doc.issuer.staff?.fullName || 'Nexora Campus Administration',
                institution: 'Biju Patnaik University of Technology (BPUT)',
                fileUrl: doc.fileUrl,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
