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
  const { bg, fg } = getScoreColor(pct);
  const grade      = getScoreGrade(pct);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">

      {/* Score header */}
      <div className="card text-center mb-5 py-10"
        style={{ background: `linear-gradient(135deg,${bg}44,#fff)` }}>
        <div className="w-36 h-36 rounded-lg flex flex-col items-center justify-center mx-auto mb-4 animate-bounce-in"
          style={{ background: `linear-gradient(135deg,${fg}22,${fg}11)`, border: `4px solid ${fg}33` }}>
          <span className="font-black leading-none" style={{ fontSize: '3rem', color: fg, letterSpacing: '-2px' }}>
            {pct}%
          </span>
        </div>
        <h2 className="text-xl font-black text-indigo-950 mb-1">{grade}</h2>
        <p className="text-sm text-gray-400 mb-6">{quiz.score} out of {quiz.totalItems} correct</p>
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
      <h3 className="text-base font-black text-indigo-950 mb-3">Answer Review</h3>
      <div className="flex flex-col gap-3">
        {quiz.answers.map((a, i) => {
          const isCorrect    = a.userAnswer?.charAt(0) === a.correct;
          const correctChoice = a.choices?.find(c => c.startsWith(a.correct)) || '';
          return (
            <div key={i} className="bg-white rounded-md p-4"
              style={{ borderLeft: `4px solid ${isCorrect ? '#22c55e' : '#ef4444'}`,
                border: `1.5px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`,
                borderLeftWidth: 4 }}>
              <div className="flex gap-2 items-start">
                <span className={`text-xs font-black px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5
                  ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isCorrect ? '✓' : '✗'} Q{i + 1}
                </span>
                <p className="text-sm font-bold text-indigo-950 leading-relaxed">{a.question}</p>
              </div>
              {!isCorrect && (
                <div className="ml-10 mt-2 flex flex-col gap-1 text-xs">
                  <span className="text-red-400">Your answer: <strong>{a.userAnswer || 'Not answered'}</strong></span>
                  <span className="text-green-600">Correct: <strong>{correctChoice}</strong></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
