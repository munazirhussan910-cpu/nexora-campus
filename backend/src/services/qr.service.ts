import crypto from 'crypto';
import QRCode from 'qrcode';
import { config } from '../config/env';
import prisma from '../config/prisma';

export interface VerifyResult {
  valid: boolean;
  status: 'VALID' | 'INVALID' | 'EXPIRED' | 'ALREADY_USED';
  message: string;
  gatePass?: any;
  student?: any;
}

export class QrService {
  /**
   * Generates a 4-digit numeric PIN for fallback verification
   */
  static generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Generates a signed, expiring QR token
   */
  static generateSignedQrToken(gatePassId: string, rollNumber: string, expiresAt: Date): string {
    const payload = `${gatePassId}:${rollNumber}:${expiresAt.getTime()}`;
    const signature = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(payload)
      .digest('hex')
      .slice(0, 16);
    return `NX-GP-${Buffer.from(payload).toString('base64')}.${signature}`;
  }

  /**
   * Generates a QR Code as a Data URL (image/png base64) for frontend display
   */
  static async generateQrDataUrl(qrToken: string): Promise<string> {
    return QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f1118',
        light: '#ffffff',
      },
    });
  }

  /**
   * Verifies either a QR token or a numeric PIN
   */
  static async verifyGatePass(tokenOrPin: string): Promise<VerifyResult> {
    const cleanedInput = tokenOrPin.trim();

    // 1. Try finding by PIN (numeric 4-digit)
    let gatePass = await prisma.gatePass.findFirst({
      where: { passPin: cleanedInput },
      include: {
        request: {
          include: {
            requester: {
              include: {
                student: {
                  include: {
                    branch: true,
                    hostelRoom: {
                      include: {
                        hostelBlock: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        events: {
          orderBy: { eventTime: 'desc' },
        },
      },
    });

    // 2. If not found by PIN, try finding by QR Token Hash
    if (!gatePass) {
      gatePass = await prisma.gatePass.findFirst({
        where: { qrTokenHash: cleanedInput },
        include: {
          request: {
            include: {
              requester: {
                include: {
                  student: {
                    include: {
                      branch: true,
                      hostelRoom: {
                        include: {
                          hostelBlock: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          events: {
            orderBy: { eventTime: 'desc' },
          },
        },
      });
    }

    if (!gatePass) {
      return {
        valid: false,
        status: 'INVALID',
        message: 'No matching gate pass found for this QR token or PIN.',
      };
    }

    const student = gatePass.request.requester.student;

    // Check if Pass is already RETURNED or CANCELLED
    if (gatePass.gateStatus === 'RETURNED' || gatePass.gateStatus === 'CLOSED') {
      return {
        valid: false,
        status: 'ALREADY_USED',
        message: 'This gate pass has already been returned and completed.',
        gatePass,
        student,
      };
    }

    if (gatePass.gateStatus === 'REJECTED' || gatePass.gateStatus === 'CANCELLED') {
      return {
        valid: false,
        status: 'INVALID',
        message: `This gate pass was ${gatePass.gateStatus.toLowerCase()} and cannot be used.`,
        gatePass,
        student,
      };
    }

    if (gatePass.gateStatus === 'PENDING_APPROVAL') {
      return {
        valid: false,
        status: 'INVALID',
        message: 'This gate pass is pending warden approval and is not yet authorized.',
        gatePass,
        student,
      };
    }

    // Check Expiration
    if (gatePass.qrExpiresAt && new Date() > gatePass.qrExpiresAt) {
      return {
        valid: false,
        status: 'EXPIRED',
        message: `This gate pass expired at ${gatePass.qrExpiresAt.toLocaleTimeString()}.`,
        gatePass,
        student,
      };
    }

    // Valid Pass (either ready for DEPARTED or RETURNED)
    return {
      valid: true,
      status: 'VALID',
      message: gatePass.gateStatus === 'APPROVED' 
        ? 'Pass is VALID. Authorized for Departure.' 
        : 'Pass is VALID. Student is currently outside. Ready for Return Entry.',
      gatePass,
      student,
    };
  }
}
