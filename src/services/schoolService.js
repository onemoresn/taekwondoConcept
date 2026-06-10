import { isDemoAuthMode } from '../lib/authConfig';
import { supabase } from '../lib/supabaseClient';
import {
  DEMO_SCHOOLS,
  DEMO_INSTRUCTOR_SCHOOLS,
  DEMO_STUDENT_SCHOOLS,
} from '../data/schools';

const ACTIVE_SCHOOL_KEY = 'dojang-active-school';
const SCHOOL_SETTINGS_KEY = 'dojang-school-settings';

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

export async function fetchSchoolsForInstructor(instructorId) {
  if (isDemoAuthMode()) {
    const ids = DEMO_INSTRUCTOR_SCHOOLS[instructorId] ?? [DEMO_SCHOOLS[0].id];
    return DEMO_SCHOOLS.filter((s) => ids.includes(s.id));
  }
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('instructor_schools')
    .select('school_id, schools:school_id ( id, name, city, primary_color, logo_url )')
    .eq('instructor_id', instructorId);
  if (error) throw error;
  return data?.map((row) => row.schools).filter(Boolean) ?? [];
}

export async function fetchSchoolForStudent(studentId) {
  if (isDemoAuthMode()) {
    const schoolId = DEMO_STUDENT_SCHOOLS[studentId] ?? DEMO_SCHOOLS[0].id;
    return DEMO_SCHOOLS.find((s) => s.id === schoolId) ?? DEMO_SCHOOLS[0];
  }
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('student_schools')
    .select('school_id, schools:school_id ( id, name, city, primary_color, logo_url )')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data?.schools ?? null;
}

export function getActiveSchoolId(userId) {
  const all = loadJson(ACTIVE_SCHOOL_KEY, {});
  return all[userId] ?? null;
}

export function setActiveSchoolId(userId, schoolId) {
  const all = loadJson(ACTIVE_SCHOOL_KEY, {});
  all[userId] = schoolId;
  saveJson(ACTIVE_SCHOOL_KEY, all);
}

export function getSchoolSettings(schoolId) {
  const all = loadJson(SCHOOL_SETTINGS_KEY, {});
  return all[schoolId] ?? { gamification_enabled: true, leaderboard_enabled: true };
}

export function updateSchoolSettings(schoolId, patch) {
  const all = loadJson(SCHOOL_SETTINGS_KEY, {});
  all[schoolId] = { ...getSchoolSettings(schoolId), ...patch };
  saveJson(SCHOOL_SETTINGS_KEY, all);
  return all[schoolId];
}

export function filterRosterBySchool(roster, schoolId) {
  if (!schoolId) return roster;
  if (!isDemoAuthMode()) return roster;
  return roster.filter((student) => DEMO_STUDENT_SCHOOLS[student.id] === schoolId);
}

export function getDemoSchoolById(schoolId) {
  return DEMO_SCHOOLS.find((s) => s.id === schoolId) ?? DEMO_SCHOOLS[0];
}
