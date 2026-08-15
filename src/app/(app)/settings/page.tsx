import { requireUser } from '@/lib/supabase/current-user';
import { updateProfile, deleteAccount } from './actions';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { user, profile } = await requireUser();

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">{user.email}</p>

      {saved && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form action={updateProfile} className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div>
          <label className="block text-sm text-zinc-700">Name</label>
          <input
            name="name"
            defaultValue={profile?.name ?? ''}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-700">Timezone</label>
          <input
            name="timezone"
            defaultValue={profile?.timezone ?? 'America/Vancouver'}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Reminders are scheduled at 9am in this timezone. IANA format, e.g. America/Vancouver.
          </p>
        </div>
        <div>
          <label className="block text-sm text-zinc-700">Default currency</label>
          <input
            name="defaultCurrency"
            defaultValue={profile?.default_currency ?? 'CAD'}
            maxLength={3}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Save
        </button>
      </form>

      <a
        href="/api/export"
        className="mt-4 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 hover:border-zinc-300"
      >
        Export all my data (JSON)
      </a>

      <details className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-red-800">Delete my account</summary>
        <p className="mt-2 text-xs text-red-700">
          This permanently deletes every purchase, document, and reminder, and cannot be undone.
        </p>
        <form action={deleteAccount} className="mt-3 space-y-2">
          <input
            name="confirmation"
            placeholder="Type DELETE to confirm"
            required
            className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Permanently delete account
          </button>
        </form>
      </details>
    </div>
  );
}
