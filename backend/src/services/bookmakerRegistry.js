const pmuApi = require('./pmuApi');
const zeturfApi = require('./zeturfApi');
const genybetApi = require('./genybetApi');

const BOOKMAKERS = {
  pmu: {
    id: 'pmu',
    name: 'PMU',
    description: 'Pari Mutuel Urbain - Le leader français des paris hippiques',
    url: 'https://www.pmu.fr',
    service: pmuApi,
  },
  zeturf: {
    id: 'zeturf',
    name: 'ZEturf',
    description: 'ZEturf - Paris hippiques en ligne depuis 2003',
    url: 'https://www.zeturf.fr',
    service: zeturfApi,
  },
  genybet: {
    id: 'genybet',
    name: 'Genybet',
    description: 'Genybet - Paris hippiques par les experts du turf',
    url: 'https://www.genybet.fr',
    service: genybetApi,
  },
};

const DEFAULT_BOOKMAKER = 'pmu';

function getBookmaker(id) {
  return BOOKMAKERS[id] || BOOKMAKERS[DEFAULT_BOOKMAKER];
}

function getBookmakerService(id) {
  return getBookmaker(id).service;
}

function listBookmakers() {
  return Object.values(BOOKMAKERS).map(({ id, name, description, url }) => ({
    id,
    name,
    description,
    url,
  }));
}

module.exports = { BOOKMAKERS, DEFAULT_BOOKMAKER, getBookmaker, getBookmakerService, listBookmakers };
