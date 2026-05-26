import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, ClipboardList, Home, LogOut, RotateCcw, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/listening', label: '学习', icon: BookOpen },
  { to: '/daily-summary', label: '总结', icon: ClipboardList },
  { to: '/stage-review', label: '复盘', icon: RotateCcw },
  { to: '/settings', label: '设置', icon: Settings },
];

export function Layout() {
  const { signOut, profile } = useAuth();
  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-cyan-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ocean-700">IELTS Daily Coach</p>
            <p className="text-xs text-slate-500">{profile?.email || '个人学习空间'}</p>
          </div>
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-cyan-50 text-ocean-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <button onClick={signOut} className="focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              <LogOut size={16} /> 退出
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 py-8 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-cyan-100 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 py-2 text-xs ${isActive ? 'text-ocean-700' : 'text-slate-500'}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
