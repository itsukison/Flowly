'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check } from 'lucide-react'
import { ICON_OPTIONS, getIconComponent } from '@/lib/iconMapping'

interface CreateTableModalProps {
  organizationId: string
  onClose: () => void
}

const TEMPLATES = [
  {
    id: 'sales_crm',
    name: '営業CRM',
    icon: 'users',
    description: '顧客管理と営業活動の追跡',
    details: 'B2B営業に最適なテンプレート。顧客情報、商談状況、フォローアップを一元管理できます。',
    columns: ['会社名', '担当者', 'メール', '電話', '業界', '従業員数', '売上規模'],
    statuses: ['リード', '商談中', '提案', '契約', '運用中'],
  },
  {
    id: 'supplier',
    name: '仕入先管理',
    icon: 'package',
    description: 'サプライヤーと取引先の管理',
    details: '仕入先や取引先の情報を整理。発注管理や支払条件の追跡に便利です。',
    columns: ['会社名', '担当者', 'メール', '電話', '商品カテゴリ', '取引開始日', '支払条件'],
    statuses: ['候補', '評価中', '契約中', '休止'],
  },
  {
    id: 'event',
    name: 'イベント参加者',
    icon: 'ticket',
    description: 'イベントや会議の参加者管理',
    details: 'セミナーや展示会の参加者を管理。出欠確認やフォローアップに活用できます。',
    columns: ['名前', 'メール', '電話', '会社', '役職', '参加日', 'チケットタイプ'],
    statuses: ['申込', '確認済', '参加', '不参加'],
  },
  {
    id: 'custom',
    name: 'カスタム',
    icon: 'settings',
    description: '独自のテーブルを作成',
    details: '基本的な項目から始めて、後から自由にカスタマイズできます。',
    columns: ['名前', 'メール', '電話'],
    statuses: ['リード', '進行中', '完了'],
  },
]

export default function CreateTableModal({ organizationId, onClose }: CreateTableModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<'template' | 'preview' | 'details'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('chart')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate)

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setName(template.name)
      setIcon(template.icon)
      setStep('preview')
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('テーブル名を入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          name: name.trim(),
          description: description.trim() || null,
          icon,
          template_type: selectedTemplate,
        }),
      })

      if (!response.ok) {
        throw new Error('テーブルの作成に失敗しました')
      }

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[10px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32),3px_3px_5px_-1px_rgba(0,0,0,0.41)]">
        <div className="sticky top-0 bg-white border-b border-[#E4E4E7] px-8 py-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-[#09090B]">
            {step === 'template' && 'テンプレートを選択'}
            {step === 'preview' && 'テンプレートのプレビュー'}
            {step === 'details' && '新しいテーブル'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F4F5] rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-[#71717B]" />
          </button>
        </div>

        <div className="p-8">
          {/* Step 1: Template Selection */}
          {step === 'template' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TEMPLATES.map((template) => {
                const IconComponent = getIconComponent(template.icon)
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="flex items-start gap-4 p-8 border-2 border-[#E4E4E7] rounded-2xl hover:border-[#09090B] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0 group-hover:bg-[#09090B] transition-colors">
                      <IconComponent className="w-7 h-7 text-[#09090B] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#09090B] text-lg mb-2">
                        {template.name}
                      </h3>
                      <p className="text-base text-[#71717B] leading-[1.5]">{template.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Template Preview */}
          {step === 'preview' && currentTemplate && (
            <div className="space-y-8">
              <div className="flex items-start gap-6 p-8 bg-[#FAFAFA] rounded-2xl">
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  {(() => {
                    const IconComponent = getIconComponent(currentTemplate.icon)
                    return <IconComponent className="w-10 h-10 text-[#09090B]" />
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-[#09090B] mb-3 leading-[1.25]">
                    {currentTemplate.name}
                  </h3>
                  <p className="text-lg text-[#71717B] leading-[1.6]">{currentTemplate.details}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#09090B] text-lg mb-4">含まれる列</h4>
                <div className="grid grid-cols-2 gap-3">
                  {currentTemplate.columns.map((column, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E4E4E7] rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    >
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-base text-[#09090B]">{column}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#09090B] text-lg mb-4">ステータス</h4>
                <div className="flex flex-wrap gap-3">
                  {currentTemplate.statuses.map((status, index) => (
                    <span
                      key={index}
                      className="px-5 py-2 bg-white border border-[#E4E4E7] rounded-full text-base text-[#09090B] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    >
                      {status}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl">
                <p className="text-base text-[#09090B] leading-[1.6]">
                  作成後に列やステータスを自由に追加・編集できます
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('template')}
                  className="flex-1 px-6 py-4 border border-[#E4E4E7] rounded-xl text-base font-semibold hover:bg-[#F4F4F5] transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 px-6 py-4 bg-[#09090B] text-white rounded-xl text-base font-bold hover:bg-[#27272A] transition-colors shadow-[0px_4px_20px_rgba(0,0,0,0.15)]"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Customize Details */}
          {step === 'details' && (
            <div className="space-y-8">
              <div>
                <label className="block text-base font-bold text-[#09090B] mb-4">
                  アイコン
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {ICON_OPTIONS.map((iconOption) => {
                    const IconComponent = iconOption.Icon
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => setIcon(iconOption.name)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          icon === iconOption.name
                            ? 'border-[#09090B] bg-[#F4F4F5]'
                            : 'border-[#E4E4E7] hover:border-[#71717B] hover:bg-[#FAFAFA]'
                        }`}
                        title={iconOption.label}
                      >
                        <IconComponent className={`w-6 h-6 ${icon === iconOption.name ? 'text-[#09090B]' : 'text-[#71717B]'}`} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-[#09090B] mb-3">
                  テーブル名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 顧客リスト"
                  className="w-full px-5 py-4 text-base border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-[#09090B] mb-3">
                  説明（任意）
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="このテーブルの用途を説明してください"
                  rows={4}
                  className="w-full px-5 py-4 text-base border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all leading-[1.6]"
                />
              </div>

              {error && (
                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-base text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  className="flex-1 px-6 py-4 border border-[#E4E4E7] rounded-xl text-base font-semibold hover:bg-[#F4F4F5] transition-colors"
                  disabled={loading}
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading || !name.trim()}
                  className="flex-1 px-6 py-4 bg-[#09090B] text-white rounded-xl text-base font-bold hover:bg-[#27272A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0px_4px_20px_rgba(0,0,0,0.15)]"
                >
                  {loading ? '作成中...' : '作成'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
