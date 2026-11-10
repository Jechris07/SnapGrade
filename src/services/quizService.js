// ─────────────────────────────────────────────────────────────────
//  services/quizService.js  — localStorage + backend quiz API
// ─────────────────────────────────────────────────────────────────

import { sanitizeGeneratedQuestions, sanitizeNotes, sanitizeQuizRecord } from '../utils/security';
import { supabase } from '../supabase';

const sg = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
  if (configuredUrl) return configuredUrl;

  if (typeof window !== 'undefined') {
    const localHosts = new Set(['localhost', '127.0.0.1']);
    if (localHosts.has(window.location.hostname)) return 'http://localhost:8787/api';
  }

  return '/api';
}

export async function generateQuestions(notes, numQ) {
  let response;
  const apiBaseUrl = getApiBaseUrl();
  const safeNotes = sanitizeNotes(notes);
  const safeNumQ = Math.min(30, Math.max(1, Number(numQ) || 1));
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Your session has expired. Sign in again.');

  try {
    response = await fetch(`${apiBaseUrl}/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ notes: safeNotes, numQ: safeNumQ }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    throw new Error(
      'Unable to generate a quiz. Please try again.'
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

  const questions = sanitizeGeneratedQuestions(data.questions);

  if (!questions.length) {
    throw new Error('No questions generated. Try again.');
  }

  return questions;
}

export function saveQuiz(quizData) {
  const all = sg.get('sg_quizzes', []);
  const quiz = sanitizeQuizRecord({
    ...quizData,
    id: 'quiz_' + Date.now(),
    completedAt: new Date().toISOString(),
  });
  all.push(quiz);
  sg.set('sg_quizzes', all);
  return quiz.id;
}

export function getUserQuizzes(userId) {
  return sg.get('sg_quizzes', [])
    .map(sanitizeQuizRecord)
    .filter(Boolean)
    .filter(q => q.userId === userId && q.completed)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export function getAllQuizzes() {
  return sg.get('sg_quizzes', [])
    .map(sanitizeQuizRecord)
    .filter(Boolean)
    .filter(q => q.completed)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export function deleteQuiz(quizId) {
  const all = sg.get('sg_quizzes', []);
  sg.set('sg_quizzes', all.filter(q => q.id !== quizId));
}
