const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class ZeturfApiService {
  constructor() {
    this.client = axios.create({
      baseURL: config.zeturf.baseUrl,
      timeout: 15000,
      headers: { 'Accept': 'application/json' },
    });
    this.name = 'ZEturf';
  }

  /**
   * Récupère le programme des courses du jour
   */
  async getProgrammeJour(date) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/courses/programme/${dateStr}`);
      return this._normalizeProgramme(response.data, dateStr);
    } catch (error) {
      logger.error('Erreur récupération programme ZEturf', { date: dateStr, error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les détails d'une réunion
   */
  async getReunion(date, reunionNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/courses/reunion/${dateStr}/${reunionNum}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération réunion ZEturf', { date: dateStr, reunion: reunionNum, error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les détails d'une course
   */
  async getCourse(date, reunionNum, courseNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/courses/detail/${dateStr}/${reunionNum}/${courseNum}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération course ZEturf', { date: dateStr, reunion: reunionNum, course: courseNum, error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les participants d'une course
   */
  async getParticipants(date, reunionNum, courseNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/courses/partants/${dateStr}/${reunionNum}/${courseNum}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération participants ZEturf', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les cotes des chevaux
   */
  async getCotes(date, reunionNum, courseNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/courses/cotes/${dateStr}/${reunionNum}/${courseNum}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération cotes ZEturf', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les résultats d'une course terminée
   */
  async getResultats(date, reunionNum, courseNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/courses/resultats/${dateStr}/${reunionNum}/${courseNum}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération résultats ZEturf', { error: error.message });
      throw error;
    }
  }

  /**
   * Normalise la réponse ZEturf au format unifié (compatible PMU)
   */
  _normalizeProgramme(data, dateStr) {
    if (data && data.programme) return data;

    const reunions = (data?.reunions || data?.meetings || []).map((r, i) => ({
      numOfficiel: r.numero || r.num || (i + 1),
      hippodrome: {
        libelleCourt: r.hippodrome || r.lieu || r.track || 'Inconnu',
      },
      disciplinesMere: r.discipline || r.type || '',
      audience: r.audience || '',
      pays: { code: r.pays || r.country || 'FR' },
      courses: (r.courses || r.races || []).map((c, ci) => ({
        numOrdre: c.numero || c.num || (ci + 1),
        libelle: c.libelle || c.nom || c.name || '',
        heureDepart: c.heure || c.heureDepart || c.startTime || null,
        nombreDeclaresPartants: c.partants || c.nbPartants || c.runners || 0,
        distance: c.distance || 0,
      })),
    }));

    return {
      programme: {
        date: dateStr,
        source: 'zeturf',
        reunions,
      },
    };
  }

  _todayStr() {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear()}`;
  }
}

module.exports = new ZeturfApiService();
