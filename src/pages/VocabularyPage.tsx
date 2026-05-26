import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Volume2, X } from 'lucide-react';
import { findVocabulary, getTodayVocabulary, vocabularyBank } from '../data/vocabulary';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/date';
import { upsertDailyLog } from '../services/logs';
import {
  fetchTodayVocabularyTest,
  fetchVocabularyReviewStates,
  saveVocabularyTest,
  upsertVocabularyReviewState,
  type VocabAction,
} from '../services/vocabulary';
import type { VocabItem, VocabularyReviewState } from '../types';

type TabKey = 'new' | 'review' | 'wrongbook' | 'test';
type LearnStatus = 'mastered' | 'unfamiliar' | 'wrongbook';
type QuestionType = 'en_to_cn' | 'cn_to_en' | 'fill_blank' | 'audio_choice';
type TestQuestion = {
  type: QuestionType;
  word: VocabItem;
  question: string;
  options: string[];
  correctAnswer: string;
};
type TestAnswer = TestQuestion & { userAnswer: string; isCorrect: boolean };

const statusLabel: Record<string, string> = {
  mastered: '已掌握',
  unfamiliar: '不熟',
  wrongbook: '错词本',
  wrong: '待复习',
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'new', label: '今日新词' },
  { key: 'review', label: '今日复习' },
  { key: 'wrongbook', label: '错词本' },
  { key: 'test', label: '今日测试' },
];

function tomorrowISO() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return todayISO(date);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function speakText(text: string, onUnsupported: (message: string) => void) {
  if (!('speechSynthesis' in window)) {
    onUnsupported('当前浏览器不支持朗读功能。可以换 Chrome 或 Edge 再试。');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) => item.lang === 'en-GB') || voices.find((item) => item.lang === 'en-US');
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || 'en-GB';
  utterance.rate = 0.9;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function buildChoices(current: VocabItem, bank: VocabItem[], field: 'meaning_cn' | 'word') {
  const distractors = shuffle(bank.filter((item) => item.word !== current.word)).slice(0, 3).map((item) => item[field]);
  return shuffle([...distractors, current[field]]);
}

function blankExample(item: VocabItem) {
  const pattern = new RegExp(`\\b${item.word}\\b`, 'i');
  return pattern.test(item.example_en) ? item.example_en.replace(pattern, '______') : `The correct answer is ______. (${item.meaning_cn})`;
}

function makeQuestions(pool: VocabItem[]) {
  const source = shuffle(pool.length >= 5 ? pool : [...pool, ...shuffle(vocabularyBank).slice(0, 10)]).slice(0, Math.min(10, Math.max(5, pool.length || 5)));
  const types: QuestionType[] = ['en_to_cn', 'cn_to_en', 'fill_blank', 'audio_choice'];
  return source.map((word, index): TestQuestion => {
    const type = types[index % types.length];
    if (type === 'cn_to_en') {
      return { type, word, question: `“${word.meaning_cn}” 对应哪个单词？`, options: buildChoices(word, vocabularyBank, 'word'), correctAnswer: word.word };
    }
    if (type === 'fill_blank') {
      return { type, word, question: blankExample(word), options: buildChoices(word, vocabularyBank, 'word'), correctAnswer: word.word };
    }
    if (type === 'audio_choice') {
      return { type, word, question: '你听到的是哪个单词？', options: buildChoices(word, vocabularyBank, 'word'), correctAnswer: word.word };
    }
    return { type, word, question: `${word.word} 的意思是？`, options: buildChoices(word, vocabularyBank, 'meaning_cn'), correctAnswer: word.meaning_cn };
  });
}

function stateToItem(state: VocabularyReviewState): VocabItem {
  return findVocabulary(state.word) || {
    word: state.word,
    meaning_cn: state.meaning_cn || '',
    example_en: `This word can be useful in IELTS practice.`,
    example_cn: '这个词可以用于雅思练习。',
    tag: 'reading',
    collocations: [],
    synonyms: [],
    ielts_usage: '',
  };
}

