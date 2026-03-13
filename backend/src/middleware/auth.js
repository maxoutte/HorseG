const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token invalide' });
  }
}

function authenticateOracleKey(req, res, next) {
  const apiKey = req.headers['x-oracle-key'];
  if (!apiKey || apiKey !== config.oracle.apiKey) {
    return res.status(401).json({ error: 'Clé oracle invalide' });
  }
  next();
}

module.exports = { authenticateToken, authenticateOracleKey };
