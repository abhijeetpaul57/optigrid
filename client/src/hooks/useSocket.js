import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket(simulationId) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      if (simulationId) {
        newSocket.emit('join_simulation', simulationId);
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      if (simulationId) {
        newSocket.emit('leave_simulation', simulationId);
      }
      newSocket.disconnect();
    };
  }, [simulationId]);

  return { socket, connected };
}
