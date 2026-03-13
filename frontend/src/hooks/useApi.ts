import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Bet, Signal, DashboardStats, Config } from '../types';
import { useStore } from '../store/useStore';

const api = axios.create({ baseURL: '/api' });

export function useStats() {
  const setStats = useStore(s => s.setStats);
  return useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/bets/stats');
      setStats(data);
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useBets(limit = 50) {
  const setBets = useStore(s => s.setBets);
  return useQuery<{ bets: Bet[]; total: number }>({
    queryKey: ['bets', limit],
    queryFn: async () => {
      const { data } = await api.get(`/bets?limit=${limit}`);
      setBets(data.bets);
      return data;
    },
    refetchInterval: 15_000,
  });
}

export function useSignals(limit = 50) {
  const setSignals = useStore(s => s.setSignals);
  return useQuery<{ signals: Signal[]; total: number }>({
    queryKey: ['signals', limit],
    queryFn: async () => {
      const { data } = await api.get(`/signals?limit=${limit}`);
      setSignals(data.signals);
      return data;
    },
    refetchInterval: 15_000,
  });
}

export function useConfig() {
  const setConfig = useStore(s => s.setConfig);
  return useQuery<Config>({
    queryKey: ['config'],
    queryFn: async () => {
      const { data } = await api.get('/config');
      setConfig(data);
      return data;
    },
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Config>) => api.patch('/config', updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  });
}

export function usePmuLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.post('/config/pmu/login', { username, password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  });
}

export function useExecuteBet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (betId: string) => api.post(`/bets/${betId}/execute`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bets'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateBetResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ betId, result, gain }: { betId: string; result: 'won' | 'lost'; gain?: number }) =>
      api.patch(`/bets/${betId}/result`, { result, gain }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bets'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
