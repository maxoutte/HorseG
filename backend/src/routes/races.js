const express = require('express');
const router = express.Router();
const pmuApi = require('../services/pmuApi');

// GET /api/races/programme/:date?
router.get('/programme/:date?', async (req, res) => {
  try {
    const programme = await pmuApi.getProgrammeJour(req.params.date);
    res.json(programme);
  } catch (error) {
    res.status(502).json({ error: 'Impossible de récupérer le programme PMU', details: error.message });
  }
});

// GET /api/races/reunion/:date/:reunion
router.get('/reunion/:date/:reunion', async (req, res) => {
  try {
    const reunion = await pmuApi.getReunion(req.params.date, req.params.reunion);
    res.json(reunion);
  } catch (error) {
    res.status(502).json({ error: 'Impossible de récupérer la réunion', details: error.message });
  }
});

// GET /api/races/course/:date/:reunion/:course
router.get('/course/:date/:reunion/:course', async (req, res) => {
  try {
    const course = await pmuApi.getCourse(req.params.date, req.params.reunion, req.params.course);
    res.json(course);
  } catch (error) {
    res.status(502).json({ error: 'Impossible de récupérer la course', details: error.message });
  }
});

// GET /api/races/participants/:date/:reunion/:course
router.get('/participants/:date/:reunion/:course', async (req, res) => {
  try {
    const participants = await pmuApi.getParticipants(req.params.date, req.params.reunion, req.params.course);
    res.json(participants);
  } catch (error) {
    res.status(502).json({ error: 'Impossible de récupérer les participants', details: error.message });
  }
});

// GET /api/races/cotes/:date/:reunion/:course
router.get('/cotes/:date/:reunion/:course', async (req, res) => {
  try {
    const cotes = await pmuApi.getCotes(req.params.date, req.params.reunion, req.params.course);
    res.json(cotes);
  } catch (error) {
    res.status(502).json({ error: 'Impossible de récupérer les cotes', details: error.message });
  }
});

// GET /api/races/resultats/:date/:reunion/:course
router.get('/resultats/:date/:reunion/:course', async (req, res) => {
  try {
    const resultats = await pmuApi.getResultats(req.params.date, req.params.reunion, req.params.course);
    res.json(resultats);
  } catch (error) {
    res.status(502).json({ error: 'Impossible de récupérer les résultats', details: error.message });
  }
});

module.exports = router;
