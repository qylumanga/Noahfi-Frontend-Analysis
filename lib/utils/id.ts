export function cuid(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36).slice(-4);
  return `cl_${prefix}_${rand}${time}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nextReference(): string {
  const n = 400000 + (Date.now() % 500000);
  return `NF-2026-${String(n).padStart(6, "0")}`;
}

export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600_000).toISOString();
}
