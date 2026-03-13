import { Router } from 'express';
import { z } from 'zod';
import { bettingService } from '../services/betting.service';
import { apiKeyAuth } from '../middleware/auth';
import { OracleSignal } from '../types';
import { Server } from 'socket.io';

const router = Router();

const SignalSchema = z.object({
  source: z.string().min(1),
  race: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
    reunion: z.number().int().min(1),
    course: z.number().int().min(1),
    hippodrome: z.string().optional(),
  }),
  horses: z.array(z.number().int().min(1)).min(1).max(20),
  betType: z.enum(['simple_gagnant', 'simple_place', 'couple', 'tierce', 'quarte', 'quinte', 'multi']),
  amount: z.number().positive().max(500),
  strength: z.enum(['low', 'medium', 'high', 'critical']),
  metadata: z.record(z.unknown()).optional(),
});

export function createSignalRouter(io: Server) {
  // POST /api/signals — recevoir un signal de l'oracle
  router.post('/', apiKeyAuth, async (req, res) => {
    const parsed = SignalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Signal invalide', details: parsed.error.flatten() });
      return;
    }

    const signal: OracleSignal = { ...parsed.data, timestamp: new Date().toISOString() };

    try {
      const result = await bettingService.processSignal(signal, io);
      res.status(201).json({
        ok: true,
        ...result,
        message: result.skipped
          ? `Signal ignoré: ${result.reason}`
          : `Signal traité — pari ${result.betId} créé`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur interne';
      res.status(500).json({ error: msg });
    }
  });

  // GET /api/signals — historique des signaux
  router.get('/', async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit ?? '50')), 200);
    const offset = parseInt(String(req.query.offset ?? '0'));
    const signals = bettingService.getSignals(limit, offset);
    res.json({ signals, total: signals.length });
  });

  return router;
}
