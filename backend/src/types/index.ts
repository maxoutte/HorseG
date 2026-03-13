export type BetType = 'simple_gagnant' | 'simple_place' | 'couple' | 'tierce' | 'quarte' | 'quinte' | 'multi';

export type BetStatus = 'pending' | 'placed' | 'won' | 'lost' | 'cancelled' | 'error';

export type SignalStrength = 'low' | 'medium' | 'high' | 'critical';

export interface OracleSignal {
  id?: string;
  source: string;
  race: {
    date: string;         // YYYY-MM-DD
    reunion: number;      // numéro de réunion
    course: number;       // numéro de course
    hippodrome?: string;
  };
  horses: number[];       // numéros des chevaux à jouer
  betType: BetType;
  amount: number;         // montant en euros
  strength: SignalStrength;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface Bet {
  id: string;
  signalId: string;
  race: string;           // "R{reunion}/C{course} - {date}"
  hippodrome: string;
  horses: string;         // JSON stringifié
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
  payload: string;        // JSON stringifié
  processed: boolean;
  betId?: string;
  error?: string;
  receivedAt: string;
}

export interface Config {
  key: string;
  value: string;
  updatedAt: string;
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
