import { useEffect, useState } from 'react';
import { useNavigate }          from 'react-router-dom';

function getScoreColor(pct) {
  if (pct >= 90) return { bg: '#dcfce7', fg: '#166534' };
  if (pct >= 75) return { bg: '#dbeafe', fg: '#1e40af' };
  if (pct >= 60) return { bg: '#fef9c3', fg: '#854d0e' };
  return           { bg: '#fee2e2', fg: '#991b1b' };
}

function getScoreGrade(pct) {
  if (pct >= 90) return 'Excellent! 🌟';
  if (pct >= 75) return 'Good job! 👍';
  if (pct >= 60) return 'Keep going! 💪';
  return           'Needs more review 📖';
}

export default function Results() {
  const navigate          = useNavigate();
  const [quiz, setQuiz]   = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('quiz_results');
    if (!raw) { navigate('/home'); return; }
    setQuiz(JSON.parse(raw));
  }, []);

  if (!quiz) return null;

  const pct        = Math.round((quiz.score / quiz.totalItems) * 100);
  const { fg } = getScoreColor(pct);
  const grade      = getScoreGrade(pct);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">

      {/* Score header */}
      <div className="w-full max-w-2xl mx-auto rounded-2xl p-8 text-center border transition-all duration-300 bg-white border-slate-200 shadow-xl dark:bg-[#11131d]/80 dark:backdrop-blur-md dark:border-indigo-400/15 dark:shadow-indigo-500/10 mb-5">
        <div className="w-32 h-32 mx-auto flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-950/50 dark:border-slate-800 transition-colors animate-bounce-in">
          <span className="font-black leading-none" style={{ fontSize: '3rem', color: fg, letterSpacing: '-2px' }}>
            {pct}%
          </span>
        </div>
        <h2 className="text-2xl font-black mt-4 text-slate-900 dark:text-white transition-colors">{grade}</h2>
        <p className="text-base font-semibold mt-2 block text-slate-600 dark:text-slate-300 transition-colors mb-6">{quiz.score} out of {quiz.totalItems} correct</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button className="btn-primary" style={{ width: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
            onClick={() => navigate('/home')}>
            ⚡ New Quiz
          </button>
          <button className="btn-ghost" onClick={() => navigate('/history')}>
            View History
          </button>
        </div>
      </div>

      {/* Answer review */}
      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100 transition-colors">Answer Review</h3>
      <div className="flex flex-col gap-3">
        {quiz.answers.map((a, i) => {
          const isCorrect    = a.userAnswer?.charAt(0) === a.correct;
          const correctChoice = a.choices?.find(c => c.startsWith(a.correct)) || '';
          return (
            <div key={i} className="p-5 mb-4 rounded-xl border transition-all duration-300 bg-white border-slate-200 shadow-sm dark:bg-[#11131d]/60 dark:border-indigo-400/15 dark:shadow-indigo-500/5">
              <div className="flex gap-2 items-start">
                <span className={`text-xs font-black px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5
                  ${isCorrect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                  {isCorrect ? '✓' : '✗'} Q{i + 1}
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{a.question}</p>
              </div>
              {!isCorrect && (
                <div className="ml-10 mt-2 flex flex-col gap-1 text-xs">
                  <span className="text-rose-600 dark:text-rose-400">Your answer: <strong>{a.userAnswer || 'Not answered'}</strong></span>
                  <span className="text-emerald-600 dark:text-emerald-400">Correct: <strong>{correctChoice}</strong></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
