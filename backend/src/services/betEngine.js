const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');
const pmuApi = require('./pmuApi');

// Types de paris PMU supportés
const BET_TYPES = {
  SIMPLE_GAGNANT: 'simple_gagnant',
  SIMPLE_PLACE: 'simple_place',
  COUPLE_GAGNANT: 'couple_gagnant',
  COUPLE_PLACE: 'couple_place',
  TRIO: 'trio',
  TIERCE: 'tierce',
  QUARTE: 'quarte',
  QUINTE: 'quinte',
};

class BetEngine {
  constructor() {
    this.pendingBets = new Map();
    this.executedBets = [];
    this.dailySpent = 0;
    this.dailyResetDate = this._todayStr();
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
    logger.info('BetEngine activé');
  }

  deactivate() {
    this.isActive = false;
    logger.info('BetEngine désactivé');
  }

  /**
   * Crée un pari à partir d'un signal oracle
   */
  async createBetFromSignal(signal) {
    this._resetDailyIfNeeded();

    if (!this.isActive) {
      logger.warn('BetEngine inactif, pari ignoré', { signal });
      return { status: 'rejected', reason: 'engine_inactive' };
    }

    const amount = signal.amount || config.betting.defaultBetAmount;

    if (amount > config.betting.maxBetAmount) {
      logger.warn('Montant pari dépasse le max', { amount, max: config.betting.maxBetAmount });
      return { status: 'rejected', reason: 'amount_exceeds_max' };
    }

    if (this.dailySpent + amount > config.betting.dailyLossLimit) {
      logger.warn('Limite journalière atteinte', { dailySpent: this.dailySpent, limit: config.betting.dailyLossLimit });
      return { status: 'rejected', reason: 'daily_limit_reached' };
    }

    const bet = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      signal: {
        id: signal.id,
        source: signal.source,
        confidence: signal.confidence,
      },
      race: {
        date: signal.raceDate,
        reunion: signal.reunion,
        course: signal.course,
      },
      type: signal.betType || BET_TYPES.SIMPLE_GAGNANT,
      selections: signal.selections, // ex: [3] pour simple, [3,7] pour couplé
      amount,
      status: 'pending',
      result: null,
    };

    // Validation de la course
    try {
      const courseInfo = await pmuApi.getCourse(bet.race.date, bet.race.reunion, bet.race.course);
      if (!courseInfo) {
        bet.status = 'rejected';
        bet.rejectReason = 'course_not_found';
        this.executedBets.push(bet);
        return bet;
      }
    } catch {
      logger.warn('Impossible de valider la course, pari mis en attente');
    }

    this.pendingBets.set(bet.id, bet);
    logger.info('Pari créé', { betId: bet.id, type: bet.type, amount: bet.amount });

    return bet;
  }

  /**
   * Confirme et "exécute" un pari (en mode simulation pour l'instant)
   */
  async executeBet(betId) {
    const bet = this.pendingBets.get(betId);
    if (!bet) {
      return { status: 'error', reason: 'bet_not_found' };
    }

    this._resetDailyIfNeeded();

    if (this.dailySpent + bet.amount > config.betting.dailyLossLimit) {
      bet.status = 'rejected';
      bet.rejectReason = 'daily_limit_reached';
      this.pendingBets.delete(betId);
      this.executedBets.push(bet);
      return bet;
    }

    // En mode simulation: le pari est "placé"
    bet.status = 'placed';
    bet.placedAt = new Date().toISOString();
    this.dailySpent += bet.amount;

    this.pendingBets.delete(betId);
    this.executedBets.push(bet);

    logger.info('Pari exécuté', { betId: bet.id, status: bet.status, dailySpent: this.dailySpent });

    return bet;
  }

  /**
   * Exécution automatique (sans confirmation manuelle)
   */
  async autoExecuteBet(signal) {
    const bet = await this.createBetFromSignal(signal);
    if (bet.status === 'rejected') return bet;
    return this.executeBet(bet.id);
  }

  cancelBet(betId) {
    const bet = this.pendingBets.get(betId);
    if (!bet) return { status: 'error', reason: 'bet_not_found' };

    bet.status = 'cancelled';
    this.pendingBets.delete(betId);
    this.executedBets.push(bet);
    return bet;
  }

  getPendingBets() {
    return Array.from(this.pendingBets.values());
  }

  getExecutedBets() {
    return this.executedBets;
  }

  getStats() {
    this._resetDailyIfNeeded();
    const placed = this.executedBets.filter(b => b.status === 'placed');
    const won = this.executedBets.filter(b => b.status === 'won');
    const lost = this.executedBets.filter(b => b.status === 'lost');
    const totalWagered = placed.reduce((s, b) => s + b.amount, 0) +
                         won.reduce((s, b) => s + b.amount, 0) +
                         lost.reduce((s, b) => s + b.amount, 0);
    const totalWon = won.reduce((s, b) => s + (b.result?.payout || 0), 0);

    return {
      isActive: this.isActive,
      dailySpent: this.dailySpent,
      dailyLimit: config.betting.dailyLossLimit,
      totalBets: this.executedBets.length,
      pending: this.pendingBets.size,
      placed: placed.length,
      won: won.length,
      lost: lost.length,
      totalWagered,
      totalWon,
      profit: totalWon - totalWagered,
    };
  }

  _resetDailyIfNeeded() {
    const today = this._todayStr();
    if (this.dailyResetDate !== today) {
      this.dailySpent = 0;
      this.dailyResetDate = today;
      logger.info('Reset journalier des dépenses');
    }
  }

  _todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
}

module.exports = { BetEngine: new BetEngine(), BET_TYPES };
