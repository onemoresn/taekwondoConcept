import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useSchool } from '../../context/SchoolProvider';
import { recordPractice } from '../../services/gamificationService';
import { getExercisesForBelt } from '../../data/practiceContent';
import {
  getExerciseCheckoffs,
  toggleExerciseCheckoff,
  getStudentAssignedExerciseBelt,
} from '../../services/practiceService';

function formatExercise(ex) {
  if (ex.reps) return `${ex.reps} reps`;
  if (ex.durationSec && ex.sets) return `${ex.durationSec}s × ${ex.sets} sets`;
  if (ex.sets) return `${ex.sets} sets`;
  return '';
}

export default function StudentExercisesPage() {
  const { profile } = useAuth();
  const { settings } = useSchool();
  const defaultBelt = profile?.belt_id ?? 'yellow';
  const beltSlug = getStudentAssignedExerciseBelt(profile.id, defaultBelt);
  const exercises = getExercisesForBelt(beltSlug);
  const [checked, setChecked] = useState(() => getExerciseCheckoffs(profile.id, beltSlug));

  function toggle(id) {
    const wasDone = checked.includes(id);
    const next = toggleExerciseCheckoff(profile.id, beltSlug, id);
    setChecked(next);
    if (settings.gamification_enabled) {
      if (!wasDone) recordPractice(profile.id, 'exercise_item', 1);
      if (next.length === exercises.length && exercises.length > 0) {
        recordPractice(profile.id, 'exercise_routine_complete', 1);
      }
    }
  }

  const done = checked.length;
  const total = exercises.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="page">
      <Link to="/student/learn" className="auth-card__back">← Learn</Link>
      <h1 className="page-title">Daily exercises</h1>
      <p className="page-desc">Complete your routine — check-offs save locally and sync with conditioning requirements.</p>

      <div className="exercise-progress">
        <strong>{done}/{total}</strong> completed today ({pct}%)
      </div>

      <ul className="exercise-list">
        {exercises.map((ex) => {
          const isDone = checked.includes(ex.id);
          return (
            <li key={ex.id}>
              <button
                type="button"
                className={`exercise-item${isDone ? ' is-done' : ''}`}
                onClick={() => toggle(ex.id)}
              >
                <span className="exercise-item__check">{isDone ? '✓' : ''}</span>
                <div className="exercise-item__body">
                  <strong>{ex.title}</strong>
                  <span>{ex.category} · {formatExercise(ex)}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {exercises.length === 0 && <p className="empty-note">No exercises assigned for your belt.</p>}
    </div>
  );
}
