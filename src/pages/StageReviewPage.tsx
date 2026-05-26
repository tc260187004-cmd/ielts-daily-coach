import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { aiClient } from '../lib/ai';
import { SummaryPanel } from '../components/Cards';
import type { StageReview } from '../types';

type StageType = 'weekly' | 'day30' | 'day60';

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row[key] || 'unknown');
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function pickRecent<T>(rows: T[], count = 12) {
  return rows.slice(0, count);
}

export function StageReviewPage() {
  const { user, profile } = useAuth();
  const [stage, setStage] = useState<StageType>('weekly');
  const [review, setReview] = useState<StageReview | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const stageDays = stage === 'weekly' ? 7 : stage === 'day30' ? 30 : 60;

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      const startDate = isoDaysAgo(stageDays);
      const endDate = today();

      const [
        dailyLogs,
        speakingLogs,
        vocabularyTestLogs,
        listeningLogs,
        writingReadingLogs,
      ] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('log_date', { ascending: false }),
        supabase
          .from('speaking_logs')
          .select('log_date, part, question, answer, estimated_band_range, ai_feedback, created_at')
          .eq('user_id', user.id)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('created_at', { ascending: false }),
        supabase
          .from('vocabulary_test_logs')
          .select('test_date, total_questions, correct_count, accuracy, wrong_words, created_at')
          .eq('user_id', user.id)
          .gte('test_date', startDate)
          .lte('test_date', endDate)
          .order('test_date', { ascending: false }),
        supabase
          .from('listening_logs')
          .select('log_date, listening_id, new_words, summary_en, completed, created_at')
          .eq('user_id', user.id)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('log_date', { ascending: false }),
        supabase
          .from('writing_reading_logs')
          .select('log_date, type, prompt, user_notes, completed, created_at')
          .eq('user_id', user.id)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('log_date', { ascending: false }),
      ]);

      const queryError = [dailyLogs, speakingLogs, vocabularyTestLogs, listeningLogs, writingReadingLogs].find((result) => result.error)?.error;
      if (queryError) throw queryError;

      const daily = dailyLogs.data || [];
      const speaking = speakingLogs.data || [];
      const vocabTests = vocabularyTestLogs.data || [];
      const listening = listeningLogs.data || [];
      const writingReading = writingReadingLogs.data || [];

      if (daily.length < stageDays) {
        setMessage(`当前只有 ${daily.length} 天学习总记录，达到 ${stageDays} 天后复盘会更准确。你仍然可以先生成参考版。`);
      }

      const completionRates = daily.map((log) => Number(log.completion_rate || 0));
      const averageCompletionRate = completionRates.length
        ? Math.round((completionRates.reduce((sum, value) => sum + value, 0) / completionRates.length) * 100) / 100
        : 0;
      const wrongWords = vocabTests.flatMap((test) => Array.isArray(test.wrong_words) ? test.wrong_words : []);
      const speakingBands = speaking.map((log) => log.estimated_band_range).filter(Boolean);

      const evidence = {
        dailyOverview: {
          daysWithLogs: daily.length,
          plannedMinutes: daily.reduce((sum, log) => sum + Number(log.planned_minutes || 0), 0),
          actualMinutes: daily.reduce((sum, log) => sum + Number(log.actual_minutes || 0), 0),
          averageCompletionRate,
          completedTasksByDay: daily.map((log) => ({
            date: log.log_date,
            completionRate: log.completion_rate,
            completedTasks: log.completed_tasks,
          })),
        },
        speakingDiagnosis: {
          attempts: speaking.length,
          bandRanges: speakingBands,
          recentAnswers: pickRecent(speaking, 8),
        },
        vocabularyDiagnosis: {
          tests: vocabTests.length,
          averageAccuracy: vocabTests.length
            ? Math.round((vocabTests.reduce((sum, test) => sum + Number(test.accuracy || 0), 0) / vocabTests.length) * 100) / 100
            : 0,
          wrongWords,
          mostRepeatedWrongWords: countBy(wrongWords.map((word) => ({ word })), 'word'),
          recentTests: pickRecent(vocabTests, 8),
        },
        listeningDiagnosis: {
          attempts: listening.length,
          logsWithNewWords: listening.filter((log) => String(log.new_words || '').trim()).length,
          recentNewWords: listening.map((log) => ({ date: log.log_date, newWords: log.new_words })).filter((item) => item.newWords),
          recentSummaries: listening.map((log) => ({ date: log.log_date, summary: log.summary_en })).filter((item) => item.summary),
        },
        readingWritingDiagnosis: {
          attempts: writingReading.length,
          typeCounts: countBy(writingReading, 'type'),
          recentWork: pickRecent(writingReading, 10),
        },
      };

      const result = await aiClient.stageReview<StageReview>({
        profile,
        dateRange: { startDate, endDate, stageType: stage, stageDays },
        logs: daily,
        evidence,
        instruction: '请基于 detailed evidence 做深度诊断，指出这一阶段最常犯的口语、词汇、听力、阅读/写作问题，并给出下阶段具体训练安排。',
      });
      setReview(result);
      const { error: saveError } = await supabase.from('stage_reviews').insert({
        user_id: user.id,
        stage_type: stage,
        start_date: startDate,
        end_date: endDate,
        review: result,
      });
      if (saveError) throw saveError;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '生成失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-cyan-100 bg-white p-5 shadow-soft md:p-6">
        <h1 className="text-2xl font-semibold text-slate-950">阶段复盘</h1>
        <p className="mt-2 text-slate-600">
          复盘会读取学习时长、完成率、口语回答与反馈、词汇测试错题、听力生词、阅读/写作记录，再生成下阶段训练建议。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['weekly', 'day30', 'day60'] as StageType[]).map((item) => (
            <button
              key={item}
              onClick={() => setStage(item)}
              className={`focus-ring rounded-xl px-4 py-3 text-sm font-semibold ${
                stage === item ? 'bg-ocean-600 text-white' : 'border border-cyan-200 bg-white text-ocean-700'
              }`}
            >
              {item === 'weekly' ? '7 天周复盘' : item === 'day30' ? '30 天诊断' : '60 天诊断'}
            </button>
          ))}
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-soft disabled:bg-slate-300"
        >
          <Sparkles size={18} /> {loading ? '生成中...' : '生成阶段复盘'}
        </button>
        {message && <p className="mt-3 text-sm leading-6 text-amber-700">{message}</p>}
      </section>
      <SummaryPanel data={review as Record<string, unknown> | null} />
    </div>
  );
}
