import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import requestRoutes from './routes/request.routes';
import complaintRoutes from './routes/complaint.routes';
import gatepassRoutes from './routes/gatepass.routes';
import bonafideRoutes from './routes/bonafide.routes';
import leaveRoutes from './routes/leave.routes';
import noticeRoutes from './routes/notice.routes';
import notificationRoutes from './routes/notification.routes';
import verifyRoutes from './routes/verify.routes';
import adminRoutes from './routes/admin.routes';
import kioskRoutes from './routes/kiosk.routes';
import integrationRoutes from './routes/integration.routes';

const app: Express = express();

// Security & Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static storage folder for generated PDFs and uploaded files
if (!fs.existsSync(config.storageDir)) {
  fs.mkdirSync(config.storageDir, { recursive: true });
}
app.use('/uploads', express.static(config.storageDir));

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    platform: 'Nexora Campus Operations Engine',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/gate-passes', gatepassRoutes);
app.use('/api/bonafide', bonafideRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/integrations', integrationRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;
