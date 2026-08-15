// Money is always stored as integer cents. These helpers are the only place
// that should convert between cents and display dollars.

export function centsToDollarsInput(cents: number | null): string {
  if (cents === null) return '';
  return (cents / 100).toFixed(2);
}

export function dollarsInputToCents(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const dollars = Number(trimmed);
  if (Number.isNaN(dollars)) return null;
  return Math.round(dollars * 100);
}

export function formatMoney(cents: number | null, currency: string): string {
  if (cents === null) return '—';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(cents / 100);
}
