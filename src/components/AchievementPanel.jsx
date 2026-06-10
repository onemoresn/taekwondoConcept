import { Link } from 'react-router-dom';
import {
  getGamificationState,
  getBadgeDetails,
  getXpProgress,
  getLevelFromXp,
} from '../services/gamificationService';

export default function AchievementPanel({ studentId, compact = false, showLink = true }) {
  const state = getGamificationState(studentId);
  const progress = getXpProgress(state.xp);
  const badges = getBadgeDetails(state.badges);
  const earned = badges.filter((b) => b.earned);

  if (compact) {
    return (
      <div className="achievement-panel achievement-panel--compact">
        <div className="achievement-panel__level">
          <span>Lv {getLevelFromXp(state.xp)}</span>
          <strong>{state.xp} XP</strong>
        </div>
        {state.streak.count > 0 && (
          <span className="achievement-panel__streak">🔥 {state.streak.count} day streak</span>
        )}
        {showLink && (
          <Link to="/student/leaderboard" className="achievement-panel__link">Leaderboard →</Link>
        )}
      </div>
    );
  }

  return (
    <section className="panel achievement-panel">
      <div className="achievement-panel__head">
        <div>
          <h2>Practice rewards</h2>
          <p className="phase-note">Earn XP from flashcards, exercises, and belt progress.</p>
        </div>
        <div className="achievement-panel__level-badge">Lv {progress.level}</div>
      </div>

      <div className="xp-bar" aria-label={`${progress.current} of ${progress.next} XP to next level`}>
        <div className="xp-bar__fill" style={{ width: `${progress.percent}%` }} />
        <span className="xp-bar__label">{state.xp} XP · {progress.current}/{progress.next} to Lv {progress.level + 1}</span>
      </div>

      {state.streak.count > 0 && (
        <p className="achievement-panel__streak">🔥 {state.streak.count}-day practice streak</p>
      )}

      <div className="badge-grid">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`badge-card${b.earned ? ' is-earned' : ''}`}
            title={b.desc}
          >
            <span className="badge-card__icon">{b.earned ? b.icon : '?'}</span>
            <strong>{b.title}</strong>
            <span>{b.desc}</span>
          </div>
        ))}
      </div>

      {showLink && (
        <Link to="/student/leaderboard" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
          View leaderboard ({earned.length}/{badges.length} badges)
        </Link>
      )}
    </section>
  );
}
