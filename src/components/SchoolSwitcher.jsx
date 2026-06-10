import { useSchool } from '../context/SchoolProvider';

export default function SchoolSwitcher() {
  const { schools, activeSchool, selectSchool, canSwitch, loading } = useSchool();

  if (loading || !activeSchool) return null;

  if (!canSwitch) {
    return (
      <span className="school-switcher school-switcher--static" title={activeSchool.city}>
        {activeSchool.name}
      </span>
    );
  }

  return (
    <label className="school-switcher">
      <span className="visually-hidden">Active dojang</span>
      <select
        value={activeSchool.id}
        onChange={(e) => selectSchool(e.target.value)}
        aria-label="Switch dojang"
      >
        {schools.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </label>
  );
}
