import { v4 as uuidv4 } from 'uuid';
import { getDb, getConfig, auditLog } from '../db';
import { OracleSignal, Bet, Signal, DashboardStats } from '../types';
import { pmuService } from './pmu.service';
import { logger } from './logger';

const STRENGTH_ORDER: Record<string, number> = {
  low: 1, medium: 2, high: 3, critical: 4,
};

export class BettingService {
  async processSignal(signal: OracleSignal, io?: import('socket.io').Server): Promise<{ signalId: string; betId?: string; skipped?: boolean; reason?: string }> {
    const db = getDb();
    const signalId = uuidv4();

    // Enregistrer le signal
    db.prepare(`
      INSERT INTO signals (id, source, payload, received_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(signalId, signal.source, JSON.stringify(signal));

    logger.info('Signal reçu', { signalId, source: signal.source, betType: signal.betType });
    io?.emit('signal:received', { signalId, signal, timestamp: new Date().toISOString() });

    // Vérifications des garde-fous
    const check = await this.checkGuardrails(signal);
    if (!check.ok) {
      db.prepare(`UPDATE signals SET processed = 1, error = ? WHERE id = ?`).run(check.reason, signalId);
      logger.warn('Signal ignoré', { signalId, reason: check.reason });
      io?.emit('signal:skipped', { signalId, reason: check.reason });
      return { signalId, skipped: true, reason: check.reason };
    }

    // Créer le pari
    const betId = uuidv4();
    const raceLabel = `R${signal.race.reunion}/C${signal.race.course} — ${signal.race.date}`;

    db.prepare(`
      INSERT INTO bets (id, signal_id, race, hippodrome, horses, bet_type, amount, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).run(
      betId,
      signalId,
      raceLabel,
      signal.race.hippodrome ?? 'Inconnu',
      JSON.stringify(signal.horses),
      signal.betType,
      signal.amount
    );

    db.prepare(`UPDATE signals SET processed = 1, bet_id = ? WHERE id = ?`).run(betId, signalId);
    auditLog('BET_CREATED', 'bet', betId, { signal });
    io?.emit('bet:created', { betId, signal, timestamp: new Date().toISOString() });

    // Placer le pari (ou simuler)
    const autoPlace = getConfig('auto_place_bets') === 'true';
    if (autoPlace) {
      await this.executeBet(betId, signal, io);
    } else {
      logger.info('Pari en attente de validation manuelle', { betId });
      io?.emit('bet:pending_approval', { betId, raceLabel, signal });
    }

    return { signalId, betId };
  }

  async executeBet(betId: string, signal: OracleSignal, io?: import('socket.io').Server): Promise<void> {
    const db = getDb();

    try {
      db.prepare(`UPDATE bets SET status = 'placed', updated_at = datetime('now') WHERE id = ?`).run(betId);
      io?.emit('bet:placing', { betId });

      const result = await pmuService.placeBet(signal);

      if (result.success) {
        db.prepare(`
          UPDATE bets SET status = 'placed', pmu_bet_id = ?, updated_at = datetime('now') WHERE id = ?
        `).run(result.betId ?? null, betId);
        auditLog('BET_PLACED', 'bet', betId, { pmuBetId: result.betId });
        io?.emit('bet:placed', { betId, pmuBetId: result.betId, simulation: result.details });
        logger.info('Pari placé avec succès', { betId, pmuBetId: result.betId });
      } else {
        db.prepare(`
          UPDATE bets SET status = 'error', error = ?, updated_at = datetime('now') WHERE id = ?
        `).run(result.error, betId);
        io?.emit('bet:error', { betId, error: result.error });
        logger.error('Échec du placement', { betId, error: result.error });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      db.prepare(`UPDATE bets SET status = 'error', error = ?, updated_at = datetime('now') WHERE id = ?`).run(msg, betId);
      io?.emit('bet:error', { betId, error: msg });
      logger.error('Exception lors du placement', { betId, error: msg });
    }
  }

  private async checkGuardrails(signal: OracleSignal): Promise<{ ok: boolean; reason?: string }> {
    const db = getDb();

    // Paris activés ?
    const bettingEnabled = getConfig('betting_enabled') === 'true';
    if (!bettingEnabled) {
      return { ok: false, reason: 'Paris désactivés dans la configuration' };
    }

    // Montant max
    const maxBet = parseFloat(getConfig('max_bet_amount') ?? '50');
    if (signal.amount > maxBet) {
      return { ok: false, reason: `Montant ${signal.amount}€ supérieur au maximum autorisé (${maxBet}€)` };
    }

    // Force du signal
    const minStrength = getConfig('min_signal_strength') ?? 'medium';
    if (STRENGTH_ORDER[signal.strength] < STRENGTH_ORDER[minStrength]) {
      return { ok: false, reason: `Force du signal "${signal.strength}" insuffisante (minimum: ${minStrength})` };
    }

    // Limite journalière
    const dailyLimit = parseFloat(getConfig('daily_limit') ?? '200');
    const todayStaked = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM bets
      WHERE date(created_at) = date('now')
      AND status NOT IN ('cancelled', 'error')
    `).get() as { total: number };

    if ((todayStaked.total + signal.amount) > dailyLimit) {
      return { ok: false, reason: `Limite journalière atteinte (${todayStaked.total}€ / ${dailyLimit}€)` };
    }

    return { ok: true };
  }

  async updateBetResult(betId: string, result: 'won' | 'lost', gain?: number): Promise<void> {
    const db = getDb();
    db.prepare(`
      UPDATE bets SET status = ?, result = ?, gain = ?, updated_at = datetime('now') WHERE id = ?
    `).run(result, result, gain ?? null, betId);
    auditLog('BET_RESULT', 'bet', betId, { result, gain });
    logger.info('Résultat enregistré', { betId, result, gain });
  }

  getBets(limit = 50, offset = 0): Bet[] {
    const db = getDb();
    return db.prepare(`
      SELECT id, signal_id as signalId, race, hippodrome, horses, bet_type as betType,
             amount, status, pmu_bet_id as pmuBetId, result, gain, error,
             created_at as createdAt, updated_at as updatedAt
      FROM bets ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset) as Bet[];
  }

  getSignals(limit = 50, offset = 0): Signal[] {
    const db = getDb();
    return db.prepare(`
      SELECT id, source, payload, processed, bet_id as betId, error, received_at as receivedAt
      FROM signals ORDER BY received_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset) as Signal[];
  }

  getStats(): DashboardStats {
    const db = getDb();
    const all = db.prepare(`SELECT status, amount, gain FROM bets`).all() as Array<{ status: string; amount: number; gain: number | null }>;
    const today = db.prepare(`SELECT status, amount FROM bets WHERE date(created_at) = date('now')`).all() as Array<{ status: string; amount: number }>;

    const totalBets = all.length;
    const wonBets = all.filter(b => b.status === 'won').length;
    const lostBets = all.filter(b => b.status === 'lost').length;
    const pendingBets = all.filter(b => ['pending', 'placed'].includes(b.status)).length;
    const totalStaked = all.reduce((s, b) => s + (b.amount || 0), 0);
    const totalGain = all.reduce((s, b) => s + (b.gain || 0), 0);

    return {
      totalBets,
      pendingBets,
      wonBets,
      lostBets,
      totalStaked,
      totalGain,
      roi: totalStaked > 0 ? Math.round(((totalGain - totalStaked) / totalStaked) * 100) : 0,
      todayBets: today.length,
      todayStaked: today.reduce((s, b) => s + (b.amount || 0), 0),
    };
  }
}

export const bettingService = new BettingService();
