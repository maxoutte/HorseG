const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Utilisateur admin en mémoire (à remplacer par une DB en production)
let adminUser = {
  username: 'admin',
  passwordHash: bcrypt.hashSync('admin', 10),
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username et password requis' });
  }

  if (username !== adminUser.username) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const valid = await bcrypt.compare(password, adminUser.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const token = jwt.sign({ username }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  res.json({ token, expiresIn: config.jwt.expiresIn });
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' });
  }

  const valid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  }

  adminUser.passwordHash = await bcrypt.hash(newPassword, 10);
  res.json({ message: 'Mot de passe changé' });
});

module.exports = router;
