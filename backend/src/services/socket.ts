import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;
const JWT_SECRET = process.env.JWT_SECRET || 'kys_super_secret_jwt_key_2026';

export function initSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      // Allow unauthenticated connection but without private rooms
      return next();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email?: string; name?: string };
      socket.data.userId = decoded.id;
      socket.data.role = decoded.role;
      socket.data.email = decoded.email;
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role || 'guest';
    const email = socket.data.email || 'anonymous';
    
    // Log successful client connection
    console.log(`[Socket.IO] Client connected: socket_id=${socket.id} | user_id=${userId || 'unauthenticated'} | email=${email} | role=${role}`);

    if (userId) {
      socket.join(`user:${userId}`);
      if (role === 'admin') {
        socket.join('room:admin');
      }
    }

    socket.on('join_user_room', (token: string) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email?: string };
        socket.data.userId = decoded.id;
        socket.data.role = decoded.role;
        socket.data.email = decoded.email;
        socket.join(`user:${decoded.id}`);
        if (decoded.role === 'admin') {
          socket.join('room:admin');
        }
        console.log(`[Socket.IO] Authenticated socket ${socket.id} for user ${decoded.id} (${decoded.role})`);
        socket.emit('authenticated', { success: true, userId: decoded.id });
      } catch {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', (reason: string) => {
      // Log successful client disconnection
      console.log(`[Socket.IO] Client disconnected: socket_id=${socket.id} | user_id=${socket.data.userId || 'anonymous'} | reason=${reason}`);
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

export function sendNotificationToAllUsers(notification: any): void {
  if (io) {
    io.emit('notification:new', notification);
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
