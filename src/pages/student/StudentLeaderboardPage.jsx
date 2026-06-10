import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useSchool } from '../../context/SchoolProvider';
import {
  buildLeaderboard,
  getDemoLeaderboardExtras,
  isLeaderboardOptIn,
} from '../../services/gamificationService';
import { DEMO_CHILDREN } from '../../data/demoData';

export default function StudentLeaderboardPage() {
  const { profile, demoMode } = useAuth();
  const { activeSchool, settings } = useSchool();

  const roster = demoMode
    ? [
        { id: profile.id, full_name: profile.full_name, belt_id: profile.belt_id },
        ...DEMO_CHILDREN.filter((c) => c.id !== profile.id).map((c) => ({
          id: c.id,
          full_name: c.name,
          belt_id: c.beltId,
        })),
      ]
    : [{ id: profile.id, full_name: profile.full_name, belt_id: profile.belt_id }];

  const entries = settings.leaderboard_enabled
    ? [
        ...buildLeaderboard(activeSchool?.id, roster, { gamificationEnabled: settings.gamification_enabled }),
        ...(demoMode ? getDemoLeaderboardExtras(activeSchool?.id) : []),
      ].sort((a, b) => b.xp - a.xp || b.streak - a.streak)
    : [];

  const myRank = entries.findIndex((e) => e.id === profile.id) + 1;
  const optedIn = isLeaderboardOptIn(profile.id);

  return (
    <div className="page">
      <Link to="/student" className="auth-card__back">← Home</Link>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-desc">
        Practice consistency rankings for {activeSchool?.name ?? 'your dojang'}.
        Only first name + last initial shown. Opt in from Profile settings.
      </p>

      {!settings.leaderboard_enabled && (
        <p className="empty-note">Leaderboard is disabled for this school.</p>
      )}

      {settings.leaderboard_enabled && !optedIn && (
        <div className="auth-banner auth-banner--info">
          You are hidden from the leaderboard. Enable &quot;Show on leaderboard&quot; in Profile settings to appear.
        </div>
      )}

      {settings.leaderboard_enabled && entries.length > 0 && (
        <>
          {optedIn && myRank > 0 && (
            <p className="phase-note">Your rank: #{myRank}</p>
          )}
          <ol className="leaderboard-list">
            {entries.map((entry, i) => (
              <li
                key={entry.id}
                className={`leaderboard-list__item${entry.id === profile.id ? ' is-me' : ''}`}
              >
                <span className="leaderboard-list__rank">#{i + 1}</span>
                <div className="leaderboard-list__body">
                  <strong>{entry.displayName}</strong>
                  <span>Lv {entry.level} · {entry.xp} XP · 🔥 {entry.streak}</span>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
