import { useStore } from '../store/useStore';
import { TrendingUp, TrendingDown, CircleDot, Trophy, Euro, Calendar } from 'lucide-react';
import clsx from 'clsx';

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4">
      <div className={clsx('p-2.5 rounded-lg', color)}>
        <Icon size={18} className="opacity-90" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function StatsCards() {
  const stats = useStore(s => s.stats);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const roiPositive = stats.roi >= 0;
  const netGain = stats.totalGain - stats.totalStaked;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Paris totaux"
        value={stats.totalBets}
        sub={`${stats.pendingBets} en cours`}
        icon={CircleDot}
        color="bg-blue-900/40 text-blue-400"
      />
      <StatCard
        label="Victoires"
        value={`${stats.wonBets} / ${stats.lostBets}`}
        sub={`${stats.totalBets > 0 ? Math.round((stats.wonBets / stats.totalBets) * 100) : 0}% de réussite`}
        icon={Trophy}
        color="bg-yellow-900/40 text-yellow-400"
      />
      <StatCard
        label="Gain net"
        value={`${netGain >= 0 ? '+' : ''}${netGain.toFixed(2)}€`}
        sub={`Misé: ${stats.totalStaked.toFixed(2)}€`}
        icon={netGain >= 0 ? TrendingUp : TrendingDown}
        color={netGain >= 0 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}
      />
      <StatCard
        label="ROI"
        value={`${roiPositive ? '+' : ''}${stats.roi}%`}
        sub={`Aujourd'hui: ${stats.todayBets} paris (${stats.todayStaked.toFixed(2)}€)`}
        icon={Euro}
        color={roiPositive ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}
      />
    </div>
  );
}
