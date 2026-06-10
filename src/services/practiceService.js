const FLASHCARD_KEY = 'dojang-flashcard-progress';
const EXERCISE_KEY = 'dojang-exercise-checkoffs';
const ASSIGNMENT_KEY = 'dojang-exercise-assignments';
const SESSION_KEY = 'dojang-flashcard-sessions';

function loadJson(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/** Spaced repetition buckets: new | learning | known */
export function getFlashcardProgress(studentId) {
  const all = loadJson(FLASHCARD_KEY, {});
  return all[studentId] ?? {};
}

export function updateFlashcardCard(studentId, cardId, bucket) {
  const all = loadJson(FLASHCARD_KEY, {});
  const student = { ...(all[studentId] ?? {}), [cardId]: bucket };
  all[studentId] = student;
  saveJson(FLASHCARD_KEY, all);
  return student;
}

export function logFlashcardSession(studentId, { reviewed, known, learning }) {
  const all = loadJson(SESSION_KEY, {});
  const sessions = all[studentId] ?? [];
  sessions.unshift({
    at: new Date().toISOString(),
    reviewed,
    known,
    learning,
  });
  all[studentId] = sessions.slice(0, 50);
  saveJson(SESSION_KEY, all);
  return sessions[0];
}

export function getFlashcardSessions(studentId) {
  const all = loadJson(SESSION_KEY, {});
  return all[studentId] ?? [];
}

export function getExerciseCheckoffs(studentId, beltSlug) {
  const all = loadJson(EXERCISE_KEY, {});
  const key = `${studentId}-${beltSlug}`;
  return all[key] ?? [];
}

export function toggleExerciseCheckoff(studentId, beltSlug, exerciseId) {
  const all = loadJson(EXERCISE_KEY, {});
  const key = `${studentId}-${beltSlug}`;
  const set = new Set(all[key] ?? []);
  if (set.has(exerciseId)) set.delete(exerciseId);
  else set.add(exerciseId);
  all[key] = [...set];
  saveJson(EXERCISE_KEY, all);
  return all[key];
}

export function getExerciseAssignments(instructorId) {
  const all = loadJson(ASSIGNMENT_KEY, {});
  return all[instructorId] ?? {};
}

export function setExerciseAssignment(instructorId, studentId, beltSlug) {
  const all = loadJson(ASSIGNMENT_KEY, {});
  const instructor = { ...(all[instructorId] ?? {}), [studentId]: beltSlug };
  all[instructorId] = instructor;
  saveJson(ASSIGNMENT_KEY, all);
  return instructor;
}

export function getAssignedBeltForStudent(instructorId, studentId, defaultBelt) {
  const assignments = getExerciseAssignments(instructorId);
  return assignments[studentId] ?? defaultBelt;
}

/** Find exercise belt assigned by any instructor (student view) */
export function getStudentAssignedExerciseBelt(studentId, defaultBelt) {
  const all = loadJson(ASSIGNMENT_KEY, {});
  for (const instructorId of Object.keys(all)) {
    if (all[instructorId]?.[studentId]) return all[instructorId][studentId];
  }
  return defaultBelt;
}

/** Order cards: learning first, then new, then known (for spaced repetition) */
export function orderFlashcards(cards, progress) {
  const order = { learning: 0, new: 1, known: 2 };
  return [...cards].sort((a, b) => {
    const pa = progress[a.id] ?? 'new';
    const pb = progress[b.id] ?? 'new';
    return (order[pa] ?? 1) - (order[pb] ?? 1);
  });
}
