import { useStore } from '../store/useStore';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import clsx from 'clsx';

export function StatusBar() {
  const connected = useStore(s => s.connected);
  const config = useStore(s => s.config);

  const bettingEnabled = config?.betting_enabled === 'true';
  const pmuLoggedIn = config?.pmu_logged_in === 'true';
  const autoPlace = config?.auto_place_bets === 'true';

  return (
    <div className="flex items-center gap-4 text-xs text-gray-400">
      <span className={clsx('flex items-center gap-1.5', connected ? 'text-green-400' : 'text-red-400')}>
        {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
        {connected ? 'Connecté' : 'Déconnecté'}
      </span>

      <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        pmuLoggedIn ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-500'
      )}>
        PMU {pmuLoggedIn ? '✓' : '✗'}
      </span>

      <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        bettingEnabled ? 'bg-orange-900/50 text-orange-300' : 'bg-gray-800 text-gray-500'
      )}>
        <Activity size={10} />
        Paris {bettingEnabled ? 'ACTIFS' : 'OFF'}
      </span>

      {autoPlace && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 animate-pulse-slow">
          AUTO-PLACE
        </span>
      )}
    </div>
  );
}
