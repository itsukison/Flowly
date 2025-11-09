import { CustomerStatus } from '@/lib/supabase/types'

interface CustomerStatusBadgeProps {
  status: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  'リード': { bg: 'bg-[#F4F4F5]', text: 'text-[#71717B]' },
  '商談中': { bg: 'bg-blue-50', text: 'text-blue-700' },
  '契約': { bg: 'bg-green-50', text: 'text-green-700' },
  '運用中': { bg: 'bg-purple-50', text: 'text-purple-700' },
  '休眠': { bg: 'bg-gray-100', text: 'text-gray-600' },
}

export default function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const colors = statusColors[status] || statusColors['リード']

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      {status}
    </span>
  )
}
