import React, { useEffect, useState } from 'react';
import { getSignalHistory } from '../services/api';

export default function SignalsPage({ liveSignals }) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSignalHistory(100)
      .then(({ data }) => setSignals(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fusionner les signaux live avec l'historique
  const allSignals = [
    ...(liveSignals || []).map((s) => s.signal),
    ...signals,
  ].filter(Boolean);

  const statusColor = (status) => {
    switch (status) {
      case 'accepted': return 'var(--success)';
      case 'filtered': return 'var(--warning)';
      default: return 'var(--danger)';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Signaux</h2>
        <p>Historique de tous les signaux reçus des oracles</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><p className="pulse">Chargement...</p></div>
        ) : allSignals.length === 0 ? (
          <div className="empty-state">
            <p>Aucun signal reçu</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Les signaux apparaîtront ici dès qu'un oracle enverra des données
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Oracle</th>
                <th>Course</th>
                <th>Type</th>
                <th>Chevaux</th>
                <th>Confiance</th>
                <th>Montant</th>
                <th>Reçu</th>
                <th>Raison filtre</th>
              </tr>
            </thead>
            <tbody>
              {allSignals.map((s, i) => (
                <tr key={s.id || i}>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: statusColor(s.status),
                      marginRight: 6,
                    }} />
                    {s.status}
                  </td>
                  <td>{s.oracleName || s.source || '—'}</td>
                  <td>R{s.reunion}C{s.course}</td>
                  <td>{s.betType || '—'}</td>
                  <td>[{s.selections?.join(', ')}]</td>
                  <td>{s.confidence !== undefined ? `${(s.confidence * 100).toFixed(0)}%` : '—'}</td>
                  <td>{s.amount ? `${s.amount}€` : '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {s.receivedAt ? new Date(s.receivedAt).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {s.filterReason || '—'}
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