function WordDetails({ item, hidden }: { item: VocabItem; hidden?: boolean }) {
  if (hidden) return null;
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-[20px] bg-cyan-50 p-4">
        <p className="text-sm text-slate-500">中文释义</p>
        <p className="mt-1 text-xl font-semibold text-slate-950">{item.meaning_cn}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">例句</p>
        <p className="mt-2 text-lg text-slate-900">{item.example_en}</p>
        <p className="mt-1 text-sm text-slate-500">{item.example_cn}</p>
      </div>
      {item.collocations?.length ? (
        <div>
          <p className="text-sm font-medium text-slate-700">常见搭配</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.collocations.map((text) => <span key={text} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{text}</span>)}
          </div>
        </div>
      ) : null}
      {item.synonyms?.length ? <p className="text-sm text-slate-700"><span className="font-medium">近义替换：</span>{item.synonyms.join(' / ')}</p> : null}
      {item.ielts_usage ? <p className="rounded-2xl border border-cyan-100 p-4 text-sm leading-6 text-slate-700"><span className="font-medium text-ocean-700">雅思用法：</span>{item.ielts_usage}</p> : null}
      {item.common_mistake ? <p className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800"><span className="font-medium">常见错误：</span>{item.common_mistake}</p> : null}
      {item.pronunciation_tip ? <p className="text-sm text-slate-500">发音提示：{item.pronunciation_tip}</p> : null}
    </div>
  );
}

