const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
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
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Routes API
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

// Servir le frontend (build statique)
const frontendBuild = path.resolve(__dirname, '..', '..', 'frontend', 'build');
const indexHtml = path.join(frontendBuild, 'index.html');

if (fs.existsSync(indexHtml)) {
  app.use(express.static(frontendBuild));

  // SPA fallback — toutes les routes non-API renvoient index.html
  app.get('*', (req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  logger.warn(`Frontend build introuvable: ${frontendBuild}`);
  logger.warn('Lancez "cd frontend && npx react-scripts build" pour générer le build');
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.status(503).send(`
        <h1>HorseG - Frontend non disponible</h1>
        <p>Le build frontend est introuvable.</p>
        <p>Chemin attendu: <code>${frontendBuild}</code></p>
        <p>Exécutez: <code>cd frontend && npx react-scripts build</code></p>
        <p><a href="/api/health">Vérifier l'API</a></p>
      `);
    }
  });
}

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
  logger.info(`Frontend build: ${frontendBuild} (${fs.existsSync(indexHtml) ? 'OK' : 'MANQUANT'})`);

  // Lancer l'oracle PMU automatique (scan toutes les 30 min)
  pmuOracle.start(30);
  logger.info('Oracle PMU pronostics démarré (scan toutes les 30 min)');

  // Lancer l'oracle Turfoo (scan toutes les 60 min)
  turfooOracle.start(60);
  logger.info('Oracle Turfoo pronostics démarré (scan toutes les 60 min)');
});

module.exports = { app, server, io };
