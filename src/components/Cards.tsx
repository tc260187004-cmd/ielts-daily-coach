import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Clock3, Lightbulb, Timer } from 'lucide-react';
import type { DailyTask } from '../types';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

const statusCopy: Record<TaskStatus, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
};

export type EnrichedTask = DailyTask & {
  eyebrow: string;
  description: string;
  meta: string;
  status: TaskStatus;
};

const cardClass = 'rounded-[22px] border border-cyan-100/80 bg-white/95 p-5 shadow-soft';

export function ProgressCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <section className={cardClass}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </section>
  );
}

export function TaskCard({ task, recommended }: { task: EnrichedTask; recommended: boolean }) {
  const completed = task.status === 'completed';
  return (
    <Link
      to={task.route}
      className={`focus-ring group block rounded-[22px] border p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg ${
        recommended
          ? 'border-ocean-500 bg-gradient-to-br from-cyan-50 to-white'
          : 'border-cyan-100/80 bg-white/95 hover:border-ocean-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-ocean-700">{task.eyebrow}</span>
            {recommended && <span className="rounded-full bg-ocean-600 px-3 py-1 text-xs font-semibold text-white">推荐先做</span>}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{task.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{task.description}</p>
          <p className="mt-3 text-sm font-medium text-slate-500">{task.meta}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          {completed ? <CheckCircle2 size={24} className="text-emerald-600" /> : recommended ? <Clock3 size={24} className="text-ocean-600" /> : <Circle size={24} className="text-slate-300" />}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${completed ? 'bg-emerald-50 text-emerald-700' : recommended ? 'bg-cyan-100 text-ocean-700' : 'bg-slate-100 text-slate-500'}`}>
            {statusCopy[task.status]}
          </span>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm text-slate-500">{task.minutes} 分钟</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-700">
          进入训练 <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function DailyPlanCard({ tasks }: { tasks: EnrichedTask[] }) {
  const recommendedIndex = tasks.findIndex((task) => task.status !== 'completed');
  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ocean-700">今日路径</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">按顺序完成这 5 个小任务</h2>
        </div>
        <p className="text-sm text-slate-500">完成后可生成今日总结</p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {tasks.map((task, index) => <TaskCard key={`${task.id}-${task.title}`} task={task} recommended={index === recommendedIndex} />)}
      </div>
    </section>
  );
}

export function SkillModuleCard({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <Link to={to} className="focus-ring rounded-[22px] border border-cyan-100/80 bg-white/95 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-ocean-300">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}

export function TimerBlock({ minutes }: { minutes: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-ocean-700">
      <Timer size={16} /> 建议 {minutes} 分钟
    </div>
  );
}

export function FeedbackPanel({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-semibold text-slate-950">AI 反馈</h2>
      <div className="mt-4 space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-ocean-700">{key.replace(/_/g, ' ')}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{String(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SummaryPanel({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return <FeedbackPanel data={data} />;
}

export function AdjustmentAdviceCard({ advice }: { advice: string[] }) {
  return (
    <section className={cardClass}>
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-amber-50 p-2 text-amber-500">
          <Lightbulb size={18} />
        </div>
        <h2 className="text-xl font-semibold text-slate-950">教练建议</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {advice.map((item) => (
          <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item}</p>
        ))}
      </div>
    </section>
  );
}
