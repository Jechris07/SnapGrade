import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.API_PORT || 8787);

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
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
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
      messages: [{ role: 'user', content: buildPrompt(notes, numQ) }],
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
  if (!jsonMatch) throw new Error('Could not parse quiz. Try rephrasing your notes.');

  const questions = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(questions) || !questions.length) {
    throw new Error('No questions generated. Try again.');
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
      const questionCount = Number(numQ);

      if (!notes?.trim()) throw new Error('Please paste your notes first.');
      if (notes.length < 60) throw new Error('Notes are too short. Add more content.');
      if (questionCount < 1 || questionCount > 30) {
        throw new Error('Number of questions must be 1-30.');
      }

      const questions = await generateQuestions(notes, questionCount);
      sendJson(req, res, 200, { questions });
    } catch (error) {
      sendJson(req, res, 400, { error: error.message || 'Quiz generation failed.' });
    }
    return;
  }

  sendJson(req, res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`SnapGrade API running at http://localhost:${PORT}`);
});
