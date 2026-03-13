import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_SIGNALS_TABLE, CREATE_BETS_TABLE, CREATE_CONFIG_TABLE, CREATE_AUDIT_TABLE, DEFAULT_CONFIG } from './schema';

const DB_PATH = process.env.DB_PATH || './data/horseg.db';

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    ensureDir(DB_PATH);
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(CREATE_SIGNALS_TABLE);
  db.exec(CREATE_BETS_TABLE);
  db.exec(CREATE_CONFIG_TABLE);
  db.exec(CREATE_AUDIT_TABLE);

  const insertConfig = db.prepare(`INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)`);
  const initConfigs = db.transaction(() => {
    for (const cfg of DEFAULT_CONFIG) {
      insertConfig.run(cfg.key, cfg.value);
    }
  });
  initConfigs();
}

export function getConfig(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setConfig(key: string, value: string): void {
  const db = getDb();
  db.prepare(`INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))`).run(key, value);
}

export function auditLog(action: string, entity: string, entityId?: string, details?: unknown): void {
  const db = getDb();
  db.prepare(`INSERT INTO audit_log (action, entity, entity_id, details) VALUES (?, ?, ?, ?)`).run(
    action,
    entity,
    entityId ?? null,
    details ? JSON.stringify(details) : null
  );
}
