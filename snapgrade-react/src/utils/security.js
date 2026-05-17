const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAG_RE = /<[^>]*>/g;
const ROLE_ALLOWLIST = new Set(['student', 'admin']);

function toStringValue(value) {
  return value == null ? '' : String(value);
}

export function sanitizePlainText(value, {
  maxLength = 500,
  allowNewlines = false,
  stripMarkup = true,
} = {}) {
  let text = toStringValue(value)
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS_RE, '');

  if (stripMarkup) {
    text = text.replace(HTML_TAG_RE, '').replace(/[<>]/g, '');
  }

  if (!allowNewlines) {
    text = text.replace(/\s+/g, ' ');
  } else {
    text = text
      .split('\n')
      .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{4,}/g, '\n\n\n');
  }

  return text.trim().slice(0, maxLength);
}

export function sanitizeEmail(value) {
  return toStringValue(value)
    .replace(CONTROL_CHARS_RE, '')
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

export function sanitizeName(value) {
  return sanitizePlainText(value, { maxLength: 80 });
}

export function sanitizeRole(value) {
  return ROLE_ALLOWLIST.has(value) ? value : 'student';
}

export function sanitizeNotes(value) {
  return sanitizePlainText(value, {
    maxLength: 12000,
    allowNewlines: true,
    stripMarkup: true,
  });
}

export function sanitizeQuizText(value, maxLength = 500) {
  return sanitizePlainText(value, { maxLength });
}

export function sanitizeGeneratedQuestions(questions) {
  if (!Array.isArray(questions)) return [];

  return questions
    .map((item) => {
      const question = sanitizeQuizText(item?.question, 700);
      const choices = Array.isArray(item?.choices)
        ? item.choices.slice(0, 4).map((choice) => sanitizeQuizText(choice, 250))
        : [];
      const answer = /^[A-D]$/.test(item?.answer) ? item.answer : '';

      return { question, choices, answer };
    })
    .filter(({ question, choices, answer }) => (
      question &&
      answer &&
      choices.length === 4 &&
      choices.every(Boolean)
    ));
}

export function sanitizeQuizRecord(quiz) {
  if (!quiz || typeof quiz !== 'object') return null;

  const questions = sanitizeGeneratedQuestions(quiz.questions);
  const answers = Array.isArray(quiz.answers)
    ? quiz.answers.map((answer) => ({
        question: sanitizeQuizText(answer?.question, 700),
        choices: Array.isArray(answer?.choices)
          ? answer.choices.slice(0, 4).map((choice) => sanitizeQuizText(choice, 250))
          : [],
        correct: /^[A-D]$/.test(answer?.correct) ? answer.correct : '',
        userAnswer: sanitizeQuizText(answer?.userAnswer, 250),
      }))
    : undefined;

  return {
    ...quiz,
    id: sanitizeQuizText(quiz.id, 80),
    userName: sanitizeQuizText(quiz.userName, 80),
    notesPreview: sanitizeQuizText(quiz.notesPreview, 220),
    questions,
    answers,
  };
}
