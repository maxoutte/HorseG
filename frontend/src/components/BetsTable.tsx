import { useState } from 'react';
import { useStore } from '../store/useStore';
import { BetStatusBadge } from './BetStatusBadge';
import { useExecuteBet, useUpdateBetResult } from '../hooks/useApi';
import { Bet } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Play, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const BET_TYPE_LABELS: Record<string, string> = {
  simple_gagnant: 'Gagnant',
  simple_place: 'Placé',
  couple: 'Couplé',
  tierce: 'Tiercé',
  quarte: 'Quarté',
  quinte: 'Quinté',
  multi: 'Multi',
};

function BetRow({ bet }: { bet: Bet }) {
  const executeBet = useExecuteBet();
  const updateResult = useUpdateBetResult();
  const [showResult, setShowResult] = useState(false);
  const [gainInput, setGainInput] = useState('');

  const horses = (() => { try { return JSON.parse(bet.horses).join(', '); } catch { return bet.horses; } })();
  const date = (() => { try { return format(parseISO(bet.createdAt), 'dd/MM HH:mm', { locale: fr }); } catch { return bet.createdAt; } })();

  const handleExecute = async () => {
    await executeBet.mutateAsync(bet.id);
    toast('Placement en cours...', { icon: '🏇' });
  };

  const handleResult = async (result: 'won' | 'lost') => {
    const gain = result === 'won' ? parseFloat(gainInput) : 0;
    await updateResult.mutateAsync({ betId: bet.id, result, gain });
    setShowResult(false);
    toast.success(result === 'won' ? `Gagné ! +${gain}€` : 'Perdu');
  };

  return (
    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{date}</td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-200">{bet.hippodrome}</div>
        <div className="text-xs text-gray-500">{bet.race}</div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-300">{BET_TYPE_LABELS[bet.betType] ?? bet.betType}</span>
        <div className="text-xs text-gray-500">#{horses}</div>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-200">{bet.amount.toFixed(2)}€</td>
      <td className="px-4 py-3"><BetStatusBadge status={bet.status} /></td>
      <td className="px-4 py-3 text-sm">
        {bet.gain != null && (
          <span className={clsx('font-semibold', bet.gain > 0 ? 'text-green-400' : 'text-red-400')}>
            {bet.gain > 0 ? '+' : ''}{bet.gain.toFixed(2)}€
          </span>
        )}
        {bet.error && <span className="text-xs text-red-400 truncate max-w-32 block" title={bet.error}>⚠ {bet.error}</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {bet.status === 'pending' && (
            <button
              onClick={handleExecute}
              disabled={executeBet.isPending}
              title="Placer ce pari"
              className="p-1.5 rounded-lg bg-blue-900/50 text-blue-400 hover:bg-blue-800/60 disabled:opacity-50 transition-colors"
            >
              {executeBet.isPending ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
            </button>
          )}
          {bet.status === 'placed' && (
            <>
              {showResult ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Gain €"
                    value={gainInput}
                    onChange={e => setGainInput(e.target.value)}
                    className="w-20 text-xs bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-gray-200"
                  />
                  <button onClick={() => handleResult('won')} title="Gagné"
                    className="p-1 rounded bg-green-900/50 text-green-400 hover:bg-green-800/60">
                    <CheckCircle size={12} />
                  </button>
                  <button onClick={() => handleResult('lost')} title="Perdu"
                    className="p-1 rounded bg-red-900/50 text-red-400 hover:bg-red-800/60">
                    <XCircle size={12} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowResult(true)}
                  className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded border border-gray-700 hover:border-gray-600 transition-colors">
                  Résultat
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export function BetsTable() {
  const bets = useStore(s => s.bets);

  if (bets.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-4xl mb-3">🏇</div>
        <p className="text-sm">Aucun pari pour l'instant</p>
        <p className="text-xs mt-1">Les paris apparaîtront ici dès la réception d'un signal</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            {['Date', 'Course', 'Type / Chevaux', 'Mise', 'Statut', 'Résultat', 'Actions'].map(h => (
              <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bets.map(bet => <BetRow key={bet.id} bet={bet} />)}
        </tbody>
      </table>
    </div>
  );
}
