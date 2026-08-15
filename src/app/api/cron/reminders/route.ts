import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendReminderEmail } from '@/lib/email/resend';

// Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically when
// CRON_SECRET is set. This also blocks anyone else from triggering sends.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { data: dueReminders, error } = await supabase
    .from('reminders')
    .select(
      `id, kind, user_id,
       returns(deadline_date, purchase_items(name, purchase_id)),
       warranties(end_date, purchase_items(name, purchase_id))`
    )
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const reminder of dueReminders ?? []) {
    // Claim this reminder first (status flips pending -> sent atomically per
    // row) so a second cron invocation racing the same window can't double-send.
    const { data: claimed } = await supabase
      .from('reminders')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', reminder.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (!claimed) continue; // another run already claimed it

    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(reminder.user_id);
      const email = authUser?.user?.email;
      if (!email) throw new Error('No email on file for user');

      const returnInfo = Array.isArray(reminder.returns) ? reminder.returns[0] : reminder.returns;
      const warrantyInfo = Array.isArray(reminder.warranties) ? reminder.warranties[0] : reminder.warranties;
      const returnItem = returnInfo ? (Array.isArray(returnInfo.purchase_items) ? returnInfo.purchase_items[0] : returnInfo.purchase_items) : null;
      const warrantyItem = warrantyInfo ? (Array.isArray(warrantyInfo.purchase_items) ? warrantyInfo.purchase_items[0] : warrantyInfo.purchase_items) : null;

      if (reminder.kind === 'return_deadline' && returnInfo) {
        const itemName = returnItem?.name ?? 'an item';
        await sendReminderEmail({
          to: email,
          subject: `Return deadline coming up: ${itemName}`,
          heading: 'Return deadline reminder',
          body: `${itemName} can be returned until ${returnInfo.deadline_date}.`,
          ctaUrl: `${appUrl}/purchases/${returnItem?.purchase_id}`,
          ctaLabel: 'View purchase',
        });
      } else if (reminder.kind === 'warranty_expiration' && warrantyInfo) {
        const itemName = warrantyItem?.name ?? 'an item';
        await sendReminderEmail({
          to: email,
          subject: `Warranty ending soon: ${itemName}`,
          heading: 'Warranty expiration reminder',
          body: `The warranty on ${itemName} ends ${warrantyInfo.end_date}.`,
          ctaUrl: `${appUrl}/purchases/${warrantyItem?.purchase_id}`,
          ctaLabel: 'View purchase',
        });
      }

      sent++;
    } catch {
      await supabase.from('reminders').update({ status: 'failed' }).eq('id', reminder.id);
      failed++;
    }
  }

  return NextResponse.json({ checked: dueReminders?.length ?? 0, sent, failed });
}
