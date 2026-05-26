import type { DailyTask, StudyModule } from '../types';

const routes: Record<StudyModule, string> = {
  listening: '/listening',
  vocabulary: '/vocabulary',
  speaking: '/speaking',
  reading: '/reading-writing',
  writing: '/reading-writing',
  summary: '/daily-summary',
};

export function buildDailyPlan(minutes: number): DailyTask[] {
  const planMap: Record<number, Array<[StudyModule, string, number]>> = {
    30: [
      ['listening', '听力', 10],
      ['vocabulary', '词汇', 5],
      ['speaking', '口语', 10],
      ['summary', '总结', 5],
    ],
    60: [
      ['listening', '听力', 15],
      ['vocabulary', '词汇', 10],
      ['speaking', '口语', 15],
      ['reading', '阅读/写作', 15],
      ['summary', '总结', 5],
    ],
    90: [
      ['listening', '听力', 25],
      ['vocabulary', '词汇', 15],
      ['speaking', '口语', 20],
      ['reading', '阅读', 15],
      ['writing', '写作', 10],
      ['summary', '总结', 5],
    ],
    120: [
      ['listening', '听力', 30],
      ['vocabulary', '词汇', 20],
      ['speaking', '口语', 25],
      ['reading', '阅读', 20],
      ['writing', '写作', 20],
      ['summary', '总结', 5],
    ],
  };

  return (planMap[minutes] || planMap[60]).map(([id, title, taskMinutes]) => ({
    id,
    title,
    minutes: taskMinutes,
    route: routes[id],
  }));
}

export function completionRate(completedTasks: string[], plannedTasks: DailyTask[]) {
  if (!plannedTasks.length) return 0;
  const done = new Set(completedTasks);
  return Math.round((plannedTasks.filter((task) => done.has(task.id)).length / plannedTasks.length) * 100);
}
