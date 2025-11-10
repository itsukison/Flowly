export interface TableTemplate {
  id: string
  name: string
  icon: string
  description: string
  details: string
  columns: TemplateColumn[]
  statuses: TemplateStatus[]
}

export interface TemplateColumn {
  name: string
  label: string
  type: string
  is_required: boolean
}

export interface TemplateStatus {
  name: string
  color: string
}

export const TABLE_TEMPLATES: TableTemplate[] = [
  {
    id: 'sales_crm',
    name: '営業CRM',
    icon: '👥',
    description: '顧客管理と営業活動の追跡',
    details: 'B2B営業に最適なテンプレート。顧客情報、商談状況、フォローアップを一元管理できます。',
    columns: [
      { name: 'name', label: '名前', type: 'text', is_required: true },
      { name: 'name_furigana', label: 'フリガナ', type: 'text', is_required: false },
      { name: 'email', label: 'メールアドレス', type: 'email', is_required: false },
      { name: 'phone', label: '電話番号', type: 'phone', is_required: false },
      { name: 'company_name', label: '会社名', type: 'text', is_required: false },
      { name: 'company_domain', label: '会社ドメイン', type: 'url', is_required: false },
      { name: 'address', label: '住所', type: 'textarea', is_required: false },
      { name: 'industry', label: '業界', type: 'text', is_required: false },
      { name: 'employee_count', label: '従業員数', type: 'number', is_required: false },
    ],
    statuses: [
      { name: 'リード', color: '#94a3b8' },
      { name: '商談中', color: '#3b82f6' },
      { name: '契約', color: '#10b981' },
      { name: '運用中', color: '#8b5cf6' },
      { name: '休眠', color: '#6b7280' },
    ],
  },
  {
    id: 'supplier',
    name: '仕入先管理',
    icon: '📦',
    description: 'サプライヤーと取引先の管理',
    details: '仕入先や取引先の情報を整理。発注管理や支払条件の追跡に便利です。',
    columns: [
      { name: 'company_name', label: '会社名', type: 'text', is_required: true },
      { name: 'contact_person', label: '担当者', type: 'text', is_required: false },
      { name: 'email', label: 'メールアドレス', type: 'email', is_required: false },
      { name: 'phone', label: '電話番号', type: 'phone', is_required: false },
      { name: 'category', label: '商品カテゴリ', type: 'text', is_required: false },
      { name: 'contract_date', label: '取引開始日', type: 'date', is_required: false },
      { name: 'payment_terms', label: '支払条件', type: 'text', is_required: false },
    ],
    statuses: [
      { name: '候補', color: '#94a3b8' },
      { name: '評価中', color: '#3b82f6' },
      { name: '契約中', color: '#10b981' },
      { name: '休止', color: '#6b7280' },
    ],
  },
  {
    id: 'event',
    name: 'イベント参加者',
    icon: '🎫',
    description: 'イベントや会議の参加者管理',
    details: 'セミナーや展示会の参加者を管理。出欠確認やフォローアップに活用できます。',
    columns: [
      { name: 'name', label: '名前', type: 'text', is_required: true },
      { name: 'email', label: 'メールアドレス', type: 'email', is_required: false },
      { name: 'phone', label: '電話番号', type: 'phone', is_required: false },
      { name: 'company', label: '会社', type: 'text', is_required: false },
      { name: 'position', label: '役職', type: 'text', is_required: false },
      { name: 'attendance_date', label: '参加日', type: 'date', is_required: false },
      { name: 'ticket_type', label: 'チケットタイプ', type: 'text', is_required: false },
    ],
    statuses: [
      { name: '申込', color: '#94a3b8' },
      { name: '確認済', color: '#3b82f6' },
      { name: '参加', color: '#10b981' },
      { name: '不参加', color: '#ef4444' },
    ],
  },
  {
    id: 'custom',
    name: 'カスタム',
    icon: '⚙️',
    description: '独自のテーブルを作成',
    details: '基本的な項目から始めて、後から自由にカスタマイズできます。',
    columns: [
      { name: 'name', label: '名前', type: 'text', is_required: true },
      { name: 'email', label: 'メールアドレス', type: 'email', is_required: false },
      { name: 'phone', label: '電話番号', type: 'phone', is_required: false },
    ],
    statuses: [
      { name: 'リード', color: '#94a3b8' },
      { name: '進行中', color: '#3b82f6' },
      { name: '完了', color: '#10b981' },
    ],
  },
]

export function getTemplateById(id: string): TableTemplate | undefined {
  return TABLE_TEMPLATES.find(t => t.id === id)
}

export function getTemplateColumns(templateType: string) {
  const template = getTemplateById(templateType)
  return template?.columns || []
}

export function getTemplateStatuses(templateType: string) {
  const template = getTemplateById(templateType)
  return template?.statuses || []
}
