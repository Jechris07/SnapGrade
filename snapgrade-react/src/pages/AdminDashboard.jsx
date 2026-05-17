import { useState, useEffect }   from 'react';
import { toast }                 from 'react-toastify';
import { getAllStudents, getAnalytics } from '../services/adminService';
import { exportStatisticsCSV }   from '../services/exportService';

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
    if (ok) toast.success('Statistics exported! Open with Excel. 📊');
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
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-indigo-950">Admin Dashboard ◈</h2>
        <p className="text-sm text-gray-400 mt-1">Overview of SnapGrade activity</p>
      </div>
      <div className="card mb-5 p-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); loadData(e.target.value, dateTo); }}
              style={{ padding: '0.6rem 0.85rem' }}/>
          </div>
          <div className="flex-1 min-w-32">
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); loadData(dateFrom, e.target.value); }}
              style={{ padding: '0.6rem 0.85rem' }}/>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              onClick={() => { setDateFrom(''); setDateTo(''); loadData('', ''); }}>Clear</button>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
              onClick={handleExport}>⬇ Export Excel</button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 font-semibold">
          {fromLabel || toLabel
            ? `Showing ${fromLabel || 'start'} to ${toLabel || 'today'} — ${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''} found`
            : `Showing all-time data — ${quizzes.length} total quiz${quizzes.length !== 1 ? 'zes' : ''}`}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[[students.length, '#667eea', 'Students registered'],
          [quizzes.length,  '#22c55e', 'Quizzes in range'],
          [avg + '%',       '#764ba2', 'Average score'],
          [students.filter(u => u.isActive).length, '#f093fb', 'Active students'],
        ].map(([val, color, label]) => (
          <div key={label} className="admin-stat">
            <div className="text-4xl font-black" style={{ color }}>{val}</div>
            <div className="text-xs text-gray-400 mt-1 font-semibold">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-black text-indigo-950 mb-3 text-sm">Top Students</h3>
          {!topStudents.filter(u => u.count > 0).length
            ? <p className="text-sm text-gray-300">No activity in this range</p>
            : topStudents.filter(u => u.count > 0).map((u, i) => (
              <div key={u.uid} className="flex items-center gap-3 py-2 border-b border-indigo-50 last:border-0">
                <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-500">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-indigo-950">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.count} quiz{u.count !== 1 ? 'zes' : ''}</div>
                </div>
                <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'active' : 'inactive'}</span>
              </div>
            ))}
        </div>
        <div className="card">
          <h3 className="font-black text-indigo-950 mb-3 text-sm">Recent Quizzes</h3>
          {!recentQuizzes.length ? <p className="text-sm text-gray-300">No quizzes in this range</p>
            : recentQuizzes.map(q => {
              const pct  = Math.round((q.score / q.totalItems) * 100);
              const good = pct >= 75;
              const date = new Date(q.completedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
              return (
                <div key={q.id} className="flex items-center gap-3 py-2 border-b border-indigo-50 last:border-0">
                  <span className="text-xs font-black px-2 py-1 rounded-md flex-shrink-0"
                    style={{ background: good ? '#dcfce7' : '#fef9c3', color: good ? '#166534' : '#854d0e' }}>{pct}%</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-700">{q.userName}</div>
                    <div className="text-xs text-gray-400">{q.score}/{q.totalItems} · {date}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
