export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customer_activity_log: {
        Row: {
          action_type: string
          changes: Json | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          changes?: Json | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          changes?: Json | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_activity_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          assigned_to: string | null
          company_domain: string | null
          company_name: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          email: string | null
          employee_count: number | null
          enrichment_sources: Json | null
          enrichment_status: string | null
          id: string
          industry: string | null
          last_contact_date: string | null
          name: string
          name_furigana: string | null
          organization_id: string
          phone: string | null
          status: string
          table_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          company_domain?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          employee_count?: number | null
          enrichment_sources?: Json | null
          enrichment_status?: string | null
          id?: string
          industry?: string | null
          last_contact_date?: string | null
          name: string
          name_furigana?: string | null
          organization_id: string
          phone?: string | null
          status?: string
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          company_domain?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          employee_count?: number | null
          enrichment_sources?: Json | null
          enrichment_status?: string | null
          id?: string
          industry?: string | null
          last_contact_date?: string | null
          name?: string
          name_furigana?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "table_statistics"
            referencedColumns: ["table_id"]
          },
          {
            foreignKeyName: "customers_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_candidates: {
        Row: {
          created_at: string
          customer_id_1: string
          customer_id_2: string
          id: string
          match_reasons: Json | null
          organization_id: string
          similarity_score: number
          status: string
        }
        Insert: {
          created_at?: string
          customer_id_1: string
          customer_id_2: string
          id?: string
          match_reasons?: Json | null
          organization_id: string
          similarity_score: number
          status?: string
        }
        Update: {
          created_at?: string
          customer_id_1?: string
          customer_id_2?: string
          id?: string
          match_reasons?: Json | null
          organization_id?: string
          similarity_score?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_candidates_customer_id_1_fkey"
            columns: ["customer_id_1"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_candidates_customer_id_2_fkey"
            columns: ["customer_id_2"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          enrichment_quota: number
          enrichment_used: number
          id: string
          name: string
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrichment_quota?: number
          enrichment_used?: number
          id?: string
          name: string
          plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrichment_quota?: number
          enrichment_used?: number
          id?: string
          name?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      records: {
        Row: {
          company: string | null
          created_at: string | null
          created_by: string | null
          data: Json | null
          email: string | null
          id: string
          name: string | null
          organization_id: string
          search_vector: unknown
          status: string | null
          table_id: string
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          email?: string | null
          id?: string
          name?: string | null
          organization_id: string
          search_vector?: unknown
          status?: string | null
          table_id: string
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          email?: string | null
          id?: string
          name?: string | null
          organization_id?: string
          search_vector?: unknown
          status?: string | null
          table_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "table_statistics"
            referencedColumns: ["table_id"]
          },
          {
            foreignKeyName: "records_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_columns: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_required: boolean | null
          label: string
          name: string
          options: Json | null
          table_id: string
          type: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean | null
          label: string
          name: string
          options?: Json | null
          table_id: string
          type: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean | null
          label?: string
          name?: string
          options?: Json | null
          table_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_columns_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "table_statistics"
            referencedColumns: ["table_id"]
          },
          {
            foreignKeyName: "table_columns_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_statuses: {
        Row: {
          color: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          table_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          table_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_statuses_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "table_statistics"
            referencedColumns: ["table_id"]
          },
          {
            foreignKeyName: "table_statuses_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          schema: Json | null
          template_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          schema?: Json | null
          template_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          schema?: Json | null
          template_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      table_statistics: {
        Row: {
          first_record_added: string | null
          last_record_added: string | null
          organization_id: string | null
          records_last_30_days: number | null
          records_last_7_days: number | null
          table_id: string | null
          table_name: string | null
          total_records: number | null
          unique_contributors: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      find_similar_customers: {
        Args: { customer_name: string; org_id: string; threshold?: number }
        Returns: {
          company_name: string
          email: string
          id: string
          name: string
          phone: string
          similarity: number
        }[]
      }
      get_user_organization_id: { Args: Record<string, never>; Returns: string }
      get_user_organizations: {
        Args: Record<string, never>
        Returns: {
          organization_id: string
          organization_name: string
          role: string
        }[]
      }
      is_organization_admin: { Args: { org_id: string }; Returns: boolean }
      normalize_phone: { Args: { phone: string }; Returns: string }
      set_user_organization: { Args: { org_id: string }; Returns: undefined }
      switch_organization: { Args: { org_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
