import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getTodayListening } from '../data/listening';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/date';
import { upsertDailyLog } from '../services/logs';
import { TimerBlock } from '../components/Cards';

export function ListeningPage() {
  const { user, profile } = useAuth();
  const item = getTodayListening();
  const [newWords, setNewWords] = useState('');
  const [summary, setSummary] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('listening_logs').select('*').eq('user_id', user.id).eq('log_date', todayISO()).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNewWords(data.new_words || '');
          setSummary(data.summary_en || '');
          if (data.completed) setMessage('今日听力已完成');
        }
      });
  }, [user?.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const payload = {
      user_id: user.id,
      log_date: todayISO(),
      listening_id: item.id,
      new_words: newWords,
      summary_en: summary,
      completed: true,
    };
    const { data: existing } = await supabase.from('listening_logs').select('id').eq('user_id', user.id).eq('log_date', todayISO()).maybeSingle();
    const { error } = existing
      ? await supabase.from('listening_logs').update(payload).eq('id', existing.id)
      : await supabase.from('listening_logs').insert(payload);
    if (error) throw error;
    await upsertDailyLog(user.id, { completedTask: 'listening' }, profile?.daily_minutes || 60);
    setMessage('听力记录已保存');
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ocean-700">{item.sectionType} · {item.sourceName}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{item.title}</h1>
            <p className="mt-2 text-sm text-slate-600">难度：{item.difficulty} · 主题：{item.topic}</p>
          </div>
          <TimerBlock minutes={15} />
        </div>
        <a className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md border border-cyan-200 px-3 py-2 text-sm font-medium text-ocean-700" href={item.url} target="_blank" rel="noreferrer">
          打开材料链接 <ExternalLink size={16} />
        </a>
      </section>
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-900">精听步骤</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          {item.tasks.map((task, index) => <div key={task} className="rounded-md bg-cyan-50 p-3 text-sm text-slate-700">{index + 1}. {task}</div>)}
        </div>
      </section>
      <label className="block rounded-lg border border-cyan-100 bg-white p-5 shadow-soft">
        <span className="text-sm font-medium text-slate-700">3 个没听懂的词</span>
        <textarea className="focus-ring mt-2 min-h-28 w-full rounded-md border border-slate-200 px-3 py-3" value={newWords} onChange={(e) => setNewWords(e.target.value)} placeholder="word 1, word 2, word 3" />
      </label>
      <label className="block rounded-lg border border-cyan-100 bg-white p-5 shadow-soft">
        <span className="text-sm font-medium text-slate-700">1 句英文总结</span>
        <textarea className="focus-ring mt-2 min-h-28 w-full rounded-md border border-slate-200 px-3 py-3" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Today I learned that..." />
      </label>
      <button className="focus-ring rounded-md bg-ocean-600 px-4 py-3 font-semibold text-white">完成并保存</button>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
