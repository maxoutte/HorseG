const pmuApi = require('./pmuApi');
const oracleManager = require('./oracleManager');
const logger = require('../utils/logger');

/**
 * PmuOracle - Oracle automatique basé sur les pronostics PMU.
 *
 * Récupère le programme du jour, analyse les pronostics officiels PMU
 * pour chaque course, et envoie des signaux à l'OracleManager
 * avec les chevaux favoris.
 *
 * Cet oracle sert de source par défaut en attendant que l'utilisateur
 * fournisse ses propres signaux.
 */
class PmuOracle {
  constructor() {
    this.oracle = null;
    this.intervalId = null;
    this.processedRaces = new Set(); // évite les doublons
  }

  /**
   * Démarre l'oracle : s'enregistre et lance le scan périodique
   */
  start(intervalMinutes = 30) {
    if (this.oracle) {
      logger.warn('PmuOracle déjà démarré');
      return this.oracle;
    }

    this.oracle = oracleManager.registerOracle('pmu-pronostics', {
      autoExecute: false,
      confidenceThreshold: 0.5,
      description: 'Oracle automatique basé sur les pronostics officiels PMU',
    });

    logger.info('PmuOracle démarré', { oracleId: this.oracle.id, intervalMinutes });

    // Premier scan immédiat
    this._scan().catch(err => logger.error('PmuOracle scan initial échoué', { error: err.message }));

    // Scan périodique
    this.intervalId = setInterval(() => {
      this._scan().catch(err => logger.error('PmuOracle scan échoué', { error: err.message }));
    }, intervalMinutes * 60 * 1000);

    return this.oracle;
  }

  /**
   * Arrête l'oracle
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.oracle) {
      oracleManager.removeOracle(this.oracle.id);
      this.oracle = null;
    }
    this.processedRaces.clear();
    logger.info('PmuOracle arrêté');
  }

  /**
   * Scan le programme du jour et génère des signaux
   */
  async _scan() {
    if (!this.oracle) return;

    logger.info('PmuOracle: scan des pronostics en cours...');
    const dateStr = this._todayStr();

    let programme;
    try {
      programme = await pmuApi.getProgrammeJour(dateStr);
    } catch (error) {
      logger.error('PmuOracle: impossible de récupérer le programme', { error: error.message });
      return;
    }

    const reunions = programme.programme?.reunions || programme.reunions || [];
    if (reunions.length === 0) {
      logger.info('PmuOracle: aucune réunion trouvée');
      return;
    }

    let signalCount = 0;

    for (const reunion of reunions) {
      const reunionNum = reunion.numOfficiel || reunion.numero;
      const courses = reunion.courses || [];

      for (const course of courses) {
        const courseNum = course.numOrdre || course.numero;
        const raceKey = `${dateStr}-R${reunionNum}-C${courseNum}`;

        // Éviter de traiter deux fois la même course
        if (this.processedRaces.has(raceKey)) continue;

        try {
          const signal = await this._analyzeRace(dateStr, reunionNum, courseNum, course);
          if (signal) {
            await oracleManager.receiveSignal(this.oracle.id, signal);
            this.processedRaces.add(raceKey);
            signalCount++;
          }
        } catch (error) {
          logger.error('PmuOracle: erreur analyse course', { raceKey, error: error.message });
        }
      }
    }

    logger.info(`PmuOracle: scan terminé, ${signalCount} signal(s) émis`);
  }

