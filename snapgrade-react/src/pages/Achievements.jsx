import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getUserQuizzes } from '../services/quizService';
import { claimAchievement, getAchievementProgress, getAchievementStats } from '../services/achievementService';

function statusLabel(status) {
  if (status === 'claimed') return 'Claimed';
  if (status === 'claimable') return 'Ready to claim';
  return 'Locked';
}

function AchievementCard({ achievement, onClaim }) {
  const disabled = achievement.status !== 'claimable';
  const muted = achievement.status === 'locked';

  return (
    <div className="bg-white rounded-md p-4 flex flex-col gap-4"
      style={{
        border: achievement.status === 'claimable' ? `2px solid ${achievement.color}` : '1.5px solid rgba(102,126,234,0.12)',
        boxShadow: achievement.status === 'claimable' ? `0 3px 10px ${achievement.color}20` : '0 1px 5px rgba(99,102,241,0.08)',
        opacity: muted ? 0.72 : 1,
      }}>
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-md flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: achievement.color }}>
          {achievement.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-indigo-950 leading-tight">{achievement.title}</h3>
              <p className="text-xs font-bold mt-1" style={{ color: achievement.color }}>{achievement.badge}</p>
            </div>
            <span className={`badge rounded-md ${achievement.status === 'claimed' ? 'badge-green' : achievement.status === 'claimable' ? 'badge-purple' : 'badge-gray'}`}>
              {statusLabel(achievement.status)}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2">{achievement.description}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.min(achievement.value, achievement.target)} / {achievement.target}</span>
        </div>
        <div className="h-2.5 rounded-sm bg-gray-100 overflow-hidden">
          <div className="h-full rounded-sm transition-all" style={{ width: `${achievement.progress}%`, background: achievement.color }} />
        </div>
      </div>

      <button className={disabled ? 'btn-ghost' : 'btn-primary'} disabled={disabled} onClick={() => onClaim(achievement.id)}>
        {achievement.status === 'claimed' ? 'Badge Claimed' : achievement.status === 'claimable' ? 'Claim Badge' : 'Keep Studying'}
      </button>
    </div>
  );
}

export default function Achievements() {
  const { userProfile } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [claimVersion, setClaimVersion] = useState(0);

  useEffect(() => {
    if (!userProfile) return;
    setQuizzes(getUserQuizzes(userProfile.uid));
  }, [userProfile]);

  const achievements = useMemo(() => (
    userProfile ? getAchievementProgress(quizzes, userProfile.uid) : []
  ), [quizzes, userProfile, claimVersion]);

  const stats = useMemo(() => getAchievementStats(quizzes), [quizzes]);
  const claimed = achievements.filter((achievement) => achievement.status === 'claimed');
  const claimable = achievements.filter((achievement) => achievement.status === 'claimable');

  function handleClaim(achievementId) {
    const achievement = achievements.find((item) => item.id === achievementId);
    if (!achievement || achievement.status !== 'claimable') return;

    claimAchievement(userProfile.uid, achievementId);
    setClaimVersion((version) => version + 1);
    toast.success(`${achievement.badge} claimed!`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-indigo-950">Achievements</h2>
          <p className="text-sm text-gray-400 mt-1">Earn badges by completing quizzes, improving scores, and answering more questions.</p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-green rounded-md">{claimed.length} claimed</span>
          <span className="badge badge-purple rounded-md">{claimable.length} ready</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          ['Quizzes', stats.total],
          ['Best score', `${stats.bestScore}%`],
          ['Average', `${stats.averageScore}%`],
          ['Correct', stats.correctAnswers],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-md p-4"
            style={{ border: '1.5px solid rgba(102,126,234,0.12)', boxShadow: '0 1px 5px rgba(99,102,241,0.08)' }}>
            <div className="text-2xl font-black text-indigo-950">{value}</div>
            <div className="text-xs text-gray-400 font-bold mt-1">{label}</div>
          </div>
        ))}
      </div>

      {claimed.length > 0 && (
        <div className="bg-white rounded-md p-5 mb-5"
          style={{ border: '1.5px solid rgba(102,126,234,0.12)', boxShadow: '0 1px 5px rgba(99,102,241,0.08)' }}>
          <h3 className="text-lg font-black text-indigo-950 mb-3">Badge Collection</h3>
          <div className="flex flex-wrap gap-2">
            {claimed.map((achievement) => (
              <span key={achievement.id} className="px-3 py-2 rounded-md text-sm font-black text-white"
                style={{ background: achievement.color }}>
                <span className="mr-1">{achievement.icon}</span>{achievement.badge}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} onClaim={handleClaim} />
        ))}
      </div>
    </div>
  );
}
