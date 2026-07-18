import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseNotificationsSocketOptions {
  companyId: string;
  userId?: string;
  onNewNotification?: (data: any) => void;
  onNotificationRead?: (data: any) => void;
  onNotificationDeleted?: (data: any) => void;
  onSystemAlert?: (data: any) => void;
}

export function useNotificationsSocket(options: UseNotificationsSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({
      path: '/api/socket',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('subscribe', { companyId: options.companyId, userId: options.userId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('notification:new', (data) => {
      options.onNewNotification?.(data);
    });

    socket.on('notification:read', (data) => {
      options.onNotificationRead?.(data);
    });

    socket.on('notification:deleted', (data) => {
      options.onNotificationDeleted?.(data);
    });

    socket.on('system:alert', (data) => {
      options.onSystemAlert?.(data);
    });

    return () => {
      socket.emit('unsubscribe', { companyId: options.companyId, userId: options.userId });
      socket.disconnect();
    };
  }, [options.companyId, options.userId]);

  return socketRef.current;
}

export default useNotificationsSocket;
