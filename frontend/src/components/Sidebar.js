import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ onLogout, wsConnected }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>HorseG</h1>
        <span>Paris Hippiques Auto</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard
        </NavLink>
        <NavLink to="/races" className={({ isActive }) => isActive ? 'active' : ''}>
          Courses
        </NavLink>
        <NavLink to="/bets" className={({ isActive }) => isActive ? 'active' : ''}>
          Paris
        </NavLink>
        <NavLink to="/oracles" className={({ isActive }) => isActive ? 'active' : ''}>
          Oracles
        </NavLink>
        <NavLink to="/signals" className={({ isActive }) => isActive ? 'active' : ''}>
          Signaux
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
          Paramètres
        </NavLink>
      </nav>
      <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className={`signal-dot ${wsConnected ? 'accepted' : 'rejected'}`} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {wsConnected ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
        <button className="btn-outline" style={{ width: '100%' }} onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
