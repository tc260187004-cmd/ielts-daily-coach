import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/date';
import type { VocabItem, VocabularyReviewState } from '../types';

export type VocabAction = 'mastered' | 'unfamiliar' | 'wrongbook' | 'wrong' | 'fuzzy' | 'remembered';

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return todayISO(date);
}

function nextInterval(correctStreak: number) {
  if (correctStreak <= 1) return 3;
  if (correctStreak === 2) return 7;
  return 14;
}

export function calculateNextState(
  item: VocabItem,
  action: VocabAction,
  current?: Partial<VocabularyReviewState> | null,
): Partial<VocabularyReviewState> {
  const reviewCount = Number(current?.review_count || 0);
  const correctStreak = Number(current?.correct_streak || 0);
  const wrongCount = Number(current?.wrong_count || 0);
  const base = {
    word: item.word,
    meaning_cn: item.meaning_cn,
    last_reviewed_at: new Date().toISOString(),
  };

  if (action === 'mastered' || action === 'remembered') {
    const nextStreak = correctStreak + 1;
    return {
      ...base,
      status: 'mastered',
      review_count: reviewCount + 1,
      correct_streak: nextStreak,
      wrong_count: wrongCount,
      next_review_date: addDays(nextInterval(nextStreak)),
      mastered: nextStreak >= 3,
      in_wrongbook: current?.in_wrongbook ? nextStreak < 2 : Boolean(current?.in_wrongbook),
    };
  }

  if (action === 'wrongbook') {
    return {
      ...base,
      status: 'wrongbook',
      review_count: reviewCount + 1,
      correct_streak: 0,
      wrong_count: wrongCount + 1,
      next_review_date: addDays(1),
      mastered: false,
      in_wrongbook: true,
    };
  }

  return {
    ...base,
    status: action === 'fuzzy' || action === 'unfamiliar' ? 'unfamiliar' : 'wrong',
    review_count: reviewCount + 1,
    correct_streak: 0,
    wrong_count: wrongCount + 1,
    next_review_date: addDays(1),
    mastered: false,
    in_wrongbook: action === 'wrong' || action === 'fuzzy' ? true : Boolean(current?.in_wrongbook),
  };
}

export async function fetchVocabularyReviewStates(userId: string) {
  const { data, error } = await supabase
    .from('vocabulary_review_states')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []) as VocabularyReviewState[];
}

export async function upsertVocabularyReviewState(userId: string, item: VocabItem, action: VocabAction) {
  const { data: current, error: currentError } = await supabase
    .from('vocabulary_review_states')
    .select('*')
    .eq('user_id', userId)
    .eq('word', item.word)
    .maybeSingle();
  if (currentError) throw currentError;

  const next = {
    user_id: userId,
    ...calculateNextState(item, action, current as VocabularyReviewState | null),
  };

  const { data, error } = await supabase
    .from('vocabulary_review_states')
    .upsert(next, { onConflict: 'user_id,word' })
    .select('*')
    .single();
  if (error) throw error;
  return data as VocabularyReviewState;
}

export async function fetchTodayVocabularyTest(userId: string) {
  const { data, error } = await supabase
    .from('vocabulary_test_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('test_date', todayISO())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveVocabularyTest(params: {
  userId: string;
  totalQuestions: number;
  correctCount: number;
  wrongWords: string[];
  items: Array<{
    question_type: string;
    word: string;
    question: string;
    options: string[];
    correct_answer: string;
    user_answer: string;
    is_correct: boolean;
  }>;
}) {
  const accuracy = params.totalQuestions ? Math.round((params.correctCount / params.totalQuestions) * 100) : 0;
  const { data: log, error } = await supabase
    .from('vocabulary_test_logs')
    .insert({
      user_id: params.userId,
      test_date: todayISO(),
      total_questions: params.totalQuestions,
      correct_count: params.correctCount,
      accuracy,
      wrong_words: params.wrongWords,
    })
    .select('*')
    .single();
  if (error) throw error;

  if (params.items.length) {
    const { error: itemError } = await supabase.from('vocabulary_test_items').insert(params.items.map((item) => ({
      ...item,
      test_id: log.id,
      user_id: params.userId,
      options: item.options,
    })));
    if (itemError) throw itemError;
  }

  return log;
}
