import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token, url = import.meta.env.VITE_API_URL || 'http://localhost:3000') {
  if (socket) return socket;
  socket = io(url, {
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function getSocket() {
  return socket;
}