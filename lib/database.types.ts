export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          business_name: string
          business_email: string
          business_phone: string | null
          sector: string | null
          plan: string
          plan_status: string
          trial_ends_at: string | null
          country: string
          currency: string
          health_score: number
          churn_risk_score: number
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          business_name: string
          business_email: string
          business_phone?: string | null
          sector?: string | null
          plan?: string
          plan_status?: string
          trial_ends_at?: string | null
          country?: string
          currency?: string
          health_score?: number
          churn_risk_score?: number
          created_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
        Relationships: []
      }

      users: {
        Row: {
          id: string
          tenant_id: string | null
          full_name: string | null
          role: string
          email_verified: boolean
          mfa_enabled: boolean
          last_login_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          tenant_id?: string | null
          full_name?: string | null
          role?: string
          email_verified?: boolean
          mfa_enabled?: boolean
          last_login_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }

      agents: {
        Row: {
          id: string
          tenant_id: string
          agent_type: string
          display_name: string | null
          status: string
          version: number
          config: Record<string, unknown>
          channels: string[]
          confidence_threshold: number
          monthly_cost_pkr: number
          monthly_value_pkr: number
          interactions_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          agent_type: string
          display_name?: string | null
          status?: string
          version?: number
          config?: Record<string, unknown>
          channels?: string[]
          confidence_threshold?: number
          monthly_cost_pkr?: number
          monthly_value_pkr?: number
          interactions_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['agents']['Insert']>
        Relationships: []
      }

      conversations: {
        Row: {
          id: string
          tenant_id: string
          agent_id: string
          channel: string | null
          contact_identifier: string | null
          status: string
          messages: Record<string, unknown>[]
          confidence_score: number | null
          resolved_at: string | null
          escalated_to: string | null
          feedback: string | null
          tokens_used: number
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          agent_id: string
          channel?: string | null
          contact_identifier?: string | null
          status?: string
          messages?: Record<string, unknown>[]
          confidence_score?: number | null
          resolved_at?: string | null
          escalated_to?: string | null
          feedback?: string | null
          tokens_used?: number
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
        Relationships: []
      }

      subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan: string | null
          billing_cycle: string
          amount_pkr: number | null
          currency: string
          payment_provider: string | null
          provider_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          paused_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan?: string | null
          billing_cycle?: string
          amount_pkr?: number | null
          currency?: string
          payment_provider?: string | null
          provider_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          paused_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
      }

      agent_versions: {
        Row: {
          id: string
          agent_id: string
          tenant_id: string
          version: number
          config_snapshot: Record<string, unknown> | null
          changed_by: string | null
          change_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          tenant_id: string
          version: number
          config_snapshot?: Record<string, unknown> | null
          changed_by?: string | null
          change_reason?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['agent_versions']['Insert']>
        Relationships: []
      }

      audit_log: {
        Row: {
          id: string
          tenant_id: string | null
          actor_type: string | null
          actor_id: string | null
          action: string | null
          resource_type: string | null
          resource_id: string | null
          metadata: Record<string, unknown> | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          actor_type?: string | null
          actor_id?: string | null
          action?: string | null
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Record<string, unknown> | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>
        Relationships: []
      }

      waitlist: {
        Row: {
          id: string
          email: string
          name: string | null
          business_type: string | null
          position: number
          referral_code: string | null
          referred_by: string | null
          referral_count: number
          cohort: string
          converted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          business_type?: string | null
          referral_code?: string | null
          referred_by?: string | null
          referral_count?: number
          cohort?: string
          converted_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['waitlist']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Tenant        = Database['public']['Tables']['tenants']['Row']
export type User          = Database['public']['Tables']['users']['Row']
export type Agent         = Database['public']['Tables']['agents']['Row']
export type Conversation  = Database['public']['Tables']['conversations']['Row']
export type Subscription  = Database['public']['Tables']['subscriptions']['Row']
export type AgentVersion  = Database['public']['Tables']['agent_versions']['Row']
export type AuditLog      = Database['public']['Tables']['audit_log']['Row']
export type WaitlistEntry = Database['public']['Tables']['waitlist']['Row']
