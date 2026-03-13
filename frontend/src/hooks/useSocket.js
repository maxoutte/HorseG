import { useEffect, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState(null);
  const [signals, setSignals] = useState([]);
  const [oracles, setOracles] = useState([]);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('stats', (data) => setStats(data));
    socket.on('oracles', (data) => setOracles(data));
    socket.on('signal', (data) => {
      setSignals((prev) => [data, ...prev].slice(0, 100));
    });

    return () => disconnectSocket();
  }, []);

  const clearSignals = useCallback(() => setSignals([]), []);

  return { connected, stats, signals, oracles, clearSignals };
}
