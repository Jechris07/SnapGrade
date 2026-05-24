import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate }         from 'react-router-dom';
import { toast }               from 'react-toastify';
import { useAuth }             from '../context/AuthContext';
import { generateQuestions, getUserQuizzes } from '../services/quizService';
import { sanitizeNotes, sanitizeQuizText } from '../utils/security';

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
    const safeNotes = sanitizeNotes(notes);

    if (!safeNotes)        { toast.error('Please paste your notes first.'); return; }
    if (safeNotes.length < 60)   { toast.error('Notes are too short. Add more content.'); return; }
    if (numQ < 1 || numQ > 30){ toast.error('Number of questions must be 1-30.'); return; }
    setLoading(true);
    try {
      const questions = await generateQuestions(safeNotes, numQ);
      sessionStorage.setItem('active_quiz', JSON.stringify({
        userId: userProfile.uid,
        userName: sanitizeQuizText(userProfile.name, 80),
        notesPreview: sanitizeQuizText(safeNotes.substring(0, 180) + (safeNotes.length > 180 ? '...' : ''), 220),
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
    <div className="mx-auto w-full max-w-2xl page-enter">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Generate a Quiz ⚡</h2>
        <p className="text-sm text-gray-400 mt-1 transition-colors duration-300 dark:text-slate-400">Paste your notes and AI will create a personalized quiz in seconds</p>
      </div>
      <div className="card mb-4 relative overflow-hidden bg-white/80 backdrop-blur-md border border-white/40 shadow-xl shadow-indigo-500/5 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-md before:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_0_32px_rgba(99,102,241,0.08)] dark:border-indigo-400/30 dark:bg-[#11131d]/80 dark:shadow-indigo-500/20 dark:focus-within:ring-indigo-400/60 dark:before:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_38px_rgba(99,102,241,0.16)]">
        <div className="mb-5">
          <label className="form-label dark:text-indigo-300">Your Study Notes</label>
          <textarea
            className="w-full min-h-[200px] p-4 rounded-xl !bg-slate-950/60 !text-slate-100 placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-y"
            rows={10}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={"Paste your study notes here...\n\nExample:\nThe mitochondria is the powerhouse of the cell..."}
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400 dark:text-slate-500">{notes.length} characters</span>
            {notes.length > 0 && notes.length < 60 && <span className="text-xs text-danger-500 font-semibold">Add more content (min. 60 chars)</span>}
          </div>
        </div>
        <div className="mb-5">
          <label className="form-label dark:text-indigo-300">Number of Questions</label>
          <p className="text-xs text-gray-400 mb-2 transition-colors duration-300 dark:text-slate-500">Type any number from 1 to 30, or pick a preset</p>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              min={1}
              max={30}
              value={numQ}
              onChange={e => setNumQ(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 p-2 rounded-lg border border-slate-200 bg-white text-slate-900 !text-slate-900 placeholder-slate-400 hover:border-indigo-300 hover:!text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:!text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:!text-slate-100 dark:hover:!text-slate-100 dark:focus:!text-slate-100 transition-colors duration-200"
              style={{ padding: '0.5rem' }}
            />
            <div className="relative flex gap-2 flex-wrap rounded-xl bg-indigo-50/60 p-1 transition-colors duration-300 dark:bg-white/5">
              {[5, 10, 15, 20].map(n => (
                <motion.button
                  key={n}
                  type="button"
                  onClick={() => setNumQ(n)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative isolate min-w-11 overflow-hidden rounded-lg border px-3 py-2 text-sm font-bold transition-colors duration-200 ${
                    numQ === n ? 'border-transparent text-white' : 'border-indigo-100 text-gray-500 hover:text-indigo-700 dark:border-indigo-300/10 dark:text-slate-400 dark:hover:text-indigo-200'
                  }`}
                >
                  {numQ === n && (
                    <motion.div
                      layoutId="question-count-pill"
                      className="absolute inset-0 z-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30 dark:shadow-indigo-500/40"
                      transition={{ type: 'spring', stiffness: 430, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{n}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        <motion.button
          className="btn-primary relative mx-auto overflow-hidden shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40"
          onClick={handleGenerate}
          disabled={loading}
          whileHover={loading ? undefined : { scale: 1.02, boxShadow: '0 14px 34px rgba(99,102,241,0.4)' }}
          whileTap={loading ? undefined : { scale: 0.98 }}
          animate={{ width: loading ? '92%' : '100%' }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        >
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 -left-1/2 z-0 w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
            animate={{ x: ['-120%', '340%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              {loading ? (
                <motion.span
                  key="loading"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <motion.span
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Generating...
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  Generate Quiz ⚡
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          ['◷', stats.total || '0', 'Quizzes taken'],
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
