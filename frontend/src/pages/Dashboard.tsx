import { useStats, useBets, useSignals, useConfig } from '../hooks/useApi';
import { StatsCards } from '../components/StatsCards';
import { BetsTable } from '../components/BetsTable';
import { SignalsLog } from '../components/SignalsLog';
import { LiveFeed } from '../components/LiveFeed';
import { ConfigPanel } from '../components/ConfigPanel';
import { StatusBar } from '../components/StatusBar';
import { Activity, List, Radio, Settings } from 'lucide-react';

export function Dashboard() {
  useStats();
  useBets();
  useSignals();
  useConfig();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏇</span>
            <div>
              <h1 className="text-base font-bold text-gray-100 leading-none">HorseG</h1>
              <p className="text-xs text-gray-500">Paris hippiques automatisés</p>
            </div>
          </div>
          <StatusBar />
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsCards />

        {/* Main content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Paris — 2/3 */}
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <List size={15} className="text-orange-400" />
                <h2 className="text-sm font-semibold text-gray-200">Historique des paris</h2>
              </div>
              <BetsTable />
            </section>

            {/* Live feed */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <Activity size={15} className="text-green-400" />
                <h2 className="text-sm font-semibold text-gray-200">Flux temps réel</h2>
              </div>
              <div className="p-4">
                <LiveFeed />
              </div>
            </section>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-6">
            {/* Signaux */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <Radio size={15} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-gray-200">Signaux reçus</h2>
              </div>
              <div className="p-4">
                <SignalsLog />
              </div>
            </section>

            {/* Configuration */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <Settings size={15} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-200">Configuration</h2>
              </div>
              <div className="p-4">
                <ConfigPanel />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
