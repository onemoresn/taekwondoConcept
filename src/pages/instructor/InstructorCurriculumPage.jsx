import { useState } from 'react';
import { useBeltRanks } from '../../hooks/useCurriculum';
import BeltCurriculumEditor from '../../components/BeltCurriculumEditor';

export default function InstructorCurriculumPage() {
  const { belts, loading, error, reload } = useBeltRanks();
  const [selectedBelt, setSelectedBelt] = useState(null);

  return (
    <div className="page">
      <h1 className="page-title">Curriculum</h1>
      <p className="page-desc">Manage belt ranks and requirements. Students see published items for their current belt only.</p>

      {error && <div className="auth-banner auth-banner--error">{error}</div>}

      {selectedBelt ? (
        <BeltCurriculumEditor
          belt={selectedBelt}
          onClose={() => setSelectedBelt(null)}
          onUpdated={reload}
        />
      ) : (
        <>
          {loading ? (
            <p className="empty-note">Loading belts…</p>
          ) : (
            <ul className="belt-editor-list">
              {belts.map((belt) => (
                <li key={belt.id} className="belt-editor-item">
                  <span className="belt-editor-swatch" style={{ background: belt.color, color: belt.text_color }}>
                    {belt.rank_number ?? belt.sort_order}°
                  </span>
                  <div>
                    <strong>{belt.name}</strong>
                    <p>{belt.korean}</p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedBelt(belt)}>
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
