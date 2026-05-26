import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/logs';
import type { Profile } from '../types';

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [reminder, setReminder] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => setDraft(profile), [profile]);

  if (!draft) return <p>正在加载设置...</p>;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await updateProfile(draft);
    await refreshProfile();
    setMessage('设置已保存');
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 rounded-lg border border-cyan-100 bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-semibold text-slate-950">学习设置</h1>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">每日学习时长</span>
        <select className="focus-ring mt-2 w-full rounded-md border border-slate-200 px-3 py-3" value={draft.daily_minutes} onChange={(e) => setDraft({ ...draft, daily_minutes: Number(e.target.value) })}>
          {[30, 60, 90, 120].map((value) => <option key={value} value={value}>{value} 分钟</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">目标雅思分数</span>
        <select className="focus-ring mt-2 w-full rounded-md border border-slate-200 px-3 py-3" value={draft.target_band} onChange={(e) => setDraft({ ...draft, target_band: e.target.value })}>
          {['5.5', '6', '6.5', '7', '7.5'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">当前薄弱模块</span>
        <select className="focus-ring mt-2 w-full rounded-md border border-slate-200 px-3 py-3" value={draft.weak_area || '口语'} onChange={(e) => setDraft({ ...draft, weak_area: e.target.value })}>
          {['听力', '阅读', '写作', '口语', '词汇'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">考试日期</span>
        <input className="focus-ring mt-2 w-full rounded-md border border-slate-200 px-3 py-3" type="date" value={draft.exam_date || ''} onChange={(e) => setDraft({ ...draft, exam_date: e.target.value || null })} />
      </label>
      <label className="flex items-center gap-3 rounded-md bg-cyan-50 p-3 text-sm text-slate-700">
        <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} />
        开启每日总结提醒（第一版仅前端显示）
      </label>
      <button className="focus-ring rounded-md bg-ocean-600 px-4 py-3 font-semibold text-white">保存设置</button>
      {message && <p className="text-sm text-emerald-700">{message}{reminder ? '，今日总结提醒已显示。' : ''}</p>}
    </form>
  );
}
