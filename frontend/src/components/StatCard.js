import React from 'react';

export default function StatCard({ label, value, color }) {
  return (
    <div className="card stat-card">
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
