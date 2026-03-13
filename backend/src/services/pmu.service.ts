import { chromium, Browser, Page } from 'playwright';
import { logger } from './logger';
import { getConfig, setConfig } from '../db';
import { BetType, OracleSignal } from '../types';

const PMU_URL = 'https://www.pmu.fr';

interface PmuBetResult {
  success: boolean;
  betId?: string;
  error?: string;
  details?: string;
}

class PmuService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;

  async init(): Promise<void> {
    if (this.browser) return;
    logger.info('Initialisation du navigateur Playwright...');
    this.browser = await chromium.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 900 });
    logger.info('Navigateur initialisé');
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      await this.init();
      if (!this.page) throw new Error('Page non initialisée');

      logger.info('Connexion à PMU.fr...');
      await this.page.goto(`${PMU_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });

      // Clic sur le bouton de connexion
      await this.page.click('[data-testid="login-button"], .login-btn, [aria-label="Se connecter"]').catch(() => {
        logger.debug('Bouton login principal non trouvé, tentative alternative');
      });

      await this.page.waitForTimeout(1000);

      // Remplir les identifiants
      const emailInput = await this.page.$('input[type="email"], input[name="username"], input[name="login"], #login');
      const pwdInput = await this.page.$('input[type="password"], input[name="password"], input[name="passwd"]');

      if (!emailInput || !pwdInput) {
        throw new Error('Formulaire de connexion introuvable — le site PMU a peut-être changé sa structure');
      }

      await emailInput.fill(username);
      await pwdInput.fill(password);
      await pwdInput.press('Enter');

      await this.page.waitForTimeout(3000);

      // Vérification de connexion
      const loggedIn = await this.page.$('[data-testid="user-menu"], .user-logged, .compte-link, .my-account').then(el => !!el);

      this.isLoggedIn = loggedIn;
      setConfig('pmu_logged_in', loggedIn ? 'true' : 'false');

      if (loggedIn) {
        logger.info('Connexion PMU.fr réussie');
      } else {
        logger.warn('Connexion PMU.fr échouée — vérifiez vos identifiants');
      }

      return loggedIn;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Erreur lors de la connexion PMU', { error: msg });
      return false;
    }
  }

  async placeBet(signal: OracleSignal): Promise<PmuBetResult> {
    if (!this.isLoggedIn) {
      return { success: false, error: 'Non connecté à PMU.fr' };
    }

    const bettingEnabled = getConfig('betting_enabled') === 'true';
    if (!bettingEnabled) {
      logger.info('Paris désactivés — simulation du pari', { signal });
      return this.simulateBet(signal);
    }

    try {
      await this.init();
      if (!this.page) throw new Error('Page non initialisée');

      logger.info('Placement du pari sur PMU.fr', {
        race: `R${signal.race.reunion}/C${signal.race.course}`,
        horses: signal.horses,
        betType: signal.betType,
        amount: signal.amount,
      });

      // Navigation vers la course
      const raceUrl = this.buildRaceUrl(signal);
      await this.page.goto(raceUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(2000);

      // Sélection du type de pari
      await this.selectBetType(signal.betType);

      // Sélection des chevaux
      for (const horse of signal.horses) {
        await this.selectHorse(horse);
      }

      // Saisie du montant
      await this.setAmount(signal.amount);

      // Validation
      const betId = await this.confirmBet();

      return { success: true, betId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Erreur lors du placement du pari', { error: msg });
      return { success: false, error: msg };
    }
  }

  private buildRaceUrl(signal: OracleSignal): string {
    const date = signal.race.date.replace(/-/g, '');
    return `${PMU_URL}/turf/programme/${date}/R${signal.race.reunion}/C${signal.race.course}`;
  }

  private async selectBetType(betType: BetType): Promise<void> {
    const selectors: Record<BetType, string> = {
      simple_gagnant: '[data-pari="E_SIMPLE_GAGNANT"], .pari-simple-gagnant',
      simple_place: '[data-pari="E_SIMPLE_PLACE"], .pari-simple-place',
      couple: '[data-pari="E_COUPLE"], .pari-couple',
      tierce: '[data-pari="E_TIERCE"], .pari-tierce',
      quarte: '[data-pari="E_QUARTE"], .pari-quarte',
      quinte: '[data-pari="E_QUINTE"], .pari-quinte',
      multi: '[data-pari="E_MULTI"], .pari-multi',
    };

    const selector = selectors[betType];
    await this.page?.click(selector).catch(() => {
      logger.warn(`Sélecteur de type de pari non trouvé: ${selector}`);
    });
    await this.page?.waitForTimeout(500);
  }

  private async selectHorse(number: number): Promise<void> {
    await this.page?.click(
      `[data-cheval="${number}"], .cheval-${number}, [data-partant="${number}"]`
    ).catch(() => {
      logger.warn(`Cheval ${number} non trouvé dans la sélection`);
    });
    await this.page?.waitForTimeout(300);
  }

  private async setAmount(amount: number): Promise<void> {
    const amountInput = await this.page?.$('input[name="mise"], input.mise-amount, .mise-input');
    if (amountInput) {
      await amountInput.fill(String(amount));
    }
  }

  private async confirmBet(): Promise<string> {
    await this.page?.click('.valider-pari, [data-testid="confirm-bet"], .btn-valider');
    await this.page?.waitForTimeout(2000);

    // Récupérer l'ID de confirmation
    const betId = await this.page?.textContent('.bet-reference, .confirmation-id, [data-bet-id]');
    return betId?.trim() || `pmu_${Date.now()}`;
  }

  private simulateBet(signal: OracleSignal): PmuBetResult {
    const fakeBetId = `SIM-${Date.now()}`;
    logger.info('SIMULATION — Pari non réellement placé', {
      betId: fakeBetId,
      signal,
    });
    return {
      success: true,
      betId: fakeBetId,
      details: 'Simulation — paris désactivés',
    };
  }

  async screenshot(): Promise<Buffer | null> {
    if (!this.page) return null;
    return await this.page.screenshot({ fullPage: false });
  }

  async logout(): Promise<void> {
    if (!this.page || !this.isLoggedIn) return;
    try {
      await this.page.click('.logout, [data-testid="logout"], .deconnexion').catch(() => {});
      this.isLoggedIn = false;
      setConfig('pmu_logged_in', 'false');
      logger.info('Déconnexion PMU.fr réussie');
    } catch (err) {
      logger.error('Erreur déconnexion', { err });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  getStatus(): { initialized: boolean; loggedIn: boolean } {
    return {
      initialized: !!this.browser,
      loggedIn: this.isLoggedIn,
    };
  }
}

export const pmuService = new PmuService();
