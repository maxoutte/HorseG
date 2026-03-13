import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RacesPage from './pages/RacesPage';
import BetsPage from './pages/BetsPage';
import OraclesPage from './pages/OraclesPage';
import SignalsPage from './pages/SignalsPage';
import SettingsPage from './pages/SettingsPage';

function AuthenticatedApp({ onLogout }) {
  const { connected, stats, signals } = useSocket();

  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar onLogout={onLogout} wsConnected={connected} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage socketData={{ stats, signals }} />} />
            <Route path="/races" element={<RacesPage />} />
            <Route path="/bets" element={<BetsPage />} />
            <Route path="/oracles" element={<OraclesPage />} />
            <Route path="/signals" element={<SignalsPage liveSignals={signals} />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  const { isAuthenticated, login, logout, loading, error } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} loading={loading} error={error} />;
  }

  return <AuthenticatedApp onLogout={logout} />;
}
