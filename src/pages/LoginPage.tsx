import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function LoginPage() {
  const { user, signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithPassword(email, password);
      setMessage('登录成功，正在进入首页。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await signUpWithPassword(email, password);
      setMessage('注册成功。如果 Supabase 要求邮箱确认，请打开邮件确认一次；确认后即可用密码登录。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await signInWithEmail(email);
      setMessage('登录链接已发送，请打开邮箱完成登录。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border border-cyan-100 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold text-ocean-700">IELTS Daily Coach</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">每天 1 小时，系统提升听说读写。</h1>
        <p className="mt-3 text-sm text-slate-600">使用 Supabase 账号登录，电脑、iPad、手机会同步同一份学习记录。</p>
        {!isSupabaseConfigured && <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">请先复制 .env.example 并配置 Supabase。</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">邮箱</span>
            <input className="focus-ring mt-2 w-full rounded-md border border-slate-200 px-3 py-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">密码</span>
            <input className="focus-ring mt-2 w-full rounded-md border border-slate-200 px-3 py-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="至少 6 位密码" />
          </label>
          <button disabled={loading || !isSupabaseConfigured} className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-ocean-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            <Mail size={18} /> {loading ? '处理中...' : '密码登录'}
          </button>
          <button type="button" disabled={loading || !email || password.length < 6 || !isSupabaseConfigured} onClick={register} className="focus-ring w-full rounded-md border border-cyan-200 bg-white px-4 py-3 font-semibold text-ocean-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300">
            注册新账号
          </button>
          <button type="button" disabled={loading || !email || !isSupabaseConfigured} onClick={sendMagicLink} className="focus-ring w-full rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">
            备用：发送邮箱登录链接
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
