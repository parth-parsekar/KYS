import http from 'http';
import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './services/socket.js';
import { startScheduler } from './services/scheduler.js';
import { seedInitialData } from './services/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    await seedInitialData();

    const server = http.createServer(app);
    const io = initSocketServer(server);
    app.set('io', io);
    startScheduler();

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` KYS Backend API listening on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` API Health: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });

    // Graceful shutdown handling
    const shutdown = (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Closing gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP connections terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();

