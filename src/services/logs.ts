import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/date';
import type { DailyLog, Profile } from '../types';

export async function upsertDailyLog(userId: string, patch: Partial<DailyLog> & { completedTask?: string }, plannedMinutes: number) {
  const logDate = patch.log_date || todayISO();
  const { data: current } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', logDate)
    .maybeSingle();

  const completed = new Set<string>((current?.completed_tasks as string[] | null) || []);
  if (patch.completedTask) completed.add(patch.completedTask);
  const nextCompleted = patch.completed_tasks || Array.from(completed);
  const taskCountByPlan: Record<number, number> = { 30: 4, 60: 5, 90: 6, 120: 6 };
  const taskCount = taskCountByPlan[plannedMinutes] || 5;
  const actualMinutes = patch.actual_minutes ?? Math.min(plannedMinutes, Math.round((nextCompleted.length / taskCount) * plannedMinutes));
  const payload = {
    user_id: userId,
    log_date: logDate,
    planned_minutes: plannedMinutes,
    actual_minutes: actualMinutes,
    completion_rate: patch.completion_rate ?? Math.min(100, Math.round((actualMinutes / plannedMinutes) * 100)),
    completed_tasks: nextCompleted,
  };

  const query = current?.id
    ? supabase.from('daily_logs').update(payload).eq('id', current.id).select('*').single()
    : supabase.from('daily_logs').insert(payload).select('*').single();
  const { data, error } = await query;
  if (error) throw error;
  return data as DailyLog;
}

export async function fetchDashboardData(userId: string) {
  const [daily, listening, speaking, writing] = await Promise.all([
    supabase.from('daily_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false }).limit(14),
    supabase.from('listening_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(7),
    supabase.from('speaking_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('writing_reading_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ]);
  if (daily.error) throw daily.error;
  return {
    dailyLogs: (daily.data || []) as DailyLog[],
    listeningLogs: listening.data || [],
    speakingLogs: speaking.data || [],
    writingLogs: writing.data || [],
  };
}

export async function updateProfile(profile: Profile) {
  const { data, error } = await supabase.from('profiles').update({
    target_band: profile.target_band,
    daily_minutes: profile.daily_minutes,
    weak_area: profile.weak_area,
    exam_date: profile.exam_date || null,
  }).eq('id', profile.id).select('*').single();
  if (error) throw error;
  return data as Profile;
}
