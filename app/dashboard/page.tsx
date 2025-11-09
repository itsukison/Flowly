import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white pt-[52px]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#09090B] mb-2">
              ダッシュボード
            </h1>
            <p className="text-[#71717B]">
              おかえりなさい、{user.email}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[#09090B] mb-2">
                総顧客数
              </h3>
              <p className="text-4xl font-bold text-[#09090B]">0</p>
              <p className="text-sm text-[#71717B] mt-2">
                まだ顧客がいません。データをインポートして始めましょう。
              </p>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[#09090B] mb-2">
                重複検出
              </h3>
              <p className="text-4xl font-bold text-[#09090B]">0</p>
              <p className="text-sm text-[#71717B] mt-2">
                重複は検出されていません
              </p>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[#09090B] mb-2">
                情報補完
              </h3>
              <p className="text-4xl font-bold text-[#09090B]">0</p>
              <p className="text-sm text-[#71717B] mt-2">
                100件の補完が利用可能
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">
              近日公開：フェーズ2
            </h2>
            <p className="text-white/90 mb-4">
              顧客管理、データインポート、重複排除機能は現在開発中です。
            </p>
            <p className="text-sm text-white/80">
              フェーズ1完了：ランディングページのリブランド + 認証機能 ✓
            </p>
          </div>
        </div>
      </div>
    </>
  );
}