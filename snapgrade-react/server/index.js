import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeGeneratedQuestions, sanitizeNotes } from '../src/utils/security.js';

const PORT = Number(process.env.API_PORT || 8787);
const MAX_BODY_BYTES = 64 * 1024;

loadLocalEnv();

function loadLocalEnv() {
  const serverDir = dirname(fileURLToPath(import.meta.url));
  const envPaths = [
    resolve(serverDir, '.env'),
    resolve(process.cwd(), '.env'),
    resolve(serverDir, '..', '.env'),
  ];

  const envPath = envPaths.find((path) => existsSync(path));
  if (!envPath) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function getAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return '*';

  try {
    const { hostname } = new URL(origin);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return origin;
  } catch {
    return 'http://localhost:5173';
  }

  return 'http://localhost:5173';
}

function sendJson(req, res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  });
  res.end(JSON.stringify(payload));
}

function clientError(message) {
  const error = new Error(message);
  error.expose = true;
  return error;
}

async function readJsonBody(req) {
  const chunks = [];
  let receivedBytes = 0;

  for await (const chunk of req) {
    receivedBytes += chunk.length;
    if (receivedBytes > MAX_BODY_BYTES) {
      throw clientError('Request body is too large.');
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw clientError('Invalid JSON request body.');
  }
}

function buildPrompt(notes, numQ) {
  return `You are a quiz generator. Based on the notes below, generate exactly ${numQ} multiple choice questions.
IMPORTANT: Return ONLY a raw JSON array. No markdown, no explanation, no code blocks.
Format: [{"question":"...","choices":["A. ...","B. ...","C. ...","D. ..."],"answer":"A"}]
Rules:
- The "answer" field must be exactly one letter: A, B, C, or D.
- Each choice must start with its letter and a period, e.g. "A. Choice text"
Notes:\n${notes}`;
}

async function generateQuestions(notes, numQ) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing on the backend.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildPrompt(sanitizeNotes(notes), numQ) }],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Groq API error ${response.status}`);
  }

  const rawText = data.choices?.[0]?.message?.content
    ?.trim()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const jsonMatch = rawText?.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw clientError('Could not parse quiz. Try rephrasing your notes.');

  let parsedQuestions;
  try {
    parsedQuestions = JSON.parse(jsonMatch[0]);
  } catch {
    throw clientError('Could not parse quiz. Try rephrasing your notes.');
  }

  const questions = sanitizeGeneratedQuestions(parsedQuestions).slice(0, numQ);
  if (!questions.length) {
    throw clientError('No questions generated. Try again.');
  }

  return questions;
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(req, res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(req, res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/generate-questions') {
    try {
      const { notes, numQ } = await readJsonBody(req);
      const safeNotes = sanitizeNotes(notes);
      const questionCount = Number(numQ);

      if (!safeNotes) throw clientError('Please paste your notes first.');
      if (safeNotes.length < 60) throw clientError('Notes are too short. Add more content.');
      if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 30) {
        throw clientError('Number of questions must be 1-30.');
      }

      const questions = await generateQuestions(safeNotes, questionCount);
      sendJson(req, res, 200, { questions });
    } catch (error) {
      if (!error.expose) console.error('Quiz generation error:', error);
      sendJson(req, res, error.expose ? 400 : 500, {
        error: error.expose ? error.message : 'Quiz generation failed. Please try again.',
      });
    }
    return;
  }

  sendJson(req, res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`SnapGrade API running at http://localhost:${PORT}`);
});
