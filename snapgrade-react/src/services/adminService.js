// ─────────────────────────────────────────────────────────────────
//  services/adminService.js  — Supabase users + local quiz analytics
// ─────────────────────────────────────────────────────────────────

import { supabase } from '../supabase';
import { sanitizeEmail, sanitizeName, sanitizeRole } from '../utils/security';

const sg = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
};

function profileFromRow(row) {
  return {
    uid: row.id,
    name: sanitizeName(row.name),
    email: sanitizeEmail(row.email),
    role: sanitizeRole(row.role),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function getAllStudents() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, is_active, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load students:', error);
    throw new Error('Could not load students from Supabase.');
  }

  return data.map(profileFromRow);
}

export async function toggleStudentActive(uid, isActive) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: !isActive })
    .eq('id', uid)
    .eq('role', 'student');

  if (error) {
    console.error('Failed to update student status:', error);
    throw new Error('Could not update student status.');
  }
}

export function getAnalytics(fromDate = null, toDate = null) {
  let quizzes = sg.get('sg_quizzes', []).filter(q => q.completed)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  if (fromDate || toDate) {
    quizzes = quizzes.filter(q => {
      const d = new Date(q.completedAt);
      if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
      if (toDate   && d > new Date(toDate   + 'T23:59:59')) return false;
      return true;
    });
  }
  return quizzes;
}
