import { sanitizeQuizText } from './security.js';

export function getWrongAnswerExplanation(correct, selected, explanation) {
  if (!selected || selected.charAt(0) === correct) return null;
  const text = typeof explanation === 'string' ? sanitizeQuizText(explanation, 700) : '';
  return text || 'This saved quiz has no explanation. Create a new quiz to get explanations for its answers.';
}
