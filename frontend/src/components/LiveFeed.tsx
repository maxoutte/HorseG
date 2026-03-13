import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';

const EVENT_STYLE: Record<string, string> = {
  connect:  'text-green-400',
  disconnect: 'text-red-400',
  signal:   'text-blue-400',
  bet:      'text-purple-400',
  placing:  'text-yellow-400',
  success:  'text-green-400',
  error:    'text-red-400',
  warning:  'text-orange-400',
  won:      'text-green-300',
  lost:     'text-red-300',
  pending:  'text-yellow-300',
};

export function LiveFeed() {
  const events = useStore(s => s.events);

  return (
    <div className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto bg-gray-950 rounded-lg p-3 border border-gray-800">
      {events.length === 0 ? (
        <p className="text-gray-700 text-center py-4">En attente d'événements...</p>
      ) : (
        events.map(e => {
          const time = (() => { try { return format(parseISO(e.timestamp), 'HH:mm:ss'); } catch { return ''; } })();
          return (
            <div key={e.id} className="flex gap-2 animate-slide-in">
              <span className="text-gray-700 shrink-0">{time}</span>
              <span className={clsx(EVENT_STYLE[e.type] ?? 'text-gray-400')}>
                [{e.type.toUpperCase()}]
              </span>
              <span className="text-gray-400">{e.message}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
