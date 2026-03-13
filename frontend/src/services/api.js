import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('horseg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('horseg_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

// Races
export const getProgramme = (date) =>
  api.get(`/races/programme${date ? `/${date}` : ''}`);
export const getReunion = (date, reunion) =>
  api.get(`/races/reunion/${date}/${reunion}`);
export const getCourse = (date, reunion, course) =>
  api.get(`/races/course/${date}/${reunion}/${course}`);
export const getParticipants = (date, reunion, course) =>
  api.get(`/races/participants/${date}/${reunion}/${course}`);
export const getCotes = (date, reunion, course) =>
  api.get(`/races/cotes/${date}/${reunion}/${course}`);
export const getResultats = (date, reunion, course) =>
  api.get(`/races/resultats/${date}/${reunion}/${course}`);

// Bets
export const getBetStats = () => api.get('/bets/stats');
export const getPendingBets = () => api.get('/bets/pending');
export const getBetHistory = () => api.get('/bets/history');
export const executeBet = (betId) => api.post(`/bets/execute/${betId}`);
export const cancelBet = (betId) => api.post(`/bets/cancel/${betId}`);
export const activateEngine = () => api.post('/bets/engine/activate');
export const deactivateEngine = () => api.post('/bets/engine/deactivate');

// Oracles
export const getOracles = () => api.get('/oracles');
export const createOracle = (name, config) =>
  api.post('/oracles', { name, config });
export const deleteOracle = (id) => api.delete(`/oracles/${id}`);
export const toggleOracle = (id, enabled) =>
  api.patch(`/oracles/${id}/toggle`, { enabled });
export const getSignalHistory = (limit) =>
  api.get(`/oracles/signals?limit=${limit || 50}`);
export const setOracleFilters = (filters) =>
  api.put('/oracles/filters', filters);

// Health
export const getHealth = () => api.get('/health');

export default api;
