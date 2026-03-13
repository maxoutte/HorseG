import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function useSocket() {
  const { setConnected, setStats, upsertBet, prependSignal, pushEvent } = useStore();

  useEffect(() => {
    if (socket) return;

    socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setConnected(true);
      pushEvent('connect', 'Connecté au serveur');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      pushEvent('disconnect', 'Déconnecté du serveur');
    });

    socket.on('stats:update', (stats) => {
      setStats(stats);
    });

    socket.on('signal:received', ({ signalId, signal, timestamp }) => {
      pushEvent('signal', `Signal reçu de "${signal.source}" — ${signal.betType} sur R${signal.race.reunion}/C${signal.race.course}`, signal);
      prependSignal({
        id: signalId,
        source: signal.source,
        payload: JSON.stringify(signal),
        processed: false,
        receivedAt: timestamp,
      });
      toast('Signal reçu', { icon: '📡', duration: 3000 });
    });

    socket.on('signal:skipped', ({ signalId, reason }) => {
      pushEvent('warning', `Signal ignoré: ${reason}`);
      toast.error(`Signal ignoré: ${reason}`, { duration: 5000 });
    });

    socket.on('bet:created', ({ betId, signal }) => {
      pushEvent('bet', `Pari créé — ${signal.betType} sur ${signal.race.hippodrome ?? 'course inconnue'}`);
    });

    socket.on('bet:placing', ({ betId }) => {
      upsertBet({ id: betId, status: 'placed' });
      pushEvent('placing', `Placement en cours pour le pari ${betId.slice(0, 8)}...`);
    });

    socket.on('bet:placed', ({ betId, pmuBetId, simulation }) => {
      upsertBet({ id: betId, status: 'placed', pmuBetId });
      const msg = simulation
        ? `Pari simulé (${pmuBetId})`
        : `Pari placé sur PMU — réf: ${pmuBetId}`;
      pushEvent('success', msg);
      toast.success(simulation ? '🎭 Simulation OK' : '✅ Pari placé !');
    });

    socket.on('bet:error', ({ betId, error }) => {
      upsertBet({ id: betId, status: 'error', error });
      pushEvent('error', `Erreur sur pari ${betId.slice(0, 8)}: ${error}`);
      toast.error(`Erreur: ${error}`, { duration: 6000 });
    });

    socket.on('bet:result', ({ betId, result, gain }) => {
      upsertBet({ id: betId, status: result, gain, result });
      const msg = result === 'won' ? `Pari gagné ! +${gain}€` : 'Pari perdu';
      pushEvent(result, msg);
      if (result === 'won') toast.success(msg, { duration: 5000 });
    });

    socket.on('bet:pending_approval', ({ betId, raceLabel }) => {
      pushEvent('pending', `Pari en attente d'approbation: ${raceLabel}`);
      toast(`Pari en attente de validation`, { icon: '⏳', duration: 5000 });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);
}
