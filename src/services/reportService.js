import { fetchRequirementsForBelt, countApprovedProgress } from './curriculumService';
import { fetchStudentProgress, fetchStudentBeltFlags, resolveProgressMap } from './progressService';
import { isDemoAuthMode } from '../lib/authConfig';
import { fetchRosterForInstructor } from './profileService';
import { filterRosterBySchool } from './schoolService';
import { DEMO_ROSTER } from '../data/demoData';
import { getBeltTestChecklist } from '../data/practiceContent';
import { getBeltById } from '../data/belts';
import { PROGRESS_STATUS_LABELS } from '../constants/roles';

export async function buildStudentReadinessReport(student) {
  const beltSlug = student.belt_id;
  const [requirements, progress, flags] = await Promise.all([
    fetchRequirementsForBelt(beltSlug),
    fetchStudentProgress(student.id),
    fetchStudentBeltFlags(student.id),
  ]);
  const map = resolveProgressMap(requirements, progress);
  const { total, approved, percent } = countApprovedProgress(requirements, map);

  const rows = requirements.map((req) => ({
    title: req.title,
    type: req.type,
    status: PROGRESS_STATUS_LABELS[map[req.id]] ?? map[req.id],
    approved: map[req.id] === 'instructor_approved',
  }));

  return {
    student,
    belt: getBeltById(beltSlug),
    percent,
    approved,
    total,
    flags,
    rows,
  };
}

export async function buildClassReadinessReport(instructorId, schoolId = null) {
  let roster;
  if (isDemoAuthMode()) {
    roster = DEMO_ROSTER.map((r) => ({
      id: r.studentId,
      full_name: r.name,
      belt_id: r.beltId,
      role: 'student',
    }));
  } else {
    roster = await fetchRosterForInstructor(instructorId);
  }
  const filtered = filterRosterBySchool(roster, schoolId);
  const reports = await Promise.all(filtered.map((s) => buildStudentReadinessReport(s)));
  return reports;
}

export function exportReadinessCsv(reports) {
  const lines = ['Name,Belt,Approved,Total,Percent,Test Ready,Tips,Stripes'];
  reports.forEach((r) => {
    lines.push([
      r.student.full_name,
      r.belt?.name ?? r.student.belt_id,
      r.approved,
      r.total,
      r.percent,
      r.flags.test_ready ? 'Yes' : 'No',
      r.flags.tips,
      r.flags.stripes,
    ].map(escapeCsv).join(','));
  });
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv' }), 'dojang-readiness-report.csv');
}

export function exportStudentDetailCsv(report) {
  const lines = [
    `Student,${escapeCsv(report.student.full_name)}`,
    `Belt,${escapeCsv(report.belt?.name ?? '')}`,
    `Progress,${report.approved}/${report.total} (${report.percent}%)`,
    '',
    'Requirement,Type,Status',
  ];
  report.rows.forEach((row) => {
    lines.push([row.title, row.type, row.status].map(escapeCsv).join(','));
  });
  downloadBlob(
    new Blob([lines.join('\n')], { type: 'text/csv' }),
    `${report.student.full_name.replace(/\s+/g, '-')}-progress.csv`
  );
}

function escapeCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printBeltTestChecklist(beltSlug, branding = {}) {
  const belt = getBeltById(beltSlug);
  const items = getBeltTestChecklist(beltSlug);
  const schoolName = branding.name ?? 'Dojang';
  const accent = branding.primary_color ?? '#e8222a';
  const city = branding.city ? `<p class="sub">${branding.city}</p>` : '';
  const logo = branding.logo_url
    ? `<img src="${branding.logo_url}" alt="" style="max-height:48px;margin-bottom:12px" />`
    : '';
  const html = `<!DOCTYPE html><html><head><title>${schoolName} — ${belt?.name} Test Checklist</title>
<style>
body{font-family:Inter,Arial,sans-serif;padding:32px;max-width:720px;margin:0 auto}
h1{color:${accent};margin-bottom:4px}.sub{color:#666;margin-bottom:24px}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:left}
th{background:#f5f5f5}.check{width:40px;text-align:center}
.footer{margin-top:32px;font-size:12px;color:#888;border-top:2px solid ${accent};padding-top:16px}
@media print{body{padding:16px}}
</style></head><body>
${logo}
<h1>${schoolName}</h1>
${city}
<p class="sub">${belt?.name} · Belt Test Checklist · ${new Date().toLocaleDateString()}</p>
<table><thead><tr><th class="check">✓</th><th>Requirement</th><th>Notes</th></tr></thead><tbody>
${items.map((i) => `<tr><td class="check"></td><td><strong>${i.title}</strong><br><small>${i.description ?? ''}</small></td><td></td></tr>`).join('')}
</tbody></table>
<p class="footer">Instructor signature: _________________________ Date: __________ · ${schoolName}</p>
<script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export function printReadinessReport(reports, branding = {}) {
  const schoolName = branding.name ?? 'Dojang';
  const accent = branding.primary_color ?? '#e8222a';
  const rows = reports.map((r) => `
    <tr>
      <td>${r.student.full_name}</td>
      <td>${r.belt?.name ?? r.student.belt_id}</td>
      <td>${r.approved}/${r.total} (${r.percent}%)</td>
      <td>${r.flags.test_ready ? '✓' : '—'}</td>
      <td>${r.flags.tips}</td>
      <td>${r.flags.stripes}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><title>${schoolName} — Class Readiness</title>
<style>body{font-family:Inter,Arial,sans-serif;padding:32px}h1{color:${accent}}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5}.heat-high{background:#dcfce7}.heat-mid{background:#fef9c3}.heat-low{background:#fee2e2}
.footer{margin-top:24px;font-size:12px;color:#888;border-top:2px solid ${accent};padding-top:12px}
</style></head><body>
<h1>${schoolName}</h1>
<p>Class Readiness Report · ${new Date().toLocaleDateString()}${branding.city ? ` · ${branding.city}` : ''}</p>
<table><thead><tr><th>Student</th><th>Belt</th><th>Progress</th><th>Test ready</th><th>Tips</th><th>Stripes</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="footer">Generated by Dojang · ${schoolName}</p>
<script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export function printStudentReadinessReport(report, branding = {}) {
  const schoolName = branding.name ?? 'Dojang';
  const accent = branding.primary_color ?? '#e8222a';
  const rows = report.rows.map((row) => `
    <tr class="${row.approved ? 'heat-high' : ''}">
      <td>${row.title}</td>
      <td>${row.type}</td>
      <td>${row.status}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><title>${report.student.full_name} — Readiness</title>
<style>
body{font-family:Inter,Arial,sans-serif;padding:32px;max-width:720px;margin:0 auto}
h1{color:${accent}}.sub{color:#666}
table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5}.heat-high{background:#dcfce7}
.footer{margin-top:24px;font-size:12px;color:#888;border-top:2px solid ${accent};padding-top:12px}
</style></head><body>
<h1>${schoolName}</h1>
<p class="sub">Belt Test Readiness · ${report.student.full_name} · ${report.belt?.name ?? ''}</p>
<p><strong>${report.approved}/${report.total}</strong> requirements approved (${report.percent}%)
 · Tips: ${report.flags.tips} · Stripes: ${report.flags.stripes}
 · Test ready: ${report.flags.test_ready ? 'Yes' : 'No'}</p>
<table><thead><tr><th>Requirement</th><th>Type</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="footer">${new Date().toLocaleDateString()} · ${schoolName}</p>
<script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export function heatmapClass(reports) {
  return reports.map((r) => ({
    ...r,
    heat: r.percent >= 80 ? 'high' : r.percent >= 50 ? 'mid' : 'low',
  }));
}
