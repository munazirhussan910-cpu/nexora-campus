"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '5001', 10),
    jwtSecret: process.env.JWT_SECRET || 'nexora-campus-secret-key-2026-bput-hackathon',
    appUrl: process.env.APP_URL || 'http://localhost:5001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    storageDir: process.env.STORAGE_DIR || path_1.default.resolve(__dirname, '../../uploads'),
    nodeEnv: process.env.NODE_ENV || 'development',
};
