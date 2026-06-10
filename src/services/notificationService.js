import { supabase } from '../lib/supabaseClient';
import { isDemoAuthMode } from '../lib/authConfig';

const DEMO_NOTIFICATIONS_KEY = 'dojang-notifications';

function loadDemoNotifications(userId) {
  try {
    const raw = localStorage.getItem(`${DEMO_NOTIFICATIONS_KEY}-${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoNotifications(userId, items) {
  localStorage.setItem(`${DEMO_NOTIFICATIONS_KEY}-${userId}`, JSON.stringify(items));
}

export async function fetchNotifications(userId) {
  if (isDemoAuthMode()) {
    return loadDemoNotifications(userId).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId, userId) {
  if (isDemoAuthMode()) {
    const items = loadDemoNotifications(userId);
    const next = items.map((n) =>
      n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
    );
    saveDemoNotifications(userId, next);
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId) {
  if (isDemoAuthMode()) {
    const items = loadDemoNotifications(userId).map((n) => ({
      ...n,
      read_at: n.read_at ?? new Date().toISOString(),
    }));
    saveDemoNotifications(userId, items);
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
}

export async function createNotification({ userId, type, title, body, linkPath, metadata = {} }) {
  const row = {
    id: `demo-notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    type,
    title,
    body,
    link_path: linkPath,
    metadata,
    read_at: null,
    created_at: new Date().toISOString(),
  };

  if (isDemoAuthMode()) {
    const items = loadDemoNotifications(userId);
    items.unshift(row);
    saveDemoNotifications(userId, items);
    return row;
  }

  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_body: body,
    p_link_path: linkPath,
    p_metadata: metadata,
  });
  if (error) throw error;
  return { id: data };
}

export async function sendWorkflowEmail(payload) {
  if (isDemoAuthMode()) {
    console.info('[Demo email]', payload);
    return { ok: true, demo: true };
  }

  const { data, error } = await supabase.functions.invoke('send-workflow-email', {
    body: payload,
  });
  if (error) throw error;
  return data;
}

export async function notifyWorkflowEvent({
  event,
  studentName,
  requirementTitle,
  beltName,
  recipientUserIds,
  linkPath,
  feedback,
}) {
  const titles = {
    attempted: `${studentName} marked a requirement attempted`,
    parent_verified: `${studentName} — ready for instructor review`,
    approved: `Approved: ${requirementTitle}`,
    denied: `Needs work: ${requirementTitle}`,
  };

  const bodies = {
    attempted: `${studentName} (${beltName}) marked "${requirementTitle}" as attempted. Please verify.`,
    parent_verified: `Parent verified "${requirementTitle}" for ${studentName}. Review in your queue.`,
    approved: `Great work! "${requirementTitle}" was approved.${feedback ? ` Feedback: ${feedback}` : ''}`,
    denied: `"${requirementTitle}" needs more practice.${feedback ? ` Feedback: ${feedback}` : ''}`,
  };

  const notifications = recipientUserIds.map((userId) =>
    createNotification({
      userId,
      type: `workflow_${event}`,
      title: titles[event] ?? 'Dojang update',
      body: bodies[event] ?? '',
      linkPath,
      metadata: { event, studentName, requirementTitle, beltName },
    })
  );

  await Promise.all(notifications);

  await sendWorkflowEmail({
    event,
    studentName,
    requirementTitle,
    beltName,
    linkPath: `${import.meta.env.VITE_APP_URL || window.location.origin}${linkPath}`,
    feedback,
  });

  return { ok: true };
}

export function unreadCount(notifications) {
  return notifications.filter((n) => !n.read_at).length;
}
