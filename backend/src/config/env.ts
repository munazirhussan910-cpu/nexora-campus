import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  jwtSecret: process.env.JWT_SECRET || 'nexora-campus-secret-key-2026-bput-hackathon',
  appUrl: process.env.APP_URL || 'http://localhost:5001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  storageDir: process.env.STORAGE_DIR || path.resolve(__dirname, '../../uploads'),
  nodeEnv: process.env.NODE_ENV || 'development',
};
