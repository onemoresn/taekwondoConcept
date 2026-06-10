import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unread, markRead, markAllRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleSelect(notification) {
    await markRead(notification.id);
    setOpen(false);
    if (notification.link_path) {
      navigate(notification.link_path);
    }
  }

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="notification-bell__btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        🔔
        {unread > 0 && <span className="notification-bell__badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel__head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="notification-panel__mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="notification-panel__empty">No notifications yet</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notification-item${n.read_at ? '' : ' is-unread'}`}
                    onClick={() => handleSelect(n)}
                  >
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                    <time>{new Date(n.created_at).toLocaleString()}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
