import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useSchool } from '../../context/SchoolProvider';
import { getAllTermCards, BELT_OPTIONS } from '../../data/practiceContent';
import { getFlashcardSessions } from '../../services/practiceService';
import FlashcardDeck from '../../components/FlashcardDeck';

export default function StudentFlashcardsPage() {
  const { profile } = useAuth();
  const { settings } = useSchool();
  const [filter, setFilter] = useState(profile?.belt_id ?? 'all');
  const [lastSession, setLastSession] = useState(null);
  const cards = getAllTermCards(filter === 'all' ? 'all' : filter);
  const sessions = getFlashcardSessions(profile.id);

  return (
    <div className="page">
      <Link to="/student/learn" className="auth-card__back">← Learn</Link>
      <h1 className="page-title">Terminology</h1>
      <p className="page-desc">Swipe or tap flashcards. Progress is saved for spaced repetition.</p>

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

      {cards.length === 0 ? (
        <p className="empty-note">No terms for this filter.</p>
      ) : (
        <FlashcardDeck
          cards={cards}
          studentId={profile.id}
          gamificationEnabled={settings.gamification_enabled}
          onSessionComplete={setLastSession}
        />
      )}

      {lastSession && (
        <p className="auth-banner auth-banner--success">
          Session logged: {lastSession.reviewed} reviewed, {lastSession.known} marked known.
        </p>
      )}

      {sessions.length > 0 && (
        <section className="panel">
          <h2>Recent sessions</h2>
          <ul className="session-list">
            {sessions.slice(0, 5).map((s) => (
              <li key={s.at}>
                {new Date(s.at).toLocaleString()} — {s.reviewed} cards
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
