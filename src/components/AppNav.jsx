import { NavLink } from 'react-router-dom';
import { ROLE_LABELS } from '../constants/roles';
import { useAuth } from '../context/AuthProvider';

const NAV_BY_ROLE = {
  student: [
    { to: '/student', label: 'Home', end: true },
    { to: '/student/training', label: 'Training' },
    { to: '/student/learn', label: 'Learn' },
    { to: '/student/progress', label: 'Progress' },
    { to: '/student/leaderboard', label: 'Ranks' },
    { to: '/student/settings', label: 'Profile' },
  ],
  parent: [
    { to: '/parent', label: 'Home', end: true },
    { to: '/parent/verify', label: 'Verify' },
    { to: '/parent/videos', label: 'Videos' },
    { to: '/parent/children', label: 'Children' },
    { to: '/parent/settings', label: 'Profile' },
  ],
  instructor: [
    { to: '/instructor', label: 'Dashboard', end: true },
    { to: '/instructor/reviews', label: 'Reviews' },
    { to: '/instructor/students', label: 'Students' },
    { to: '/instructor/curriculum', label: 'Curriculum' },
    { to: '/instructor/reports', label: 'Reports' },
    { to: '/instructor/leaderboard', label: 'Ranks' },
    { to: '/instructor/settings', label: 'Profile' },
  ],
};

export default function AppNav({ role }) {
  const { profile } = useAuth();
  const items = NAV_BY_ROLE[role] ?? [];

  return (
    <nav className="app-nav" aria-label={`${ROLE_LABELS[role]} navigation`}>
      <div className="app-nav__brand">
        <span className="app-nav__brand-en">DOJANG</span>
        <span className="app-nav__brand-ko">도장</span>
        <span className="app-nav__role-tag">{ROLE_LABELS[role]}</span>
        {profile?.full_name && (
          <span className="app-nav__user">{profile.full_name}</span>
        )}
      </div>
      <div className="app-nav__links">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `app-nav__link${isActive ? ' is-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
