'use client'

import { useState } from 'react'
import { Plus, Users, Headphones, Package, Briefcase, Handshake, ChevronRight } from 'lucide-react'

interface TableTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  columns: Array<{
    name: string
    label: string
    type: string
    is_required?: boolean
    options?: any
  }>
  statuses: Array<{
    name: string
    color: string
  }>
}

interface TableTemplatesProps {
  organizationId: string
  onTemplateSelect?: (template: TableTemplate) => void
}

const templates: TableTemplate[] = [
  {
    id: 'customers',
    name: '顧客管理',
    description: '顧客情報を一元管理する基本テンプレート',
    icon: '👥',
    category: '営業',
    columns: [
      { name: 'company_name', label: '会社名', type: 'text', is_required: true },
      { name: 'contact_person', label: '担当者名', type: 'text', is_required: true },
      { name: 'email', label: 'メールアドレス', type: 'email', is_required: true },
      { name: 'phone', label: '電話番号', type: 'tel' },
      { name: 'address', label: '住所', type: 'text' },
      { name: 'industry', label: '業種', type: 'select', options: ['IT', '製造', '金融', 'サービス', 'その他'] },
      { name: 'notes', label: 'メモ', type: 'longtext' },
    ],
    statuses: [
      { name: '新規', color: '#10B981' },
      { name: '商談中', color: '#F59E0B' },
      { name: '受注', color: '#3B82F6' },
      { name: '失注', color: '#EF4444' },
    ]
  },
  {
    id: 'leads',
    name: 'リード管理',
    description: '見込み客情報の管理と追跡',
    icon: '🎯',
    category: 'マーケティング',
    columns: [
      { name: 'lead_source', label: 'リード元', type: 'select', options: ['ウェブサイト', '展示会', '紹介', '広告', 'その他'], is_required: true },
      { name: 'company_name', label: '会社名', type: 'text' },
      { name: 'contact_person', label: '担当者名', type: 'text', is_required: true },
      { name: 'email', label: 'メールアドレス', type: 'email', is_required: true },
      { name: 'phone', label: '電話番号', type: 'tel' },
      { name: 'budget', label: '予算', type: 'number' },
      { name: 'timeline', label: '導入時期', type: 'select', options: ['1ヶ月以内', '3ヶ月以内', '6ヶ月以内', '1年以内', '未定'] },
      { name: 'requirements', label: '要件', type: 'longtext' },
    ],
    statuses: [
      { name: '新規リード', color: '#10B981' },
      { name: '連絡待ち', color: '#F59E0B' },
      { name: '対応中', color: '#3B82F6' },
      { name: '成約', color: '#8B5CF6' },
      { name: '失注', color: '#EF4444' },
    ]
  },
  {
    id: 'support',
    name: 'サポート対応',
    description: '顧客サポートの問い合わせ管理',
    icon: '🎧',
    category: 'カスタマーサポート',
    columns: [
      { name: 'ticket_number', label: 'チケット番号', type: 'text', is_required: true },
      { name: 'customer_name', label: '顧客名', type: 'text', is_required: true },
      { name: 'email', label: 'メールアドレス', type: 'email', is_required: true },
      { name: 'subject', label: '件名', type: 'text', is_required: true },
      { name: 'priority', label: '優先度', type: 'select', options: ['高', '中', '低'] },
      { name: 'category', label: 'カテゴリ', type: 'select', options: ['技術的', '請求', '機能要望', 'その他'] },
      { name: 'description', label: '詳細', type: 'longtext', is_required: true },
      { name: 'assigned_to', label: '担当者', type: 'text' },
    ],
    statuses: [
      { name: '未対応', color: '#EF4444' },
      { name: '対応中', color: '#F59E0B' },
      { name: '情報待ち', color: '#3B82F6' },
      { name: '解決済み', color: '#10B981' },
      { name: 'クローズ', color: '#6B7280' },
    ]
  },
  {
    id: 'projects',
    name: 'プロジェクト管理',
    description: 'プロジェクトの進捗とタスク管理',
    icon: '📋',
    category: 'プロジェクト管理',
    columns: [
      { name: 'project_name', label: 'プロジェクト名', type: 'text', is_required: true },
      { name: 'client', label: 'クライアント', type: 'text', is_required: true },
      { name: 'start_date', label: '開始日', type: 'date' },
      { name: 'end_date', label: '終了日', type: 'date' },
      { name: 'budget', label: '予算', type: 'number' },
      { name: 'project_manager', label: 'プロジェクトマネージャー', type: 'text', is_required: true },
      { name: 'team_members', label: 'チームメンバー', type: 'text' },
      { name: 'description', label: '概要', type: 'longtext' },
    ],
    statuses: [
      { name: '計画中', color: '#8B5CF6' },
      { name: '進行中', color: '#3B82F6' },
      { name: 'レビュー中', color: '#F59E0B' },
      { name: '完了', color: '#10B981' },
      { name: '保留', color: '#6B7280' },
    ]
  },
  {
    id: 'inventory',
    name: '在庫管理',
    description: '商品在庫の管理と追跡',
    icon: '📦',
    category: '在庫管理',
    columns: [
      { name: 'product_code', label: '商品コード', type: 'text', is_required: true },
      { name: 'product_name', label: '商品名', type: 'text', is_required: true },
      { name: 'category', label: 'カテゴリ', type: 'select', options: ['電子機器', '事務用品', '原材料', '完成品', 'その他'] },
      { name: 'quantity', label: '在庫数', type: 'number', is_required: true },
      { name: 'unit', label: '単位', type: 'text', options: ['個', 'セット', '箱', '本', 'kg'] },
      { name: 'unit_price', label: '単価', type: 'number' },
      { name: 'supplier', label: 'サプライヤー', type: 'text' },
      { name: 'location', label: '保管場所', type: 'text' },
    ],
    statuses: [
      { name: '在庫あり', color: '#10B981' },
      { name: '残りわずか', color: '#F59E0B' },
      { name: '在庫切れ', color: '#EF4444' },
      { name: '発注中', color: '#3B82F6' },
    ]
  },
  {
    id: 'partners',
    name: 'パートナー管理',
    description: 'ビジネスパートナー関係の管理',
    icon: '🤝',
    category: '提携',
    columns: [
      { name: 'partner_name', label: 'パートナー名', type: 'text', is_required: true },
      { name: 'contact_person', label: '担当者名', type: 'text', is_required: true },
      { name: 'email', label: 'メールアドレス', type: 'email', is_required: true },
      { name: 'phone', label: '電話番号', type: 'tel' },
      { name: 'partner_type', label: 'パートナータイプ', type: 'select', options: ['販売代理店', '技術提携', 'サービス提供', 'コンサルタント', 'その他'] },
      { name: 'agreement_date', label: '契約日', type: 'date' },
      { name: 'revenue_share', label: '収益分配率', type: 'number' },
      { name: 'notes', label: '備考', type: 'longtext' },
    ],
    statuses: [
      { name: '検討中', color: '#F59E0B' },
      { name: '提携中', color: '#10B981' },
      { name: '契約更新待ち', color: '#3B82F6' },
      { name: '契約終了', color: '#EF4444' },
    ]
  }
]

