import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { aiClient } from '../lib/ai';
import { SummaryPanel } from '../components/Cards';
import type { StageReview } from '../types';

type StageType = 'weekly' | 'day30' | 'day60';

export function StageReviewPage() {
  const { user, profile } = useAuth();
  const [stage, setStage] = useState<StageType>('weekly');
  const [review, setReview] = useState<StageReview | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const stageDays = stage === 'weekly' ? 7 : stage === 'day30' ? 30 : 60;

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      const { data: logs } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(stageDays);
      const reviewLogs = logs || [];
      if (reviewLogs.length < stageDays) {
        setMessage(`当前只有 ${reviewLogs.length} 天记录，达到 ${stageDays} 天后更适合生成该复盘。你仍可以先生成参考版。`);
      }
      const endDate = reviewLogs[0]?.log_date || new Date().toISOString().slice(0, 10);
      const startDate = reviewLogs[reviewLogs.length - 1]?.log_date || endDate;
      const result = await aiClient.stageReview<StageReview>({
        profile,
        dateRange: { startDate, endDate, stageType: stage },
        logs: reviewLogs,
      });
      setReview(result);
      await supabase.from('stage_reviews').insert({ user_id: user.id, stage_type: stage, start_date: startDate, end_date: endDate, review: result });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-950">阶段复盘</h1>
        <p className="mt-2 text-slate-600">第 7 天生成周复盘，第 30 / 60 天生成阶段诊断。</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['weekly', 'day30', 'day60'] as StageType[]).map((item) => (
            <button key={item} onClick={() => setStage(item)} className={`focus-ring rounded-md px-3 py-2 text-sm font-medium ${stage === item ? 'bg-ocean-600 text-white' : 'border border-cyan-200 bg-white text-ocean-700'}`}>
              {item === 'weekly' ? '7 天周复盘' : item === 'day30' ? '30 天诊断' : '60 天诊断'}
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={loading} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-ocean-600 px-4 py-3 font-semibold text-white disabled:bg-slate-300">
          <Sparkles size={18} /> {loading ? '生成中...' : '生成阶段复盘'}
        </button>
        {message && <p className="mt-3 text-sm text-amber-700">{message}</p>}
      </section>
      <SummaryPanel data={review as Record<string, unknown> | null} />
    </div>
  );
}
