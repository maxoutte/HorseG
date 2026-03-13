import React, { useEffect, useState } from 'react';
import { getPendingBets, getBetHistory, executeBet, cancelBet } from '../services/api';

export default function BetsPage() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('pending');

  const loadData = () => {
    getPendingBets().then(({ data }) => setPending(data)).catch(() => {});
    getBetHistory().then(({ data }) => setHistory(data)).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleExecute = async (id) => {
    await executeBet(id);
    loadData();
  };

  const handleCancel = async (id) => {
    await cancelBet(id);
    loadData();
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'badge-warning',
      placed: 'badge-info',
      won: 'badge-success',
      lost: 'badge-danger',
      cancelled: 'badge-danger',
      rejected: 'badge-danger',
    };
    return <span className={`badge ${map[status] || ''}`}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Paris</h2>
        <p>Gérez vos paris en attente et consultez l'historique</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={tab === 'pending' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setTab('pending')}
        >
          En attente ({pending.length})
        </button>
        <button
          className={tab === 'history' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setTab('history')}
        >
          Historique ({history.length})
        </button>
      </div>

      <div className="card">
        {tab === 'pending' && (
          pending.length === 0 ? (
            <div className="empty-state">
              <p>Aucun pari en attente</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                Les paris apparaîtront ici lorsque les oracles enverront des signaux
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>Chevaux</th>
                  <th>Montant</th>
                  <th>Confiance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((bet) => (
                  <tr key={bet.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{bet.id.slice(0, 8)}</td>
                    <td>R{bet.race.reunion}C{bet.race.course}</td>
                    <td>{bet.type}</td>
                    <td>[{bet.selections?.join(', ')}]</td>
                    <td>{bet.amount}€</td>
                    <td>{((bet.signal?.confidence || 0) * 100).toFixed(0)}%</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-success" style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handleExecute(bet.id)}>
                          Placer
                        </button>
                        <button className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handleCancel(bet.id)}>
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'history' && (
          history.length === 0 ? (
            <div className="empty-state">
              <p>Aucun pari dans l'historique</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>Chevaux</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((bet) => (
                  <tr key={bet.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{bet.id.slice(0, 8)}</td>
                    <td>R{bet.race?.reunion}C{bet.race?.course}</td>
                    <td>{bet.type}</td>
                    <td>[{bet.selections?.join(', ')}]</td>
                    <td>{bet.amount}€</td>
                    <td>{statusBadge(bet.status)}</td>
                    <td style={{ fontSize: 12 }}>
                      {bet.placedAt ? new Date(bet.placedAt).toLocaleString('fr-FR') : bet.createdAt ? new Date(bet.createdAt).toLocaleString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
