import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Headphones, Info, Volume2, VolumeX } from 'lucide-react';
import { getTodayListening, isPlaceholderListeningUrl } from '../data/listening';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/date';
import { upsertDailyLog } from '../services/logs';
import { TimerBlock } from '../components/Cards';

type ListenMode = 'normal' | 'slow' | 'full';

export function ListeningPage() {
  const { user, profile } = useAuth();
  const item = getTodayListening();
  const [newWords, setNewWords] = useState('');
  const [summary, setSummary] = useState('');
  const [message, setMessage] = useState('');
  const [speechMessage, setSpeechMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlaceholder = isPlaceholderListeningUrl(item.url);

  const getVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang === 'en-GB') || voices.find((voice) => voice.lang === 'en-US') || null;
  };

  const speakText = (text: string, rate = 0.9) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = getVoice();
    utterance.lang = utterance.voice?.lang || 'en-GB';
    utterance.rate = rate;
    utterance.volume = 1;
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const speak = (mode: ListenMode = 'normal') => {
    setSpeechMessage('');
    if (!('speechSynthesis' in window)) {
      setSpeechMessage('当前浏览器不支持朗读。你可以直接阅读下方内置文本。');
      return;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const script = item.localScript || item.title;
    if (mode === 'full') {
      const fullPractice = [
        'Round one. Blind listening. Do not look at the text. Listen for the main idea only.',
        script,
        'Round two. Intensive listening. Now look at the text. Notice useful phrases, linking words, and any words you missed.',
        script,
        'Round three. Shadowing practice. Listen to each sentence and repeat after the speaker. Try to copy the rhythm and stress.',
        script,
        'Practice finished. Now write three difficult words and one English summary sentence.',
      ].join('\n\n');
      speakText(fullPractice, 0.86);
      return;
    }

    speakText(script, mode === 'slow' ? 0.72 : 0.9);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

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

        <div className="mt-5 rounded-2xl bg-cyan-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">内置精听材料</h2>
              <p className="mt-1 text-sm text-slate-600">建议按三轮完成：盲听抓主旨、精听看文本、跟读练节奏。</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => speak('normal')}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ocean-700 shadow-sm"
              >
                <Volume2 size={16} /> 单次播放
              </button>
              <button
                type="button"
                onClick={() => speak('slow')}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ocean-700 shadow-sm"
              >
                <Volume2 size={16} /> 慢速精听
              </button>
              <button
                type="button"
                onClick={() => speak('full')}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-500 px-3 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <Volume2 size={16} /> 15 分钟训练
              </button>
              <button
                type="button"
                onClick={stopSpeaking}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm"
              >
                <VolumeX size={16} /> 停止
              </button>
            </div>
          </div>
          {isPlaying && <p className="mt-3 text-sm font-medium text-ocean-700">正在播放。手机锁屏或切换 App 可能会中断朗读。</p>}
          <p className="mt-4 text-sm leading-7 text-slate-700">{item.localScript}</p>
          {speechMessage && <p className="mt-3 text-sm text-amber-700">{speechMessage}</p>}
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-100 p-4">
          <h2 className="font-semibold text-slate-900">听后检查</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(item.focusQuestions || []).map((question) => (
              <li key={question}>· {question}</li>
            ))}
          </ul>
        </div>

        {isPlaceholder ? (
          <div className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            <Info className="mt-0.5 shrink-0" size={16} />
            <p>这条听力材料还没有配置真实链接。请先使用下方精听步骤，稍后可以在题库文件里替换成你的真实资源。</p>
          </div>
        ) : (
          <a
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm font-semibold text-ocean-700 shadow-sm"
            href={item.url}
            target="_blank"
            rel="noreferrer"
          >
            打开补充练习入口 <ExternalLink size={16} />
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
