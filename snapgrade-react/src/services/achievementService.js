const storage = {
  get: (key, fallback = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
};

export const ACHIEVEMENTS = [
  { id: 'first_quiz', title: 'First Spark', badge: 'Starter Badge', icon: '✨', color: '#6366f1', metric: 'total', target: 1, description: 'Complete your first quiz.' },
  { id: 'quiz_3', title: 'Study Streaker', badge: '3 Quiz Badge', icon: '🔥', color: '#0ea5e9', metric: 'total', target: 3, description: 'Complete 3 quizzes.' },
  { id: 'quiz_5', title: 'Quiz Explorer', badge: '5 Quiz Badge', icon: '🧭', color: '#14b8a6', metric: 'total', target: 5, description: 'Complete 5 quizzes.' },
  { id: 'quiz_10', title: 'Brain Builder', badge: '10 Quiz Badge', icon: '🧠', color: '#22c55e', metric: 'total', target: 10, description: 'Complete 10 quizzes.' },
  { id: 'quiz_20', title: 'Knowledge Climber', badge: '20 Quiz Badge', icon: '⛰️', color: '#84cc16', metric: 'total', target: 20, description: 'Complete 20 quizzes.' },
  { id: 'quiz_50', title: 'Study Legend', badge: '50 Quiz Badge', icon: '🏆', color: '#f59e0b', metric: 'total', target: 50, description: 'Complete 50 quizzes.' },
  { id: 'score_70', title: 'Solid Start', badge: '70% Badge', icon: '👍', color: '#38bdf8', metric: 'bestScore', target: 70, description: 'Score 70% or higher on any quiz.' },
  { id: 'score_80', title: 'Sharp Thinker', badge: '80% Badge', icon: '💡', color: '#a855f7', metric: 'bestScore', target: 80, description: 'Score 80% or higher on any quiz.' },
  { id: 'score_90', title: 'Honor Roll', badge: '90% Badge', icon: '🎖️', color: '#ec4899', metric: 'bestScore', target: 90, description: 'Score 90% or higher on any quiz.' },
  { id: 'perfect_score', title: 'Perfect Paper', badge: 'Perfect Badge', icon: '💯', color: '#f97316', metric: 'perfectScores', target: 1, description: 'Get a perfect score once.' },
  { id: 'perfect_3', title: 'Flawless Focus', badge: 'Triple Perfect Badge', icon: '🌟', color: '#ef4444', metric: 'perfectScores', target: 3, description: 'Get 3 perfect quiz scores.' },
  { id: 'questions_25', title: 'Question Crusher', badge: '25 Questions Badge', icon: '📝', color: '#06b6d4', metric: 'questionsAnswered', target: 25, description: 'Answer 25 total questions.' },
  { id: 'questions_100', title: 'Answer Architect', badge: '100 Questions Badge', icon: '📚', color: '#10b981', metric: 'questionsAnswered', target: 100, description: 'Answer 100 total questions.' },
  { id: 'correct_50', title: 'Accuracy Ace', badge: '50 Correct Badge', icon: '🎯', color: '#8b5cf6', metric: 'correctAnswers', target: 50, description: 'Answer 50 questions correctly.' },
  { id: 'avg_75', title: 'Consistent Learner', badge: '75 Avg Badge', icon: '📈', color: '#3b82f6', metric: 'averageScore', target: 75, description: 'Reach a 75% average score.' },
  { id: 'avg_85', title: 'Reliable Scholar', badge: '85 Avg Badge', icon: '🎓', color: '#d946ef', metric: 'averageScore', target: 85, description: 'Reach an 85% average score.' },
];

function claimedKey(userId) {
  return `sg_claimed_achievements_${userId}`;
}

export function getAchievementStats(quizzes) {
  const completed = quizzes.filter((quiz) => quiz.completed);
  const total = completed.length;
  const questionsAnswered = completed.reduce((sum, quiz) => sum + Number(quiz.totalItems || 0), 0);
  const correctAnswers = completed.reduce((sum, quiz) => sum + Number(quiz.score || 0), 0);
  const percentages = completed.map((quiz) => Math.round((Number(quiz.score || 0) / Number(quiz.totalItems || 1)) * 100));
  const bestScore = percentages.length ? Math.max(...percentages) : 0;
  const averageScore = questionsAnswered ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
  const perfectScores = completed.filter((quiz) => Number(quiz.score) === Number(quiz.totalItems)).length;

  return { total, questionsAnswered, correctAnswers, bestScore, averageScore, perfectScores };
}

export function getClaimedAchievements(userId) {
  return storage.get(claimedKey(userId), []);
}

export function claimAchievement(userId, achievementId) {
  const claimed = getClaimedAchievements(userId);
  if (claimed.includes(achievementId)) return claimed;

  const updated = [...claimed, achievementId];
  storage.set(claimedKey(userId), updated);
  return updated;
}

export function getAchievementProgress(quizzes, userId) {
  const stats = getAchievementStats(quizzes);
  const claimed = getClaimedAchievements(userId);

  return ACHIEVEMENTS.map((achievement) => {
    const value = stats[achievement.metric] || 0;
    const progress = Math.min(100, Math.round((value / achievement.target) * 100));
    const unlocked = value >= achievement.target;
    const isClaimed = claimed.includes(achievement.id);

    return {
      ...achievement,
      value,
      progress,
      unlocked,
      claimed: isClaimed,
      status: isClaimed ? 'claimed' : unlocked ? 'claimable' : 'locked',
    };
  });
}
