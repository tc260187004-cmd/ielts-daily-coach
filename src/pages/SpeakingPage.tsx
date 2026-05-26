import { FormEvent, useRef, useState } from 'react';
import { AlertCircle, Mic, MicOff, Sparkles, Target, Trash2 } from 'lucide-react';
import { getTodaySpeakingPrompt } from '../data/speaking';
import { useAuth } from '../context/AuthContext';
import { aiClient } from '../lib/ai';
import { todayISO } from '../lib/date';
import { supabase } from '../lib/supabase';
import { upsertDailyLog } from '../services/logs';
import type { SpeakingFeedback } from '../types';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

const promptGroups = [
  {
    title: '开头观点',
    items: ['In my opinion, ...', 'I tend to think that ...', 'Personally, I would say ...'],
  },
  {
    title: '解释原因',
    items: ['The main reason is that ...', 'This is mainly because ...', 'What I mean is ...'],
  },
  {
    title: '举例说明',
    items: ['For example, ...', 'A good example is ...', 'In my own experience, ...'],
  },
  {
    title: '对比扩展',
    items: ['Compared with the past, ...', 'On the other hand, ...', 'It depends on ...'],
  },
];

function SpeakingFeedbackPanel({ feedback }: { feedback: SpeakingFeedback | null }) {
  if (!feedback) return null;
  return (
    <section className="rounded-[22px] border border-cyan-100/80 bg-white/95 p-5 shadow-soft">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[20px] bg-gradient-to-br from-cyan-50 to-blue-50 p-5">
          <p className="text-sm font-semibold text-ocean-700">AI 参考分数区间</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{feedback.estimated_band_range}</p>
        </div>
        <div className="rounded-[20px] bg-slate-50 p-5 md:col-span-2">
          <p className="text-sm font-semibold text-slate-700">今日主要问题</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{feedback.coherence_feedback}</p>
        </div>
      </div>
      <div className="mt-4 rounded-[20px] bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-emerald-700">下次改进重点</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{feedback.next_practice_advice}</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-[20px] bg-slate-50 p-4">
          <p className="text-sm font-semibold text-ocean-700">流利度</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{feedback.fluency_feedback}</p>
        </div>
        <div className="rounded-[20px] bg-slate-50 p-4">
          <p className="text-sm font-semibold text-ocean-700">词汇</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{feedback.vocabulary_feedback}</p>
        </div>
        <div className="rounded-[20px] bg-slate-50 p-4">
          <p className="text-sm font-semibold text-ocean-700">语法</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{feedback.grammar_feedback}</p>
        </div>
        <div className="rounded-[20px] bg-slate-50 p-4">
          <p className="text-sm font-semibold text-ocean-700">发音说明</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{feedback.pronunciation_note}</p>
        </div>
      </div>
      <div className="mt-4 rounded-[20px] border border-cyan-100 p-5">
        <p className="text-sm font-semibold text-ocean-700">Band 7 参考回答</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{feedback.improved_answer_band7}</p>
      </div>
    </section>
  );
}

export function SpeakingPage() {
  const { user, profile } = useAuth();
  const prompt = getTodaySpeakingPrompt();
  const [answer, setAnswer] = useState('');
  const [interim, setInterim] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const SpeechRecognitionCtor = typeof window !== 'undefined'
    ? ((window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition)
    : undefined;

  const startSpeaking = () => {
    setError('');
    if (!SpeechRecognitionCtor) {
      setError('当前浏览器不支持语音转文字。可以用 Chrome 打开，或先手动输入回答。');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText.trim()) {
        setAnswer((current) => `${current}${current.trim() ? ' ' : ''}${finalText.trim()}`);
      }
      setInterim(interimText.trim());
    };
    recognition.onerror = (event) => {
      setError(event.error ? `语音识别失败：${event.error}` : '语音识别失败');
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopSpeaking = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterim('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const result = await aiClient.speakingFeedback<SpeakingFeedback>({
        part: prompt.part,
        question: prompt.question,
        answer,
        targetBand: profile?.target_band || '6.5',
      });
      setFeedback(result);
      await supabase.from('speaking_logs').insert({
        user_id: user.id,
        log_date: todayISO(),
        part: prompt.part,
        question: prompt.question,
        answer,
        ai_feedback: result,
        estimated_band_range: result.estimated_band_range,
      });
      await upsertDailyLog(user.id, { completedTask: 'speaking' }, profile?.daily_minutes || 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[22px] border border-cyan-100/80 bg-white/95 p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-ocean-700">{prompt.part}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <Target size={16} /> 至少回答 4 句话
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold leading-tight text-slate-950 md:text-4xl">{prompt.question}</h1>
        <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm leading-6 text-slate-700">回答目标：至少回答 4 句话，包含观点 + 原因 + 例子 + 总结。</p>
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle size={14} /> AI 反馈仅供学习参考，不等同于真实雅思考官评分。
        </p>
      </section>

      <form onSubmit={submit} className="rounded-[22px] border border-cyan-100/80 bg-white/95 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">开口练习</h2>
            <p className="mt-1 text-sm text-slate-500">点击麦克风直接说英文，系统只保存文字稿，不上传音频。</p>
          </div>
          <button type="button" onClick={isRecording ? stopSpeaking : startSpeaking} className={`focus-ring inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-white shadow-soft ${isRecording ? 'bg-red-600' : 'bg-gradient-to-r from-ocean-600 to-cyan-500'}`}>
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            {isRecording ? '停止说话' : '开始说英文'}
          </button>
        </div>

        <div className="mt-5 rounded-[20px] bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">实时 transcript</p>
          <div className="mt-3 min-h-36 rounded-2xl border border-slate-200 bg-white p-4 text-slate-800">
            {answer ? <p className="whitespace-pre-wrap leading-7">{answer}</p> : <p className="text-slate-400">你的口语内容会出现在这里...</p>}
            {interim && <p className="mt-2 text-ocean-700">{interim}</p>}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {promptGroups.map((group) => (
            <div key={group.title} className="rounded-[18px] border border-cyan-100 p-4">
              <p className="text-sm font-semibold text-slate-700">{group.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <button key={item} type="button" onClick={() => setAnswer((current) => `${current}${current.trim() ? ' ' : ''}${item}`)} className="focus-ring rounded-full bg-cyan-50 px-3 py-2 text-sm text-ocean-700 hover:bg-cyan-100">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <details className="mt-5 rounded-2xl border border-cyan-100 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">手动修正 transcript</summary>
          <textarea className="focus-ring mt-3 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="You can edit the transcript here..." />
        </details>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" disabled={loading || !answer.trim()} className="focus-ring inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-ocean-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-soft disabled:bg-none disabled:bg-slate-300">
            <Sparkles size={18} /> {loading ? '生成中...' : '让 Gemini 反馈'}
          </button>
          <button type="button" onClick={() => { setAnswer(''); setInterim(''); }} className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600">
            <Trash2 size={18} /> 清空
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>

      <SpeakingFeedbackPanel feedback={feedback} />
    </div>
  );
}
