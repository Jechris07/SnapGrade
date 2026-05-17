import { useState, useEffect }  from 'react';
import { toast }                from 'react-toastify';
import { useAuth }              from '../context/AuthContext';
import { getUserQuizzes }       from '../services/quizService';
import { updateUserName } from '../services/authService';
import { sanitizeName } from '../utils/security';

export default function Profile() {
  const { userProfile, setUserProfile } = useAuth();
  const [name,    setName]    = useState(userProfile?.name || '');
  const [editing, setEditing] = useState(false);
  const [stats,   setStats]   = useState({ total: 0, avg: null, best: null });

  useEffect(() => {
    if (!userProfile) return;
    setName(userProfile.name);
    const quizzes = getUserQuizzes(userProfile.uid);
    if (!quizzes.length) return;
    const avg  = Math.round(quizzes.reduce((s, q) => s + (q.score / q.totalItems * 100), 0) / quizzes.length);
    const best = Math.round(Math.max(...quizzes.map(q => q.score / q.totalItems * 100)));
    setStats({ total: quizzes.length, avg, best });
  }, [userProfile]);

  async function handleSave() {
    const safeName = sanitizeName(name);
    if (!safeName) { toast.error('Name cannot be empty.'); return; }

    try {
      const savedName = await updateUserName(userProfile.uid, safeName);
      const updated = { ...userProfile, name: savedName };
      setUserProfile(updated);
      setName(savedName);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.message || 'Could not update profile.');
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 page-enter">
      <div className="mb-6"><h2 className="text-2xl font-black text-indigo-950">Profile ◉</h2></div>
      <div className="card mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-md flex items-center justify-center text-white text-2xl font-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', boxShadow: '0 6px 20px rgba(102,126,234,0.4)' }}>
            {userProfile?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-black text-indigo-950">{userProfile?.name}</div>
            <div className="text-sm text-gray-400">{userProfile?.email}</div>
            <span className="badge badge-purple mt-1 inline-block capitalize">{userProfile?.role}</span>
          </div>
        </div>
        {editing ? (
          <div className="space-y-3">
            <label className="form-label">Display Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)}/>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={handleSave}>Save Changes</button>
              <button className="btn-ghost flex-1" onClick={() => { setEditing(false); setName(userProfile.name); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm text-indigo-500 font-bold hover:text-indigo-700 bg-transparent border-none cursor-pointer">
            Edit Name →
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[['◷', stats.total || '0', 'Total quizzes'],
          ['◈', stats.avg  !== null ? stats.avg  + '%' : '—', 'Avg score'],
          ['★', stats.best !== null ? stats.best + '%' : '—', 'Best score'],
        ].map(([icon, val, label]) => (
          <div key={label} className="bg-white rounded-md p-4 text-center"
            style={{ border: '1.5px solid rgba(102,126,234,0.12)', boxShadow: '0 2px 10px rgba(99,102,241,0.07)' }}>
            <div className="text-xl text-indigo-400 mb-1">{icon}</div>
            <div className="text-2xl font-black text-indigo-950">{val}</div>
            <div className="text-xs text-gray-400 mt-1 font-semibold">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
