export type BetType = 'simple_gagnant' | 'simple_place' | 'couple' | 'tierce' | 'quarte' | 'quinte' | 'multi';
export type BetStatus = 'pending' | 'placed' | 'won' | 'lost' | 'cancelled' | 'error';
export type SignalStrength = 'low' | 'medium' | 'high' | 'critical';

export interface Bet {
  id: string;
  signalId: string;
  race: string;
  hippodrome: string;
  horses: string;
  betType: BetType;
  amount: number;
  status: BetStatus;
  pmuBetId?: string;
  result?: string;
  gain?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Signal {
  id: string;
  source: string;
  payload: string;
  processed: boolean;
  betId?: string;
  error?: string;
  receivedAt: string;
}

export interface DashboardStats {
  totalBets: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  totalStaked: number;
  totalGain: number;
  roi: number;
  todayBets: number;
  todayStaked: number;
}

export interface Config {
  betting_enabled: string;
  max_bet_amount: string;
  daily_limit: string;
  min_signal_strength: string;
  auto_place_bets: string;
  pmu_logged_in: string;
  [key: string]: string;
}
