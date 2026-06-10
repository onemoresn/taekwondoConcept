import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { getAllTechniques, BELT_OPTIONS } from '../../data/practiceContent';

export default function StudentTechniquesPage() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState(profile?.belt_id ?? 'all');
  const techniques = getAllTechniques(filter === 'all' ? 'all' : filter);

  return (
    <div className="page">
      <Link to="/student/learn" className="auth-card__back">← Learn</Link>
      <h1 className="page-title">Technique library</h1>

      <div className="filter-row">
        <label className="auth-field">
          <span>Belt filter</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All belts</option>
            {BELT_OPTIONS.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="technique-list">
        {techniques.map((tech) => (
          <li key={tech.id} className="technique-card">
            <div className="technique-card__body">
              <strong>{tech.title}</strong>
              {tech.korean && <p className="technique-card__ko">{tech.korean}</p>}
              <p>{tech.description}</p>
              {tech.keyPoints?.length > 0 && (
                <ul className="key-points">
                  {tech.keyPoints.map((pt) => <li key={pt}>{pt}</li>)}
                </ul>
              )}
            </div>
            {tech.videoUrl ? (
              <video className="technique-card__video" src={tech.videoUrl} controls playsInline preload="metadata" />
            ) : (
              <div className="video-placeholder"><span>🎬</span><p>Demo video coming soon</p></div>
            )}
          </li>
        ))}
      </ul>

      {techniques.length === 0 && <p className="empty-note">No techniques for this filter.</p>}
    </div>
  );
}
