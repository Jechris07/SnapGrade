// ─────────────────────────────────────────────────────────────────
//  services/quizService.js  — localStorage + backend quiz API
// ─────────────────────────────────────────────────────────────────

const sg = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

export async function generateQuestions(notes, numQ) {
  let response;

  try {
    response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, numQ }),
    });
  } catch (error) {
    throw new Error(
      'Unable to reach the backend API. Start the local API server with `npm run dev:api` and try again.'
    );
  }

  const text = await response.text();
  let data = {};

  if (text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Backend returned invalid JSON. Please try again or check the API server logs.');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Could not generate quiz. (${response.status})`);
  }

  if (!Array.isArray(data.questions) || !data.questions.length) {
    throw new Error('No questions generated. Try again.');
  }

  return data.questions;
}

export function saveQuiz(quizData) {
  const all = sg.get('sg_quizzes', []);
  const quiz = { ...quizData, id: 'quiz_' + Date.now(), completedAt: new Date().toISOString() };
  all.push(quiz);
  sg.set('sg_quizzes', all);
  return quiz.id;
}

export function getUserQuizzes(userId) {
  return sg.get('sg_quizzes', [])
    .filter(q => q.userId === userId && q.completed)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export function getAllQuizzes() {
  return sg.get('sg_quizzes', [])
    .filter(q => q.completed)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export function deleteQuiz(quizId) {
  const all = sg.get('sg_quizzes', []);
  sg.set('sg_quizzes', all.filter(q => q.id !== quizId));
}
