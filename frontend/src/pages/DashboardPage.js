import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import SignalFeed from '../components/SignalFeed';
import { getBetStats, activateEngine, deactivateEngine } from '../services/api';

export default function DashboardPage({ socketData }) {
  const [stats, setStats] = useState(socketData?.stats || null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (socketData?.stats) {
      setStats(socketData.stats);
    }
  }, [socketData?.stats]);

  useEffect(() => {
    getBetStats().then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const handleToggleEngine = async () => {
    setToggling(true);
    try {
      if (stats?.isActive) {
        const { data } = await deactivateEngine();
        setStats(data.stats);
      } else {
        const { data } = await activateEngine();
        setStats(data.stats);
      }
    } catch { /* handled by interceptor */ }
    setToggling(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Dashboard</h2>
          <p>Vue d'ensemble du système de paris</p>
        </div>
        <button
          className={stats?.isActive ? 'btn-danger' : 'btn-success'}
          onClick={handleToggleEngine}
          disabled={toggling}
        >
          {stats?.isActive ? 'Désactiver le moteur' : 'Activer le moteur'}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Paris" value={stats?.totalBets || 0} />
        <StatCard label="En attente" value={stats?.pending || 0} color="var(--warning)" />
        <StatCard label="Dépensé aujourd'hui" value={`${stats?.dailySpent || 0}€`} />
        <StatCard
          label="Profit/Perte"
          value={`${(stats?.profit || 0) >= 0 ? '+' : ''}${(stats?.profit || 0).toFixed(2)}€`}
          color={(stats?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}
        />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Statut du moteur</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span className={`signal-dot ${stats?.isActive ? 'accepted' : 'rejected'}`}
                  style={{ width: 12, height: 12 }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              {stats?.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Paris placés</span>
              <span>{stats?.placed || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gagnés</span>
              <span style={{ color: 'var(--success)' }}>{stats?.won || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Perdus</span>
              <span style={{ color: 'var(--danger)' }}>{stats?.lost || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Limite journalière</span>
              <span>{stats?.dailySpent || 0}€ / {stats?.dailyLimit || 100}€</span>
            </div>
          </div>
        </div>

        <SignalFeed signals={socketData?.signals} />
      </div>
    </div>
  );
}
