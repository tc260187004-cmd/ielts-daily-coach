import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Sparkles, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildDailyPlan } from '../lib/plan';
import { formatDateCN, todayISO } from '../lib/date';
import { buildAdjustmentAdvice } from '../lib/advice';
import { fetchDashboardData } from '../services/logs';
import { fetchTodayVocabularyTest, fetchVocabularyReviewStates } from '../services/vocabulary';
import type { DailyLog, VocabularyReviewState } from '../types';
import { getTodayListening } from '../data/listening';
import { getTodayVocabulary } from '../data/vocabulary';
import { getTodaySpeakingPrompt } from '../data/speaking';
import { getReadingWritingTask } from '../data/readingWriting';
import { AdjustmentAdviceCard, DailyPlanCard, ProgressCard, SkillModuleCard, type EnrichedTask } from '../components/Cards';

function shortText(text: string, max = 42) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [advice, setAdvice] = useState<string[]>(['正在读取你的学习节奏...']);
  const [vocabStates, setVocabStates] = useState<VocabularyReviewState[]>([]);
  const [vocabTest, setVocabTest] = useState<any>(null);
  const dailyMinutes = profile?.daily_minutes || 60;
  const tasks = useMemo(() => buildDailyPlan(dailyMinutes), [dailyMinutes]);
  const todayLog = logs.find((log) => log.log_date === todayISO());
  const completedTasks = (todayLog?.completed_tasks || []) as string[];
  const completion = todayLog?.completion_rate || 0;
  const streak = logs.reduce((count, log) => Number(log.completion_rate) > 0 ? count + 1 : count, 0);
  const weekRate = logs.slice(0, 7).length
    ? Math.round(logs.slice(0, 7).reduce((sum, log) => sum + Number(log.completion_rate || 0), 0) / logs.slice(0, 7).length)
    : 0;

  const listening = getTodayListening();
  const vocabulary = getTodayVocabulary();
  const dueReviewCount = vocabStates.filter((state) => state.next_review_date && state.next_review_date <= todayISO() && !state.mastered).length;
  const wrongbookCount = vocabStates.filter((state) => state.in_wrongbook).length;
  const speaking = getTodaySpeakingPrompt();
  const readingWriting = getReadingWritingTask();

  const enrichedTasks: EnrichedTask[] = tasks.map((task) => {
    const completed = completedTasks.includes(task.id);
    const base = { ...task, status: completed ? 'completed' as const : 'not_started' as const };
    if (task.id === 'listening') {
      return {
        ...base,
        eyebrow: '听力',
        title: listening.title,
        description: `${listening.sectionType} 精听：盲听、看文本、跟读、生词记录、英文总结。`,
        meta: `${listening.difficulty} · ${listening.topic}`,
      };
    }
    if (task.id === 'vocabulary') {
      return {
        ...base,
        eyebrow: '词汇',
        title: `今日新词 ${vocabulary.length} 个｜待复习 ${dueReviewCount} 个｜错词本 ${wrongbookCount} 个`,
        description: vocabTest
          ? `今日测试 ${vocabTest.correct_count}/${vocabTest.total_questions}，错词 ${Array.isArray(vocabTest.wrong_words) ? vocabTest.wrong_words.length : 0} 个。`
          : completed
            ? '新词已完成，今日测试已解锁。'
            : '完成新词后解锁今日测试。',
        meta: '卡片学习 · 记忆曲线 · 错词本 · 听音选词',
      };
    }
    if (task.id === 'speaking') {
      return {
        ...base,
        eyebrow: speaking.part,
        title: shortText(speaking.question, 34),
        description: '开麦说英文，形成 transcript 后获得 Gemini 口语反馈。',
        meta: '观点 + 原因 + 例子 + 总结',
      };
    }
    if (task.id === 'reading' || task.id === 'writing') {
      return {
        ...base,
        eyebrow: readingWriting.type === 'writing' ? '写作' : readingWriting.type === 'reading' ? '阅读' : '复盘',
        title: readingWriting.title,
        description: shortText(readingWriting.prompt, 70),
        meta: readingWriting.isFullWriting ? '完整 Task 2' : readingWriting.helper,
      };
    }
    return {
      ...base,
      eyebrow: '总结',
      title: '生成今日总结',
      description: '根据今日学习记录生成完成情况、主要问题和明日建议。',
      meta: 'Gemini 总结 · 明日计划',
    };
  });

  const firstUnfinished = enrichedTasks.find((task) => task.status !== 'completed');
  const displayTasks = enrichedTasks.map((task) => ({
    ...task,
    status: task.id === firstUnfinished?.id ? 'in_progress' as const : task.status,
  }));

  useEffect(() => {
    if (!user) return;
    fetchDashboardData(user.id).then((data) => {
      setLogs(data.dailyLogs);
      setAdvice(buildAdjustmentAdvice({
        logs: data.dailyLogs,
        speakingLogs: data.speakingLogs,
        writingLogs: data.writingLogs,
        listeningLogs: data.listeningLogs,
      }));
    }).catch((error) => setAdvice([error.message]));
    fetchVocabularyReviewStates(user.id).then(setVocabStates).catch(() => setVocabStates([]));
    fetchTodayVocabularyTest(user.id).then(setVocabTest).catch(() => setVocabTest(null));
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-cyan-100 bg-white/95 shadow-soft">
        <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-ocean-700">
              <CalendarDays size={16} /> {formatDateCN()}
            </div>
            <p className="mt-6 text-sm font-semibold tracking-wide text-ocean-700">每天 1 小时，系统提升听说读写。</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">今天的雅思训练计划</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">完成 5 个小任务，系统会自动生成今日总结。</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={firstUnfinished?.route || '/listening'} className="focus-ring inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-ocean-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-soft">
                按顺序开始 <ArrowRight size={18} />
              </Link>
              <Link to="/daily-summary" className="focus-ring inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-3 font-semibold text-ocean-700">
                <Sparkles size={18} /> 生成今日总结
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[22px] bg-gradient-to-br from-cyan-50 to-blue-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ocean-700"><Target size={17} /> 今日重点</div>
              <p className="mt-2 text-lg font-semibold text-slate-950">{firstUnfinished?.title || '今日任务已完成'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500"><Clock size={16} /> 预计时长</div>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{dailyMinutes} 分钟</p>
              </div>
              <div className="rounded-[22px] bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 size={16} /> 完成任务</div>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{completedTasks.length}/{tasks.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <ProgressCard title="今日进度" value={`${completion}%`} detail={`${completedTasks.length}/${tasks.length} 个任务已完成`} />
        <ProgressCard title="连续学习" value={`${streak} 天`} detail="有学习记录即计入" />
        <ProgressCard title="本周完成率" value={`${weekRate}%`} detail="最近 7 天平均" />
        <ProgressCard title="目标分数" value={profile?.target_band || '6.5'} detail={`薄弱项：${profile?.weak_area || '未设置'}`} />
      </section>

      <DailyPlanCard tasks={displayTasks} />
      <AdjustmentAdviceCard advice={advice} />

      <section className="grid gap-4 md:grid-cols-3">
        <SkillModuleCard title="学习入口" description="听力、词汇、口语、阅读写作都按今日计划推进。" to={firstUnfinished?.route || '/listening'} />
        <SkillModuleCard title="每日总结" description="把当天数据整理成亮点、问题和明日建议。" to="/daily-summary" />
        <SkillModuleCard title="阶段复盘" description="第 7 / 30 / 60 天生成学习稳定性和时间分配建议。" to="/stage-review" />
      </section>
    </div>
  );
}
