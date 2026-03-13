import { create } from 'zustand';
import { Bet, Signal, DashboardStats, Config } from '../types';

interface LiveEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: unknown;
}

interface AppStore {
  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Stats
  stats: DashboardStats | null;
  setStats: (s: DashboardStats) => void;

  // Bets
  bets: Bet[];
  setBets: (bets: Bet[]) => void;
  upsertBet: (bet: Partial<Bet> & { id: string }) => void;

  // Signals
  signals: Signal[];
  setSignals: (signals: Signal[]) => void;
  prependSignal: (s: Signal) => void;

  // Config
  config: Config | null;
  setConfig: (c: Config) => void;

  // Live events feed
  events: LiveEvent[];
  pushEvent: (type: string, message: string, data?: unknown) => void;
}

export const useStore = create<AppStore>((set) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  stats: null,
  setStats: (stats) => set({ stats }),

  bets: [],
  setBets: (bets) => set({ bets }),
  upsertBet: (partial) =>
    set((state) => {
      const idx = state.bets.findIndex(b => b.id === partial.id);
      if (idx >= 0) {
        const updated = [...state.bets];
        updated[idx] = { ...updated[idx], ...partial };
        return { bets: updated };
      }
      return { bets: [partial as Bet, ...state.bets] };
    }),

  signals: [],
  setSignals: (signals) => set({ signals }),
  prependSignal: (s) => set((state) => ({ signals: [s, ...state.signals].slice(0, 100) })),

  config: null,
  setConfig: (config) => set({ config }),

  events: [],
  pushEvent: (type, message, data) =>
    set((state) => ({
      events: [
        { id: crypto.randomUUID(), type, message, timestamp: new Date().toISOString(), data },
        ...state.events,
      ].slice(0, 50),
    })),
}));
