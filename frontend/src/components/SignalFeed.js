import React from 'react';

export default function SignalFeed({ signals }) {
  if (!signals || signals.length === 0) {
    return (
      <div className="card">
        <h3 style={{ marginBottom: 10 }}>Signaux en direct</h3>
        <div className="empty-state" style={{ padding: 30 }}>
          <p>En attente de signaux des oracles...</p>
          <span className="pulse" style={{ display: 'inline-block', marginTop: 10, color: 'var(--text-muted)' }}>
            Listening...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: 10 }}>Signaux en direct</h3>
      <div className="signal-feed">
        {signals.map((s, i) => (
          <div key={i} className="signal-item">
            <span className={`signal-dot ${s.signal?.status || 'accepted'}`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {s.signal?.oracleName || 'Oracle'}
                {' — '}
                R{s.signal?.reunion}C{s.signal?.course}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Chevaux: [{s.signal?.selections?.join(', ')}]
                {' | '}
                Confiance: {((s.signal?.confidence || 0) * 100).toFixed(0)}%
                {s.betResult && ` | Pari: ${s.betResult.status}`}
              </div>
            </div>
            <span className="badge badge-info" style={{ fontSize: 11 }}>
              {new Date(s.signal?.receivedAt).toLocaleTimeString('fr-FR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
