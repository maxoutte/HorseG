import { useState, useCallback } from 'react';
import { login as apiLogin } from '../services/api';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('horseg_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token;

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiLogin(username, password);
      localStorage.setItem('horseg_token', data.token);
      setToken(data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('horseg_token');
    setToken(null);
  }, []);

  return { isAuthenticated, token, login, logout, loading, error };
}
