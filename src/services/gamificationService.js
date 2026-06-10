import { getFlashcardSessions } from './practiceService';
import { DEMO_STUDENT_SCHOOLS } from '../data/schools';

const XP_KEY = 'dojang-gamification-xp';
const STREAK_KEY = 'dojang-gamification-streak';
const BADGES_KEY = 'dojang-gamification-badges';
const OPTIN_KEY = 'dojang-leaderboard-optin';
const ACTIVITY_KEY = 'dojang-daily-activity';

export const XP_REWARDS = {
  flashcard_card: 2,
  flashcard_session: 15,
  exercise_item: 5,
  exercise_routine_complete: 25,
  requirement_attempted: 15,
  requirement_approved: 50,
};

export const BADGE_DEFS = [
  { id: 'first_practice', title: 'First Steps', desc: 'Complete your first practice session', icon: '🥋' },
  { id: 'streak_3', title: '3-Day Streak', desc: 'Practice 3 days in a row', icon: '🔥' },
  { id: 'streak_7', title: 'Week Warrior', desc: 'Practice 7 days in a row', icon: '⚡' },
  { id: 'streak_30', title: 'Dedicated', desc: 'Practice 30 days in a row', icon: '🏆' },
  { id: 'xp_100', title: 'Rising Star', desc: 'Earn 100 XP', icon: '⭐' },
  { id: 'xp_500', title: 'Black Belt Mindset', desc: 'Earn 500 XP', icon: '🌟' },
  { id: 'cards_50', title: 'Term Master', desc: 'Review 50 flashcards', icon: '📚' },
  { id: 'cards_200', title: 'Scholar', desc: 'Review 200 flashcards', icon: '🎓' },
];

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getGamificationState(studentId) {
  const xpAll = loadJson(XP_KEY, {});
  const streakAll = loadJson(STREAK_KEY, {});
  const badgesAll = loadJson(BADGES_KEY, {});
  return {
    xp: xpAll[studentId] ?? 0,
    streak: streakAll[studentId] ?? { count: 0, lastDate: null },
    badges: badgesAll[studentId] ?? [],
  };
}

export function isLeaderboardOptIn(studentId) {
  const all = loadJson(OPTIN_KEY, {});
  return all[studentId] !== false;
}

export function setLeaderboardOptIn(studentId, optedIn) {
  const all = loadJson(OPTIN_KEY, {});
  all[studentId] = optedIn;
  saveJson(OPTIN_KEY, all);
}

function recordDailyActivity(studentId) {
  const all = loadJson(ACTIVITY_KEY, {});
  const days = new Set(all[studentId] ?? []);
  days.add(todayKey());
  all[studentId] = [...days].slice(-90);
  saveJson(ACTIVITY_KEY, all);
  return days.size;
}

function updateStreak(studentId) {
  const all = loadJson(STREAK_KEY, {});
  const current = all[studentId] ?? { count: 0, lastDate: null };
  const today = todayKey();
  const yesterday = yesterdayKey();

  let count = current.count;
  if (current.lastDate === today) {
    /* already counted today */
  } else if (current.lastDate === yesterday) {
    count += 1;
  } else {
    count = 1;
  }

  const next = { count, lastDate: today };
  all[studentId] = next;
  saveJson(STREAK_KEY, all);
  return next;
}

function addXp(studentId, amount) {
  const all = loadJson(XP_KEY, {});
  const next = (all[studentId] ?? 0) + amount;
  all[studentId] = next;
  saveJson(XP_KEY, all);
  return next;
}

function totalCardsReviewed(studentId) {
  return getFlashcardSessions(studentId).reduce((sum, s) => sum + (s.reviewed ?? 0), 0);
}

function evaluateBadges(studentId) {
  const { xp, streak, badges } = getGamificationState(studentId);
  const cards = totalCardsReviewed(studentId);
  const earned = new Set(badges);

  if (cards >= 1 || xp > 0) earned.add('first_practice');
  if (streak.count >= 3) earned.add('streak_3');
  if (streak.count >= 7) earned.add('streak_7');
  if (streak.count >= 30) earned.add('streak_30');
  if (xp >= 100) earned.add('xp_100');
  if (xp >= 500) earned.add('xp_500');
  if (cards >= 50) earned.add('cards_50');
  if (cards >= 200) earned.add('cards_200');

  const all = loadJson(BADGES_KEY, {});
  const next = [...earned];
  const prev = all[studentId] ?? [];
  all[studentId] = next;
  saveJson(BADGES_KEY, all);

  const newBadges = next.filter((b) => !prev.includes(b));
  return { badges: next, newBadges };
}

/**
 * Record practice activity and award XP. Returns updated state + any new badges.
 */
export function recordPractice(studentId, action, count = 1) {
  const perUnit = XP_REWARDS[action] ?? 0;
  const gained = perUnit * count;
  const xp = addXp(studentId, gained);
  const streak = updateStreak(studentId);
  recordDailyActivity(studentId);
  const { badges, newBadges } = evaluateBadges(studentId);
  return { xp, streak, badges, newBadges, gained };
}

export function getBadgeDetails(earnedIds) {
  const set = new Set(earnedIds);
  return BADGE_DEFS.map((b) => ({ ...b, earned: set.has(b.id) }));
}

export function getLevelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

export function getXpProgress(xp) {
  const level = getLevelFromXp(xp);
  const base = (level - 1) * 100;
  return { level, current: xp - base, next: 100, percent: xp - base };
}

/** Privacy-safe leaderboard entries for a school */
export function buildLeaderboard(schoolId, roster, { gamificationEnabled = true } = {}) {
  if (!gamificationEnabled) return [];
  return roster
    .filter((s) => isLeaderboardOptIn(s.id))
    .map((student) => {
      const state = getGamificationState(student.id);
      const sessions = getFlashcardSessions(student.id);
      const practiceDays = loadJson(ACTIVITY_KEY, {})[student.id]?.length ?? 0;
      return {
        id: student.id,
        displayName: privacyName(student.full_name),
        xp: state.xp,
        streak: state.streak.count,
        level: getLevelFromXp(state.xp),
        sessions: sessions.length,
        practiceDays,
        schoolId: DEMO_STUDENT_SCHOOLS[student.id] ?? schoolId,
      };
    })
    .sort((a, b) => b.xp - a.xp || b.streak - a.streak);
}

function privacyName(fullName) {
  if (!fullName) return 'Student';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0].charAt(0)}.`;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/** Demo roster entries for leaderboard when school has few students */
export function getDemoLeaderboardExtras(schoolId) {
  if (schoolId === 'school-beta') {
    return [
      { id: 'demo-lb-1', displayName: 'Sam R.', xp: 180, streak: 4, level: 2, sessions: 6, practiceDays: 8 },
      { id: 'demo-lb-2', displayName: 'Taylor K.', xp: 95, streak: 2, level: 1, sessions: 3, practiceDays: 4 },
    ];
  }
  return [
    { id: 'demo-lb-3', displayName: 'Morgan L.', xp: 220, streak: 5, level: 3, sessions: 8, practiceDays: 10 },
    { id: 'demo-lb-4', displayName: 'Casey J.', xp: 140, streak: 3, level: 2, sessions: 5, practiceDays: 6 },
  ];
}