const categories = Array.from(new Set(templates.map(t => t.category)))

export default function TableTemplates({ organizationId, onTemplateSelect }: TableTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて')
  const [selectedTemplate, setSelectedTemplate] = useState<TableTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const filteredTemplates = selectedCategory === 'すべて'
    ? templates
    : templates.filter(t => t.category === selectedCategory)

  const handleTemplateSelect = async (template: TableTemplate) => {
    setSelectedTemplate(template)
    setIsCreating(true)

    try {
      // Create table from template
      const tableResponse = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          icon: template.icon,
          organization_id: organizationId,
        }),
      })

      if (!tableResponse.ok) throw new Error('Failed to create table')

      const table = await tableResponse.json()

      // Create columns
      for (const column of template.columns) {
        await fetch('/api/columns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            table_id: table.id,
            name: column.name,
            label: column.label,
            type: column.type,
            is_required: column.is_required || false,
            options: column.options || null,
            display_order: template.columns.indexOf(column),
          }),
        })
      }

      // Create statuses
      for (const status of template.statuses) {
        await fetch('/api/statuses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            table_id: table.id,
            name: status.name,
            color: status.color,
            display_order: template.statuses.indexOf(status),
          }),
        })
      }

      if (onTemplateSelect) {
        onTemplateSelect(template)
      }

      // Redirect to new table
      window.location.href = `/dashboard/tables/${table.id}`

    } catch (error) {
      console.error('Error creating table from template:', error)
      alert('テンプレートからのテーブル作成に失敗しました')
    } finally {
      setIsCreating(false)
      setSelectedTemplate(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '営業': return Briefcase
      case 'マーケティング': return Users
      case 'カスタマーサポート': return Headphones
      case 'プロジェクト管理': return Package
      case '在庫管理': return Package
      case '提携': return Handshake
      default: return Plus
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('すべて')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            selectedCategory === 'すべて'
              ? 'bg-[#09090B] text-white'
              : 'bg-white border border-[#E4E4E7] text-[#71717B] hover:bg-[#F4F4F5]'
          }`}
        >
          すべて
        </button>
        {categories.map((category) => {
          const Icon = getCategoryIcon(category)
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-[#09090B] text-white'
                  : 'bg-white border border-[#E4E4E7] text-[#71717B] hover:bg-[#F4F4F5]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category}
            </button>
          )
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-6 hover:shadow-[0px_4px_20px_rgba(0,0,0,0.1)] transition-all cursor-pointer group"
            onClick={() => !isCreating && handleTemplateSelect(template)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{template.icon}</div>
              <div className="w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center group-hover:bg-[#09090B] transition-colors">
                <ChevronRight className="w-4 h-4 text-[#71717B] group-hover:text-white transition-colors" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[#09090B] mb-2">
              {template.name}
            </h3>

            <p className="text-sm text-[#71717B] mb-4 line-clamp-2">
              {template.description}
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-[#71717B] mb-1">含まれる列 ({template.columns.length})</p>
                <div className="flex flex-wrap gap-1">
                  {template.columns.slice(0, 3).map((column) => (
                    <span
                      key={column.name}
                      className="px-2 py-1 bg-[#F4F4F5] rounded text-xs text-[#71717B]"
                    >
                      {column.label}
                    </span>
                  ))}
                  {template.columns.length > 3 && (
                    <span className="px-2 py-1 bg-[#F4F4F5] rounded text-xs text-[#71717B]">
                      +{template.columns.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#71717B] mb-1">ステータス ({template.statuses.length})</p>
                <div className="flex flex-wrap gap-1">
                  {template.statuses.map((status) => (
                    <span
                      key={status.name}
                      className="px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[#E4E4E7] border-t-[#09090B] rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-semibold text-[#09090B] mb-2">
                テーブルを作成中...
              </h3>
              <p className="text-sm text-[#71717B] text-center">
                {selectedTemplate?.name}テンプレートからテーブルを作成しています
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}