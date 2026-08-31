// communityos-frontend/src/services/socket.js
import io from 'socket.io-client';

let socket = null;

export function initSocket(token, user) {
  if (socket) return socket;

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    // fallback: send identity after connect so server maps this socket to a user
    if (user?.id) {
      socket.emit('auth', { userId: user.id, tenantId: user.tenantId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
}

export function getSocket() { return socket; }

export function closeSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export function joinOrder(orderId) { if (socket) socket.emit('join:order', orderId); }
export function joinProvider(providerId) { if (socket) socket.emit('join:provider', providerId); }
export function joinCommunity(communityId) { if (socket) socket.emit('join:community', communityId); }
