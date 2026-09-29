// ============================================================
// OptiGrid — Socket.IO Client Service
// Falls back gracefully if backend is unavailable
// ============================================================

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = () => {
  // Lazy import to avoid crashing if socket.io-client not loaded
  try {
    const { io } = require('socket.io-client');
    socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    return socket;
  } catch (e) {
    console.warn('[Socket] socket.io-client unavailable, running in mock mode');
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
