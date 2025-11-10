export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_organizations: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
      }
      users: {
        Row: {
          created_at: string
          current_organization_id: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_organization_id?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_organization_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
      }
      [key: string]: any
    }
    Functions: {
      get_user_organizations: {
        Args: Record<string, never>
        Returns: {
          organization_id: string
          organization_name: string
          role: string
        }[]
      }
      switch_organization: {
        Args: { org_id: string }
        Returns: void
      }
      [key: string]: any
    }
  }
}
