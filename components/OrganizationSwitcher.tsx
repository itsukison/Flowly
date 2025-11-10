'use client'

import { useState } from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { ChevronDown, Building2, Check } from 'lucide-react'

export default function OrganizationSwitcher() {
  const { currentOrganization, organizations, switchOrganization, loading } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrganization?.id) {
      setIsOpen(false)
      return
    }

    setSwitching(true)
    try {
      await switchOrganization(orgId)
    } catch (error) {
      console.error('Failed to switch organization:', error)
    } finally {
      setSwitching(false)
      setIsOpen(false)
    }
  }

  if (loading || !currentOrganization) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-[#F4F4F5] rounded-xl animate-pulse">
        <Building2 className="w-5 h-5 text-[#71717B]" />
        <span className="text-base text-[#71717B]">読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E4E4E7] rounded-xl hover:bg-[#FAFAFA] hover:border-[#09090B] transition-all shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
        disabled={switching}
      >
        <Building2 className="w-5 h-5 text-[#71717B]" />
        <span className="text-base font-semibold text-[#09090B]">
          {currentOrganization.name}
        </span>
        <ChevronDown className={`w-5 h-5 text-[#71717B] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 bg-white border border-[#E4E4E7] rounded-2xl shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32),3px_3px_5px_-1px_rgba(0,0,0,0.41)] z-20 overflow-hidden">
            <div className="p-3">
              <div className="px-4 py-3 text-sm font-bold text-[#71717B] uppercase tracking-[0.1em]">
                組織を切り替え
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-base rounded-xl hover:bg-[#F4F4F5] transition-colors"
                  disabled={switching}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#71717B]" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-[#09090B]">{org.name}</div>
                      <div className="text-sm text-[#71717B]">{org.role}</div>
                    </div>
                  </div>
                  {org.id === currentOrganization.id && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-[#E4E4E7] p-3">
              <button
                className="w-full px-4 py-3 text-base text-left font-semibold text-[#09090B] hover:bg-[#F4F4F5] rounded-xl transition-colors"
                onClick={() => {
                  setIsOpen(false)
                  alert('組織作成機能は今後実装予定です')
                }}
              >
                + 新しい組織を作成
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
