const axios = require('axios');
const cheerio = require('cheerio');
const oracleManager = require('./oracleManager');
const logger = require('../utils/logger');

/**
 * TurfooOracle - Oracle basé sur les pronostics de Turfoo.fr
 *
 * Scrape les pronostics quotidiens de Turfoo (tiercé, quarté, quinté)
 * et génère des signaux pour l'OracleManager.
 */
class TurfooOracle {
  constructor() {
    this.oracle = null;
    this.intervalId = null;
    this.processedUrls = new Set();
    this.baseUrl = 'https://www.turfoo.fr';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });
  }

  /**
   * Démarre l'oracle Turfoo
   */
  start(intervalMinutes = 60) {
    if (this.oracle) {
      logger.warn('TurfooOracle déjà démarré');
      return this.oracle;
    }

    this.oracle = oracleManager.registerOracle('turfoo-pronostics', {
      autoExecute: false,
      confidenceThreshold: 0.5,
      description: 'Oracle basé sur les pronostics Turfoo.fr',
    });

    logger.info('TurfooOracle démarré', { oracleId: this.oracle.id, intervalMinutes });

    // Premier scan après un court délai (éviter de surcharger au démarrage)
    setTimeout(() => {
      this._scan().catch(err => logger.error('TurfooOracle scan initial échoué', { error: err.message }));
    }, 5000);

    // Scan périodique
    this.intervalId = setInterval(() => {
      this._scan().catch(err => logger.error('TurfooOracle scan échoué', { error: err.message }));
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
    this.processedUrls.clear();
    logger.info('TurfooOracle arrêté');
  }

  /**
   * Scan les pages de pronostics Turfoo
   */
  async _scan() {
    if (!this.oracle) return;

    logger.info('TurfooOracle: scan des pronostics en cours...');

    const pages = [
      '/pronostics-pmu/tierce/',
      '/pronostics-pmu/quarte/',
      '/pronostics-pmu/quinte/',
    ];

    let signalCount = 0;

    for (const page of pages) {
      try {
        const signals = await this._scrapePage(page);
        for (const signal of signals) {
          const key = `${signal.raceDate}-R${signal.reunion}-C${signal.course}-${page}`;
          if (this.processedUrls.has(key)) continue;

          await oracleManager.receiveSignal(this.oracle.id, signal);
          this.processedUrls.add(key);
          signalCount++;
        }
      } catch (error) {
        logger.error(`TurfooOracle: erreur scraping ${page}`, { error: error.message });
      }
    }

    logger.info(`TurfooOracle: scan terminé, ${signalCount} signal(s) émis`);
  }

  /**
   * Scrape une page de pronostics Turfoo
   */
  async _scrapePage(pagePath) {
    const response = await this.client.get(pagePath);
    const $ = cheerio.load(response.data);
    const signals = [];
    const dateStr = this._todayStr();

    // Turfoo structure: les pronostics sont dans des blocs de course
    // On cherche les sélections de chevaux dans différents formats possibles

    // Chercher les blocs de pronostics
    const pronoBlocks = $('.prono-block, .pronostic, .course-prono, .race-prono, .tipster-pick, article.prono');

    if (pronoBlocks.length > 0) {
      pronoBlocks.each((_, block) => {
        const signal = this._parsePronoBlock($, $(block), dateStr, pagePath);
        if (signal) signals.push(signal);
      });
    }

    // Si aucun bloc structuré trouvé, tenter une extraction plus générique
    if (signals.length === 0) {
      const genericSignal = this._parseGenericPage($, dateStr, pagePath);
      if (genericSignal) signals.push(genericSignal);
    }

    return signals;
  }

  /**
   * Parse un bloc de pronostic structuré
   */
  _parsePronoBlock($, block, dateStr, pagePath) {
    // Extraire les numéros de chevaux
    const selections = [];

    // Chercher les numéros dans différents formats
    block.find('.numero, .horse-number, .num, .cheval-num, .runner-number, [class*="numero"]').each((_, el) => {
      const num = parseInt($(el).text().trim(), 10);
      if (num > 0 && num < 30 && !selections.includes(num)) {
        selections.push(num);
      }
    });

    // Essayer aussi les data-attributes
    if (selections.length === 0) {
      block.find('[data-numero], [data-num], [data-horse]').each((_, el) => {
        const num = parseInt($(el).attr('data-numero') || $(el).attr('data-num') || $(el).attr('data-horse'), 10);
        if (num > 0 && num < 30 && !selections.includes(num)) {
          selections.push(num);
        }
      });
    }

    if (selections.length === 0) return null;

    // Extraire les infos de course si disponibles
    const raceInfo = this._extractRaceInfo($, block);

    return {
      confidence: 0.65,
      raceDate: dateStr,
      reunion: raceInfo.reunion || 1,
      course: raceInfo.course || 1,
      betType: this._betTypeFromPath(pagePath),
      selections: selections.slice(0, 5),
      metadata: {
        source: 'turfoo',
        page: pagePath,
        courseName: raceInfo.name || '',
      },
    };
  }

  /**
   * Parse une page en mode générique (texte brut)
   */
  _parseGenericPage($, dateStr, pagePath) {
    const selections = [];

    // Stratégie 1: chercher les numéros dans le contenu principal
    const mainContent = $('.content, .main, .article-content, .prono-content, main, .entry-content').first();
    const contentEl = mainContent.length ? mainContent : $('body');

    // Chercher les patterns "N°X" ou "numéro X" ou juste des listes de chiffres
    const text = contentEl.text();

    // Pattern: "Base : 5" ou "Base: 5 - 12 - 3"
    const baseMatch = text.match(/[Bb]ase\s*[:]\s*([\d\s\-–,]+)/);
    if (baseMatch) {
      const nums = baseMatch[1].match(/\d+/g);
      if (nums) {
        nums.forEach(n => {
          const num = parseInt(n, 10);
          if (num > 0 && num < 30 && !selections.includes(num)) selections.push(num);
        });
      }
    }

    // Pattern: "Outsider : 7" ou "Tocard : 14"
    const outsiderMatch = text.match(/[Oo]utsider\s*[:]\s*([\d\s\-–,]+)/);
    if (outsiderMatch) {
      const nums = outsiderMatch[1].match(/\d+/g);
      if (nums) {
        nums.forEach(n => {
          const num = parseInt(n, 10);
          if (num > 0 && num < 30 && !selections.includes(num)) selections.push(num);
        });
      }
    }

    // Pattern: "Pronostic : 5 - 12 - 3 - 8 - 1" ou séparés par tirets
    const pronoMatch = text.match(/[Pp]ronostic[s]?\s*[:]\s*([\d\s\-–,]+)/);
    if (pronoMatch) {
      const nums = pronoMatch[1].match(/\d+/g);
      if (nums) {
        nums.forEach(n => {
          const num = parseInt(n, 10);
          if (num > 0 && num < 30 && !selections.includes(num)) selections.push(num);
        });
      }
    }

    // Pattern: liste séparée par tirets dans les titres (ex: "5 - 12 - 3 - 8 - 1")
    if (selections.length === 0) {
      $('h1, h2, h3, .titre, .title').each((_, el) => {
        const titleText = $(el).text();
        const dashNums = titleText.match(/(\d+\s*[-–]\s*){2,}\d+/);
        if (dashNums) {
          const nums = dashNums[0].match(/\d+/g);
          if (nums) {
            nums.forEach(n => {
              const num = parseInt(n, 10);
              if (num > 0 && num < 30 && !selections.includes(num)) selections.push(num);
            });
          }
        }
      });
    }

    // Pattern: chercher des listes ordonnées de chevaux (ol > li)
    if (selections.length === 0) {
      $('ol li, .selection li, .picks li').each((_, el) => {
        const liText = $(el).text().trim();
        const numMatch = liText.match(/^(\d+)/);
        if (numMatch) {
          const num = parseInt(numMatch[1], 10);
          if (num > 0 && num < 30 && !selections.includes(num)) selections.push(num);
        }
      });
    }

    if (selections.length === 0) return null;

    // Extraire réunion/course depuis la page
    const reunionMatch = text.match(/[Rr](?:éunion|eunion|)\s*(\d+)/);
    const courseMatch = text.match(/[Cc]ourse\s*(\d+)/);

    return {
      confidence: 0.60,
      raceDate: dateStr,
      reunion: reunionMatch ? parseInt(reunionMatch[1], 10) : 1,
      course: courseMatch ? parseInt(courseMatch[1], 10) : 1,
      betType: this._betTypeFromPath(pagePath),
      selections: selections.slice(0, 5),
      metadata: {
        source: 'turfoo',
        page: pagePath,
        extractionMode: 'generic',
      },
    };
  }

  /**
   * Extrait les infos de course d'un bloc
   */
  _extractRaceInfo($, block) {
    const text = block.text();
    const reunionMatch = text.match(/R(\d+)/i);
    const courseMatch = text.match(/C(\d+)/i);
    const nameEl = block.find('.course-name, .race-name, h3, h4').first();

    return {
      reunion: reunionMatch ? parseInt(reunionMatch[1], 10) : null,
      course: courseMatch ? parseInt(courseMatch[1], 10) : null,
      name: nameEl.length ? nameEl.text().trim() : '',
    };
  }

  /**
   * Déduit le type de pari depuis le chemin de la page
   */
  _betTypeFromPath(path) {
    if (path.includes('quinte')) return 'quinte';
    if (path.includes('quarte')) return 'quarte';
    if (path.includes('tierce')) return 'tierce';
    return 'trio';
  }

  _todayStr() {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear()}`;
  }
}

module.exports = new TurfooOracle();
