'use client';

import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const { language } = useLanguage();

  const text = {
    ja: {
      title: 'おかえりなさい',
      subtitle: 'アカウントにログインして続行',
      noAccount: 'アカウントをお持ちでないですか？',
      signup: '新規登録',
    },
    en: {
      title: 'Welcome back',
      subtitle: 'Sign in to your account to continue',
      noAccount: "Don't have an account?",
      signup: 'Sign up',
    },
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white flex items-center justify-center px-6 pt-[52px]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#09090B] mb-2">
              {text[language].title}
            </h1>
            <p className="text-[#71717B]">
              {text[language].subtitle}
            </p>
          </div>

          <LoginForm lang={language} />

          <div className="mt-6 text-center">
            <p className="text-sm text-[#71717B]">
              {text[language].noAccount}{' '}
              <Link href="/signup" className="text-[#09090B] font-semibold hover:underline">
                {text[language].signup}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
