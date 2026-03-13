import React, { useState } from 'react';
import { setOracleFilters } from '../services/api';

export default function SettingsPage() {
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [maxAmount, setMaxAmount] = useState(50);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await setOracleFilters({ minConfidence: parseFloat(minConfidence) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* handled by interceptor */ }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Paramètres</h2>
        <p>Configuration du système de paris</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Filtres des signaux</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Confiance minimum (0-1)
            </label>
            <input
              type="number"
              min="0" max="1" step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button className="btn-primary" onClick={handleSave}>
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Limites de mise</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Montant max par pari (€)
            </label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Limite de perte journalière (€)
            </label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Ces limites sont configurées via le fichier .env du backend.
            Modifiez MAX_BET_AMOUNT et DAILY_LOSS_LIMIT.
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>API Oracle</h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>Pour connecter vos oracles, utilisez l'endpoint:</p>
            <pre style={{
              background: 'var(--bg-primary)',
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              overflow: 'auto',
              marginTop: 8,
            }}>
{`POST /api/oracles/{oracleId}/signal
Header: X-Oracle-Key: {ORACLE_API_KEY}
Content-Type: application/json`}
            </pre>
            <p style={{ marginTop: 12 }}>
              La clé API est définie dans la variable d'env ORACLE_API_KEY.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Types de paris supportés</h3>
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <div><span className="badge badge-info">simple_gagnant</span> Simple Gagnant</div>
            <div><span className="badge badge-info">simple_place</span> Simple Placé</div>
            <div><span className="badge badge-info">couple_gagnant</span> Couplé Gagnant</div>
            <div><span className="badge badge-info">couple_place</span> Couplé Placé</div>
            <div><span className="badge badge-info">trio</span> Trio</div>
            <div><span className="badge badge-info">tierce</span> Tiercé</div>
            <div><span className="badge badge-info">quarte</span> Quarté+</div>
            <div><span className="badge badge-info">quinte</span> Quinté+</div>
          </div>
        </div>
      </div>
    </div>
  );
}
