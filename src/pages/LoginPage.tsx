import { Activity, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(''); const [password, setPassword] = useState('');
  const [show, setShow] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const navigate = useNavigate(); const location = useLocation();
  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await login(username, password); navigate((location.state as { from?: string } | null)?.from || '/', { replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : 'เข้าสู่ระบบไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  return <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
    <section className="hidden bg-gradient-to-br from-brand-700 to-emerald-500 p-12 text-white lg:flex lg:flex-col lg:justify-between"><Activity size={42} /><div><p className="text-5xl font-bold">INHOMESSS</p><p className="mt-4 max-w-lg text-xl text-emerald-50">ระบบเยี่ยมบ้านผู้ป่วย เพื่อการดูแลต่อเนื่องอย่างปลอดภัยและครบทุกมิติ</p></div><p className="text-sm text-emerald-100">ข้อมูลสุขภาพเป็นความลับ ใช้งานตามสิทธิ์และวัตถุประสงค์เท่านั้น</p></section>
    <section className="flex items-center justify-center p-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-soft lg:p-10"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><LockKeyhole /></span><h1 className="mt-6 text-3xl font-bold">เข้าสู่ระบบ</h1><p className="mt-2 text-sm text-slate-500">ใช้บัญชีที่ผู้ดูแลระบบออกให้</p>
      <label className="mt-7 block text-sm font-semibold" htmlFor="username">ชื่อผู้ใช้</label><div className="mt-2 flex items-center rounded-2xl border border-slate-200 px-4 focus-within:ring-2 focus-within:ring-brand-500"><UserRound size={19} className="text-slate-400" /><input id="username" autoComplete="username" required value={username} onChange={(e)=>setUsername(e.target.value)} className="min-h-12 w-full border-0 bg-transparent px-3 outline-none" /></div>
      <label className="mt-5 block text-sm font-semibold" htmlFor="password">รหัสผ่าน</label><div className="mt-2 flex items-center rounded-2xl border border-slate-200 px-4 focus-within:ring-2 focus-within:ring-brand-500"><LockKeyhole size={19} className="text-slate-400" /><input id="password" type={show?'text':'password'} autoComplete="current-password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="min-h-12 w-full border-0 bg-transparent px-3 outline-none" /><button type="button" onClick={()=>setShow(!show)} className="p-2" aria-label={show?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน'}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>
      {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="mt-7 min-h-12 w-full rounded-2xl bg-brand-700 font-bold text-white transition hover:bg-brand-600 disabled:opacity-60">{busy?'กำลังเข้าสู่ระบบ…':'เข้าสู่ระบบ'}</button>
    </form></section>
  </main>;
}

