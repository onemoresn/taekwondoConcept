import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { getLessonPlansForBelt } from '../../data/practiceContent';
import { REQUIREMENT_TYPE_LABELS } from '../../data/curriculumSeed';
import { REQUIREMENT_TYPES } from '../../constants/roles';

export default function StudentLessonsPage() {
  const { profile } = useAuth();
  const beltSlug = profile?.belt_id ?? 'yellow';
  const { forms, selfDefense } = getLessonPlansForBelt(beltSlug);

  return (
    <div className="page">
      <Link to="/student/learn" className="auth-card__back">← Learn</Link>
      <h1 className="page-title">Lesson plans</h1>
      <p className="page-desc">Step-by-step forms and one-step sparring for your belt.</p>

      {forms.length > 0 && (
        <section className="panel">
          <h2>{REQUIREMENT_TYPE_LABELS[REQUIREMENT_TYPES.FORM]}</h2>
          {forms.map((form) => (
            <article key={form.slug} className="lesson-block">
              <h3>{form.title}</h3>
              {form.content?.meaning && <p className="req-content__meaning">{form.content.meaning}</p>}
              <ol className="step-list">
                {(form.content?.steps ?? []).map((step) => (
                  <li key={step.n}><strong>{step.n}.</strong> {step.text}</li>
                ))}
              </ol>
            </article>
          ))}
        </section>
      )}

      {selfDefense.length > 0 && (
        <section className="panel">
          <h2>{REQUIREMENT_TYPE_LABELS[REQUIREMENT_TYPES.SELF_DEFENSE]}</h2>
          {selfDefense.map((sd) => (
            <article key={sd.slug} className="lesson-block">
              <h3>{sd.title}</h3>
              <p>{sd.description}</p>
              {(sd.content?.steps ?? []).map((step) => (
                <div key={step.n ?? step.attack} className="sd-step">
                  <p><strong>Attack:</strong> {step.attack}</p>
                  <p><strong>Defense:</strong> {step.defense}</p>
                  <p><strong>Counter:</strong> {step.counter}</p>
                </div>
              ))}
            </article>
          ))}
        </section>
      )}

      {forms.length === 0 && selfDefense.length === 0 && (
        <p className="empty-note">No lesson plans for your belt yet.</p>
      )}
    </div>
  );
}
