import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    if (loading) return;
    const safeNotes = sanitizeNotes(notes);

    if (!safeNotes)        { toast.error('Please paste your notes first.'); return; }
    if (safeNotes.length < 60)   { toast.error('Notes are too short. Add more content.'); return; }
    if (!Number.isInteger(Number(numQ)) || Number(numQ) < 1 || Number(numQ) > 30){ toast.error('Number of questions must be 1-30.'); return; }
    setLoading(true);
    try {
      const questions = await generateQuestions(safeNotes, Number(numQ));
      sessionStorage.setItem('active_quiz', JSON.stringify({
        userId: userProfile.uid,
        userName: sanitizeQuizText(userProfile.name, 80),
        notesPreview: sanitizeQuizText(safeNotes.substring(0, 180) + (safeNotes.length > 180 ? '...' : ''), 220),
        questions, totalItems: questions.length,
      }));
      toast.success(`${questions.length} questions ready.`);
      navigate('/quiz');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="study-workspace">
      <header className="workspace-heading">
        <p className="eyebrow">Your study desk</p>
        <h1>A little practice.<br />A clearer understanding.</h1>
        <p>Turn what you’re studying into questions worth answering.</p>
      </header>
      <div className="workspace-grid">
        <form className="notes-panel" onSubmit={e => { e.preventDefault(); handleGenerate(); }} aria-busy={loading}>
          <div className="panel-heading"><div><span className="step-number">01</span><label htmlFor="study-notes">Start with your notes</label></div><span className="quiet-label">Text to practice</span></div>
          <textarea id="study-notes" className="notes-editor" rows={12} value={notes} disabled={loading} onChange={e => setNotes(e.target.value)} placeholder={'Paste a lesson, a chapter summary, or your own notes.\n\nInclude the key facts and concepts you want to remember.'} aria-describedby="notes-help" required minLength={60} />
          <div className="editor-footer" id="notes-help"><span>{notes.length > 0 && sanitizeNotes(notes).length < 60 ? 'Add a little more detail. At least 60 characters are needed.' : 'At least 60 characters. More detail makes better questions.'}</span><span>{notes.length.toLocaleString()} characters</span></div>
          <div className="quiz-settings">
            <div><label htmlFor="question-count" className="setting-label">Questions</label><p className="quiet-label">Choose a length that fits your session.</p></div>
            <div className="question-counts">
              {[5, 10, 15, 20].map(n => <button key={n} type="button" className={`count-button${Number(numQ) === n ? ' selected' : ''}`} aria-pressed={Number(numQ) === n} onClick={() => setNumQ(n)} disabled={loading}>{n}</button>)}
              <input id="question-count" aria-label="Custom number of questions" type="number" min="1" max="30" step="1" value={numQ} onChange={e => setNumQ(e.target.value)} disabled={loading} required />
            </div>
          </div>
          <div className="generate-footer">
            <p className="quiet-label" role="status">{loading ? 'Preparing your questions. This may take a moment.' : 'Multiple choice · 1–30 questions'}</p>
            <button className="btn-primary create-button" type="submit" disabled={loading || sanitizeNotes(notes).length < 60}>{loading ? <><span className="loading-spinner" aria-hidden="true" />Creating quiz…</> : <>Create quiz <span aria-hidden="true">→</span></>}</button>
          </div>
        </form>
        <aside className="study-sidebar" aria-label="Study overview">
          <section className="study-summary"><p className="eyebrow">Your practice so far</p><dl>{[[stats.total, 'Quizzes completed'], [stats.avg === null ? '—' : `${stats.avg}%`, 'Average score'], [stats.best === null ? '—' : `${stats.best}%`, 'Best score']].map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><Link to="/history" className="text-link">Review past quizzes <span aria-hidden="true">↗</span></Link></section>
          <section className="study-tip"><span className="eyebrow">Make it a useful session</span><h2>Read. Recall. Review.</h2><p>Use notes on one topic. Answer from memory, then review the questions you missed.</p><p className="tip-footnote">Generated questions can contain mistakes. Check answers against your source material.</p></section>
        </aside>
      </div>
    </div>
  );
}
