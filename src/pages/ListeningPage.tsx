import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Headphones, Info } from 'lucide-react';
import { getTodayListening, isPlaceholderListeningUrl } from '../data/listening';
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
  const isPlaceholder = isPlaceholderListeningUrl(item.url);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('listening_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', todayISO())
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNewWords(data.new_words || '');
          setSummary(data.summary_en || '');
          if (data.completed) setMessage('今日听力已完成。');
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
    const { data: existing } = await supabase
      .from('listening_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('log_date', todayISO())
      .maybeSingle();
    const { error } = existing
      ? await supabase.from('listening_logs').update(payload).eq('id', existing.id)
      : await supabase.from('listening_logs').insert(payload);
    if (error) throw error;
    await upsertDailyLog(user.id, { completedTask: 'listening' }, profile?.daily_minutes || 60);
    setMessage('听力记录已保存。');
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-[22px] border border-cyan-100 bg-white p-5 shadow-soft md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-ocean-700">
              <Headphones size={16} />
              {item.sectionType} · {item.sourceName}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{item.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              难度：{item.difficulty} · 主题：{item.topic}
            </p>
          </div>
          <TimerBlock minutes={15} />
        </div>

        {isPlaceholder ? (
          <div className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            <Info className="mt-0.5 shrink-0" size={16} />
            <p>这条听力材料还没有配置真实链接。请先使用下方精听步骤，稍后可以在题库文件里替换成你的真实资源。</p>
          </div>
        ) : (
          <a
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-soft"
            href={item.url}
            target="_blank"
            rel="noreferrer"
          >
            打开今日听力材料 <ExternalLink size={16} />
          </a>
        )}
      </section>

      <section className="rounded-[22px] border border-cyan-100 bg-white p-5 shadow-soft md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">精听步骤</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          {item.tasks.map((task, index) => (
            <div key={task} className="rounded-2xl bg-cyan-50 p-3 text-sm text-slate-700">
              <span className="font-semibold text-ocean-700">{index + 1}.</span> {task}
            </div>
          ))}
        </div>
      </section>

      <label className="block rounded-[22px] border border-cyan-100 bg-white p-5 shadow-soft md:p-6">
        <span className="text-sm font-medium text-slate-700">3 个没听懂的词</span>
        <textarea
          className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-3 py-3"
          value={newWords}
          onChange={(event) => setNewWords(event.target.value)}
          placeholder="word 1, word 2, word 3"
        />
      </label>

      <label className="block rounded-[22px] border border-cyan-100 bg-white p-5 shadow-soft md:p-6">
        <span className="text-sm font-medium text-slate-700">1 句英文总结</span>
        <textarea
          className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-3 py-3"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Today I learned that..."
        />
      </label>

      <button className="focus-ring rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-soft">
        完成并保存
      </button>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
