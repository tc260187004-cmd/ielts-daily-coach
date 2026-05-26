const workerUrl = (import.meta.env.VITE_AI_WORKER_URL as string | undefined)?.replace(/\/$/, '');

async function postAI<T>(path: string, payload: unknown): Promise<T> {
  if (!workerUrl) throw new Error('请先配置 VITE_AI_WORKER_URL');
  const response = await fetch(`${workerUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'AI 服务暂时不可用');
  return data as T;
}

export const aiClient = {
  speakingFeedback: <T>(payload: unknown) => postAI<T>('/api/speaking-feedback', payload),
  dailySummary: <T>(payload: unknown) => postAI<T>('/api/daily-summary', payload),
  stageReview: <T>(payload: unknown) => postAI<T>('/api/stage-review', payload),
};
