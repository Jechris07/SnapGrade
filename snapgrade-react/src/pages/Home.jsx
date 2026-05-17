import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { toast }               from 'react-toastify';
import { useAuth }             from '../context/AuthContext';
import { generateQuestions, getUserQuizzes } from '../services/quizService';

export default function Home() {
  const { userProfile } = useAuth();
  const navigate        = useNavigate();
  const [notes,   setNotes]   = useState('');
  const [numQ,    setNumQ]    = useState(10);
  const [loading, setLoading] = useState(false);
  const [stats,   setStats]   = useState({ total: 0, avg: null, best: null });

  useEffect(() => {
    if (!userProfile) return;
    const quizzes = getUserQuizzes(userProfile.uid);
    if (!quizzes.length) return;
    const avg  = Math.round(quizzes.reduce((s, q) => s + (q.score / q.totalItems * 100), 0) / quizzes.length);
    const best = Math.round(Math.max(...quizzes.map(q => q.score / q.totalItems * 100)));
    setStats({ total: quizzes.length, avg, best });
  }, [userProfile]);

  async function handleGenerate() {
    if (!notes.trim())        { toast.error('Please paste your notes first.'); return; }
    if (notes.length < 60)   { toast.error('Notes are too short. Add more content.'); return; }
    if (numQ < 1 || numQ > 30){ toast.error('Number of questions must be 1–30.'); return; }
    setLoading(true);
    try {
      const questions = await generateQuestions(notes, numQ);
      sessionStorage.setItem('active_quiz', JSON.stringify({
        userId: userProfile.uid, userName: userProfile.name,
        notesPreview: notes.substring(0, 180) + (notes.length > 180 ? '...' : ''),
        questions, totalItems: questions.length,
      }));
      toast.success(`${questions.length} questions ready! Good luck 🎯`);
      navigate('/quiz');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-indigo-950 tracking-tight">Generate a Quiz ⚡</h2>
        <p className="text-sm text-gray-400 mt-1">Paste your notes and AI will create a personalized quiz in seconds</p>
      </div>
      <div className="card mb-4">
        <div className="mb-5">
          <label className="form-label">Your Study Notes</label>
          <textarea className="form-input" rows={10} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={"Paste your study notes here...\n\nExample:\nThe mitochondria is the powerhouse of the cell..."}/>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-300">{notes.length} characters</span>
            {notes.length > 0 && notes.length < 60 && <span className="text-xs text-red-400 font-semibold">Add more content (min. 60 chars)</span>}
          </div>
        </div>
        <div className="mb-5">
          <label className="form-label">Number of Questions</label>
          <p className="text-xs text-gray-400 mb-2">Type any number from 1 to 30, or pick a preset</p>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="number" min={1} max={30} value={numQ}
              onChange={e => setNumQ(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
              className="form-input text-center text-xl font-black text-purple-700"
              style={{ width: 100, padding: '0.6rem' }}/>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20].map(n => (
                <button key={n} onClick={() => setNumQ(n)}
                  className="px-3 py-2 rounded-md text-sm font-bold border-2 transition-all duration-200"
                  style={numQ === n
                    ? { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'transparent', boxShadow: '0 4px 12px rgba(102,126,234,0.35)' }
                    : { background: '#f0f4ff', color: '#6b7280', borderColor: '#e0e7ff' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading
            ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Generating...</>
            : '⚡ Generate Quiz'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[['◷', stats.total || '0', 'Quizzes taken'],
          ['◈', stats.avg  !== null ? stats.avg + '%'  : '—', 'Average score'],
          ['★', stats.best !== null ? stats.best + '%' : '—', 'Best score'],
        ].map(([icon, val, label], i) => (
          <div key={label} className="stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-2xl font-black leading-none">{val}</div>
            <div className="text-xs opacity-80 mt-1 font-semibold">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
