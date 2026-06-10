import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useSchool } from '../../context/SchoolProvider';
import {
  buildClassReadinessReport,
  exportReadinessCsv,
  exportStudentDetailCsv,
  printBeltTestChecklist,
  printReadinessReport,
  printStudentReadinessReport,
} from '../../services/reportService';
import { BELT_OPTIONS } from '../../data/practiceContent';

export default function InstructorReportsPage() {
  const { profile } = useAuth();
  const { activeSchool } = useSchool();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checklistBelt, setChecklistBelt] = useState('yellow');

  useEffect(() => {
    if (!profile?.id) return;
    buildClassReadinessReport(profile.id, activeSchool?.id)
      .then(setReports)
      .finally(() => setLoading(false));
  }, [profile?.id, activeSchool?.id]);

  const branding = activeSchool ?? { name: 'Dojang', primary_color: '#e8222a' };

  return (
    <div className="page">
      <h1 className="page-title">Reports</h1>
      <p className="page-desc">Export class readiness, student progress, and printable belt test checklists.</p>

      <section className="panel">
        <h2>Class export</h2>
        <div className="report-actions">
          <button type="button" className="btn btn-primary" disabled={loading || !reports.length} onClick={() => exportReadinessCsv(reports)}>
            Download class CSV
          </button>
          <button type="button" className="btn btn-secondary" disabled={loading || !reports.length} onClick={() => printReadinessReport(reports, branding)}>
            Print class report
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Belt test checklist</h2>
        <div className="filter-row">
          <label className="auth-field">
            <span>Belt</span>
            <select value={checklistBelt} onChange={(e) => setChecklistBelt(e.target.value)}>
              {BELT_OPTIONS.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-secondary" onClick={() => printBeltTestChecklist(checklistBelt, branding)}>
            Print checklist (PDF)
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Per-student export</h2>
        {loading ? (
          <p className="empty-note">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="empty-note">No students on roster.</p>
        ) : (
          <ul className="req-list">
            {reports.map((r) => (
              <li key={r.student.id} className="req-list__item">
                <div className="req-list__body">
                  <strong>{r.student.full_name}</strong>
                  <p>{r.approved}/{r.total} approved ({r.percent}%)</p>
                </div>
                <div className="req-list__actions">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => exportStudentDetailCsv(r)}>
                    CSV
                  </button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => printStudentReadinessReport(r, branding)}>
                    Print
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
