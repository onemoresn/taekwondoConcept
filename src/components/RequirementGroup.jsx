import { Link } from 'react-router-dom';
import { REQUIREMENT_TYPE_LABELS } from '../data/curriculumSeed';
import StatusBadge, { RequirementTypeIcon } from './StatusBadge';

export default function RequirementGroup({ type, requirements, progressMap, detailBasePath }) {
  if (!requirements?.length) return null;

  return (
    <section className="req-group">
      <h3 className="req-group__title">
        <RequirementTypeIcon type={type} />
        {REQUIREMENT_TYPE_LABELS[type] ?? type}
        <span className="req-group__count">{requirements.length}</span>
      </h3>
      <ul className="req-list">
        {requirements.map((req) => (
          <li key={req.id} className="req-list__item">
            <RequirementTypeIcon type={req.type} />
            <div className="req-list__body">
              <strong>{req.title}</strong>
              {req.description && <p>{req.description}</p>}
            </div>
            <StatusBadge status={progressMap[req.id] ?? 'not_started'} />
            {detailBasePath && (
              <Link to={`${detailBasePath}/${req.id}`} className="req-list__link btn btn-sm btn-secondary">
                View
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
