"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const server = app_1.default.listen(env_1.config.port, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`  🏛️  NEXORA CAMPUS BACKEND ONLINE`);
    console.log(`  🚀 Port:         ${env_1.config.port}`);
    console.log(`  🌐 App URL:      ${env_1.config.appUrl}`);
    console.log(`  💻 Frontend:     ${env_1.config.frontendUrl}`);
    console.log(`  ⚡ Environment:  ${env_1.config.nodeEnv}`);
    console.log(`=========================================`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
exports.default = server;
