'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/supabase/current-user';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { deleteDocument } from '@/lib/storage';

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();

  await supabase
    .from('profiles')
    .update({
      name: String(formData.get('name') ?? '').trim() || null,
      timezone: String(formData.get('timezone') ?? '').trim() || 'America/Vancouver',
      default_currency: String(formData.get('defaultCurrency') ?? 'CAD').toUpperCase().slice(0, 3),
    })
    .eq('id', user.id);

  redirect('/settings?saved=1');
}

// Deletes all of the user's records and stored files, then the auth account
// itself. Storage/table deletes use the user's own scoped client (RLS-safe);
// only the final auth.admin.deleteUser call needs the service role.
export async function deleteAccount(formData: FormData) {
  const { supabase, user } = await requireUser();
  const confirmation = String(formData.get('confirmation') ?? '');

  if (confirmation !== 'DELETE') {
    redirect('/settings?error=' + encodeURIComponent('Type DELETE to confirm account deletion.'));
  }

  const { data: documents } = await supabase.from('documents').select('storage_key').eq('user_id', user.id);
  if (documents && documents.length > 0) {
    await Promise.all(documents.map((doc) => deleteDocument(supabase, doc.storage_key).catch(() => {})));
  }

  // purchases cascades to purchase_items/returns/warranties/inventory_items/reminders.
  // documents, subscriptions, and the profile are user_id-scoped directly.
  await supabase.from('purchases').delete().eq('user_id', user.id);
  await supabase.from('documents').delete().eq('user_id', user.id);
  await supabase.from('subscriptions').delete().eq('user_id', user.id);
  await supabase.from('reminders').delete().eq('user_id', user.id);
  await supabase.from('profiles').delete().eq('id', user.id);

  const adminClient = createServiceRoleClient();
  await adminClient.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  redirect('/login');
}
