import { Router } from 'express';
import { bettingService } from '../services/betting.service';
import { getDb } from '../db';
import { OracleSignal } from '../types';
import { Server } from 'socket.io';

const router = Router();

export function createBetsRouter(io: Server) {
  // GET /api/bets — liste des paris
  router.get('/', (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit ?? '50')), 200);
    const offset = parseInt(String(req.query.offset ?? '0'));
    const bets = bettingService.getBets(limit, offset);
    res.json({ bets, total: bets.length });
  });

  // GET /api/bets/stats — statistiques globales
  router.get('/stats', (req, res) => {
    const stats = bettingService.getStats();
    res.json(stats);
  });

  // GET /api/bets/:id — détail d'un pari
  router.get('/:id', (req, res) => {
    const db = getDb();
    const bet = db.prepare(`
      SELECT id, signal_id as signalId, race, hippodrome, horses, bet_type as betType,
             amount, status, pmu_bet_id as pmuBetId, result, gain, error,
             created_at as createdAt, updated_at as updatedAt
      FROM bets WHERE id = ?
    `).get(req.params.id);

    if (!bet) {
      res.status(404).json({ error: 'Pari introuvable' });
      return;
    }
    res.json(bet);
  });

  // POST /api/bets/:id/execute — placer manuellement un pari en attente
  router.post('/:id/execute', async (req, res) => {
    const db = getDb();
    const bet = db.prepare(`SELECT * FROM bets WHERE id = ?`).get(req.params.id) as {
      id: string; signal_id: string; status: string; bet_type: string;
      amount: number; horses: string; race: string;
    } | undefined;

    if (!bet) {
      res.status(404).json({ error: 'Pari introuvable' });
      return;
    }
    if (bet.status !== 'pending') {
      res.status(400).json({ error: `Pari déjà en statut "${bet.status}"` });
      return;
    }

    const signal = db.prepare(`SELECT payload FROM signals WHERE id = ?`).get(bet.signal_id) as { payload: string } | undefined;
    if (!signal) {
      res.status(404).json({ error: 'Signal source introuvable' });
      return;
    }

    const originalSignal: OracleSignal = JSON.parse(signal.payload);
    await bettingService.executeBet(bet.id, originalSignal, io);
    res.json({ ok: true, message: 'Pari en cours de placement' });
  });

  // PATCH /api/bets/:id/result — enregistrer le résultat
  router.patch('/:id/result', async (req, res) => {
    const { result, gain } = req.body as { result: 'won' | 'lost'; gain?: number };
    if (!['won', 'lost'].includes(result)) {
      res.status(400).json({ error: 'result doit être "won" ou "lost"' });
      return;
    }
    await bettingService.updateBetResult(req.params.id, result, gain);
    io.emit('bet:result', { betId: req.params.id, result, gain });
    res.json({ ok: true });
  });

  return router;
}
