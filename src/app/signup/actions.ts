'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const timezone = String(formData.get('timezone') ?? 'America/Vancouver');

  if (!email || !password) {
    redirect('/signup?error=' + encodeURIComponent('Email and password are required.'));
  }
  if (password.length < 8) {
    redirect('/signup?error=' + encodeURIComponent('Password must be at least 8 characters.'));
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appUrl}/auth/confirm` },
  });

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message));
  }

  if (data.user) {
    await supabase.from('profiles').update({ timezone }).eq('id', data.user.id);
  }

  // If email confirmations are disabled on the Supabase project, signUp already
  // returns a session and the user is logged in immediately.
  if (data.session) {
    redirect('/dashboard');
  }

  redirect('/signup/check-email');
}
