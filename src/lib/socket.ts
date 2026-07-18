import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from '@/modules/auth/utils/jwt';

export interface SocketServerOptions {
  path?: string;
  cors?: {
    origin: string | string[];
    methods: string[];
  };
}

let io: SocketIOServer | null = null;

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function initSocketIO(server: NetServer, options: SocketServerOptions = {}) {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: options.path || '/api/socket',
    cors: options.cors || {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication token required'));
      }
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      socket.data.companyId = payload.cid;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const companyId = socket.data.companyId;
    if (companyId) {
      socket.join(`company:${companyId}`);
    }

    socket.on('disconnect', () => {
      // cleanup if needed
    });
  });

  return io;
}

export function emitToCompany(companyId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`company:${companyId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown) {
  if (!io) return;
  io.emit(event, data);
}
