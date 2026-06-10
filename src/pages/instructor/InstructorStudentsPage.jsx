import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import {
  fetchRosterForInstructor,
  findStudentByEmail,
  assignStudentToInstructor,
} from '../../services/profileService';
import { fetchStudentBeltFlags, updateStudentBeltFlags } from '../../services/progressService';
import { getBeltById } from '../../data/belts';
import { DEMO_ROSTER } from '../../data/demoData';
import { BELT_OPTIONS } from '../../data/practiceContent';
import { getExerciseAssignments, setExerciseAssignment } from '../../services/practiceService';

function ExerciseAssignment({ student, instructorId }) {
  const [belt, setBelt] = useState(student.belt_id);

  useEffect(() => {
    const assignments = getExerciseAssignments(instructorId);
    setBelt(assignments[student.id] ?? student.belt_id);
  }, [student.id, student.belt_id, instructorId]);

  function handleChange(e) {
    const next = e.target.value;
    setBelt(next);
    setExerciseAssignment(instructorId, student.id, next);
  }

  return (
    <label className="flag-control">
      <span>Exercise routine</span>
      <select value={belt} onChange={handleChange}>
        {BELT_OPTIONS.map((b) => (
          <option key={b.slug} value={b.slug}>{b.name}</option>
        ))}
      </select>
    </label>
  );
}

function StudentFlagEditor({ student, onUpdated }) {
  const [flags, setFlags] = useState({ tips: 0, stripes: 0, test_ready: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudentBeltFlags(student.id).then(setFlags);
  }, [student.id]);

  async function save(next) {
    setSaving(true);
    try {
      const updated = await updateStudentBeltFlags(student.id, next);
      setFlags(updated);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="student-flags">
      <label className="flag-control">
        <span>Tips</span>
        <input
          type="number"
          min={0}
          max={99}
          value={flags.tips}
          disabled={saving}
          onChange={(e) => save({ tips: Number(e.target.value) })}
        />
      </label>
      <label className="flag-control">
        <span>Stripes</span>
        <input
          type="number"
          min={0}
          max={99}
          value={flags.stripes}
          disabled={saving}
          onChange={(e) => save({ stripes: Number(e.target.value) })}
        />
      </label>
      <label className="flag-control flag-control--check">
        <input
          type="checkbox"
          checked={flags.test_ready}
          disabled={saving}
          onChange={(e) => save({ test_ready: e.target.checked })}
        />
        <span>Test ready</span>
      </label>
    </div>
  );
}

export default function InstructorStudentsPage() {
  const { profile, demoMode } = useAuth();
  const [roster, setRoster] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (demoMode) {
      setRoster(
        DEMO_ROSTER.map((r) => ({
          id: r.studentId,
          full_name: r.name,
          belt_id: r.beltId,
          role: 'student',
        }))
      );
      setLoading(false);
      return;
    }
    fetchRosterForInstructor(profile.id)
      .then(setRoster)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [profile, demoMode]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (demoMode) {
        setMessage('Demo mode: student assignment simulated.');
        setEmail('');
        return;
      }
      const student = await findStudentByEmail(email.trim());
      if (!student) {
        setError('No student found with that email.');
        return;
      }
      if (student.role !== 'student') {
        setError('That account is not a student.');
        return;
      }
      await assignStudentToInstructor(profile.id, student.id, profile.school_id);
      const updated = await fetchRosterForInstructor(profile.id);
      setRoster(updated);
      setMessage(`${student.full_name} added to your roster.`);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Could not add student');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Students</h1>
      <p className="page-sub">Manage roster, tips, stripes, and test readiness</p>

      {demoMode && (
        <div className="auth-banner auth-banner--info">
          Demo mode — flag changes saved locally.
        </div>
      )}

      <form onSubmit={handleAdd} className="settings-form">
        {error && <div className="auth-banner auth-banner--error">{error}</div>}
        {message && <div className="auth-banner auth-banner--success">{message}</div>}

        <label className="auth-field">
          <span>Add student by email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add to roster'}
        </button>
      </form>

      <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
        <div className="panel__head">
          <h2>Roster</h2>
          <span className="panel__meta">{roster.length} students</span>
        </div>
        {loading ? (
          <p className="empty-note">Loading…</p>
        ) : roster.length === 0 ? (
          <p className="empty-note">No students on your roster yet.</p>
        ) : (
          <ul className="roster-list">
            {roster.map((student) => {
              const belt = getBeltById(student.belt_id);
              return (
                <li key={student.id} className="roster-list__item">
                  <div className="req-list__body">
                    <strong>{student.full_name}</strong>
                    <p>{belt?.name ?? student.belt_id}</p>
                  </div>
                  <StudentFlagEditor student={student} />
                  <ExerciseAssignment student={student} instructorId={profile.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
