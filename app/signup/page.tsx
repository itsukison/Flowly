'use client';

import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignupPage() {
  const { language } = useLanguage();

  const text = {
    ja: {
      title: 'アカウントを作成',
      subtitle: '今日からスマートな顧客管理を始めましょう',
      hasAccount: 'すでにアカウントをお持ちですか？',
      signin: 'ログイン',
    },
    en: {
      title: 'Create your account',
      subtitle: 'Start managing your customers smarter today',
      hasAccount: 'Already have an account?',
      signin: 'Sign in',
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

          <SignupForm lang={language} />

          <div className="mt-6 text-center">
            <p className="text-sm text-[#71717B]">
              {text[language].hasAccount}{' '}
              <Link href="/login" className="text-[#09090B] font-semibold hover:underline">
                {text[language].signin}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
