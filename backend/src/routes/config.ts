import { Router } from 'express';
import { getDb, getConfig, setConfig } from '../db';
import { pmuService } from '../services/pmu.service';

const router = Router();

export function createConfigRouter() {
  // GET /api/config — lecture de toute la configuration
  router.get('/', (req, res) => {
    const db = getDb();
    const rows = db.prepare(`SELECT key, value, updated_at FROM config`).all() as Array<{
      key: string; value: string; updated_at: string;
    }>;
    const config: Record<string, string> = {};
    rows.forEach(r => { config[r.key] = r.value; });
    res.json(config);
  });

  // PATCH /api/config — mise à jour d'une clé de config
  router.patch('/', (req, res) => {
    const updates = req.body as Record<string, string>;
    const allowedKeys = [
      'betting_enabled', 'max_bet_amount', 'daily_limit',
      'min_signal_strength', 'auto_place_bets',
    ];

    const updated: string[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.includes(key)) continue;
      setConfig(key, String(value));
      updated.push(key);
    }

    res.json({ ok: true, updated });
  });

  // POST /api/config/pmu/login — connexion à PMU.fr
  router.post('/pmu/login', async (req, res) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ error: 'Username et password requis' });
      return;
    }
    const ok = await pmuService.login(username, password);
    res.json({ ok, message: ok ? 'Connecté à PMU.fr' : 'Échec de connexion' });
  });

  // POST /api/config/pmu/logout
  router.post('/pmu/logout', async (req, res) => {
    await pmuService.logout();
    res.json({ ok: true });
  });

  // GET /api/config/pmu/status — état du navigateur PMU
  router.get('/pmu/status', (req, res) => {
    const status = pmuService.getStatus();
    const loggedIn = getConfig('pmu_logged_in') === 'true';
    res.json({ ...status, loggedIn });
  });

  // GET /api/config/pmu/screenshot — capture d'écran du navigateur
  router.get('/pmu/screenshot', async (req, res) => {
    const screenshot = await pmuService.screenshot();
    if (!screenshot) {
      res.status(404).json({ error: 'Navigateur non initialisé' });
      return;
    }
    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
  });

  return router;
}
