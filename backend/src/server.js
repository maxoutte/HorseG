const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const config = require('./config');
const logger = require('./utils/logger');
const oracleManager = require('./services/oracleManager');
const pmuOracle = require('./services/pmuOracle');
const turfooOracle = require('./services/turfooOracle');
const { BetEngine } = require('./services/betEngine');

const app = express();
const server = http.createServer(app);

// WebSocket pour les mises à jour temps réel
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/races', require('./routes/races'));
app.use('/api/bets', require('./routes/bets'));
app.use('/api/oracles', require('./routes/oracles'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    engine: BetEngine.getStats(),
    oracles: oracleManager.getOracles().length,
  });
});

// Connecter Oracle → BetEngine
oracleManager.onSignal(async (signal, oracle) => {
  let result;
  if (oracle.config.autoExecute) {
    result = await BetEngine.autoExecuteBet(signal);
  } else {
    result = await BetEngine.createBetFromSignal(signal);
  }

  // Émettre via WebSocket
  io.emit('signal', { signal, betResult: result });
  io.emit('stats', BetEngine.getStats());

  return result;
});

// WebSocket
io.on('connection', (socket) => {
  logger.info('Client WebSocket connecté');
  socket.emit('stats', BetEngine.getStats());
  socket.emit('oracles', oracleManager.getOracles());

  socket.on('disconnect', () => {
    logger.info('Client WebSocket déconnecté');
  });
});

// Démarrage
server.listen(config.port, () => {
  logger.info(`HorseG Backend démarré sur le port ${config.port}`);

  // Lancer l'oracle PMU automatique (scan toutes les 30 min)
  pmuOracle.start(30);
  logger.info('Oracle PMU pronostics démarré (scan toutes les 30 min)');

  // Lancer l'oracle Turfoo (scan toutes les 60 min)
  turfooOracle.start(60);
  logger.info('Oracle Turfoo pronostics démarré (scan toutes les 60 min)');
});

module.exports = { app, server, io };
