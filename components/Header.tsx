'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/65 backdrop-blur-[10px] z-[1000] px-6 md:px-20 lg:px-32 xl:px-48">
      <nav className="flex justify-between items-center py-4 px-6 max-w-[1400px] mx-auto">
        <Link href="/" className="font-bold text-xl no-underline text-[#09090B]">
          {t('brandName')}
        </Link>
        <div className="hidden md:flex gap-14 items-center">
          <a href="#pricing" className="text-base font-semibold text-[#09090B] no-underline hover:opacity-70 transition-opacity">
            {t('pricing')}
          </a>
          <a href="#enterprise" className="text-base font-semibold text-[#09090B] no-underline hover:opacity-70 transition-opacity">
            {t('enterprise')}
          </a>
          <a href="#resources" className="text-base font-semibold text-[#09090B] no-underline hover:opacity-70 transition-opacity">
            {t('resources')}
          </a>
        </div>
        <div className="flex gap-4 items-center">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="text-sm font-semibold text-[#09090B] px-3 py-1.5 rounded-md border border-[#E4E4E7] hover:bg-[#FAFAFA] transition-colors"
            aria-label="Toggle language"
          >
            {language === 'en' ? '日本語' : 'EN'}
          </button>
          
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard" className="text-base font-semibold text-[#09090B] no-underline hidden md:inline hover:opacity-70 transition-opacity">
                    {language === 'ja' ? 'ダッシュボード' : 'Dashboard'}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="bg-[#09090B] text-[#FAFAFA] px-5 py-2.5 rounded-lg text-base font-semibold shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-[#27272A] transition-colors"
                  >
                    {language === 'ja' ? 'ログアウト' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-base font-semibold text-[#09090B] no-underline hidden md:inline hover:opacity-70 transition-opacity">
                    {t('signIn')}
                  </Link>
                  <Link href="/signup" className="bg-[#09090B] text-[#FAFAFA] px-5 py-2.5 rounded-lg text-base font-semibold no-underline shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-[#27272A] transition-colors">
                    {t('tryForFree')}
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
