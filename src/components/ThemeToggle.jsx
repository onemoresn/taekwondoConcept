import { useTheme } from '../context/ThemeProvider';

const LABELS = { system: 'System', dark: 'Dark', light: 'Light' };

export default function ThemeToggle({ compact = false }) {
  const { preference, setTheme, themes } = useTheme();

  if (compact) {
    const next = themes[(themes.indexOf(preference) + 1) % themes.length];
    return (
      <button
        type="button"
        className="theme-toggle theme-toggle--compact"
        onClick={() => setTheme(next)}
        aria-label={`Theme: ${LABELS[preference]}. Click to switch.`}
        title={`Theme: ${LABELS[preference]}`}
      >
        {preference === 'light' ? '☀' : preference === 'dark' ? '☾' : '◐'}
      </button>
    );
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {themes.map((t) => (
        <button
          key={t}
          type="button"
          className={`theme-toggle__btn${preference === t ? ' is-active' : ''}`}
          onClick={() => setTheme(t)}
          aria-pressed={preference === t}
        >
          {LABELS[t]}
        </button>
      ))}
    </div>
  );
}
