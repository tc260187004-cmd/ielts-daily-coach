import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { aiClient } from '../lib/ai';
import { todayISO } from '../lib/date';
import { upsertDailyLog } from '../services/logs';
import { SummaryPanel } from '../components/Cards';
import type { DailySummary } from '../types';

export function DailySummaryPage() {
  const { user, profile } = useAuth();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const logDate = todayISO();
      const [todayLogs, listeningLogs, vocabularyLogs, speakingLogs, writingReadingLogs] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', logDate),
        supabase.from('listening_logs').select('*').eq('user_id', user.id).eq('log_date', logDate),
        supabase.from('vocabulary_logs').select('*').eq('user_id', user.id).eq('log_date', logDate),
        supabase.from('speaking_logs').select('*').eq('user_id', user.id).eq('log_date', logDate),
        supabase.from('writing_reading_logs').select('*').eq('user_id', user.id).eq('log_date', logDate),
      ]);
      const result = await aiClient.dailySummary<DailySummary>({
        profile,
        todayLogs: todayLogs.data || [],
        listeningLogs: listeningLogs.data || [],
        vocabularyLogs: vocabularyLogs.data || [],
        speakingLogs: speakingLogs.data || [],
        writingReadingLogs: writingReadingLogs.data || [],
      });
      setSummary(result);
      await supabase.from('daily_summaries').upsert(
        { user_id: user.id, log_date: logDate, summary: result },
        { onConflict: 'user_id,log_date' },
      );
      await upsertDailyLog(user.id, { completedTask: 'summary' }, profile?.daily_minutes || 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-950">今日总结</h1>
        <p className="mt-2 text-slate-600">整理今天的学习记录，由 Gemini 生成学习亮点、问题和明日建议。</p>
        <button onClick={generate} disabled={loading} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-ocean-600 px-4 py-3 font-semibold text-white disabled:bg-slate-300">
          <Sparkles size={18} /> {loading ? '生成中...' : '生成今日总结'}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
      <SummaryPanel data={summary as Record<string, unknown> | null} />
    </div>
  );
}
