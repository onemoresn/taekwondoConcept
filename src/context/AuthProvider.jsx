import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isDemoAuthMode } from '../lib/authConfig';
import { fetchProfile } from '../services/profileService';
import { ROLES } from '../constants/roles';

const DEMO_STORAGE_KEY = 'dojang-demo-auth';

const AuthContext = createContext(null);

function loadDemoSession() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDemoSession(session) {
  if (session) {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  }
}

const DEMO_PROFILES = {
  student: {
    id: 'demo-student-id',
    role: ROLES.STUDENT,
    full_name: 'Alex Kim',
    notification_email: 'alex@demo.local',
    belt_id: 'yellow',
  },
  parent: {
    id: 'demo-parent-id',
    role: ROLES.PARENT,
    full_name: 'Jordan Parent',
    notification_email: 'parent@demo.local',
    belt_id: 'white',
  },
  instructor: {
    id: 'demo-instructor-id',
    role: ROLES.INSTRUCTOR,
    full_name: 'Master Park',
    notification_email: 'instructor@demo.local',
    belt_id: 'black',
  },
};

export function AuthProvider({ children }) {
  const demoMode = isDemoAuthMode();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSupabaseProfile = useCallback(async (userId) => {
    const data = await fetchProfile(userId);
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (demoMode) {
      const demo = loadDemoSession();
      if (demo) {
        setUser({ id: demo.userId, email: demo.email });
        setProfile(DEMO_PROFILES[demo.role] ?? DEMO_PROFILES.student);
      }
      setLoading(false);
      return undefined;
    }

    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSupabaseProfile(session.user.id).catch((err) => setError(err.message));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            await loadSupabaseProfile(session.user.id);
          } catch (err) {
            setError(err.message);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [demoMode, loadSupabaseProfile]);

  const signIn = useCallback(async ({ email, password, demoRole }) => {
    setError(null);
    if (demoMode) {
      const existing = loadDemoSession();
      const role = demoRole ?? existing?.role ?? ROLES.STUDENT;
      const session = { userId: DEMO_PROFILES[role].id, email, role };
      saveDemoSession(session);
      setUser({ id: session.userId, email });
      setProfile(DEMO_PROFILES[role]);
      return { user: session, profile: DEMO_PROFILES[role] };
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    const loadedProfile = await loadSupabaseProfile(data.user.id);
    return { ...data, profile: loadedProfile };
  }, [demoMode, loadSupabaseProfile]);

  const signUp = useCallback(async ({ email, password, fullName, role }) => {
    setError(null);
    if (!Object.values(ROLES).includes(role)) {
      throw new Error('Invalid role selected');
    }

    if (demoMode) {
      const session = { userId: DEMO_PROFILES[role].id, email, role };
      saveDemoSession(session);
      setUser({ id: session.userId, email });
      setProfile({ ...DEMO_PROFILES[role], full_name: fullName });
      return { user: session };
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
      },
    });
    if (authError) throw authError;
    if (data.user) {
      await loadSupabaseProfile(data.user.id);
    }
    return data;
  }, [demoMode, loadSupabaseProfile]);

  const signOut = useCallback(async () => {
    setError(null);
    if (demoMode) {
      saveDemoSession(null);
      setUser(null);
      setProfile(null);
      return;
    }
    const { error: authError } = await supabase.auth.signOut();
    if (authError) throw authError;
    setUser(null);
    setProfile(null);
  }, [demoMode]);

  const resetPassword = useCallback(async (email) => {
    setError(null);
    if (demoMode) {
      return { message: 'Demo mode: password reset simulated.' };
    }
    const redirectTo = `${import.meta.env.VITE_APP_URL || window.location.origin}/login`;
    const { data, error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (authError) throw authError;
    return data;
  }, [demoMode]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id || demoMode) return profile;
    return loadSupabaseProfile(user.id);
  }, [user, demoMode, profile, loadSupabaseProfile]);

  const updateProfileLocal = useCallback((updates) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      demoMode,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile,
      updateProfileLocal,
      isAuthenticated: Boolean(user && profile),
    }),
    [user, profile, loading, error, demoMode, signIn, signUp, signOut, resetPassword, refreshProfile, updateProfileLocal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getDashboardPath(role) {
  return `/${role}`;
}
