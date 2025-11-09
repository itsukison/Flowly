'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  lang?: 'ja' | 'en';
}

export default function LoginForm({ lang = 'ja' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const text = {
    ja: {
      email: 'メールアドレス',
      password: 'パスワード',
      signin: 'ログイン',
      signingIn: 'ログイン中...',
      emailPlaceholder: 'you@example.com',
    },
    en: {
      email: 'Email',
      password: 'Password',
      signin: 'Sign In',
      signingIn: 'Signing in...',
      emailPlaceholder: 'you@example.com',
    },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Redirect to dashboard - it will handle org check and redirect to onboarding if needed
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-md">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-[#09090B]">
          {text[lang].email}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-4 py-3 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-transparent"
          placeholder={text[lang].emailPlaceholder}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-[#09090B]">
          {text[lang].password}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="px-4 py-3 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-[#09090B] text-white px-6 py-3 rounded-full font-bold text-base cursor-pointer hover:bg-[#27272A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0px_4px_20px_rgba(0,0,0,0.15)]"
      >
        {loading ? text[lang].signingIn : text[lang].signin}
      </button>
    </form>
  );
}
