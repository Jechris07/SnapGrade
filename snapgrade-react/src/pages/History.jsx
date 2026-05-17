import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { toast }               from 'react-toastify';
import { useAuth }             from '../context/AuthContext';
import { getUserQuizzes, deleteQuiz } from '../services/quizService';

function getScoreColor(pct) {
  if (pct >= 90) return { bg: '#dcfce7', fg: '#166534' };
  if (pct >= 75) return { bg: '#dbeafe', fg: '#1e40af' };
  if (pct >= 60) return { bg: '#fef9c3', fg: '#854d0e' };
  return { bg: '#fee2e2', fg: '#991b1b' };
}

export default function History() {
  const { userProfile } = useAuth();
  const navigate        = useNavigate();
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    if (!userProfile) return;
    setQuizzes(getUserQuizzes(userProfile.uid));
  }, [userProfile]);

  function handleDelete(id) {
    if (!window.confirm('Delete this quiz from history?')) return;
    deleteQuiz(id);
    setQuizzes(prev => prev.filter(q => q.id !== id));
    toast.success('Quiz deleted.');
  }

  function handleRetake(quiz) {
    sessionStorage.setItem('active_quiz', JSON.stringify({
      userId: quiz.userId, userName: quiz.userName,
      notesPreview: quiz.notesPreview, questions: quiz.questions, totalItems: quiz.totalItems,
    }));
    navigate('/quiz');
  }

  if (!quizzes.length) return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center page-enter" style={{ paddingTop: '6rem' }}>
      <div className="text-6xl mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>📚</div>
      <h3 className="text-lg font-black text-indigo-950 mb-2">No quizzes yet</h3>
      <p className="text-sm text-gray-400 mb-6">Generate your first quiz to see it here</p>
      <div className="flex justify-center">
        <button className="btn-primary" style={{ width: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
          onClick={() => navigate('/home')}>⚡ Generate Quiz</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-indigo-950">Quiz History ◷</h2>
        <p className="text-sm text-gray-400 mt-1">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} completed</p>
      </div>
      <div className="flex flex-col gap-3">
        {quizzes.map((quiz, idx) => {
          const pct = Math.round((quiz.score / quiz.totalItems) * 100);
          const { bg, fg } = getScoreColor(pct);
          const date = new Date(quiz.completedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
          return (
            <div key={quiz.id} className="history-card" style={{ animationDelay: `${idx * 0.04}s` }}>
              <div className="w-14 h-14 rounded-md flex items-center justify-center font-black text-base flex-shrink-0"
                style={{ background: bg, color: fg }}>{pct}%</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-indigo-950 truncate">{quiz.notesPreview}</p>
                <p className="text-xs text-gray-400 mt-0.5">{quiz.score}/{quiz.totalItems} correct · {date}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="btn-sm-purple" onClick={() => handleRetake(quiz)}>Retake</button>
                <button className="btn-sm-danger" onClick={() => handleDelete(quiz.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
