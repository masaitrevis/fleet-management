import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setSocketServer(socketIo: SocketIOServer): void {
  io = socketIo;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function emitToCompany(companyId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`company:${companyId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  if (!io) return;
  io.emit(event, data);
}
