import { useEffect, useState, useCallback } from 'react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  unreadCount,
} from '../services/notificationService';
import { isDemoAuthMode } from '../lib/authConfig';
import { supabase } from '../lib/supabaseClient';

export function useNotifications(userId, pollIntervalMs = 15000) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch {
      /* keep prior */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!userId) return undefined;

    const interval = setInterval(reload, pollIntervalMs);
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);

    if (!isDemoAuthMode() && supabase) {
      const channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => reload()
        )
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
  }, [userId, pollIntervalMs, reload]);

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id, userId);
    await reload();
  }, [userId, reload]);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead(userId);
    await reload();
  }, [userId, reload]);

  return {
    notifications,
    unread: unreadCount(notifications),
    loading,
    reload,
    markRead,
    markAllRead,
  };
}
