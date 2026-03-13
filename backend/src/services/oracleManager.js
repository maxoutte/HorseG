const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * OracleManager gère les sources de signaux (oracles) qui déclenchent les paris.
 *
 * Un oracle est une source externe qui envoie des signaux contenant:
 * - La course ciblée (date, réunion, course)
 * - Les chevaux sélectionnés
 * - Le type de pari recommandé
 * - Un niveau de confiance
 * - Optionnellement un montant
 *
 * Format attendu d'un signal:
 * {
 *   source: "oracle-name",
 *   confidence: 0.85,          // 0-1
 *   raceDate: "13032026",      // format PMU ddMMyyyy
 *   reunion: 1,
 *   course: 3,
 *   betType: "simple_gagnant",
 *   selections: [5],           // numéros de chevaux
 *   amount: 10,                // optionnel
 *   metadata: {}               // données supplémentaires de l'oracle
 * }
 */
class OracleManager {
  constructor() {
    this.oracles = new Map();
    this.signalHistory = [];
    this.signalHandlers = [];
    this.filters = {
      minConfidence: 0.6,
      allowedBetTypes: null, // null = tous
      maxAmount: null,       // null = utilise config
    };
  }

  /**
   * Enregistre un nouvel oracle
   */
  registerOracle(name, config = {}) {
    const oracle = {
      id: uuidv4(),
      name,
      enabled: true,
      registeredAt: new Date().toISOString(),
      signalCount: 0,
      lastSignal: null,
      config: {
        autoExecute: config.autoExecute || false,
        confidenceThreshold: config.confidenceThreshold || this.filters.minConfidence,
        ...config,
      },
    };
    this.oracles.set(oracle.id, oracle);
    logger.info('Oracle enregistré', { oracleId: oracle.id, name });
    return oracle;
  }

  /**
   * Supprime un oracle
   */
  removeOracle(oracleId) {
    const removed = this.oracles.delete(oracleId);
    if (removed) logger.info('Oracle supprimé', { oracleId });
    return removed;
  }

  /**
   * Active/désactive un oracle
   */
  toggleOracle(oracleId, enabled) {
    const oracle = this.oracles.get(oracleId);
    if (!oracle) return null;
    oracle.enabled = enabled;
    logger.info(`Oracle ${enabled ? 'activé' : 'désactivé'}`, { oracleId });
    return oracle;
  }

  /**
   * Reçoit un signal d'un oracle
   */
  async receiveSignal(oracleId, signalData) {
    const oracle = this.oracles.get(oracleId);
    if (!oracle) {
      logger.warn('Signal reçu d\'un oracle inconnu', { oracleId });
      return { status: 'rejected', reason: 'unknown_oracle' };
    }

    if (!oracle.enabled) {
      logger.warn('Signal reçu d\'un oracle désactivé', { oracleId });
      return { status: 'rejected', reason: 'oracle_disabled' };
    }

    const signal = {
      id: uuidv4(),
      oracleId,
      oracleName: oracle.name,
      receivedAt: new Date().toISOString(),
      ...signalData,
      source: oracle.name,
    };

    // Validation du signal
    const validation = this._validateSignal(signal, oracle);
    if (!validation.valid) {
      signal.status = 'filtered';
      signal.filterReason = validation.reason;
      this.signalHistory.push(signal);
      logger.info('Signal filtré', { signalId: signal.id, reason: validation.reason });
      return { status: 'filtered', reason: validation.reason, signal };
    }

    signal.status = 'accepted';
    oracle.signalCount++;
    oracle.lastSignal = signal.receivedAt;
    this.signalHistory.push(signal);

    // Notifier les handlers
    for (const handler of this.signalHandlers) {
      try {
        await handler(signal, oracle);
      } catch (error) {
        logger.error('Erreur handler signal', { error: error.message });
      }
    }

    logger.info('Signal accepté', { signalId: signal.id, oracle: oracle.name });
    return { status: 'accepted', signal };
  }

  /**
   * Enregistre un handler pour les signaux acceptés
   */
  onSignal(handler) {
    this.signalHandlers.push(handler);
  }

  /**
   * Met à jour les filtres globaux
   */
  setFilters(filters) {
    Object.assign(this.filters, filters);
    logger.info('Filtres mis à jour', { filters: this.filters });
  }

  getOracles() {
    return Array.from(this.oracles.values());
  }

  getSignalHistory(limit = 50) {
    return this.signalHistory.slice(-limit);
  }

  _validateSignal(signal, oracle) {
    if (!signal.raceDate || !signal.reunion || !signal.course) {
      return { valid: false, reason: 'missing_race_info' };
    }
    if (!signal.selections || !Array.isArray(signal.selections) || signal.selections.length === 0) {
      return { valid: false, reason: 'missing_selections' };
    }
    const threshold = oracle.config.confidenceThreshold || this.filters.minConfidence;
    if (signal.confidence !== undefined && signal.confidence < threshold) {
      return { valid: false, reason: `confidence_too_low (${signal.confidence} < ${threshold})` };
    }
    if (this.filters.allowedBetTypes && signal.betType && !this.filters.allowedBetTypes.includes(signal.betType)) {
      return { valid: false, reason: 'bet_type_not_allowed' };
    }
    return { valid: true };
  }
}

module.exports = new OracleManager();
