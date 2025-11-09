'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SignupFormProps {
  lang?: 'ja' | 'en';
}

export default function SignupForm({ lang = 'ja' }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const text = {
    ja: {
      email: 'メールアドレス',
      password: 'パスワード',
      confirmPassword: 'パスワード（確認）',
      createAccount: 'アカウント作成',
      creating: 'アカウント作成中...',
      emailPlaceholder: 'you@example.com',
      checkEmail: 'メールを確認してください！',
      checkEmailDesc: '確認リンクを送信しました。受信トレイを確認してアカウントを認証してください。',
      goToLogin: 'ログインへ',
      passwordMismatch: 'パスワードが一致しません',
      passwordTooShort: 'パスワードは6文字以上である必要があります',
    },
    en: {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      createAccount: 'Create Account',
      creating: 'Creating account...',
      emailPlaceholder: 'you@example.com',
      checkEmail: 'Check your email!',
      checkEmailDesc: "We've sent you a confirmation link. Please check your inbox to verify your account.",
      goToLogin: 'Go to login',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
    },
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError(text[lang].passwordMismatch);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(text[lang].passwordTooShort);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-md text-center">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="font-medium mb-2">{text[lang].checkEmail}</p>
          <p className="text-sm">{text[lang].checkEmailDesc}</p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="text-[#09090B] hover:underline text-sm"
        >
          {text[lang].goToLogin}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-4 w-full max-w-md">
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

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-[#09090B]">
          {text[lang].confirmPassword}
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        {loading ? text[lang].creating : text[lang].createAccount}
      </button>
    </form>
  );
}
