const workerUrl = (import.meta.env.VITE_AI_WORKER_URL as string | undefined)?.replace(/\/$/, '');

function explainNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  if (message === 'Load failed' || message === 'Failed to fetch') {
    return '无法连接 AI 中转服务。请确认 Cloudflare Worker 已部署，并且允许访问域名包含当前 GitHub Pages 地址。';
  }
  return message || 'AI 服务暂时不可用。';
}

async function postAI<T>(path: string, payload: unknown): Promise<T> {
  if (!workerUrl) throw new Error('请先配置 VITE_AI_WORKER_URL。');
  let response: Response;
  try {
    response = await fetch(`${workerUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(explainNetworkError(error));
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `AI 服务返回错误：${response.status}`);
  return data as T;
}

export const aiClient = {
  speakingFeedback: <T>(payload: unknown) => postAI<T>('/api/speaking-feedback', payload),
  dailySummary: <T>(payload: unknown) => postAI<T>('/api/daily-summary', payload),
  stageReview: <T>(payload: unknown) => postAI<T>('/api/stage-review', payload),
};
