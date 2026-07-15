import { Activity, AlarmClock, BarChart3, ClipboardPlus, Home, LogOut, Menu, Settings, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../auth/permissions';

const nav = [
  { to: '/', label: 'ภาพรวม', icon: Home, permission: 'dashboard.read' },
  { to: '/patients', label: 'ผู้ป่วย', icon: Users, permission: 'patients.read' },
  { to: '/visits', label: 'เยี่ยมบ้าน', icon: ClipboardPlus, permission: 'visits.read' },
  { to: '/follow-ups', label: 'ติดตาม', icon: AlarmClock, permission: 'visits.read' },
  { to: '/reports', label: 'รายงาน', icon: BarChart3, permission: 'reports.read' },
  { to: '/settings', label: 'ตั้งค่า', icon: Settings, permission: 'master.manage' },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const visibleNav = user ? nav.filter((item) => hasPermission(user.role, item.permission)) : [];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white p-6 lg:block">
        <Brand />
        <nav className="mt-10 space-y-2" aria-label="เมนูหลัก">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`
            }><Icon size={20} />{label}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="lg:hidden"><Brand compact /></div>
          <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 lg:hidden" aria-label="เปิดเมนู"><Menu size={20} /></button>
          <div className="ml-auto flex items-center gap-3"><div className="text-right"><p className="text-xs text-slate-400">{user?.role}</p><p className="text-sm font-semibold">{user?.displayName}</p></div><button onClick={logout} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500" aria-label="ออกจากระบบ"><LogOut size={19}/></button></div>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-8"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="เมนูมือถือ">
        {visibleNav.filter(item=>item.to!=='/settings').map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
            `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${isActive ? 'text-brand-700' : 'text-slate-400'}`
          }><Icon size={20} />{label}</NavLink>
        ))}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 text-white"><Activity /></span>{!compact && <div><p className="font-bold text-brand-700">INHOMESSS</p><p className="text-xs text-slate-400">Home Visit Platform</p></div>}</div>;
}
