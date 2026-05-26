import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, PenLine } from 'lucide-react';
import { getReadingWritingTask } from '../data/readingWriting';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/date';
import { upsertDailyLog } from '../services/logs';

type ReadingFields = {
  mainIdea: string;
  newWords: string;
  summary: string;
  reflection: string;
};

type WritingFields = {
  opinion: string;
  reason1: string;
  reason2: string;
  example: string;
  usefulExpressions: string;
};

const initialReading: ReadingFields = { mainIdea: '', newWords: '', summary: '', reflection: '' };
const initialWriting: WritingFields = { opinion: '', reason1: '', reason2: '', example: '', usefulExpressions: '' };

function parseSavedNotes(notes: string | null | undefined, mode: 'reading' | 'writing') {
  if (!notes) return mode === 'reading' ? initialReading : initialWriting;
  try {
    const parsed = JSON.parse(notes);
    return mode === 'reading' ? { ...initialReading, ...parsed } : { ...initialWriting, ...parsed };
  } catch {
    return mode === 'reading' ? { ...initialReading, summary: notes } : { ...initialWriting, opinion: notes };
  }
}

export function ReadingWritingPage() {
  const { user, profile } = useAuth();
  const task = getReadingWritingTask();
  const normalizedType = task.type === 'writing' ? 'writing' : 'reading';
  const [reading, setReading] = useState<ReadingFields>(initialReading);
  const [writing, setWriting] = useState<WritingFields>(initialWriting);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('writing_reading_logs').select('*').eq('user_id', user.id).eq('log_date', todayISO()).maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (normalizedType === 'writing') setWriting(parseSavedNotes(data.user_notes, 'writing') as WritingFields);
          else setReading(parseSavedNotes(data.user_notes, 'reading') as ReadingFields);
          if (data.completed) setMessage('今日阅读/写作已完成');
        }
      });
  }, [user?.id, normalizedType]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const userNotes = JSON.stringify(normalizedType === 'writing' ? writing : reading, null, 2);
    const payload = {
      user_id: user.id,
      log_date: todayISO(),
      type: normalizedType,
      prompt: task.prompt,
      user_notes: userNotes,
      completed: true,
    };
    const { data: existing } = await supabase.from('writing_reading_logs').select('id').eq('user_id', user.id).eq('log_date', todayISO()).maybeSingle();
    const { error } = existing
      ? await supabase.from('writing_reading_logs').update(payload).eq('id', existing.id)
      : await supabase.from('writing_reading_logs').insert(payload);
    if (error) throw error;
    await upsertDailyLog(user.id, { completedTask: normalizedType === 'writing' ? 'writing' : 'reading' }, profile?.daily_minutes || 60);
    setMessage('记录已保存');
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-[22px] border border-cyan-100/80 bg-white/95 p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-ocean-700">
            {normalizedType === 'writing' ? <PenLine size={16} /> : <BookOpen size={16} />}
            {task.type === 'review' ? '周日复盘' : normalizedType === 'writing' ? '写作训练' : '阅读训练'}
          </span>
          {task.isFullWriting && <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">完整 Task 2</span>}
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950 md:text-4xl">{task.title}</h1>
        <p className="mt-5 whitespace-pre-wrap rounded-[20px] bg-cyan-50 p-5 leading-7 text-slate-700">{task.prompt}</p>
        <p className="mt-4 text-sm leading-6 text-slate-500">{task.helper}</p>
      </section>

      {normalizedType === 'reading' ? (
        <section className="rounded-[22px] border border-cyan-100/80 bg-white/95 p-5 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">阅读记录</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Main idea</span>
              <textarea className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={reading.mainIdea} onChange={(e) => setReading({ ...reading, mainIdea: e.target.value })} required placeholder="What is the main idea of this text?" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">3 个 new words</span>
              <textarea className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={reading.newWords} onChange={(e) => setReading({ ...reading, newWords: e.target.value })} placeholder="word 1 / word 2 / word 3" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">1 句 summary</span>
              <textarea className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={reading.summary} onChange={(e) => setReading({ ...reading, summary: e.target.value })} placeholder="In one sentence, ..." />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">我的观点 / 启发</span>
              <textarea className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={reading.reflection} onChange={(e) => setReading({ ...reading, reflection: e.target.value })} placeholder="What can you reuse in speaking or writing?" />
            </label>
          </div>
        </section>
      ) : (
        <section className="rounded-[22px] border border-cyan-100/80 bg-white/95 p-5 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">写作搭建</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">我的观点</span>
              <textarea className="focus-ring mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" value={writing.opinion} onChange={(e) => setWriting({ ...writing, opinion: e.target.value })} required placeholder="I agree / disagree because..." />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">理由 1</span>
              <textarea className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={writing.reason1} onChange={(e) => setWriting({ ...writing, reason1: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">理由 2</span>
              <textarea className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={writing.reason2} onChange={(e) => setWriting({ ...writing, reason2: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">例子</span>
              <textarea className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={writing.example} onChange={(e) => setWriting({ ...writing, example: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">可用表达</span>
              <textarea className="focus-ring mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={writing.usefulExpressions} onChange={(e) => setWriting({ ...writing, usefulExpressions: e.target.value })} placeholder="useful phrases / topic vocabulary" />
            </label>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className="focus-ring rounded-full bg-gradient-to-r from-ocean-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-soft">完成并保存</button>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
      </div>
    </form>
  );
}
