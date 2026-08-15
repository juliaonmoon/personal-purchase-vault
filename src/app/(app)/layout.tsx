import Link from 'next/link';
import { logout } from '@/app/login/actions';
import { requireUser } from '@/lib/supabase/current-user';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/upload', label: 'Add' },
  { href: '/vault', label: 'Vault' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/settings', label: 'Settings' },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <span className="text-sm font-semibold text-zinc-900">Personal Purchase Vault</span>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span className="hidden sm:inline">{user.email}</span>
          <form action={logout}>
            <button type="submit" className="text-zinc-500 underline hover:text-zinc-900">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-zinc-200 bg-white">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 py-3 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
