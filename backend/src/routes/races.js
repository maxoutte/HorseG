const express = require('express');
const router = express.Router();
const { getBookmakerService, listBookmakers, DEFAULT_BOOKMAKER } = require('../services/bookmakerRegistry');

// Helper: récupère le service du bookmaker depuis le query param
function getService(req) {
  const bookmaker = req.query.bookmaker || DEFAULT_BOOKMAKER;
  return { service: getBookmakerService(bookmaker), bookmaker };
}

// GET /api/races/bookmakers — liste les bookmakers disponibles
router.get('/bookmakers', (req, res) => {
  res.json({ bookmakers: listBookmakers(), default: DEFAULT_BOOKMAKER });
});

// GET /api/races/programme/:date?
router.get('/programme/:date?', async (req, res) => {
  const { service, bookmaker } = getService(req);
  try {
    const programme = await service.getProgrammeJour(req.params.date);
    res.json({ ...programme, _bookmaker: bookmaker });
  } catch (error) {
    res.status(502).json({ error: `Impossible de récupérer le programme (${bookmaker})`, details: error.message });
  }
});

// GET /api/races/reunion/:date/:reunion
router.get('/reunion/:date/:reunion', async (req, res) => {
  const { service, bookmaker } = getService(req);
  try {
    const reunion = await service.getReunion(req.params.date, req.params.reunion);
    res.json(reunion);
  } catch (error) {
    res.status(502).json({ error: `Impossible de récupérer la réunion (${bookmaker})`, details: error.message });
  }
});

// GET /api/races/course/:date/:reunion/:course
router.get('/course/:date/:reunion/:course', async (req, res) => {
  const { service, bookmaker } = getService(req);
  try {
    const course = await service.getCourse(req.params.date, req.params.reunion, req.params.course);
    res.json(course);
  } catch (error) {
    res.status(502).json({ error: `Impossible de récupérer la course (${bookmaker})`, details: error.message });
  }
});

// GET /api/races/participants/:date/:reunion/:course
router.get('/participants/:date/:reunion/:course', async (req, res) => {
  const { service, bookmaker } = getService(req);
  try {
    const participants = await service.getParticipants(req.params.date, req.params.reunion, req.params.course);
    res.json(participants);
  } catch (error) {
    res.status(502).json({ error: `Impossible de récupérer les participants (${bookmaker})`, details: error.message });
  }
});

// GET /api/races/cotes/:date/:reunion/:course
router.get('/cotes/:date/:reunion/:course', async (req, res) => {
  const { service, bookmaker } = getService(req);
  try {
    const cotes = await service.getCotes(req.params.date, req.params.reunion, req.params.course);
    res.json(cotes);
  } catch (error) {
    res.status(502).json({ error: `Impossible de récupérer les cotes (${bookmaker})`, details: error.message });
  }
});

// GET /api/races/resultats/:date/:reunion/:course
router.get('/resultats/:date/:reunion/:course', async (req, res) => {
  const { service, bookmaker } = getService(req);
  try {
    const resultats = await service.getResultats(req.params.date, req.params.reunion, req.params.course);
    res.json(resultats);
  } catch (error) {
    res.status(502).json({ error: `Impossible de récupérer les résultats (${bookmaker})`, details: error.message });
  }
});

module.exports = router;
