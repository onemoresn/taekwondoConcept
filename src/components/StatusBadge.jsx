import { PROGRESS_STATUS, PROGRESS_STATUS_LABELS } from '../constants/roles';

const STATUS_CLASS = {
  [PROGRESS_STATUS.NOT_STARTED]: 'status--none',
  [PROGRESS_STATUS.ATTEMPTED]: 'status--attempted',
  [PROGRESS_STATUS.PARENT_VERIFIED]: 'status--parent',
  [PROGRESS_STATUS.SUBMITTED]: 'status--parent',
  [PROGRESS_STATUS.APPROVED]: 'status--approved',
  [PROGRESS_STATUS.DENIED]: 'status--denied',
};

export default function StatusBadge({ status }) {
  const label = PROGRESS_STATUS_LABELS[status] ?? status;
  return (
    <span className={`status-badge ${STATUS_CLASS[status] ?? ''}`}>
      {label}
    </span>
  );
}

export function RequirementTypeIcon({ type }) {
  const icons = {
    technique: '🥊',
    form: '🥋',
    self_defense: '🛡️',
    terminology: '📖',
    conditioning: '💪',
    leadership: '⭐',
  };
  return <span className="req-type-icon" aria-hidden="true">{icons[type] ?? '•'}</span>;
}
