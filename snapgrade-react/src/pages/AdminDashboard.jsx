import { useState, useEffect }   from 'react';
import { toast }                 from 'react-toastify';
import { getAllStudents, getAnalytics } from '../services/adminService';
import { exportStatisticsCSV }   from '../services/exportService';

const dashboardCardClass = 'bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-indigo-100/70 dark:border-slate-800/80 rounded-xl p-6 shadow-xl shadow-indigo-500/5 dark:shadow-black/20 text-slate-900 dark:text-white';
const adminInputClass = 'bg-slate-950 text-slate-100 border border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [quizzes,  setQuizzes]  = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  async function loadData(from, to) {
    try {
      const studentsData = await getAllStudents();
      setStudents(studentsData);
      setQuizzes(getAnalytics(from || null, to || null));
    } catch (err) {
      toast.error(err.message);
    }
  }

  useEffect(() => { loadData('', ''); }, []);

  function handleExport() {
    const ok = exportStatisticsCSV(students, quizzes, { from: dateFrom, to: dateTo });
    if (ok) toast.success('Statistics exported! Open with Excel.');
    else    toast.warn('No quiz data to export for the selected range.');
  }

  const avg = quizzes.length
    ? Math.round(quizzes.reduce((s, q) => s + (q.score / q.totalItems * 100), 0) / quizzes.length) : 0;
  const topStudents  = students.map(u => ({ ...u, count: quizzes.filter(q => q.userId === u.uid).length }))
    .sort((a, b) => b.count - a.count).slice(0, 5);
  const recentQuizzes = quizzes.slice(0, 8);
  const fromLabel = dateFrom ? new Date(dateFrom).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const toLabel   = dateTo   ? new Date(dateTo).toLocaleDateString('en-PH',   { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Admin Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overview of SnapGrade activity</p>
      </div>

      <div className={`${dashboardCardClass} mb-5`}>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="form-label dark:text-indigo-300">From Date</label>
            <input
              className={adminInputClass}
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); loadData(e.target.value, dateTo); }}
            />
          </div>
          <div className="flex-1 min-w-32">
            <label className="form-label dark:text-indigo-300">To Date</label>
            <input
              className={adminInputClass}
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); loadData(dateFrom, e.target.value); }}
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              className="btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              onClick={() => { setDateFrom(''); setDateTo(''); loadData('', ''); }}
            >
              Clear
            </button>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
              onClick={handleExport}
            >
              Export Excel
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">
          {fromLabel || toLabel
            ? `Showing ${fromLabel || 'start'} to ${toLabel || 'today'} - ${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''} found`
            : `Showing all-time data - ${quizzes.length} total quiz${quizzes.length !== 1 ? 'zes' : ''}`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[[students.length, '#667eea', 'Students registered'],
          [quizzes.length,  '#22c55e', 'Quizzes in range'],
          [avg + '%',       '#764ba2', 'Average score'],
          [students.filter(u => u.isActive).length, '#f093fb', 'Active students'],
        ].map(([val, color, label]) => (
          <div key={label} className={dashboardCardClass}>
            <div className="text-4xl font-black" style={{ color }}>{val}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className={dashboardCardClass}>
          <h3 className="font-black text-slate-900 dark:text-white mb-3 text-sm">Top Students</h3>
          {!topStudents.filter(u => u.count > 0).length
            ? <p className="text-sm text-slate-500 dark:text-slate-400">No activity in this range</p>
            : topStudents.filter(u => u.count > 0).map((u, i) => (
              <div key={u.uid} className="flex items-center gap-3 py-2 border-b border-indigo-100/70 dark:border-slate-800 last:border-0">
                <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs font-black text-indigo-500 dark:text-indigo-300">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{u.count} quiz{u.count !== 1 ? 'zes' : ''}</div>
                </div>
                <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'active' : 'inactive'}</span>
              </div>
            ))}
        </div>

        <div className={dashboardCardClass}>
          <h3 className="font-black text-slate-900 dark:text-white mb-3 text-sm">Recent Quizzes</h3>
          {!recentQuizzes.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No quizzes in this range</p>
            : recentQuizzes.map(q => {
              const pct  = Math.round((q.score / q.totalItems) * 100);
              const good = pct >= 75;
              const date = new Date(q.completedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
              return (
                <div key={q.id} className="flex items-center gap-3 py-2 border-b border-indigo-100/70 dark:border-slate-800 last:border-0">
                  <span className="text-xs font-black px-2 py-1 rounded-md flex-shrink-0"
                    style={{ background: good ? '#dcfce7' : '#fef9c3', color: good ? '#166534' : '#854d0e' }}>{pct}%</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{q.userName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{q.score}/{q.totalItems} - {date}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
