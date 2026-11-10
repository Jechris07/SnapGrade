import test from 'node:test';
import assert from 'node:assert/strict';
import { getWrongAnswerExplanation } from '../src/utils/answerFeedback.js';
import { sanitizeGeneratedQuestions, sanitizeQuizRecord } from '../src/utils/security.js';

const question = {
  question: 'What does photosynthesis produce?',
  choices: ['A. Glucose', 'B. Iron', 'C. Salt', 'D. Helium'],
  answer: 'A',
  explanation: 'Glucose is a sugar that stores energy produced during photosynthesis.',
};

test('explanation is hidden until an incorrect choice is selected', () => {
  assert.equal(getWrongAnswerExplanation('A', null, question.explanation), null);
  assert.equal(getWrongAnswerExplanation('A', '', question.explanation), null);
  assert.equal(getWrongAnswerExplanation('A', 'A. Glucose', question.explanation), null);
  assert.equal(getWrongAnswerExplanation('A', 'B. Iron', question.explanation), question.explanation);
  // Moving to another question clears the selection and hides its explanation.
  assert.equal(getWrongAnswerExplanation('B', null, question.explanation), null);
});

test('explanation survives generation, saving, reload and retaking', () => {
  const generated = sanitizeGeneratedQuestions([question]);
  const record = sanitizeQuizRecord({ questions: generated, answers: [{ question: question.question, choices: question.choices, correct: 'A', userAnswer: 'B. Iron', explanation: generated[0].explanation }] });
  const reloaded = sanitizeQuizRecord(JSON.parse(JSON.stringify(record)));
  assert.equal(reloaded.questions[0].explanation, question.explanation);
  assert.equal(reloaded.answers[0].explanation, question.explanation);
  assert.equal(getWrongAnswerExplanation(reloaded.answers[0].correct, reloaded.answers[0].userAnswer, reloaded.answers[0].explanation), question.explanation);
  const retake = sanitizeGeneratedQuestions(reloaded.questions);
  assert.equal(retake[0].explanation, question.explanation);
});

test('older saved quizzes remain usable without fabricated explanations', () => {
  const { explanation, ...legacy } = question;
  const [saved] = sanitizeGeneratedQuestions([legacy]);
  assert.equal(saved.answer, 'A');
  assert.equal(saved.explanation, '');
  assert.equal(getWrongAnswerExplanation('A', 'A. Glucose', saved.explanation), null);
  assert.match(getWrongAnswerExplanation('A', 'B. Iron', saved.explanation), /no explanation/);
});

test('explanations are sanitized and limited before storage and display', () => {
  const unsafe = '<script>alert(1)</script><b>Glucose</b> stores energy.\u0000';
  const [saved] = sanitizeGeneratedQuestions([{ ...question, explanation: unsafe }]);
  assert.equal(saved.explanation, 'Glucose stores energy.');
  const record = sanitizeQuizRecord({ questions: [question], answers: [{ correct: 'A', userAnswer: 'B. Iron', explanation: unsafe }] });
  assert.equal(record.answers[0].explanation, saved.explanation);
  assert.equal(getWrongAnswerExplanation('A', 'B. Iron', unsafe), saved.explanation);
  assert.equal(sanitizeGeneratedQuestions([{ ...question, explanation: 'x'.repeat(1000) }])[0].explanation.length, 700);
});
