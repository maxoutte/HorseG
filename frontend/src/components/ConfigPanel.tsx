import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useUpdateConfig, usePmuLogin } from '../hooks/useApi';
import { Shield, Lock, Unlock, Settings2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function Toggle({ label, configKey, value, onChange }: {
  label: string; configKey: string; value: boolean; onChange: (key: string, val: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onChange(configKey, value ? 'false' : 'true')}
        className={clsx(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
          value ? 'bg-orange-500' : 'bg-gray-700'
        )}
      >
        <span className={clsx(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
          value ? 'translate-x-5' : 'translate-x-1'
        )} />
      </button>
    </div>
  );
}

export function ConfigPanel() {
  const config = useStore(s => s.config);
  const updateConfig = useUpdateConfig();
  const pmuLogin = usePmuLogin();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [maxBet, setMaxBet] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');

  if (!config) return <div className="animate-pulse h-40 bg-gray-900 rounded-xl" />;

  const update = async (key: string, value: string) => {
    await updateConfig.mutateAsync({ [key]: value });
    toast.success('Configuration mise à jour');
  };

  const handleLogin = async () => {
    if (!username || !password) { toast.error('Identifiants requis'); return; }
    const res = await pmuLogin.mutateAsync({ username, password });
    if (res.data?.ok) {
      toast.success('Connecté à PMU.fr !');
      setUsername(''); setPassword('');
    } else {
      toast.error('Échec de connexion PMU.fr');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sécurité paris */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
          <Shield size={14} className="text-orange-400" /> Contrôle des paris
        </h3>
        <div className="divide-y divide-gray-800">
          <Toggle
            label="Paris activés"
            configKey="betting_enabled"
            value={config.betting_enabled === 'true'}
            onChange={update}
          />
          <Toggle
            label="Placement automatique"
            configKey="auto_place_bets"
            value={config.auto_place_bets === 'true'}
            onChange={update}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mise max (€)</label>
            <div className="flex gap-2">
              <input
                type="number" min="1" max="500"
                defaultValue={config.max_bet_amount}
                onChange={e => setMaxBet(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500"
              />
              <button onClick={() => update('max_bet_amount', maxBet || config.max_bet_amount)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg transition-colors">
                OK
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Limite journalière (€)</label>
            <div className="flex gap-2">
              <input
                type="number" min="1"
                defaultValue={config.daily_limit}
                onChange={e => setDailyLimit(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500"
              />
              <button onClick={() => update('daily_limit', dailyLimit || config.daily_limit)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">Force minimale du signal</label>
          <select
            value={config.min_signal_strength}
            onChange={e => update('min_signal_strength', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500"
          >
            {['low', 'medium', 'high', 'critical'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Connexion PMU */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
          {config.pmu_logged_in === 'true'
            ? <><Unlock size={14} className="text-green-400" /> PMU.fr — Connecté</>
            : <><Lock size={14} className="text-red-400" /> PMU.fr — Déconnecté</>
          }
        </h3>
        <div className="space-y-2">
          <input
            type="text" placeholder="Identifiant PMU"
            value={username} onChange={e => setUsername(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-orange-500"
          />
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} placeholder="Mot de passe"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-sm text-gray-200 focus:outline-none focus:border-orange-500"
            />
            <button onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={handleLogin}
            disabled={pmuLogin.isPending}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {pmuLogin.isPending ? 'Connexion...' : 'Se connecter à PMU.fr'}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Les identifiants ne sont pas stockés en base de données
        </p>
      </div>
    </div>
  );
}
