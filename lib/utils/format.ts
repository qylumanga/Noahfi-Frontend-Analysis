export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function truncateHash(hash: string, size = 6): string {
  if (hash.length <= size * 2 + 1) return hash;
  return `${hash.slice(0, size)}…${hash.slice(-size)}`;
}

export function maskPassport(value: string): string {
  if (value.length <= 4) return value;
  return `•••• ${value.slice(-4)}`;
}

export function luhnOk(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function formatCard(num: string): string {
  return num.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function bandFor(score: number): { label: string; note: string } {
  if (score <= 559) return { label: "Poor", note: "Expect limited approvals at first." };
  if (score <= 659) return { label: "Fair", note: "Some products open, with higher rates." };
  if (score <= 724) return { label: "Good", note: "Most mainstream cards and loans are in reach." };
  if (score <= 759) return { label: "Very good", note: "Competitive rates on most products." };
  return { label: "Excellent", note: "Best available rates on most products." };
}

export function downloadCsv(filename: string, rows: Record<string, string | number | boolean | null>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number | boolean | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? null)).join(","))].join("\n");
  const blob = new Blob([body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
