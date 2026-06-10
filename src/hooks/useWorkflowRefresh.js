import { useEffect, useCallback } from 'react';
import { isDemoAuthMode } from '../lib/authConfig';
import { supabase } from '../lib/supabaseClient';

/** Poll + optional Supabase realtime for workflow tables */
export function useWorkflowRefresh(onRefresh, pollIntervalMs = 15000) {
  const refresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  useEffect(() => {
    const interval = setInterval(refresh, pollIntervalMs);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    if (!isDemoAuthMode() && supabase) {
      const channel = supabase
        .channel('workflow-refresh')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_progress' }, refresh)
        .subscribe();
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, pollIntervalMs]);
}
