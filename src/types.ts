export type StudyModule = 'listening' | 'vocabulary' | 'speaking' | 'reading' | 'writing' | 'summary';

export type Profile = {
  id: string;
  email: string | null;
  target_band: string;
  daily_minutes: number;
  weak_area: string | null;
  exam_date: string | null;
  reminder_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DailyTask = {
  id: StudyModule;
  title: string;
  minutes: number;
  route: string;
};

export type DailyLog = {
  id?: string;
  user_id: string;
  log_date: string;
  planned_minutes: number;
  actual_minutes: number;
  completion_rate: number;
  completed_tasks: string[];
  created_at?: string;
  updated_at?: string;
};

export type ListeningItem = {
  id: string;
  dayIndex: number;
  title: string;
  sourceName: string;
  url: string;
  topic: string;
  difficulty: string;
  sectionType: 'Section 1' | 'Section 2' | 'Section 3' | 'Section 4' | 'General Listening';
  tasks: string[];
  localScript?: string;
  focusQuestions?: string[];
};

export type VocabItem = {
  word: string;
  meaning_cn: string;
  example_en: string;
  example_cn: string;
  tag: 'listening' | 'speaking' | 'writing' | 'reading';
  collocations?: string[];
  synonyms?: string[];
  ielts_usage?: string;
  common_mistake?: string;
  pronunciation_tip?: string;
};

export type VocabularyReviewState = {
  id?: string;
  user_id: string;
  word: string;
  meaning_cn: string | null;
  status: string | null;
  review_count: number;
  correct_streak: number;
  wrong_count: number;
  last_reviewed_at: string | null;
  next_review_date: string | null;
  mastered: boolean;
  in_wrongbook: boolean;
  created_at?: string;
  updated_at?: string;
};

export type VocabularyTestLog = {
  id?: string;
  user_id: string;
  test_date: string;
  total_questions: number;
  correct_count: number;
  accuracy: number;
  wrong_words: string[];
  created_at?: string;
};

export type SpeakingPrompt = {
  part: 'Part 1' | 'Part 2' | 'Part 3';
  question: string;
};

export type SpeakingFeedback = {
  estimated_band_range: string;
  fluency_feedback: string;
  vocabulary_feedback: string;
  grammar_feedback: string;
  coherence_feedback: string;
  pronunciation_note: string;
  improved_answer_band7: string;
  next_practice_advice: string;
};

export type DailySummary = {
  completion_summary: string;
  strengths: string;
  weaknesses: string;
  tomorrow_plan: string;
  should_increase_time: string;
  encouragement: string;
};

export type StageReview = {
  consistency_analysis: string;
  strongest_area: string;
  weakest_area: string;
  time_allocation_advice: string;
  next_30_days_plan: string;
  should_adjust_daily_minutes: string;
};

export type ReadingWritingTask = {
  type: 'reading' | 'writing' | 'review';
  title: string;
  prompt: string;
  helper: string;
  isFullWriting?: boolean;
};
