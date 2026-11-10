import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;
const JWT_SECRET = process.env.JWT_SECRET || 'kys_super_secret_jwt_key_2026';

export function initSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      // Allow unauthenticated connection but without private rooms
      return next();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      socket.data.userId = decoded.id;
      socket.data.role = decoded.role;
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      if (socket.data.role === 'admin') {
        socket.join('room:admin');
      }
    }

    socket.on('join_user_room', (token: string) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
        socket.data.userId = decoded.id;
        socket.data.role = decoded.role;
        socket.join(`user:${decoded.id}`);
        if (decoded.role === 'admin') {
          socket.join('room:admin');
        }
        socket.emit('authenticated', { success: true, userId: decoded.id });
      } catch {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', () => {
      // disconnected
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function sendNotificationToUser(userId: string, notification: any): void {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
}

export function sendBudgetAlert(userId: string, alertData: any): void {
  if (io) {
    io.to(`user:${userId}`).emit('budget:alert', alertData);
  }
}

export function sendSubscriptionUpdate(userId: string, subData: any): void {
  if (io) {
    io.to(`user:${userId}`).emit('subscription:updated', subData);
  }
}
