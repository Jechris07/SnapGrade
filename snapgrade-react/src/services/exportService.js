// ─────────────────────────────────────────────────────────────────
//  services/exportService.js
//  Purpose : Builds and downloads a CSV statistics report.
//            CSV opens natively in Microsoft Excel.
// ─────────────────────────────────────────────────────────────────


// ── rowToCsv(row) ─────────────────────────────────────────────────
function rowToCsv(row) {
  return row.map(cell => {
    const text = String(cell === null || cell === undefined ? '' : cell);
    return (text.includes(',') || text.includes('"') || text.includes('\n'))
      ? '"' + text.replace(/"/g, '""') + '"'
      : text;
  }).join(',');
}


// ── exportStatisticsCSV(students, quizzes, dateRange) ────────────
export function exportStatisticsCSV(students, quizzes, dateRange = {}) {
  if (quizzes.length === 0) return false;

  const avg = quizzes.length
    ? Math.round(quizzes.reduce((s, q) => s + (q.score / q.totalItems * 100), 0) / quizzes.length)
    : 0;

  const fromLabel = dateRange.from
    ? new Date(dateRange.from).toLocaleDateString('en-PH') : 'All time';
  const toLabel = dateRange.to
    ? new Date(dateRange.to).toLocaleDateString('en-PH')   : 'All time';

  const rows = [];

  // Header
  rows.push(['SNAPGRADE — STATISTICS REPORT']);
  rows.push(['Generated on', new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })]);
  rows.push(['Date Range',   `${fromLabel}  to  ${toLabel}`]);
  rows.push([]);

  // Summary
  rows.push(['--- SUMMARY ---']);
  rows.push(['Total Students',     students.length]);
  rows.push(['Quizzes in Range',   quizzes.length]);
  rows.push(['Average Score',      avg + '%']);
  rows.push(['Active Students',    students.filter(u => u.isActive).length]);
  rows.push([]);

  // Student breakdown
  rows.push(['--- STUDENT BREAKDOWN ---']);
  rows.push(['Name', 'Email', 'Status', 'Quizzes Taken', 'Average Score', 'Best Score', 'Date Joined']);
  students.forEach(u => {
    const uQ     = quizzes.filter(q => q.userId === u.uid);
    const uAvg   = uQ.length ? Math.round(uQ.reduce((s, q) => s + (q.score / q.totalItems * 100), 0) / uQ.length) : null;
    const uBest  = uQ.length ? Math.round(Math.max(...uQ.map(q => q.score / q.totalItems * 100))) : null;
    const joined = u.createdAt?.toDate
      ? u.createdAt.toDate().toLocaleDateString('en-PH')
      : new Date(u.createdAt).toLocaleDateString('en-PH');
    rows.push([u.name, u.email, u.isActive ? 'Active' : 'Inactive', uQ.length, uAvg !== null ? uAvg + '%' : '—', uBest !== null ? uBest + '%' : '—', joined]);
  });
  rows.push([]);

  // Quiz log
  rows.push(['--- QUIZ LOG ---']);
  rows.push(['Student Name', 'Score', 'Total Items', 'Percentage', 'Date Taken']);
  quizzes.forEach(q => {
    const pct  = Math.round((q.score / q.totalItems) * 100);
    const date = q.completedAt?.toDate
      ? q.completedAt.toDate().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date(q.completedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    rows.push([q.userName, q.score, q.totalItems, pct + '%', date]);
  });

  // Build CSV and download
  const csv      = '\uFEFF' + rows.map(rowToCsv).join('\r\n');
  const blob     = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url      = URL.createObjectURL(blob);
  const link     = document.createElement('a');
  link.href      = url;
  link.download  = 'SnapGrade_Statistics_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
