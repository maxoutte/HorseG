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
