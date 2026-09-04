/** Locale-stable so SSR and the browser never disagree (no `US$` vs `$`). */
export function usd(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

export function usdMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  const body = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${body}`;
}

export function usdDelta(n: number): string {
  if (n > 0) return `+${usdMoney(n)}`;
  return usdMoney(n);
}

export function signedPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

export function barChangePct(bars: { c: number }[]): number | null {
  if (bars.length < 2) return null;
  const prev = bars[bars.length - 2]?.c;
  const last = bars[bars.length - 1]?.c;
  if (!prev) return null;
  return ((last - prev) / prev) * 100;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function stampTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[d.getUTCMonth()];
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${day} ${mon} ${hh}:${mm}:${ss} UTC`;
}
