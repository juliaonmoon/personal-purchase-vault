export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Check your email</h1>
        <p className="mt-2 text-sm text-zinc-500">
          We sent you a confirmation link. Open it to activate your vault.
        </p>
      </div>
    </div>
  );
}
