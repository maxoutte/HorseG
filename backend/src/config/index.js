require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: '24h',
  },
  pmu: {
    baseUrl: process.env.PMU_BASE_URL || 'https://online.turfinfo.api.pmu.fr/rest/client/1',
    authUrl: process.env.PMU_AUTH_URL || 'https://compteclient.pmu.fr',
    username: process.env.PMU_USERNAME || '',
    password: process.env.PMU_PASSWORD || '',
  },
  zeturf: {
    baseUrl: process.env.ZETURF_BASE_URL || 'https://www.zeturf.fr/api/v1',
    username: process.env.ZETURF_USERNAME || '',
    password: process.env.ZETURF_PASSWORD || '',
  },
  genybet: {
    baseUrl: process.env.GENYBET_BASE_URL || 'https://www.genybet.fr/api/v1',
    username: process.env.GENYBET_USERNAME || '',
    password: process.env.GENYBET_PASSWORD || '',
  },
  betting: {
    maxBetAmount: parseFloat(process.env.MAX_BET_AMOUNT) || 50,
    defaultBetAmount: parseFloat(process.env.DEFAULT_BET_AMOUNT) || 2,
    dailyLossLimit: parseFloat(process.env.DAILY_LOSS_LIMIT) || 100,
  },
  oracle: {
    apiKey: process.env.ORACLE_API_KEY || '',
  },
};
