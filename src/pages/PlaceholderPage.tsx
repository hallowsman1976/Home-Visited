import { Construction } from 'lucide-react';

export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return <section className="card flex min-h-72 flex-col items-center justify-center text-center"><span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-700"><Construction /></span><h1 className="mt-5 text-2xl font-bold">{title}</h1><p className="mt-2 text-slate-500">โมดูลนี้จะพัฒนาใน {phase} ตาม Blueprint ที่อนุมัติ</p></section>;
}

