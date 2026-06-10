import { REQUIREMENT_TYPES } from '../constants/roles';

export default function RequirementContentView({ requirement }) {
  const { type, content = {} } = requirement;

  if (type === REQUIREMENT_TYPES.FORM) {
    return (
      <div className="req-content">
        {content.meaning && <p className="req-content__meaning">{content.meaning}</p>}
        {content.korean && <p className="req-content__korean">{content.korean}</p>}
        {content.steps?.length > 0 && (
          <ol className="step-list">
            {content.steps.map((step) => (
              <li key={step.n}><strong>{step.n}.</strong> {step.text}</li>
            ))}
          </ol>
        )}
      </div>
    );
  }

  if (type === REQUIREMENT_TYPES.TECHNIQUE) {
    return (
      <div className="req-content">
        {content.korean && <p className="req-content__korean">{content.korean}</p>}
        {content.keyPoints?.length > 0 && (
          <ul className="key-points">
            {content.keyPoints.map((pt) => <li key={pt}>{pt}</li>)}
          </ul>
        )}
        {content.videoUrl && (
          <a href={content.videoUrl} className="quick-link" target="_blank" rel="noreferrer">Watch demo →</a>
        )}
      </div>
    );
  }

  if (type === REQUIREMENT_TYPES.TERMINOLOGY) {
    return (
      <div className="req-content flashcard-grid">
        {(content.cards ?? []).map((card) => (
          <div key={card.korean} className="flashcard">
            <strong>{card.korean}</strong>
            <span>{card.english}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === REQUIREMENT_TYPES.SELF_DEFENSE) {
    return (
      <div className="req-content">
        {(content.steps ?? []).map((step) => (
          <div key={step.n ?? step.attack} className="sd-step">
            <p><strong>Attack:</strong> {step.attack}</p>
            <p><strong>Defense:</strong> {step.defense}</p>
            <p><strong>Counter:</strong> {step.counter}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === REQUIREMENT_TYPES.CONDITIONING) {
    return (
      <div className="req-content">
        <ul className="key-points">
          {content.category && <li>Category: {content.category}</li>}
          {content.reps && <li>{content.reps} reps</li>}
          {content.durationSec && <li>{content.durationSec} seconds</li>}
          {content.sets && <li>{content.sets} sets</li>}
        </ul>
      </div>
    );
  }

  if (type === REQUIREMENT_TYPES.LEADERSHIP) {
    return (
      <div className="req-content">
        <ul className="key-points">
          {(content.checklist ?? []).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    );
  }

  return null;
}
