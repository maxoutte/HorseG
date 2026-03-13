import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

const STRENGTH_STYLE: Record<string, string> = {
  low:      'bg-gray-800 text-gray-400',
  medium:   'bg-blue-900/40 text-blue-300',
  high:     'bg-orange-900/40 text-orange-300',
  critical: 'bg-red-900/50 text-red-300 animate-pulse',
};

export function SignalsLog() {
  const signals = useStore(s => s.signals);

  if (signals.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600">
        <p className="text-sm">En attente de signaux...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {signals.map(signal => {
        const payload = (() => { try { return JSON.parse(signal.payload); } catch { return null; } })();
        const date = (() => { try { return format(parseISO(signal.receivedAt), 'HH:mm:ss', { locale: fr }); } catch { return signal.receivedAt; } })();
        const strength = payload?.strength ?? 'low';

        return (
          <div key={signal.id} className={clsx(
            'flex items-start gap-3 p-3 rounded-lg border text-sm animate-slide-in',
            signal.processed ? 'bg-gray-900 border-gray-800' : 'bg-gray-900/50 border-gray-700'
          )}>
            <span className="text-xs text-gray-600 font-mono whitespace-nowrap mt-0.5">{date}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-300">{signal.source}</span>
                <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium', STRENGTH_STYLE[strength])}>
                  {strength}
                </span>
                {payload?.betType && (
                  <span className="text-xs text-gray-500">{payload.betType}</span>
                )}
                {payload?.race && (
                  <span className="text-xs text-gray-500">
                    R{payload.race.reunion}/C{payload.race.course}
                  </span>
                )}
                {payload?.amount && (
                  <span className="text-xs font-semibold text-gray-400">{payload.amount}€</span>
                )}
              </div>
              {signal.error && (
                <p className="text-xs text-red-400 mt-1">{signal.error}</p>
              )}
              {signal.betId && (
                <p className="text-xs text-green-500 mt-1">→ Pari {signal.betId.slice(0, 8)}... créé</p>
              )}
            </div>
            <span className={clsx('text-xs mt-0.5', signal.processed ? 'text-green-500' : 'text-yellow-500')}>
              {signal.processed ? '✓' : '…'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
