const express = require('express');
const router = express.Router();
const { BetEngine } = require('../services/betEngine');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/bets/stats
router.get('/stats', (req, res) => {
  res.json(BetEngine.getStats());
});

// GET /api/bets/pending
router.get('/pending', (req, res) => {
  res.json(BetEngine.getPendingBets());
});

// GET /api/bets/history
router.get('/history', (req, res) => {
  res.json(BetEngine.getExecutedBets());
});

// POST /api/bets/execute/:betId
router.post('/execute/:betId', async (req, res) => {
  try {
    const result = await BetEngine.executeBet(req.params.betId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bets/cancel/:betId
router.post('/cancel/:betId', (req, res) => {
  const result = BetEngine.cancelBet(req.params.betId);
  res.json(result);
});

// POST /api/bets/engine/activate
router.post('/engine/activate', (req, res) => {
  BetEngine.activate();
  res.json({ status: 'active', stats: BetEngine.getStats() });
});

// POST /api/bets/engine/deactivate
router.post('/engine/deactivate', (req, res) => {
  BetEngine.deactivate();
  res.json({ status: 'inactive', stats: BetEngine.getStats() });
});

module.exports = router;