export function VocabularyPage() {
  const { user, profile } = useAuth();
  const todayWords = getTodayVocabulary();
  const [tab, setTab] = useState<TabKey>('new');
  const [statuses, setStatuses] = useState<Record<string, LearnStatus>>({});
  const [reviewStates, setReviewStates] = useState<VocabularyReviewState[]>([]);
  const [testLog, setTestLog] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<TestAnswer[]>([]);
  const [testSelected, setTestSelected] = useState<string | null>(null);
  const [testFinished, setTestFinished] = useState(false);

  const dueItems = useMemo(() => reviewStates
    .filter((state) => state.next_review_date && state.next_review_date <= todayISO() && !state.mastered)
    .map(stateToItem), [reviewStates]);
  const wrongbookItems = useMemo(() => reviewStates.filter((state) => state.in_wrongbook).map(stateToItem), [reviewStates]);
  const activeItems = tab === 'review' ? dueItems : tab === 'wrongbook' ? wrongbookItems : todayWords;
  const current = activeItems[Math.min(index, Math.max(0, activeItems.length - 1))] || todayWords[0];
  const choices = useMemo(() => buildChoices(current, vocabularyBank, 'meaning_cn'), [current.word]);
  const studiedCount = todayWords.filter((word) => statuses[word.word]).length;
  const todayDone = studiedCount >= todayWords.length;
  const currentQuestion = questions[questionIndex];
  const currentAnswer = answers.find((answer) => answer.word.word === currentQuestion?.word.word && answer.type === currentQuestion.type);

  async function refreshVocabularyData() {
    if (!user) return;
    const [logs, states, todayTest] = await Promise.all([
      supabase.from('vocabulary_logs').select('*').eq('user_id', user.id).eq('log_date', todayISO()),
      fetchVocabularyReviewStates(user.id).catch(() => []),
      fetchTodayVocabularyTest(user.id).catch(() => null),
    ]);
    const next: Record<string, LearnStatus> = {};
    (logs.data || []).forEach((row) => { next[row.word] = row.status; });
    setStatuses(next);
    setReviewStates(states);
    setTestLog(todayTest);
  }

  useEffect(() => {
    refreshVocabularyData().catch((error) => setMessage(error.message));
  }, [user?.id]);

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
    setSelected(null);
  }, [tab]);

  const move = (direction: 1 | -1) => {
    setIndex((currentIndex) => Math.min(activeItems.length - 1, Math.max(0, currentIndex + direction)));
    setRevealed(false);
    setSelected(null);
  };

  const saveLegacyLog = async (item: VocabItem, status: LearnStatus) => {
    if (!user) return;
    const { data: existing } = await supabase.from('vocabulary_logs').select('id').eq('user_id', user.id).eq('log_date', todayISO()).eq('word', item.word).maybeSingle();
    const payload = { user_id: user.id, log_date: todayISO(), word: item.word, status };
    const { error } = existing
      ? await supabase.from('vocabulary_logs').update(payload).eq('id', existing.id)
      : await supabase.from('vocabulary_logs').insert(payload);
    if (error) throw error;
  };

  const saveWordAction = async (item: VocabItem, action: VocabAction, shouldMove = true) => {
    if (!user) return;
    const legacyStatus: LearnStatus = action === 'mastered' || action === 'remembered' ? 'mastered' : action === 'wrongbook' || action === 'wrong' ? 'wrongbook' : 'unfamiliar';
    setStatuses((currentStatuses) => ({ ...currentStatuses, [item.word]: legacyStatus }));
    await saveLegacyLog(item, legacyStatus);
    await upsertVocabularyReviewState(user.id, item, action);
    await refreshVocabularyData();
    const nextStatuses = { ...statuses, [item.word]: legacyStatus };
    if (todayWords.every((word) => nextStatuses[word.word])) {
      await upsertDailyLog(user.id, { completedTask: 'vocabulary' }, profile?.daily_minutes || 60);
      setMessage('今日新词已完成，可以开始今日单词测试。');
    }
    if (shouldMove && index < activeItems.length - 1) move(1);
  };

  const startTest = () => {
    const pool = [...todayWords, ...dueItems].filter((item, itemIndex, arr) => arr.findIndex((target) => target.word === item.word) === itemIndex);
    setQuestions(makeQuestions(pool));
    setQuestionIndex(0);
    setAnswers([]);
    setTestSelected(null);
    setTestFinished(false);
  };

  const answerQuestion = async (answer: string) => {
    if (!currentQuestion || currentAnswer) return;
    const isCorrect = answer === currentQuestion.correctAnswer;
    setTestSelected(answer);
    const record: TestAnswer = { ...currentQuestion, userAnswer: answer, isCorrect };
    setAnswers((currentAnswers) => [...currentAnswers, record]);
    if (!isCorrect && user) {
      await saveLegacyLog(currentQuestion.word, 'wrongbook');
      await upsertVocabularyReviewState(user.id, currentQuestion.word, 'wrong');
      await refreshVocabularyData();
    }
  };

  const finishTest = async () => {
    if (!user) return;
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const wrongWords = answers.filter((answer) => !answer.isCorrect).map((answer) => answer.word.word);
    await saveVocabularyTest({
      userId: user.id,
      totalQuestions: answers.length,
      correctCount,
      wrongWords,
      items: answers.map((answer) => ({
        question_type: answer.type,
        word: answer.word.word,
        question: answer.question,
        options: answer.options,
        correct_answer: answer.correctAnswer,
        user_answer: answer.userAnswer,
        is_correct: answer.isCorrect,
      })),
    });
    await refreshVocabularyData();
    setTestFinished(true);
  };

  const nextQuestion = async () => {
    setTestSelected(null);
    if (questionIndex >= questions.length - 1) await finishTest();
    else setQuestionIndex((currentIndex) => currentIndex + 1);
  };

  const renderLearningCard = (mode: 'new' | 'review' | 'wrongbook') => {
    if (!activeItems.length) {
      return <section className="rounded-[22px] border border-cyan-100 bg-white/95 p-6 shadow-soft">今天没有需要复习的词。可以去“今日新词”或“今日测试”。</section>;
    }
    const isReview = mode !== 'new';
    return (
      <>
        <section className="rounded-[22px] border border-cyan-100 bg-white/95 p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">进度 {index + 1}/{activeItems.length}</p>
              <div className="mt-2 h-2 w-56 max-w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-ocean-600" style={{ width: `${((index + 1) / activeItems.length) * 100}%` }} />
              </div>
            </div>
            <button onClick={() => { setIndex(0); setRevealed(false); setSelected(null); }} className="focus-ring inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              <RotateCcw size={16} /> 重来
            </button>
          </div>
        </section>

        <section
          className="rounded-[24px] border border-cyan-100 bg-white/95 p-6 shadow-soft"
          onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            if (touchStart === null || isReview) return;
            const end = event.changedTouches[0]?.clientX ?? touchStart;
            const delta = end - touchStart;
            if (delta > 80) saveWordAction(current, 'mastered');
            if (delta < -80) saveWordAction(current, 'unfamiliar');
            setTouchStart(null);
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ocean-700">{current.tag}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-4xl font-semibold text-slate-950">{current.word}</h2>
                <button onClick={() => speakText(current.word, setMessage)} className="focus-ring rounded-full bg-cyan-50 p-3 text-ocean-700" aria-label="朗读单词">
                  <Volume2 size={22} />
                </button>
              </div>
            </div>
            {statuses[current.word] && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{statusLabel[statuses[current.word]]}</span>}
          </div>

          {!isReview && !revealed ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-slate-700">这个词最接近哪个意思？</p>
              <div className="grid gap-3 md:grid-cols-2">
                {choices.map((choice) => (
                  <button key={choice} onClick={() => { setSelected(choice); if (choice === current.meaning_cn) setRevealed(true); }} className={`focus-ring rounded-2xl border px-4 py-3 text-left text-sm font-medium ${selected === choice && choice !== current.meaning_cn ? 'border-red-300 bg-red-50 text-red-700' : selected && choice === current.meaning_cn ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-cyan-100 bg-slate-50 text-slate-700 hover:border-ocean-500'}`}>
                    {choice}
                  </button>
                ))}
              </div>
              {selected && selected !== current.meaning_cn && <p className="text-sm text-red-600">再想一下，或者直接查看答案。</p>}
              <button onClick={() => setRevealed(true)} className="focus-ring w-full rounded-full border border-cyan-200 px-4 py-3 font-semibold text-ocean-700">显示答案</button>
            </div>
          ) : null}

          {isReview && !revealed ? (
            <div className="mt-6 rounded-[20px] bg-slate-50 p-5 text-center">
              <p className="text-slate-600">先回忆中文释义、搭配和例句，再查看答案。</p>
              <button onClick={() => setRevealed(true)} className="focus-ring mt-4 rounded-full bg-gradient-to-r from-ocean-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-soft">显示答案</button>
            </div>
          ) : null}

          <WordDetails item={current} hidden={(isReview && !revealed) || (!isReview && !revealed)} />
          {revealed && (
            <button onClick={() => speakText(current.example_en, setMessage)} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-ocean-700">
              <Volume2 size={17} /> 朗读例句
            </button>
          )}

          <div className="mt-6 grid grid-cols-3 gap-2">
            {isReview ? (
              <>
                <button onClick={() => saveWordAction(current, 'wrong')} className="focus-ring rounded-2xl border border-red-100 bg-red-50 px-3 py-3 font-semibold text-red-700">想不起来</button>
                <button onClick={() => saveWordAction(current, 'fuzzy')} className="focus-ring rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 font-semibold text-amber-800">模糊</button>
                <button onClick={() => saveWordAction(current, 'remembered')} className="focus-ring rounded-2xl bg-emerald-600 px-3 py-3 font-semibold text-white">记得</button>
              </>
            ) : (
              <>
                <button onClick={() => saveWordAction(current, 'unfamiliar')} className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 font-semibold text-red-700"><X size={18} /> 不记得</button>
                <button onClick={() => saveWordAction(current, 'wrongbook', false)} className="focus-ring rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 font-semibold text-amber-800">错词本</button>
                <button onClick={() => saveWordAction(current, 'mastered')} className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 font-semibold text-white">记得 <Check size={18} /></button>
              </>
            )}
          </div>
        </section>

        <div className="flex items-center justify-between">
          <button disabled={index === 0} onClick={() => move(-1)} className="focus-ring inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 disabled:text-slate-300"><ChevronLeft size={18} /> 上一个</button>
          <span className="text-sm text-slate-500">{isReview ? '先回忆，再显示答案' : '左滑不记得 · 右滑记得'}</span>
          <button disabled={index === activeItems.length - 1} onClick={() => move(1)} className="focus-ring inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 disabled:text-slate-300">下一个 <ChevronRight size={18} /></button>
        </div>
      </>
    );
  };

  const renderTest = () => {
    if (testLog && !questions.length) {
      const wrongWords = Array.isArray(testLog.wrong_words) ? testLog.wrong_words : [];
      return (
        <section className="rounded-[22px] border border-cyan-100 bg-white/95 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">今日测试已完成</h2>
          <p className="mt-3 text-slate-600">得分：{testLog.correct_count}/{testLog.total_questions}，正确率 {Math.round(Number(testLog.accuracy || 0))}%</p>
          <p className="mt-3 text-sm text-slate-500">错词：{wrongWords.length ? wrongWords.join(' / ') : '无'}</p>
          <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm text-slate-700">明日建议：优先复习错词本和 next review 到期的单词。</p>
        </section>
      );
    }
    if (!questions.length || testFinished) {
      const correctCount = answers.filter((answer) => answer.isCorrect).length;
      const wrongAnswers = answers.filter((answer) => !answer.isCorrect);
      return (
        <section className="rounded-[22px] border border-cyan-100 bg-white/95 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">{testFinished ? '测试结果' : '今日单词测试'}</h2>
          {testFinished ? (
            <div className="mt-4 space-y-3">
              <p className="text-slate-700">正确题数：{correctCount} / {answers.length}</p>
              <p className="text-slate-700">正确率：{answers.length ? Math.round((correctCount / answers.length) * 100) : 0}%</p>
              <p className="text-slate-700">错词列表：{wrongAnswers.length ? wrongAnswers.map((answer) => answer.word.word).join(' / ') : '无'}</p>
              <p className="rounded-2xl bg-cyan-50 p-4 text-sm text-slate-700">明日复习建议：错词已经自动加入错词本，明天优先复习这些词。</p>
            </div>
          ) : (
            <p className="mt-3 text-slate-600">{todayDone ? '从今日新词和待复习词中生成 5-10 道题。' : '完成今日新词后解锁今日测试。'}</p>
          )}
          {!testFinished && <button disabled={!todayDone} onClick={startTest} className="focus-ring mt-5 rounded-full bg-gradient-to-r from-ocean-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-soft disabled:bg-none disabled:bg-slate-300">开始今日单词测试</button>}
        </section>
      );
    }

    return (
      <section className="rounded-[22px] border border-cyan-100 bg-white/95 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ocean-700">第 {questionIndex + 1}/{questions.length} 题</p>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{currentQuestion.type === 'audio_choice' ? '听音选词' : currentQuestion.type === 'fill_blank' ? '例句填空' : currentQuestion.type === 'cn_to_en' ? '中译英' : '英译中'}</p>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">{currentQuestion.question}</h2>
        {currentQuestion.type === 'audio_choice' && <button onClick={() => speakText(currentQuestion.word.word, setMessage)} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 font-semibold text-ocean-700"><Volume2 size={18} /> 播放音频 / 再听一遍</button>}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {currentQuestion.options.map((option) => {
            const chosen = currentAnswer?.userAnswer === option || testSelected === option;
            const correct = currentAnswer && option === currentQuestion.correctAnswer;
            const wrong = currentAnswer && chosen && option !== currentQuestion.correctAnswer;
            return (
              <button key={option} disabled={Boolean(currentAnswer)} onClick={() => answerQuestion(option)} className={`focus-ring rounded-2xl border px-4 py-4 text-left font-semibold ${correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : wrong ? 'border-red-300 bg-red-50 text-red-700' : 'border-cyan-100 bg-slate-50 text-slate-700 hover:border-ocean-500'}`}>
                {option}
              </button>
            );
          })}
        </div>
        {currentAnswer && (
          <div className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${currentAnswer.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {currentAnswer.isCorrect ? '答对了。' : `答错了。正确答案：${currentQuestion.correctAnswer}。${currentQuestion.word.word}：${currentQuestion.word.meaning_cn}。例句：${currentQuestion.word.example_en}`}
          </div>
        )}
        <button disabled={!currentAnswer} onClick={nextQuestion} className="focus-ring mt-5 rounded-full bg-gradient-to-r from-ocean-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-soft disabled:bg-none disabled:bg-slate-300">
          {questionIndex >= questions.length - 1 ? '完成测试' : '下一题'}
        </button>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">雅思词汇训练</h1>
        <p className="mt-2 text-slate-600">今日新词、记忆曲线复习、错词本和小测试都集中在这里。</p>
      </section>

      <section className="grid gap-3 rounded-[22px] border border-cyan-100 bg-white/95 p-3 shadow-soft md:grid-cols-4">
        {tabs.map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`focus-ring rounded-2xl px-4 py-3 text-sm font-semibold ${tab === item.key ? 'bg-ocean-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-cyan-50'}`}>
            {item.label}
          </button>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[20px] bg-white/95 p-4 shadow-soft"><p className="text-sm text-slate-500">今日新词</p><p className="mt-1 text-2xl font-semibold">{todayWords.length}</p></div>
        <div className="rounded-[20px] bg-white/95 p-4 shadow-soft"><p className="text-sm text-slate-500">待复习</p><p className="mt-1 text-2xl font-semibold">{dueItems.length}</p></div>
        <div className="rounded-[20px] bg-white/95 p-4 shadow-soft"><p className="text-sm text-slate-500">错词本</p><p className="mt-1 text-2xl font-semibold">{wrongbookItems.length}</p></div>
        <div className="rounded-[20px] bg-white/95 p-4 shadow-soft"><p className="text-sm text-slate-500">今日测试</p><p className="mt-1 text-lg font-semibold">{testLog ? `${testLog.correct_count}/${testLog.total_questions}` : todayDone ? '已解锁' : '未解锁'}</p></div>
      </section>

      {tab === 'test' ? renderTest() : renderLearningCard(tab)}

      {tab !== 'test' && (
        <section className="rounded-[22px] border border-cyan-100 bg-white/95 p-5 shadow-soft">
          <h2 className="font-semibold text-slate-900">{tab === 'wrongbook' ? '错词列表' : tab === 'review' ? '待复习列表' : '今日单词列表'}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {activeItems.map((item, itemIndex) => {
              const state = reviewStates.find((row) => row.word === item.word);
              const label = statuses[item.word] ? statusLabel[statuses[item.word]] : state?.next_review_date && state.next_review_date <= todayISO() ? '待复习' : '未学习';
              return (
                <button key={item.word} onClick={() => { setIndex(itemIndex); setRevealed(false); setSelected(null); }} className="focus-ring rounded-2xl border border-cyan-100 p-4 text-left hover:border-ocean-500">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.word}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.meaning_cn}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {message && <p className="rounded-2xl bg-cyan-50 p-4 text-sm text-ocean-700">{message}</p>}
    </div>
  );
}
