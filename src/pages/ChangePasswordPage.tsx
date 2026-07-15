import { KeyRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

export function ChangePasswordPage() {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (newPassword !== confirmPassword) { setError('ยืนยันรหัสผ่านใหม่ไม่ตรงกัน'); return; }
    setBusy(true);
    try { await changePassword(currentPassword, newPassword); }
    catch (e) { setError(e instanceof Error ? e.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-soft lg:p-10"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><KeyRound /></span><h1 className="mt-6 text-2xl font-bold">กำหนดรหัสผ่านใหม่</h1><p className="mt-2 text-sm text-slate-500">เพื่อความปลอดภัย กรุณาเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้งานระบบ</p>
    {[['current','รหัสผ่านปัจจุบัน',currentPassword,setCurrentPassword],['new','รหัสผ่านใหม่',newPassword,setNewPassword],['confirm','ยืนยันรหัสผ่านใหม่',confirmPassword,setConfirmPassword]].map(([id,label,value,setter])=><label key={id as string} className="mt-5 block text-sm font-semibold">{label as string}<input id={id as string} type="password" required value={value as string} onChange={(e)=>(setter as (value:string)=>void)(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-brand-500" /></label>)}
    <p className="mt-4 text-xs text-slate-500">อย่างน้อย 12 ตัว มี A–Z, a–z และตัวเลข</p>{error&&<p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="mt-6 min-h-12 w-full rounded-2xl bg-brand-700 font-bold text-white disabled:opacity-60">{busy?'กำลังบันทึก…':'เปลี่ยนรหัสผ่าน'}</button><button type="button" onClick={logout} className="mt-3 min-h-11 w-full text-sm text-slate-500">ออกจากระบบ</button>
  </form></main>;
}
