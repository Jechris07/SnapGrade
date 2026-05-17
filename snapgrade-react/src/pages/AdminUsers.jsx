import { useState, useEffect }  from 'react';
import { toast }                from 'react-toastify';
import { getAllStudents, toggleStudentActive } from '../services/adminService';
import { getAllQuizzes }         from '../services/quizService';

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
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-indigo-950">Manage Users ◎</h2>
        <p className="text-sm text-gray-400 mt-1">{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="p-4 border-b border-indigo-50">
          <input className="form-input" type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."/>
        </div>
        {loading
          ? <div className="py-12 text-center text-gray-300 text-sm">Loading students...</div>
          : !filtered.length
          ? <div className="py-12 text-center text-gray-300 text-sm">No students found</div>
          : filtered.map(u => {
            const uQ  = quizzes.filter(q => q.userId === u.uid);
            const avg = uQ.length ? Math.round(uQ.reduce((s, q) => s + (q.score / q.totalItems * 100), 0) / uQ.length) : null;
            const joined = new Date(u.createdAt).toLocaleDateString('en-PH');
            return (
              <div key={u.uid} className="flex items-center gap-4 px-5 py-4 border-b border-indigo-50 last:border-0 hover:bg-indigo-50 transition-colors">
                <div className="w-11 h-11 rounded-md flex items-center justify-center text-lg font-black text-indigo-500 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#667eea22,#764ba222)' }}>
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-indigo-950">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#c4b5fd' }}>
                    {uQ.length} quiz{uQ.length !== 1 ? 'zes' : ''}{avg !== null ? ` · avg ${avg}%` : ''} · joined {joined}
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
