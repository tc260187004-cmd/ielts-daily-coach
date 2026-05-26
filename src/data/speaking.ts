import type { SpeakingPrompt } from '../types';
import { dayIndex } from '../lib/date';

export const speakingPrompts: SpeakingPrompt[] = [
  { part: 'Part 1', question: 'Do you prefer studying in the morning or in the evening? Why?' },
  { part: 'Part 2', question: 'Describe a skill you would like to improve. You should say what it is, why you want to improve it, how you plan to improve it, and how it may help you.' },
  { part: 'Part 3', question: 'Why do some people find it difficult to keep learning after leaving school?' },
  { part: 'Part 1', question: 'What kind of place do you usually choose when you need to concentrate?' },
  { part: 'Part 2', question: 'Describe a person who encouraged you to study. You should say who this person is and explain how they encouraged you.' },
  { part: 'Part 3', question: 'Should governments invest more in adult education?' },
  { part: 'Part 1', question: 'How often do you make plans for your day?' },
  { part: 'Part 2', question: 'Describe a useful website or app for learning. You should say what it is and explain why it is useful.' },
  { part: 'Part 3', question: 'How has technology changed the way people learn languages?' },
];

export function getTodaySpeakingPrompt() {
  return speakingPrompts[dayIndex(speakingPrompts.length)];
}
