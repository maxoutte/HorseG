const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class PmuApiService {
  constructor() {
    this.client = axios.create({
      baseURL: config.pmu.baseUrl,
      timeout: 15000,
      headers: { 'Accept': 'application/json' },
    });
    this.authToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Récupère le programme des courses du jour
   */
  async getProgrammeJour(date) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/programme/${dateStr}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération programme PMU', { date: dateStr, error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les détails d'une réunion
   */
  async getReunion(date, reunionNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/programme/${dateStr}/R${reunionNum}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération réunion', { date: dateStr, reunion: reunionNum, error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les détails d'une course
   */
  async getCourse(date, reunionNum, courseNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/programme/${dateStr}/R${reunionNum}/C${courseNum}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération course', { date: dateStr, reunion: reunionNum, course: courseNum, error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les participants d'une course
   */
  async getParticipants(date, reunionNum, courseNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/programme/${dateStr}/R${reunionNum}/C${courseNum}/participants`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération participants', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les cotes des chevaux
   */
  async getCotes(date, reunionNum, courseNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/programme/${dateStr}/R${reunionNum}/C${courseNum}/pronostics`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération cotes', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les rapports / résultats d'une course terminée
   */
  async getResultats(date, reunionNum, courseNum) {
    const dateStr = date || this._todayStr();
    try {
      const response = await this.client.get(`/programme/${dateStr}/R${reunionNum}/C${courseNum}/rapports-definitifs`);
      return response.data;
    } catch (error) {
      logger.error('Erreur récupération résultats', { error: error.message });
      throw error;
    }
  }

  _todayStr() {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear()}`;
  }
}

module.exports = new PmuApiService();
