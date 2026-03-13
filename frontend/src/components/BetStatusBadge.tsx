import { BetStatus } from '../types';
import clsx from 'clsx';

const STATUS_CONFIG: Record<BetStatus, { label: string; classes: string }> = {
  pending:   { label: 'En attente',  classes: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  placed:    { label: 'Placé',       classes: 'bg-blue-900/40 text-blue-300 border-blue-800' },
  won:       { label: 'Gagné ✓',     classes: 'bg-green-900/40 text-green-300 border-green-800' },
  lost:      { label: 'Perdu',       classes: 'bg-red-900/40 text-red-400 border-red-800' },
  cancelled: { label: 'Annulé',      classes: 'bg-gray-800 text-gray-500 border-gray-700' },
  error:     { label: 'Erreur',      classes: 'bg-red-900/60 text-red-300 border-red-700' },
};

export function BetStatusBadge({ status }: { status: BetStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.error;
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.classes)}>
      {cfg.label}
    </span>
  );
}
