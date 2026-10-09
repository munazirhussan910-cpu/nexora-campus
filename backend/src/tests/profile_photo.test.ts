import { StorageService } from '../services/storage.service';
import { AppError } from '../middleware/error.middleware';

describe('Profile Photo Storage & Security Service Unit Tests', () => {
  // Sample valid headers
  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01]);
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x24, 0x00, 0x00, 0x00, // file length
    0x57, 0x45, 0x42, 0x50, // WEBP
    0x56, 0x50, 0x38, 0x20, // VP8
  ]);

  describe('1. Magic Bytes Image Detection', () => {
    it('Correctly identifies JPEG magic bytes (FF D8 FF)', () => {
      expect(StorageService.detectMimeFromMagicBytes(validJpegBuffer)).toBe('image/jpeg');
    });

    it('Correctly identifies PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)', () => {
      expect(StorageService.detectMimeFromMagicBytes(validPngBuffer)).toBe('image/png');
    });

    it('Correctly identifies WebP magic bytes (RIFF....WEBP)', () => {
      expect(StorageService.detectMimeFromMagicBytes(validWebpBuffer)).toBe('image/webp');
    });

    it('Rejects text/HTML files disguised as images', () => {
      const htmlBuffer = Buffer.from('<html><body><script>alert(1)</script></body></html>');
      expect(StorageService.detectMimeFromMagicBytes(htmlBuffer)).toBeNull();
    });

    it('Rejects PDF or executable files', () => {
      const pdfBuffer = Buffer.from('%PDF-1.5 fake content');
      expect(StorageService.detectMimeFromMagicBytes(pdfBuffer)).toBeNull();
    });

    it('Rejects empty or too-short buffers', () => {
      expect(StorageService.detectMimeFromMagicBytes(Buffer.from([]))).toBeNull();
      expect(StorageService.detectMimeFromMagicBytes(Buffer.from([0xff, 0xd8]))).toBeNull();
    });
  });

  describe('2. Validation & Parsing', () => {
    it('Parses valid JPEG data URL properly', () => {
      const dataUrl = `data:image/jpeg;base64,${validJpegBuffer.toString('base64')}`;
      const result = StorageService.validateAndParse(dataUrl);

      expect(result.mimeType).toBe('image/jpeg');
      expect(result.extension).toBe('jpg');
      expect(result.dataUrl).toContain('data:image/jpeg;base64,');
    });

    it('Parses valid PNG data URL properly', () => {
      const dataUrl = `data:image/png;base64,${validPngBuffer.toString('base64')}`;
      const result = StorageService.validateAndParse(dataUrl);

      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('png');
    });

    it('Parses valid WebP data URL properly', () => {
      const dataUrl = `data:image/webp;base64,${validWebpBuffer.toString('base64')}`;
      const result = StorageService.validateAndParse(dataUrl);

      expect(result.mimeType).toBe('image/webp');
      expect(result.extension).toBe('webp');
    });

    it('Enforces 5 MB size limit', () => {
      // Allocate 5MB + 1KB buffer starting with valid JPEG magic bytes
      const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
      oversizedBuffer[0] = 0xff;
      oversizedBuffer[1] = 0xd8;
      oversizedBuffer[2] = 0xff;

      expect(() => {
        StorageService.validateAndParse(oversizedBuffer);
      }).toThrow('Image size must be less than 5 MB.');
    });

    it('Rejects corrupt or non-image files with clear user-friendly message', () => {
      const fakeImage = Buffer.from('not an image content at all');
      expect(() => {
        StorageService.validateAndParse(fakeImage);
      }).toThrow('Image must be JPG, PNG, or WEBP.');
    });

    it('Rejects declared image header when magic bytes do not match', () => {
      const mismatchDataUrl = 'data:image/jpeg;base64,c29tZSByYW5kb20gbm9uIGltYWdlIGRhdGE=';
      expect(() => {
        StorageService.validateAndParse(mismatchDataUrl);
      }).toThrow('Image must be JPG, PNG, or WEBP.');
    });
  });

  describe('3. Avatar Processing & Security', () => {
    it('Saves avatar and returns persistent data URL', async () => {
      const res = await StorageService.processAndSaveAvatar('test-user-123', validPngBuffer);
      expect(res.profilePhotoUrl).toBeDefined();
      expect(res.profilePhotoUrl.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('Path traversal attempts are neutralized in safeDeleteDiskFile', () => {
      expect(() => {
        StorageService.safeDeleteDiskFile('../../etc/passwd');
        StorageService.safeDeleteDiskFile('/uploads/avatars/../../../var/log/system.log');
        StorageService.safeDeleteDiskFile('avatar-test/../../evil.sh');
      }).not.toThrow();
    });
  });
});
