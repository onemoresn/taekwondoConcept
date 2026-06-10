import { Link } from 'react-router-dom';
import ProgressRing from './ProgressRing';

export default function ReadinessHeatmap({ reports }) {
  if (!reports?.length) {
    return <p className="empty-note">No students on roster.</p>;
  }

  return (
    <div className="heatmap">
      {reports.map((r) => (
        <Link
          key={r.student.id}
          to="/instructor/students"
          className={`heatmap__cell heatmap__cell--${r.heat}`}
        >
          <ProgressRing percent={r.percent} size={56} stroke={4} />
          <div className="heatmap__info">
            <strong>{r.student.full_name}</strong>
            <span>{r.approved}/{r.total} approved</span>
            {r.flags.test_ready && <span className="heatmap__ready">Test ready</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
