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
    initSocketServer(server);
    startScheduler();

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` KYS Backend API listening on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` API Health: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();
