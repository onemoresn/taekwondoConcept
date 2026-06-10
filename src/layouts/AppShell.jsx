import { Outlet } from 'react-router-dom';
import AppNav from '../components/AppNav';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import SchoolSwitcher from '../components/SchoolSwitcher';
import { useAuth } from '../context/AuthProvider';

export default function AppShell() {
  const { profile, demoMode, user } = useAuth();
  const role = profile?.role;

  return (
    <div className="app-shell">
      <div className="app-shell__body">
        {demoMode && (
          <div className="demo-banner">
            Demo mode — configure Supabase in <code>.env</code> for real authentication.
          </div>
        )}
        {user && (
          <header className="app-topbar">
            <SchoolSwitcher />
            <div className="app-topbar__actions">
              <ThemeToggle compact />
              <NotificationBell />
            </div>
          </header>
        )}
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
      <AppNav role={role} />
    </div>
  );
}
