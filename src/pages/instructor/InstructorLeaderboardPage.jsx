import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useSchool } from '../../context/SchoolProvider';
import { fetchRosterForInstructor } from '../../services/profileService';
import { filterRosterBySchool } from '../../services/schoolService';
import { buildLeaderboard, getDemoLeaderboardExtras } from '../../services/gamificationService';
import { updateSchoolSettings } from '../../services/schoolService';
import { DEMO_ROSTER } from '../../data/demoData';

export default function InstructorLeaderboardPage() {
  const { profile, demoMode } = useAuth();
  const { activeSchool, settings, refreshSettings } = useSchool();
  const [roster, setRoster] = useState([]);

  useEffect(() => {
    async function load() {
      if (demoMode) {
        const all = DEMO_ROSTER.map((r) => ({
          id: r.studentId,
          full_name: r.name,
          belt_id: r.beltId,
        }));
        setRoster(filterRosterBySchool(all, activeSchool?.id));
        return;
      }
      const all = await fetchRosterForInstructor(profile.id);
      setRoster(filterRosterBySchool(all, activeSchool?.id));
    }
    load();
  }, [profile.id, demoMode, activeSchool?.id]);

  const entries = settings.leaderboard_enabled
    ? [
        ...buildLeaderboard(activeSchool?.id, roster, { gamificationEnabled: settings.gamification_enabled }),
        ...(demoMode ? getDemoLeaderboardExtras(activeSchool?.id) : []),
      ].sort((a, b) => b.xp - a.xp || b.streak - a.streak)
    : [];

  function toggleSetting(key) {
    if (!activeSchool) return;
    updateSchoolSettings(activeSchool.id, { [key]: !settings[key] });
    refreshSettings();
  }

  return (
    <div className="page">
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-desc">
        Opt-in practice rankings for {activeSchool?.name ?? 'your school'}.
        Students control their own visibility.
      </p>

      <section className="panel">
        <h2>School settings</h2>
        <label className="flag-control flag-control--check">
          <input
            type="checkbox"
            checked={settings.gamification_enabled}
            onChange={() => toggleSetting('gamification_enabled')}
          />
          <span>Enable gamification (XP & badges)</span>
        </label>
        <label className="flag-control flag-control--check">
          <input
            type="checkbox"
            checked={settings.leaderboard_enabled}
            onChange={() => toggleSetting('leaderboard_enabled')}
          />
          <span>Enable leaderboard</span>
        </label>
      </section>

      {!settings.leaderboard_enabled ? (
        <p className="empty-note">Leaderboard is disabled for this school.</p>
      ) : entries.length === 0 ? (
        <p className="empty-note">No opted-in students yet.</p>
      ) : (
        <ol className="leaderboard-list">
          {entries.map((entry, i) => (
            <li key={entry.id} className="leaderboard-list__item">
              <span className="leaderboard-list__rank">#{i + 1}</span>
              <div className="leaderboard-list__body">
                <strong>{entry.displayName}</strong>
                <span>Lv {entry.level} · {entry.xp} XP · 🔥 {entry.streak} · {entry.practiceDays} practice days</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
