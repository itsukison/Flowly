import {
  Users,
  Package,
  Ticket,
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  Phone,
  Mail,
  Target,
  Settings,
  Wrench,
  Database,
  Calendar,
  ShoppingCart,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export const ICON_OPTIONS = [
  { name: 'users', label: '顧客', Icon: Users },
  { name: 'package', label: '商品', Icon: Package },
  { name: 'ticket', label: 'チケット', Icon: Ticket },
  { name: 'chart', label: 'データ', Icon: BarChart3 },
  { name: 'briefcase', label: 'ビジネス', Icon: Briefcase },
  { name: 'building', label: '会社', Icon: Building2 },
  { name: 'file', label: 'ドキュメント', Icon: FileText },
  { name: 'phone', label: '電話', Icon: Phone },
  { name: 'mail', label: 'メール', Icon: Mail },
  { name: 'target', label: 'ターゲット', Icon: Target },
  { name: 'settings', label: '設定', Icon: Settings },
  { name: 'wrench', label: 'ツール', Icon: Wrench },
  { name: 'database', label: 'データベース', Icon: Database },
  { name: 'calendar', label: 'カレンダー', Icon: Calendar },
  { name: 'cart', label: 'ショッピング', Icon: ShoppingCart },
  { name: 'trending', label: 'トレンド', Icon: TrendingUp },
]

export const getIconComponent = (iconName: string | null): LucideIcon => {
  // Handle legacy emoji icons
  const emojiToIconMap: Record<string, string> = {
    '👥': 'users',
    '📦': 'package',
    '🎫': 'ticket',
    '📊': 'chart',
    '💼': 'briefcase',
    '🏢': 'building',
    '📝': 'file',
    '📞': 'phone',
    '✉️': 'mail',
    '🎯': 'target',
    '⚙️': 'settings',
    '🔧': 'wrench',
  }

  // Convert emoji to icon name if needed
  const mappedName = iconName && emojiToIconMap[iconName] ? emojiToIconMap[iconName] : iconName

  const icon = ICON_OPTIONS.find(opt => opt.name === mappedName)
  return icon ? icon.Icon : BarChart3
}