  /**
   * Analyse une course et retourne un signal si un pronostic est exploitable
   */
  async _analyzeRace(dateStr, reunionNum, courseNum, courseData) {
    // Vérifier que la course n'est pas déjà terminée
    const statut = (courseData.statut || courseData.etat || '').toUpperCase();
    if (['TERMINEE', 'ARRIVEE', 'ANNULEE'].includes(statut)) {
      return null;
    }

    // Récupérer les pronostics PMU
    let pronostics;
    try {
      pronostics = await pmuApi.getCotes(dateStr, reunionNum, courseNum);
    } catch {
      return null;
    }

    // Extraire les chevaux favoris des pronostics PMU
    const selections = this._extractFavorites(pronostics);
    if (!selections || selections.length === 0) return null;

    // Calculer la confiance basée sur la qualité du pronostic
    const confidence = this._computeConfidence(pronostics, selections);

    // Déterminer le type de pari selon le nombre de favoris
    let betType;
    if (selections.length === 1) {
      betType = 'simple_gagnant';
    } else if (selections.length === 2) {
      betType = 'couple_gagnant';
    } else if (selections.length >= 3) {
      betType = 'trio';
    }

    return {
      confidence,
      raceDate: dateStr,
      reunion: reunionNum,
      course: courseNum,
      betType,
      selections: selections.slice(0, 3), // max 3 chevaux
      metadata: {
        source: 'pmu-pronostics-officiels',
        courseName: courseData.libelle || courseData.nom || '',
        heureDepart: courseData.heureDepart || '',
      },
    };
  }

  /**
   * Extrait les numéros des chevaux favoris depuis les pronostics
   */
  _extractFavorites(pronostics) {
    if (!pronostics) return [];

    // Format PMU: pronostics peut contenir un tableau de pronostics
    // avec les chevaux ordonnés par favori
    const pronoList = pronostics.pronostics || pronostics.pronostic || pronostics;

    if (Array.isArray(pronoList)) {
      // Cas: tableau de pronostics avec numeros de chevaux
      const favorites = [];
      for (const p of pronoList) {
        if (p.numParticipant || p.numero) {
          favorites.push(p.numParticipant || p.numero);
        }
        if (favorites.length >= 3) break;
      }
      if (favorites.length > 0) return favorites;
    }

    // Cas: objet avec pronostics PMU nommés (favori, outsider, etc.)
    if (pronoList && typeof pronoList === 'object' && !Array.isArray(pronoList)) {
      const favorites = [];
      const keys = ['favori', 'deuxieme', 'troisieme', 'outsider'];
      for (const key of keys) {
        if (pronoList[key]) {
          const num = pronoList[key].numParticipant || pronoList[key].numero || pronoList[key];
          if (typeof num === 'number') favorites.push(num);
        }
        if (favorites.length >= 3) break;
      }
      if (favorites.length > 0) return favorites;
    }

    // Cas: participants avec cotes — prendre les 3 plus petites cotes
    const participants = pronostics.participants || [];
    if (participants.length > 0) {
      const sorted = [...participants]
        .filter(p => p.coteDirect || p.cote || p.derniereCoteDirect)
        .sort((a, b) => {
          const coteA = a.coteDirect || a.cote || a.derniereCoteDirect || 999;
          const coteB = b.coteDirect || b.cote || b.derniereCoteDirect || 999;
          return coteA - coteB;
        });

      return sorted.slice(0, 3).map(p => p.numParticipant || p.numero);
    }

    return [];
  }

  /**
   * Calcule un score de confiance (0-1)
   */
  _computeConfidence(pronostics, selections) {
    // Base: confiance moyenne
    let confidence = 0.6;

    // Si on a des cotes, un favori avec une cote basse = plus de confiance
    const participants = pronostics.participants || [];
    if (participants.length > 0 && selections.length > 0) {
      const favori = participants.find(
        p => (p.numParticipant || p.numero) === selections[0]
      );
      if (favori) {
        const cote = favori.coteDirect || favori.cote || favori.derniereCoteDirect;
        if (cote) {
          if (cote <= 2) confidence = 0.85;
          else if (cote <= 4) confidence = 0.75;
          else if (cote <= 6) confidence = 0.65;
          else confidence = 0.55;
        }
      }
    }

    return confidence;
  }

  _todayStr() {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear()}`;
  }
}

module.exports = new PmuOracle();
