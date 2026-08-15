// Reminder offsets are intentionally fixed for MVP (requirements §4 lists
// configurable offsets as a Should-have, not a Must-have).
export const RETURN_REMINDER_OFFSETS_DAYS = [7, 1];
export const WARRANTY_REMINDER_OFFSETS_DAYS = [30, 7];

export interface ReminderDraft {
  user_id: string;
  kind: 'return_deadline' | 'warranty_expiration';
  return_id?: string;
  warranty_id?: string;
  scheduled_for: string;
  channel: 'email';
  status: 'pending';
}

// Reminders fire at 9am in the user's timezone, `offsetDays` before the
// deadline date. Falls back silently to UTC 9am if the timezone is invalid.
function atNineAm(dateISO: string, timezone: string): Date {
  const date = new Date(`${dateISO}T09:00:00`);
  try {
    const offsetMinutes = getTimezoneOffsetMinutes(date, timezone);
    return new Date(date.getTime() - offsetMinutes * 60_000 + date.getTimezoneOffset() * 60_000);
  } catch {
    return date;
  }
}

function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - date.getTime()) / 60_000;
}

export function buildReturnReminders(params: {
  userId: string;
  returnId: string;
  deadlineDateISO: string;
  timezone: string;
}): ReminderDraft[] {
  return RETURN_REMINDER_OFFSETS_DAYS.map((days) => {
    const deadline = new Date(`${params.deadlineDateISO}T00:00:00Z`);
    deadline.setUTCDate(deadline.getUTCDate() - days);
    const dateOnly = deadline.toISOString().slice(0, 10);
    return {
      user_id: params.userId,
      kind: 'return_deadline' as const,
      return_id: params.returnId,
      scheduled_for: atNineAm(dateOnly, params.timezone).toISOString(),
      channel: 'email' as const,
      status: 'pending' as const,
    };
  });
}

export function buildWarrantyReminders(params: {
  userId: string;
  warrantyId: string;
  endDateISO: string;
  timezone: string;
}): ReminderDraft[] {
  return WARRANTY_REMINDER_OFFSETS_DAYS.map((days) => {
    const end = new Date(`${params.endDateISO}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() - days);
    const dateOnly = end.toISOString().slice(0, 10);
    return {
      user_id: params.userId,
      kind: 'warranty_expiration' as const,
      warranty_id: params.warrantyId,
      scheduled_for: atNineAm(dateOnly, params.timezone).toISOString(),
      channel: 'email' as const,
      status: 'pending' as const,
    };
  });
}
