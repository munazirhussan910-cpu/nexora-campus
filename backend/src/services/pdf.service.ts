import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { config } from '../config/env';

export interface BonafideData {
  certificateId: string;
  studentName: string;
  rollNumber: string;
  branchName: string;
  year: number;
  purpose: string;
  issueDate: Date;
  issuedByName?: string;
  verificationUrl: string;
}

export class PdfService {
  static async generateBonafidePdf(data: BonafideData): Promise<string> {
    if (!fs.existsSync(config.storageDir)) {
      fs.mkdirSync(config.storageDir, { recursive: true });
    }

    const fileName = `bonafide-${data.certificateId}.pdf`;
    const filePath = path.join(config.storageDir, fileName);

    // Generate QR Code image for the verification URL
    const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#1e2230',
        light: '#ffffff',
      },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Decorative Academic Border
      doc
        .lineWidth(3)
        .strokeColor('#1e2230')
        .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .stroke();

      doc
        .lineWidth(1)
        .strokeColor('#D4AF37')
        .rect(36, 36, doc.page.width - 72, doc.page.height - 72)
        .stroke();

      // Header
      doc.moveDown(1.5);
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#1e2230')
        .text('NEXORA CAMPUS', { align: 'center', characterSpacing: 1.5 });

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#6e7994')
        .text('BIJU PATNAIK UNIVERSITY OF TECHNOLOGY AFFILIATED CAMPUS', {
          align: 'center',
          characterSpacing: 0.5,
        });

      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .fillColor('#8c97ad')
        .text('Office of Academic Affairs & Student Welfare | Odisha, India', {
          align: 'center',
        });

      doc.moveDown(1);
      doc
        .strokeColor('#edeef2')
        .lineWidth(1)
        .moveTo(60, doc.y)
        .lineTo(doc.page.width - 60, doc.y)
        .stroke();

      doc.moveDown(1.5);

      // Certificate Title
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#D4AF37')
        .text('BONAFIDE CERTIFICATE', { align: 'center', underline: false });

      doc.moveDown(0.8);

      // Certificate Number & Issue Date
      const dateStr = data.issueDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#1e2230')
        .text(`Certificate No: ${data.certificateId}`, 60, doc.y);

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(`Date of Issue: ${dateStr}`, doc.page.width - 240, doc.y - 12, {
          width: 180,
          align: 'right',
        });

      doc.moveDown(2);

      // Body Paragraph
      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#1e2230')
        .lineGap(8)
        .text(
          'This is to certify that Mr./Ms. ',
          60,
          doc.y,
          { continued: true }
        )
        .font('Helvetica-Bold')
        .text(`${data.studentName}`, { continued: true })
        .font('Helvetica')
        .text(', holding University Registration / Roll Number ', { continued: true })
        .font('Helvetica-Bold')
        .text(`${data.rollNumber}`, { continued: true })
        .font('Helvetica')
        .text(
          `, is a bona fide, regular student of this institution, currently pursuing the Bachelor of Technology (B.Tech) degree in `,
          { continued: true }
        )
        .font('Helvetica-Bold')
        .text(`${data.branchName}`, { continued: true })
        .font('Helvetica')
        .text(`, currently enrolled in the `, { continued: true })
        .font('Helvetica-Bold')
        .text(`Year ${data.year} (Semester ${data.year * 2 - 1})`, { continued: true })
        .font('Helvetica')
        .text(` academic curriculum during the 2026 academic session.`);

      doc.moveDown(1.5);

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(
          `This certificate is officially issued on the formal request of the student for the express purpose of: `,
          60,
          doc.y,
          { continued: true }
        )
        .font('Helvetica-Bold')
        .text(`${data.purpose}.`);

      doc.moveDown(1);
      doc
        .font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor('#57607a')
        .text(
          'According to institution records, the conduct and academic standing of the student have remained satisfactory throughout the term of study.'
        );

      doc.moveDown(3);

      // QR Verification Section and Authority Signature
      const bottomY = doc.y;

      // Draw QR Code
      doc.image(qrBuffer, 60, bottomY, { width: 90 });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#6e7994')
        .text('Scan to Verify Legitimacy Online', 60, bottomY + 95, { width: 120, align: 'center' });

      // Authority Signature Block
      const sigX = doc.page.width - 240;
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#1e2230')
        .text(data.issuedByName || 'Dr. Ananya Ray', sigX, bottomY + 30, { align: 'right', width: 180 });

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#57607a')
        .text('Campus Operations Director', sigX, bottomY + 45, { align: 'right', width: 180 })
        .text('Nexora Campus Administration', sigX, bottomY + 58, { align: 'right', width: 180 })
        .text('BPUT Central Registry', sigX, bottomY + 71, { align: 'right', width: 180 });

      // Watermark / Verification Link footer
      doc.fontSize(8).fillColor('#8c97ad').text(
        `Digital Verification URL: ${data.verificationUrl}`,
        60,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 120 }
      );

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/${fileName}`);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}
