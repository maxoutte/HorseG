import React, { useEffect, useState } from 'react';
import { getOracles, createOracle, deleteOracle, toggleOracle } from '../services/api';

export default function OraclesPage() {
  const [oracles, setOracles] = useState([]);
  const [newName, setNewName] = useState('');
  const [autoExec, setAutoExec] = useState(false);
  const [confidence, setConfidence] = useState(0.6);
  const [error, setError] = useState(null);

  const loadOracles = () => {
    setError(null);
    getOracles()
      .then(({ data }) => setOracles(data))
      .catch((err) => {
        setError(err.response?.data?.error || err.message || 'Erreur de connexion au backend');
      });
  };

  useEffect(() => { loadOracles(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createOracle(newName.trim(), {
      autoExecute: autoExec,
      confidenceThreshold: parseFloat(confidence),
    });
    setNewName('');
    setAutoExec(false);
    setConfidence(0.6);
    loadOracles();
  };

  const handleToggle = async (id, enabled) => {
    await toggleOracle(id, !enabled);
    loadOracles();
  };

  const handleDelete = async (id) => {
    await deleteOracle(id);
    loadOracles();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Oracles</h2>
        <p>Gérez les sources de signaux qui déclenchent les paris</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Nouvel Oracle</h3>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Nom de l'oracle
              </label>
              <input
                type="text"
                placeholder="ex: MonAlgo, TipsterBot..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Seuil de confiance minimum
              </label>
              <input
                type="number"
                min="0" max="1" step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="autoExec"
                checked={autoExec}
                onChange={(e) => setAutoExec(e.target.checked)}
              />
              <label htmlFor="autoExec" style={{ fontSize: 14 }}>
                Exécution automatique des paris
              </label>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Créer l'oracle
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Comment connecter un oracle</h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>Envoyez un signal via HTTP POST:</p>
            <pre style={{
              background: 'var(--bg-primary)',
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              overflow: 'auto',
              marginTop: 8,
            }}>
{`POST /api/oracles/{id}/signal
Header: X-Oracle-Key: votre-clé

{
  "confidence": 0.85,
  "raceDate": "13032026",
  "reunion": 1,
  "course": 3,
  "betType": "simple_gagnant",
  "selections": [5],
  "amount": 10
}`}
            </pre>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginTop: 20, borderLeft: '3px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Erreur de chargement</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{error}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Vérifiez que le backend tourne sur <code>http://localhost:5001</code>
          </p>
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Oracles enregistrés</h3>
        {oracles.length === 0 ? (
          <div className="empty-state">
            <p>Aucun oracle enregistré</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Créez votre premier oracle pour commencer à recevoir des signaux
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>ID</th>
                <th>Statut</th>
                <th>Auto-exec</th>
                <th>Seuil</th>
                <th>Signaux</th>
                <th>Dernier signal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {oracles.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.id.slice(0, 8)}</td>
                  <td>
                    <span className={`badge ${o.enabled ? 'badge-success' : 'badge-danger'}`}>
                      {o.enabled ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>{o.config?.autoExecute ? 'Oui' : 'Non'}</td>
                  <td>{((o.config?.confidenceThreshold || 0.6) * 100).toFixed(0)}%</td>
                  <td>{o.signalCount}</td>
                  <td style={{ fontSize: 12 }}>
                    {o.lastSignal ? new Date(o.lastSignal).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={o.enabled ? 'btn-outline' : 'btn-success'}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => handleToggle(o.id, o.enabled)}
                      >
                        {o.enabled ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => handleDelete(o.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
