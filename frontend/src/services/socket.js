import { io } from 'socket.io-client';

// Se connecter au même host que la page (fonctionne quel que soit le port)
const SOCKET_URL = process.env.REACT_APP_WS_URL || window.location.origin;

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
