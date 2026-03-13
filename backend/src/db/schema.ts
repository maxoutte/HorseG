export const CREATE_SIGNALS_TABLE = `
  CREATE TABLE IF NOT EXISTS signals (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    payload TEXT NOT NULL,
    processed INTEGER NOT NULL DEFAULT 0,
    bet_id TEXT,
    error TEXT,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const CREATE_BETS_TABLE = `
  CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY,
    signal_id TEXT NOT NULL,
    race TEXT NOT NULL,
    hippodrome TEXT NOT NULL DEFAULT 'Inconnu',
    horses TEXT NOT NULL,
    bet_type TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    pmu_bet_id TEXT,
    result TEXT,
    gain REAL,
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (signal_id) REFERENCES signals(id)
  )
`;

export const CREATE_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const CREATE_AUDIT_TABLE = `
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const DEFAULT_CONFIG: Array<{ key: string; value: string }> = [
  { key: 'betting_enabled', value: 'false' },
  { key: 'max_bet_amount', value: '50' },
  { key: 'daily_limit', value: '200' },
  { key: 'min_signal_strength', value: 'medium' },
  { key: 'auto_place_bets', value: 'false' },
  { key: 'pmu_logged_in', value: 'false' },
];
