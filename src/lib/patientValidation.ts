export function normalizeCid(value: string) { return value.replace(/\D/g, ''); }

export function isValidThaiCid(input: string) {
  const cid = normalizeCid(input);
  if (!/^\d{13}$/.test(cid)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(cid[i]) * (13 - i);
  return ((11 - (sum % 11)) % 10) === Number(cid[12]);
}

export function calculateAge(birthDate: string, now = new Date()) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
