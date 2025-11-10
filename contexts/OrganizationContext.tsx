'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Organization {
  id: string
  name: string
  role: string
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  switchOrganization: (orgId: string) => Promise<void>
  loading: boolean
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_organizations')
      
      if (error) throw error
      
      const orgs = data.map((org: any) => ({
        id: org.organization_id,
        name: org.organization_name,
        role: org.role
      }))
      
      setOrganizations(orgs)
      
      // Get current user to find current organization
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('current_organization_id')
          .eq('id', user.id)
          .single()
        
        if (userData?.current_organization_id) {
          const current = orgs.find((org: Organization) => org.id === userData.current_organization_id)
          setCurrentOrganization(current || orgs[0] || null)
        } else if (orgs.length > 0) {
          setCurrentOrganization(orgs[0])
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase.rpc('switch_organization', { org_id: orgId })
      
      if (error) throw error
      
      const newOrg = organizations.find(org => org.id === orgId)
      if (newOrg) {
        setCurrentOrganization(newOrg)
        // Refresh the page to reload data for new organization
        window.location.reload()
      }
    } catch (error) {
      console.error('Error switching organization:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        switchOrganization,
        loading,
        refreshOrganizations: fetchOrganizations
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
