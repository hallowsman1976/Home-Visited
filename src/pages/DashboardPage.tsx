import { Activity, AlertTriangle, ClipboardPlus, Database, Server, ShieldCheck, Users, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiPost, healthCheck } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import type { DashboardSummary, HealthData } from '../types/api';

export function DashboardPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    healthCheck().then(setHealth).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
    apiPost<DashboardSummary>('dashboard.summary', {}, token).then(setSummary).catch((e: Error) => setError(e.message));
  }, [token]);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-emerald-500 p-6 text-white shadow-soft lg:p-8">
      <p className="text-sm font-medium text-emerald-100">ระบบเยี่ยมบ้านผู้ป่วย</p>
      <h1 className="mt-2 text-2xl font-bold lg:text-4xl">ดูแลต่อเนื่อง ครบทุกมิติ INHOMESSS</h1>
      <p className="mt-3 max-w-2xl text-sm text-emerald-50 lg:text-base">โครงสร้างพื้นฐานพร้อมสำหรับเชื่อม React Frontend กับ Google Apps Script และ Google Sheets</p>
    </section>
    <section className="grid gap-4 md:grid-cols-3">
      <StatusCard icon={Server} title="API Gateway" value={loading ? 'กำลังตรวจสอบ' : health ? 'พร้อมใช้งาน' : 'ยังไม่เชื่อมต่อ'} ok={!!health} />
      <StatusCard icon={Database} title="Google Sheets" value={health?.spreadsheetConfigured ? 'กำหนดค่าแล้ว' : 'รอตั้งค่า'} ok={!!health?.spreadsheetConfigured} />
      <StatusCard icon={ShieldCheck} title="Environment" value={health?.environment || import.meta.env.VITE_APP_ENV || 'development'} ok={!!health} />
    </section>
    {error && <div role="alert" className="card flex items-start gap-3 border-amber-200 bg-amber-50 text-amber-800"><WifiOff className="mt-0.5 shrink-0" /><div><p className="font-semibold">ยังเชื่อมต่อ Backend ไม่ได้</p><p className="text-sm">{error}</p><p className="mt-1 text-xs">คัดลอก .env.example เป็น .env แล้วกำหนด URL หลัง Deploy Apps Script</p></div></div>}
    {summary&&<><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Users} label="ผู้ป่วยทั้งหมด" value={summary.patientsTotal}/><Metric icon={ClipboardPlus} label="เยี่ยมวันนี้" value={summary.visitsToday}/><Metric icon={AlertTriangle} label="ติดตามเกินกำหนด" value={summary.followUpsOverdue} alert/><Metric icon={Activity} label="ผู้ป่วยเสี่ยงสูง" value={summary.patientsHighRisk} alert/></section><section className="card"><h2 className="font-bold">การดำเนินงาน</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Visit ทั้งหมด</p><p className="text-2xl font-bold">{summary.visitsTotal}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-amber-700">Draft</p><p className="text-2xl font-bold text-amber-800">{summary.drafts}</p></div><div className="rounded-2xl bg-brand-50 p-4"><p className="text-sm text-brand-700">รอติดตาม</p><p className="text-2xl font-bold text-brand-800">{summary.followUpsPending}</p></div></div></section></>}
  </div>;
}

function Metric({icon:Icon,label,value,alert=false}:{icon:typeof Activity;label:string;value:number;alert?:boolean}){return <article className="card flex items-center gap-4"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${alert&&value>0?'bg-red-50 text-red-700':'bg-brand-50 text-brand-700'}`}><Icon/></span><div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div></article>}

function StatusCard({ icon: Icon, title, value, ok }: { icon: typeof Activity; title: string; value: string; ok: boolean }) {
  return <article className="card"><div className="flex items-center justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${ok ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400'}`}><Icon /></span><span className={`chip ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{ok ? 'พร้อม' : 'ตั้งค่า'}</span></div><p className="mt-5 text-sm text-slate-400">{title}</p><p className="mt-1 font-bold">{value}</p></article>;
}
