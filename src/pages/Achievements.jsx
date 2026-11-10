import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserQuizzes } from '../services/quizService';
import { getAchievementStats } from '../services/achievementService';

export default function Achievements() {
  const { userProfile } = useAuth();
  const quizzes = useMemo(() => getUserQuizzes(userProfile.uid), [userProfile.uid]);
  const stats = getAchievementStats(quizzes);
  const recent = quizzes.slice(0, 10).reverse();
  return (
    <div className="progress-page">
      <header className="mb-8"><p className="eyebrow">Your learning record</p><h1 className="page-title">Study progress</h1><p className="muted-copy">See how your practice adds up, and where to go next.</p></header>
      <div className="progress-stats">{[[stats.total, 'Quizzes completed'], [stats.questionsAnswered, 'Questions answered'], [stats.total ? `${stats.averageScore}%` : '—', 'Overall accuracy'], [stats.correctAnswers, 'Correct answers']].map(([value, label]) => <div className="card" key={label}><p className="quiet-label">{label}</p><p className="metric-value">{value}</p></div>)}</div>
      <section className="card mt-6">
        <h2 className="section-title">Recent scores</h2><p className="quiet-label mb-6">Your last ten quizzes, from oldest to newest.</p>
        {recent.length ? <ol className="score-list">{recent.map((quiz, index) => {
          const pct = Math.round(quiz.score / quiz.totalItems * 100);
          return <li key={quiz.id}><span className="quiet-label">{String(index + 1).padStart(2, '0')}</span><div className="score-detail"><span>{quiz.notesPreview}</span><meter min="0" max="100" value={pct} aria-label={`Quiz ${index + 1} score`} /></div><strong>{pct}%</strong></li>;
        })}</ol> : <div className="empty-state"><h3>Your first session starts here.</h3><p>Complete a quiz to see your scores and accuracy over time.</p><Link to="/home" className="text-link">Create a quiz →</Link></div>}
      </section>
      {stats.total > 0 && <p className="quiet-label mt-5">Overall accuracy is the share of all questions you answered correctly. <Link to="/history" className="text-link">Open history to retake a quiz.</Link></p>}
    </div>
  );
}
