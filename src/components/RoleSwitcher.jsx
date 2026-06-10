import { Link } from 'react-router-dom';
import { ROLES, ROLE_LABELS } from '../constants/roles';

/** Phase 0: demo role switcher until auth in Phase 1 */
export default function RoleSwitcher({ currentRole }) {
  return (
    <div className="role-switcher">
      <span className="role-switcher__label">Preview as:</span>
      <div className="role-switcher__buttons">
        {Object.values(ROLES).map((role) => (
          <Link
            key={role}
            to={`/${role}`}
            className={`role-switcher__btn${currentRole === role ? ' is-active' : ''}`}
          >
            {ROLE_LABELS[role]}
          </Link>
        ))}
      </div>
    </div>
  );
}
