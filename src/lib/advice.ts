import type { DailyLog } from '../types';

type SpeakingLite = { estimated_band_range?: string | null };
type WritingLite = { created_at?: string; type?: string; user_notes?: string | null };
type ListeningLite = { new_words?: string | null };

function firstNumber(text?: string | null) {
  if (!text) return null;
  const match = text.match(/\d(?:\.\d)?/);
  return match ? Number(match[0]) : null;
}

export function buildAdjustmentAdvice(params: {
  logs: DailyLog[];
  speakingLogs: SpeakingLite[];
  writingLogs: WritingLite[];
  listeningLogs: ListeningLite[];
}) {
  const advice: string[] = [];
  const recent7 = params.logs.slice(0, 7);
  if (recent7.length >= 3) {
    const avg = recent7.reduce((sum, log) => sum + Number(log.completion_rate || 0), 0) / recent7.length;
    if (avg < 60) advice.push('最近 7 天完成率偏低。建议先把每日学习时间降一档，把节奏稳定下来，再逐步加量。');
    if (avg > 85) advice.push('最近 7 天完成率很稳。可以考虑增加 15-30 分钟，把新增时间优先分给薄弱模块。');
  }

  const last5Speaking = params.speakingLogs.slice(0, 5);
  if (last5Speaking.length >= 5 && last5Speaking.every((log) => (firstNumber(log.estimated_band_range) || 9) < 6)) {
    advice.push('口语最近 5 次 AI 参考区间都低于 6。建议每天多加 10 分钟，用观点、原因、例子的结构练短回答。');
  }

  const hasRecentFullWriting = params.writingLogs.some((log) => {
    if (log.type !== 'writing' || !log.created_at) return false;
    const days = (Date.now() - new Date(log.created_at).getTime()) / 86_400_000;
    return days <= 14 && (log.user_notes || '').length > 450;
  });
  if (!hasRecentFullWriting) {
    advice.push('你最近 14 天还没有完成完整 Task 2。建议本周安排一次 30 分钟完整写作，用来检查观点展开和段落结构。');
  }

  const last7Listening = params.listeningLogs.slice(0, 7);
  if (last7Listening.length >= 7 && last7Listening.every((log) => !(log.new_words || '').trim())) {
    advice.push('听力最近几次没有记录生词。建议今天减少泛听，把 3 个没听懂的词写下来并跟读一遍。');
  }

  return advice.length ? advice : ['当前节奏健康。今天按计划完成 5 个小任务，最后用总结页复盘一下最卡的地方。'];
}
