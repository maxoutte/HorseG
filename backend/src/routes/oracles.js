const express = require('express');
const router = express.Router();
const oracleManager = require('../services/oracleManager');
const { authenticateToken, authenticateOracleKey } = require('../middleware/auth');

// --- Routes admin (JWT) ---

// GET /api/oracles - liste des oracles
router.get('/', authenticateToken, (req, res) => {
  res.json(oracleManager.getOracles());
});

// POST /api/oracles - enregistrer un oracle
router.post('/', authenticateToken, (req, res) => {
  const { name, config } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const oracle = oracleManager.registerOracle(name, config);
  res.status(201).json(oracle);
});

// DELETE /api/oracles/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const removed = oracleManager.removeOracle(req.params.id);
  res.json({ removed });
});

// PATCH /api/oracles/:id/toggle
router.patch('/:id/toggle', authenticateToken, (req, res) => {
  const oracle = oracleManager.toggleOracle(req.params.id, req.body.enabled);
  if (!oracle) return res.status(404).json({ error: 'Oracle non trouvé' });
  res.json(oracle);
});

// GET /api/oracles/signals - historique des signaux
router.get('/signals', authenticateToken, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  res.json(oracleManager.getSignalHistory(limit));
});

// PUT /api/oracles/filters
router.put('/filters', authenticateToken, (req, res) => {
  oracleManager.setFilters(req.body);
  res.json({ filters: oracleManager.filters });
});

// --- Contrôle de l'oracle PMU automatique ---

// POST /api/oracles/pmu-oracle/start
router.post('/pmu-oracle/start', authenticateToken, (req, res) => {
  const pmuOracle = require('../services/pmuOracle');
  const interval = parseInt(req.body.intervalMinutes, 10) || 30;
  const oracle = pmuOracle.start(interval);
  res.json({ status: 'started', oracle, intervalMinutes: interval });
});

// POST /api/oracles/pmu-oracle/stop
router.post('/pmu-oracle/stop', authenticateToken, (req, res) => {
  const pmuOracle = require('../services/pmuOracle');
  pmuOracle.stop();
  res.json({ status: 'stopped' });
});

// POST /api/oracles/pmu-oracle/scan - forcer un scan immédiat
router.post('/pmu-oracle/scan', authenticateToken, async (req, res) => {
  const pmuOracle = require('../services/pmuOracle');
  try {
    await pmuOracle._scan();
    res.json({ status: 'scan_complete' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Route signal (API Key oracle) ---

// POST /api/oracles/:id/signal - recevoir un signal d'un oracle
router.post('/:id/signal', authenticateOracleKey, async (req, res) => {
  try {
    const result = await oracleManager.receiveSignal(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
