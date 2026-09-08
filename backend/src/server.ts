import app from './app';
import { config } from './config/env';

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`  🏛️  NEXORA CAMPUS BACKEND ONLINE`);
  console.log(`  🚀 Port:         ${config.port}`);
  console.log(`  🌐 App URL:      ${config.appUrl}`);
  console.log(`  💻 Frontend:     ${config.frontendUrl}`);
  console.log(`  ⚡ Environment:  ${config.nodeEnv}`);
  console.log(`=========================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default server;
