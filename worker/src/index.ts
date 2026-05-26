type Env = {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGINS?: string;
};

const GEMINI_MODEL = 'gemini-2.5-flash';

const schemas = {
  speaking: [
    'estimated_band_range',
    'fluency_feedback',
    'vocabulary_feedback',
    'grammar_feedback',
    'coherence_feedback',
    'pronunciation_note',
    'improved_answer_band7',
    'next_practice_advice',
  ],
  summary: [
    'completion_summary',
    'strengths',
    'weaknesses',
    'tomorrow_plan',
    'should_increase_time',
    'encouragement',
  ],
  stage: [
    'consistency_analysis',
    'strongest_area',
    'weakest_area',
    'time_allocation_advice',
    'next_30_days_plan',
    'should_adjust_daily_minutes',
  ],
};

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean);
  const isLocal = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  const isGitHubPages = /^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin);
  const allowOrigin = allowed.includes(origin) || isLocal || isGitHubPages ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowOrigin || allowed[0] || 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonResponse(request: Request, env: Env, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env),
    },
  });
}

function assertAllowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!origin) return;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return;
  if (/^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin)) return;
  if (allowed.length && !allowed.includes(origin)) {
    throw new Error('Origin is not allowed');
  }
}

function strictJsonPrompt(task: string, payload: unknown, keys: string[]) {
  return `You are an IELTS study coach. Return strict JSON only, no Markdown, no code fence.
The JSON object must contain exactly these string fields: ${keys.join(', ')}.
Use Chinese for feedback except improved English answers.
Do not claim this is an official IELTS score. Use AI reference score or estimated range only.

Task:
${task}

Input:
${JSON.stringify(payload)}`;
}

async function callGemini(env: Env, prompt: string) {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY secret is missing');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    }),
  });
  const data = await response.json() as any;
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini request failed');
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini did not return valid JSON');
  }
}

async function handlePost(request: Request, env: Env) {
  assertAllowedOrigin(request, env);
  const url = new URL(request.url);
  const payload = await request.json().catch(() => null);
  if (!payload) return jsonResponse(request, env, { error: 'Invalid JSON body' }, 400);

  if (url.pathname === '/api/speaking-feedback') {
    const prompt = strictJsonPrompt(
      'Evaluate this IELTS speaking text answer. Include estimated_band_range as an AI reference range, not an official score. pronunciation_note must state that without audio, pronunciation can only be inferred from text.',
      payload,
      schemas.speaking,
    );
    return jsonResponse(request, env, await callGemini(env, prompt));
  }

  if (url.pathname === '/api/daily-summary') {
    const prompt = strictJsonPrompt('Summarize today IELTS study records and give tomorrow advice.', payload, schemas.summary);
    return jsonResponse(request, env, await callGemini(env, prompt));
  }

  if (url.pathname === '/api/stage-review') {
    const prompt = strictJsonPrompt('Review this IELTS study stage and provide practical next-step diagnosis.', payload, schemas.stage);
    return jsonResponse(request, env, await callGemini(env, prompt));
  }

  return jsonResponse(request, env, { error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }
    if (request.method === 'GET' && url.pathname === '/api/health') {
      const key = env.GEMINI_API_KEY || '';
      return jsonResponse(request, env, {
        ok: true,
        hasGeminiKey: Boolean(key),
        keyLooksLikeGoogleAiKey: key.startsWith('AIza') && key.length > 30,
        keyLength: key.length,
      });
    }
    if (request.method !== 'POST') {
      return jsonResponse(request, env, { error: 'Only POST is supported' }, 405);
    }
    try {
      return await handlePost(request, env);
    } catch (error) {
      return jsonResponse(request, env, { error: error instanceof Error ? error.message : 'Worker error' }, 500);
    }
  },
};
