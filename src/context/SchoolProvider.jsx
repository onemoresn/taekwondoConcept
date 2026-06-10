import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { ROLES } from '../constants/roles';
import {
  fetchSchoolsForInstructor,
  fetchSchoolForStudent,
  getActiveSchoolId,
  setActiveSchoolId,
  getSchoolSettings,
} from '../services/schoolService';

const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const { profile } = useAuth();
  const [schools, setSchools] = useState([]);
  const [activeSchool, setActiveSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsVersion, setSettingsVersion] = useState(0);

  const reload = useCallback(async () => {
    if (!profile?.id) {
      setSchools([]);
      setActiveSchool(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (profile.role === ROLES.INSTRUCTOR) {
        const list = await fetchSchoolsForInstructor(profile.id);
        setSchools(list);
        const stored = getActiveSchoolId(profile.id);
        const match = list.find((s) => s.id === stored) ?? list[0] ?? null;
        setActiveSchool(match);
        if (match) setActiveSchoolId(profile.id, match.id);
      } else if (profile.role === ROLES.STUDENT) {
        const school = await fetchSchoolForStudent(profile.id);
        setSchools(school ? [school] : []);
        setActiveSchool(school);
      } else {
        setSchools([]);
        setActiveSchool(null);
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    reload();
  }, [reload]);

  const selectSchool = useCallback(
    (schoolId) => {
      if (!profile?.id) return;
      const next = schools.find((s) => s.id === schoolId);
      if (!next) return;
      setActiveSchool(next);
      setActiveSchoolId(profile.id, next.id);
    },
    [profile?.id, schools]
  );

  const refreshSettings = useCallback(() => {
    setSettingsVersion((v) => v + 1);
  }, []);

  const settings = useMemo(() => {
    void settingsVersion;
    return activeSchool
      ? getSchoolSettings(activeSchool.id)
      : { gamification_enabled: true, leaderboard_enabled: true };
  }, [activeSchool, settingsVersion]);

  const value = useMemo(
    () => ({
      schools,
      activeSchool,
      selectSchool,
      loading,
      settings,
      reload,
      refreshSettings,
      canSwitch: profile?.role === ROLES.INSTRUCTOR && schools.length > 1,
    }),
    [schools, activeSchool, selectSchool, loading, settings, reload, refreshSettings, profile?.role]
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used within SchoolProvider');
  return ctx;
}
