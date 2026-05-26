import type { ReadingWritingTask } from '../types';

const readingTasks: ReadingWritingTask[] = [
  {
    type: 'reading',
    title: '短阅读：城市绿地',
    prompt: 'Urban green spaces can reduce stress, improve air quality, and create opportunities for social interaction. However, maintaining parks requires long-term funding and careful planning.',
    helper: '记录 main idea、3 个 new words、1 句 summary。',
  },
  {
    type: 'reading',
    title: '短阅读：远程学习',
    prompt: 'Remote learning offers flexibility, but students often need stronger self-discipline. The effectiveness of online courses depends on interaction, feedback, and clear learning goals.',
    helper: '找出作者观点，并写一句英文总结。',
  },
  {
    type: 'reading',
    title: '短阅读：公共交通',
    prompt: 'A reliable public transport system can reduce congestion and pollution. Yet many commuters still prefer private cars because of convenience and comfort.',
    helper: '记录转折关系，并整理 3 个可用于写作的表达。',
  },
];

const writingTasks: ReadingWritingTask[] = [
  {
    type: 'writing',
    title: 'Task 2 观点搭建',
    prompt: 'Some people think children should start learning a foreign language at primary school. To what extent do you agree or disagree?',
    helper: '写观点、2 个理由、每个理由 1 个例子。',
  },
  {
    type: 'writing',
    title: 'Task 2 完整作文',
    prompt: 'In many cities, people are choosing to live alone. What are the reasons for this, and is it a positive or negative development?',
    helper: '本周完整 Task 2：写完整引言、主体段和结论。',
    isFullWriting: true,
  },
  {
    type: 'writing',
    title: 'Task 2 论据练习',
    prompt: 'Some people believe that governments should spend more money on public services rather than arts. Discuss both views and give your opinion.',
    helper: '不用写全文，先写双方观点与自己的立场。',
  },
];

export function getReadingWritingTask(date = new Date()): ReadingWritingTask {
  const day = date.getDay();
  if (day === 0) {
    return {
      type: 'review',
      title: '周日复盘',
      prompt: '回顾本周阅读和写作练习：哪个题型最卡？哪类表达可以复用？下周想重点练什么？',
      helper: '写下本周问题、可复用表达、下周重点。',
    };
  }
  if ([1, 3, 5].includes(day)) return readingTasks[Math.floor(date.getDate() / 2) % readingTasks.length];
  return writingTasks[Math.floor(date.getDate() / 2) % writingTasks.length];
}
