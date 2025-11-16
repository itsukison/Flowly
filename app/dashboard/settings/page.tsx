import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Building,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  CreditCard
} from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.user_metadata.organization_id)
    .single()

  const settingsSections = [
    {
      title: 'プロフィール設定',
      icon: User,
      items: [
        { label: '名前', value: user.user_metadata.full_name || '未設定', type: 'text' },
        { label: 'メールアドレス', value: user.email || '未設定', type: 'email' },
        { label: '役職', value: user.user_metadata.role || '未設定', type: 'text' },
      ]
    },
    {
      title: '組織設定',
      icon: Building,
      items: [
        { label: '組織名', value: organization?.name || '未設定', type: 'text' },
        { label: '組織ID', value: organization?.id || '未設定', type: 'text', readonly: true },
        { label: 'プラン', value: organization?.plan || 'フリー', type: 'badge' },
      ]
    },
    {
      title: '通知設定',
      icon: Bell,
      items: [
        { label: 'メール通知', value: '有効', type: 'toggle' },
        { label: 'ブラウザ通知', value: '無効', type: 'toggle' },
        { label: '週次レポート', value: '有効', type: 'toggle' },
      ]
    },
    {
      title: 'セキュリティ設定',
      icon: Shield,
      items: [
        { label: '二要素認証', value: '設定する', type: 'action' },
        { label: 'パスワード変更', value: '変更する', type: 'action' },
        { label: 'ログイン履歴', value: '確認する', type: 'action' },
      ]
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-600">アカウントと組織の設定を管理できます</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
          <User className="h-6 w-6" />
          <span className="text-sm">プロフィール編集</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
          <Building className="h-6 w-6" />
          <span className="text-sm">組織管理</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
          <CreditCard className="h-6 w-6" />
          <span className="text-sm">請求情報</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
          <Database className="h-6 w-6" />
          <span className="text-sm">データエクスポート</span>
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section, index) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Icon className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>

              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor={`${section.title}-${item.label}`} className="text-sm font-medium">
                          {item.label}
                        </Label>
                        {item.type === 'badge' ? (
                          <Badge variant="secondary">{item.value}</Badge>
                        ) : item.type === 'action' ? (
                          <Button variant="link" className="p-0 h-auto text-blue-600">
                            {item.value}
                          </Button>
                        ) : item.type === 'toggle' ? (
                          <div className="text-sm text-gray-600">
                            {item.value}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {item.value}
                          </div>
                        )}
                      </div>

                      {item.type === 'text' && !item.readonly && (
                        <Input
                          id={`${section.title}-${item.label}`}
                          defaultValue={item.value}
                          className="w-64"
                          placeholder={item.label}
                        />
                      )}
                      {item.type === 'email' && (
                        <Input
                          id={`${section.title}-${item.label}`}
                          type="email"
                          defaultValue={item.value}
                          className="w-64"
                          placeholder={item.label}
                        />
                      )}
                      {item.type === 'toggle' && (
                        <Button variant="outline" size="sm">
                          切り替え
                        </Button>
                      )}
                    </div>

                    {itemIndex < section.items.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-4">危険な操作</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-800">アカウント削除</h3>
              <p className="text-sm text-red-600">アカウントとすべてのデータを完全に削除します</p>
            </div>
            <Button variant="destructive" size="sm">
              アカウントを削除
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="min-w-32">
          変更を保存
        </Button>
      </div>
    </div>
  )
}