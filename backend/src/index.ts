import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { getDb } from './db';
import { createSignalRouter } from './routes/signals';
import { createBetsRouter } from './routes/bets';
import { createConfigRouter } from './routes/config';
import { logger } from './services/logger';

const PORT = parseInt(process.env.PORT ?? '3001');
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/signals', createSignalRouter(io));
app.use('/api/bets', createBetsRouter(io));
app.use('/api/config', createConfigRouter());

// WebSocket
io.on('connection', socket => {
  logger.info('Client WebSocket connecté', { id: socket.id });

  // Envoyer les stats au nouveau client
  const { bettingService } = require('./services/betting.service');
  socket.emit('stats:update', bettingService.getStats());

  socket.on('disconnect', () => {
    logger.info('Client WebSocket déconnecté', { id: socket.id });
  });
});

// Émettre les stats toutes les 30s
setInterval(() => {
  try {
    const { bettingService } = require('./services/betting.service');
    io.emit('stats:update', bettingService.getStats());
  } catch {}
}, 30_000);

// Init DB + démarrage
getDb();

server.listen(PORT, () => {
  logger.info(`🏇 HorseG Backend démarré sur le port ${PORT}`);
  logger.info(`   → API:       http://localhost:${PORT}/api`);
  logger.info(`   → Health:    http://localhost:${PORT}/health`);
  logger.info(`   → Frontend:  ${FRONTEND_URL}`);
});

process.on('SIGTERM', async () => {
  logger.info('Arrêt gracieux...');
  const { pmuService } = await import('./services/pmu.service');
  await pmuService.close();
  server.close(() => process.exit(0));
});
