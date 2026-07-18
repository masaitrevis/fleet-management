import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

interface SocketResponse extends NextApiResponse {
  socket: any;
}

let io: SocketIOServer | null = null;

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export default function handler(req: any, res: SocketResponse) {
  if (!io) {
    console.log('Initializing Socket.IO server...');
    io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('subscribe', (data: { companyId: string; userId?: string }) => {
        socket.join(`company:${data.companyId}`);
        if (data.userId) {
          socket.join(`user:${data.userId}`);
        }
      });

      socket.on('unsubscribe', (data: { companyId: string; userId?: string }) => {
        socket.leave(`company:${data.companyId}`);
        if (data.userId) {
          socket.leave(`user:${data.userId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
  }

  res.status(200).json({ success: true, message: 'Socket.IO server running' });
}
