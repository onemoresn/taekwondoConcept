import { useState, useRef } from 'react';
import {
  getFlashcardProgress,
  updateFlashcardCard,
  logFlashcardSession,
  orderFlashcards,
} from '../services/practiceService';
import { recordPractice } from '../services/gamificationService';

export default function FlashcardDeck({ cards, studentId, onSessionComplete, gamificationEnabled = true }) {
  const ordered = orderFlashcards(cards, getFlashcardProgress(studentId));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, known: 0, learning: 0 });
  const touchStart = useRef(null);

  const card = ordered[index];
  const done = !card;

  function advance(bucket) {
    if (!card) return;
    updateFlashcardCard(studentId, card.id, bucket);
    setStats((s) => ({
      reviewed: s.reviewed + 1,
      known: s.known + (bucket === 'known' ? 1 : 0),
      learning: s.learning + (bucket === 'learning' ? 1 : 0),
    }));
    setFlipped(false);
    if (index + 1 >= ordered.length) {
      const reviewed = stats.reviewed + 1;
      const session = logFlashcardSession(studentId, {
        reviewed,
        known: stats.known + (bucket === 'known' ? 1 : 0),
        learning: stats.learning + (bucket === 'learning' ? 1 : 0),
      });
      if (gamificationEnabled) {
        recordPractice(studentId, 'flashcard_card', reviewed);
        recordPractice(studentId, 'flashcard_session', 1);
      }
      onSessionComplete?.(session);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function onTouchStart(e) {
    touchStart.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) < 50) {
      setFlipped((f) => !f);
    } else if (dx > 0) {
      advance('known');
    } else {
      advance('learning');
    }
    touchStart.current = null;
  }

  if (done) {
    return (
      <div className="flashcard-done">
        <h2>Session complete</h2>
        <p>{stats.reviewed} cards reviewed</p>
        <button type="button" className="btn btn-primary" onClick={() => { setIndex(0); setStats({ reviewed: 0, known: 0, learning: 0 }); }}>
          Study again
        </button>
      </div>
    );
  }

  return (
    <div className="flashcard-deck">
      <p className="flashcard-deck__meta">{index + 1} / {ordered.length} · tap to flip · swipe right = know, left = learning</p>
      <div
        className={`flashcard-card${flipped ? ' is-flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === ' ' && setFlipped((f) => !f)}
      >
        <div className="flashcard-card__face flashcard-card__front">
          <span className="flashcard-card__lang">Korean</span>
          <strong>{card.korean}</strong>
        </div>
        <div className="flashcard-card__face flashcard-card__back">
          <span className="flashcard-card__lang">English</span>
          <strong>{card.english}</strong>
        </div>
      </div>
      <div className="flashcard-actions">
        <button type="button" className="btn btn-secondary" onClick={() => advance('learning')}>Still learning</button>
        <button type="button" className="btn btn-primary" onClick={() => advance('known')}>Got it</button>
      </div>
    </div>
  );
}
