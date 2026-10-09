import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env';
import { AppError } from '../middleware/error.middleware';

export interface ParsedImage {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  sizeBytes: number;
  dataUrl: string;
}

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class StorageService {
  private static getAvatarsDir(): string {
    const dir = path.join(config.storageDir, 'avatars');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Fallback silently if storage directory is read-only or in testing
      }
    }
    return dir;
  }

  /**
   * Validates image magic bytes to ensure the content is genuinely an image
   * and not an executable, script, or corrupted file.
   */
  public static detectMimeFromMagicBytes(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
    if (!buffer || buffer.length < 12) {
      return null;
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A (\x89PNG\r\n\x1a\n)
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return 'image/png';
    }

    // WebP: RIFF (bytes 0-3) .... WEBP (bytes 8-11)
    const isRiff =
      buffer[0] === 0x52 && // R
      buffer[1] === 0x49 && // I
      buffer[2] === 0x46 && // F
      buffer[3] === 0x46; // F

    const isWebp =
      buffer[8] === 0x57 && // W
      buffer[9] === 0x45 && // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50; // P

    if (isRiff && isWebp) {
      return 'image/webp';
    }

    return null;
  }

  /**
   * Validates, sanitizes, and parses an image input (either a Data URL or raw Buffer).
   */
  public static validateAndParse(input: Buffer | string, declaredMimeType?: string): ParsedImage {
    let buffer: Buffer;
    let mimeTypeHeader: string | undefined = declaredMimeType;

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('data:')) {
        const matches = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!matches) {
          throw new AppError('Invalid image data URL format.', 400);
        }
        mimeTypeHeader = matches[1].toLowerCase();
        try {
          buffer = Buffer.from(matches[2], 'base64');
        } catch {
          throw new AppError('Failed to decode base64 image data.', 400);
        }
      } else {
        // Plain base64 string
        try {
          buffer = Buffer.from(trimmed, 'base64');
        } catch {
          throw new AppError('Failed to decode base64 image data.', 400);
        }
      }
    } else if (Buffer.isBuffer(input)) {
      buffer = input;
    } else {
      throw new AppError('Unsupported image input format.', 400);
    }

    // 1. Size Validation
    if (buffer.length === 0) {
      throw new AppError('Uploaded image is empty.', 400);
    }

    if (buffer.length > MAX_AVATAR_SIZE_BYTES) {
      throw new AppError('Image size must be less than 5 MB.', 400);
    }

    // 2. MIME Type Validation
    const detectedMime = this.detectMimeFromMagicBytes(buffer);
    if (!detectedMime) {
      throw new AppError('Image must be JPG, PNG, or WEBP.', 400);
    }

    if (mimeTypeHeader && !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimeTypeHeader)) {
      throw new AppError('Image must be JPG, PNG, or WEBP.', 400);
    }

    const extension = detectedMime === 'image/jpeg' ? 'jpg' : detectedMime === 'image/png' ? 'png' : 'webp';
    const dataUrl = `data:${detectedMime};base64,${buffer.toString('base64')}`;

    return {
      buffer,
      mimeType: detectedMime,
      extension,
      sizeBytes: buffer.length,
      dataUrl,
    };
  }

  /**
   * Processes and stores an avatar image.
   * Generates a safe Data URL for resilient database persistence (guaranteeing survival across
   * Render ephemeral dyno wipes) and writes a local disk copy when storage is available.
   */
  public static async processAndSaveAvatar(
    userId: string,
    input: Buffer | string,
    currentPhotoUrl?: string | null
  ): Promise<{ profilePhotoUrl: string }> {
    const parsed = this.validateAndParse(input);

    // Clean up previous disk file if present
    if (currentPhotoUrl) {
      this.safeDeleteDiskFile(currentPhotoUrl);
    }

    // Attempt to write to local storage as file cache
    try {
      const avatarsDir = this.getAvatarsDir();
      const safeRandom = crypto.randomBytes(6).toString('hex');
      const safeFileName = `avatar-${userId.replace(/[^a-zA-Z0-9-]/g, '')}-${safeRandom}.${parsed.extension}`;
      const filePath = path.join(avatarsDir, safeFileName);

      fs.writeFileSync(filePath, parsed.buffer);
    } catch {
      // Ephemeral disk or permission limitation — database Data URL guarantees persistence
    }

    // Return the persistent data URL
    return {
      profilePhotoUrl: parsed.dataUrl,
    };
  }

  /**
   * Safely deletes an avatar file from the disk storage without allowing path traversal.
   */
  public static safeDeleteDiskFile(fileUrlOrDataUrl: string): void {
    if (!fileUrlOrDataUrl || fileUrlOrDataUrl.startsWith('data:')) {
      return;
    }

    try {
      const fileName = path.basename(fileUrlOrDataUrl);
      if (!fileName || fileName.includes('..') || !fileName.startsWith('avatar-')) {
        return;
      }

      const filePath = path.join(this.getAvatarsDir(), fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Ignore cleanup error if already removed
    }
  }
}
