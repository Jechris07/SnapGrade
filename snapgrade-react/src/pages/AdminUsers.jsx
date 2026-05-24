import { useState, useEffect }  from 'react';
import { toast }                from 'react-toastify';
import { getAllStudents, toggleStudentActive } from '../services/adminService';
import { getAllQuizzes }         from '../services/quizService';

const usersPanelClass = 'bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-indigo-100/70 dark:border-slate-800/80 rounded-xl shadow-xl shadow-indigo-500/5 dark:shadow-black/20 text-slate-900 dark:text-white overflow-hidden';
const searchInputClass = 'w-full bg-slate-950 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function AdminUsers() {
  const [students, setStudents] = useState([]);
  const [quizzes,  setQuizzes]  = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        const studentsData = await getAllStudents();
        setStudents(studentsData);
        setQuizzes(getAllQuizzes());
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  async function handleToggle(uid, isActive) {
    try {
      await toggleStudentActive(uid, isActive);
      setStudents(prev => prev.map(u => u.uid === uid ? { ...u, isActive: !isActive } : u));
      toast.success(`Account ${isActive ? 'deactivated' : 'reactivated'}.`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  const filtered = students.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Manage Users</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
      </div>

      <div className={usersPanelClass}>
        <div className="p-6 border-b border-indigo-100/70 dark:border-slate-800">
          <input
            className={searchInputClass}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
          />
        </div>

        {loading
          ? <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Loading students...</div>
          : !filtered.length
          ? <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">No students found</div>
          : filtered.map(u => {
            const uQ  = quizzes.filter(q => q.userId === u.uid);
            const avg = uQ.length ? Math.round(uQ.reduce((s, q) => s + (q.score / q.totalItems * 100), 0) / uQ.length) : null;
            const joined = new Date(u.createdAt).toLocaleDateString('en-PH');
            return (
              <div key={u.uid} className="flex items-center gap-4 px-6 py-4 border-b border-indigo-100/70 dark:border-slate-800 last:border-0 hover:bg-indigo-50/70 dark:hover:bg-white/5 transition-colors">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-black text-indigo-500 dark:text-indigo-300 flex-shrink-0 bg-gradient-to-br from-indigo-500/15 to-violet-500/15">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100">{u.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                  <div className="text-xs mt-0.5 text-violet-500 dark:text-violet-300">
                    {uQ.length} quiz{uQ.length !== 1 ? 'zes' : ''}{avg !== null ? ` - avg ${avg}%` : ''} - joined {joined}
                  </div>
                </div>
                <span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'} mr-2`}>{u.isActive ? 'active' : 'inactive'}</span>
                <button className={u.isActive ? 'btn-sm-danger' : 'btn-sm-green'} onClick={() => handleToggle(u.uid, u.isActive)}>
                  {u.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
