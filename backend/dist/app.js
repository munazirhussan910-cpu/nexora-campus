"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const request_routes_1 = __importDefault(require("./routes/request.routes"));
const complaint_routes_1 = __importDefault(require("./routes/complaint.routes"));
const gatepass_routes_1 = __importDefault(require("./routes/gatepass.routes"));
const bonafide_routes_1 = __importDefault(require("./routes/bonafide.routes"));
const leave_routes_1 = __importDefault(require("./routes/leave.routes"));
const notice_routes_1 = __importDefault(require("./routes/notice.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const verify_routes_1 = __importDefault(require("./routes/verify.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const kiosk_routes_1 = __importDefault(require("./routes/kiosk.routes"));
const integration_routes_1 = __importDefault(require("./routes/integration.routes"));
const app = (0, express_1.default)();
// Security & Parsing Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: [env_1.config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Static storage folder for generated PDFs and uploaded files
if (!fs_1.default.existsSync(env_1.config.storageDir)) {
    fs_1.default.mkdirSync(env_1.config.storageDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(env_1.config.storageDir));
// System Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        platform: 'Nexora Campus Operations Engine',
        timestamp: new Date(),
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/requests', request_routes_1.default);
app.use('/api/complaints', complaint_routes_1.default);
app.use('/api/gate-passes', gatepass_routes_1.default);
app.use('/api/bonafide', bonafide_routes_1.default);
app.use('/api/leaves', leave_routes_1.default);
app.use('/api/notices', notice_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/verify', verify_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/kiosk', kiosk_routes_1.default);
app.use('/api/integrations', integration_routes_1.default);
// Centralized Error Handling
app.use(error_middleware_1.errorHandler);
exports.default = app;
