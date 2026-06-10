import { Link } from 'react-router-dom';

const LEARN_LINKS = [
  { to: '/student/learn/techniques', icon: '🥊', title: 'Technique library', desc: 'Demo videos filtered by belt' },
  { to: '/student/learn/lessons', icon: '🥋', title: 'Lesson plans', desc: 'Forms & one-step sparring steps' },
  { to: '/student/learn/exercises', icon: '💪', title: 'Daily exercises', desc: 'Check off your routine' },
  { to: '/student/learn/terms', icon: '📖', title: 'Terminology', desc: 'Swipe flashcards' },
];

export default function StudentLearnPage() {
  return (
    <div className="page">
      <h1 className="page-title">Learn</h1>
      <p className="page-desc">Techniques, forms, exercises, and Korean terms for your belt.</p>
      <div className="learn-grid">
        {LEARN_LINKS.map((item) => (
          <Link key={item.to} to={item.to} className="learn-card">
            <span className="learn-card__icon">{item.icon}</span>
            <strong>{item.title}</strong>
            <p>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
