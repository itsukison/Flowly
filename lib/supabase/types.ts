import { Database } from './database.types'

// Helper types for easier usage
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type CustomerActivityLog = Database['public']['Tables']['customer_activity_log']['Row']
export type CustomerActivityLogInsert = Database['public']['Tables']['customer_activity_log']['Insert']

export type DuplicateCandidate = Database['public']['Tables']['duplicate_candidates']['Row']
export type DuplicateCandidateInsert = Database['public']['Tables']['duplicate_candidates']['Insert']
export type DuplicateCandidateUpdate = Database['public']['Tables']['duplicate_candidates']['Update']

// Enums
export type CustomerStatus = 'リード' | '商談中' | '契約' | '運用中' | '休眠'
export type UserRole = 'owner' | 'admin' | 'member'
export type OrganizationPlan = 'starter' | 'growth' | 'business'
export type EnrichmentStatus = 'pending' | 'completed' | 'failed'
export type ActivityActionType = 'created' | 'updated' | 'status_changed' | 'enriched' | 'merged' | 'note_added'
export type DuplicateStatus = 'pending' | 'merged' | 'dismissed'

// Extended types with relationships
export type CustomerWithRelations = Customer & {
  assigned_user?: User | null
  created_by_user?: User | null
}

export type CustomerWithActivity = Customer & {
  activity_log?: CustomerActivityLog[]
}
