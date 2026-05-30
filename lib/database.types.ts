export type Json = string | number | boolean | null | { [key: string]: unknown } | unknown[]

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
          slug: string | null
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
          slug?: string | null
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
          has_completed_onboarding: boolean
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
          has_completed_onboarding?: boolean
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
          description: string | null
          system_prompt: string | null
          model_complexity: string
          recommended_channels: string[]
          estimated_value_pkr: number
          sector_tags: string[]
          use_case_examples: Json
          is_catalogue: boolean
          source: string
          widget_token: string | null
          status: string
          version: number
          config: Json
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
          description?: string | null
          system_prompt?: string | null
          model_complexity?: string
          recommended_channels?: string[]
          estimated_value_pkr?: number
          sector_tags?: string[]
          use_case_examples?: Json
          is_catalogue?: boolean
          source?: string
          widget_token?: string | null
          status?: string
          version?: number
          config?: Json
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
          messages: Json[]
          confidence_score: number | null
          resolved_at: string | null
          escalated_to: string | null
          feedback: string | null
          tokens_used: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          agent_id: string
          channel?: string | null
          contact_identifier?: string | null
          status?: string
          messages?: Json[]
          confidence_score?: number | null
          resolved_at?: string | null
          escalated_to?: string | null
          feedback?: string | null
          tokens_used?: number
          metadata?: Json | null
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
          config_snapshot: Json | null
          changed_by: string | null
          change_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          tenant_id: string
          version: number
          config_snapshot?: Json | null
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
          metadata: Json | null
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
          metadata?: Json | null
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

      channel_connections: {
        Row: {
          id: string
          tenant_id: string
          agent_id: string | null
          channel_type: string
          channel_identifier: string | null
          credentials: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          agent_id?: string | null
          channel_type: string
          channel_identifier?: string | null
          credentials?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['channel_connections']['Insert']>
        Relationships: []
      }

      automations: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          trigger_type: string | null
          trigger_config: Json | null
          action_type: string | null
          action_config: Json | null
          status: string
          run_count: number
          last_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          trigger_type?: string | null
          trigger_config?: Json | null
          action_type?: string | null
          action_config?: Json | null
          status?: string
          run_count?: number
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['automations']['Insert']>
        Relationships: []
      }

      automation_logs: {
        Row: {
          id: string
          tenant_id: string
          automation_id: string
          trigger_event: string | null
          trigger_data: Json
          steps_executed: Json
          status: string
          error_message: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          automation_id: string
          trigger_event?: string | null
          trigger_data?: Json
          steps_executed?: Json
          status?: string
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['automation_logs']['Insert']>
        Relationships: []
      }

      contact_memory: {
        Row: {
          id: string
          tenant_id: string
          contact_identifier: string
          contact_name: string | null
          profile: Json
          interaction_log: Json
          total_value_pkr: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          contact_identifier: string
          contact_name?: string | null
          profile?: Json
          interaction_log?: Json
          total_value_pkr?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['contact_memory']['Insert']>
        Relationships: []
      }

      feedback: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          type: string
          message: string
          rating: number | null
          category: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          type: string
          message: string
          rating?: number | null
          category?: string | null
          status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>
        Relationships: []
      }

      forge_queue: {
        Row: {
          id: string
          agent_type: string
          display_name: string
          description: string
          system_prompt: string
          recommended_channels: string[]
          model_complexity: string
          estimated_value_pkr: number
          sector_tags: string[]
          use_case_examples: Json
          why_novel: string
          source: string
          research_sources: Json
          status: string
          master_notes: string | null
          deployed_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          display_name: string
          description?: string
          system_prompt?: string
          recommended_channels?: string[]
          model_complexity?: string
          estimated_value_pkr?: number
          sector_tags?: string[]
          use_case_examples?: Json
          why_novel?: string
          source?: string
          research_sources?: Json
          status?: string
          master_notes?: string | null
          deployed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['forge_queue']['Insert']>
        Relationships: []
      }

      knowledge_documents: {
        Row: {
          id: string
          tenant_id: string
          name: string
          content: string | null
          source_type: string
          source_url: string | null
          chunk_index: number
          embedding: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          content?: string | null
          source_type?: string
          source_url?: string | null
          chunk_index?: number
          embedding?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['knowledge_documents']['Insert']>
        Relationships: []
      }

      agent_personas: {
        Row: {
          agent_type: string
          display_name: string
          personality: string | null
          communication_style: string | null
          tone: string | null
          catchphrase: string | null
          sprite_color: string
        }
        Insert: {
          agent_type: string
          display_name: string
          personality?: string | null
          communication_style?: string | null
          tone?: string | null
          catchphrase?: string | null
          sprite_color?: string
        }
        Update: Partial<Database['public']['Tables']['agent_personas']['Insert']>
        Relationships: []
      }

      agent_skills: {
        Row: {
          agent_type: string
          pattern: string
          trigger: string | null
          example: string | null
          usage_count: number
          success_rate: number
        }
        Insert: {
          agent_type: string
          pattern: string
          trigger?: string | null
          example?: string | null
          usage_count?: number
          success_rate?: number
        }
        Update: Partial<Database['public']['Tables']['agent_skills']['Insert']>
        Relationships: []
      }

      skill_listings: {
        Row: {
          id: string
          agent_type: string
          display_name: string
          description: string
          sector: string
          system_prompt: string
          price_pkr: number
          price_usd: number
          publisher_name: string
          publisher_email: string | null
          status: string
          downloads: number
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          display_name: string
          description: string
          sector: string
          system_prompt: string
          price_pkr?: number
          price_usd?: number
          publisher_name?: string
          publisher_email?: string | null
          status?: string
          downloads?: number
          rating?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['skill_listings']['Insert']>
        Relationships: []
      }

      country_profiles: {
        Row: {
          country_code: string
          country_name: string
          currency: string | null
          primary_language: string | null
          secondary_languages: string[]
          timezone: string | null
          regulatory_context: string | null
          market_context: string | null
          agent_injection: string | null
          last_updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          currency?: string | null
          primary_language?: string | null
          secondary_languages?: string[]
          timezone?: string | null
          regulatory_context?: string | null
          market_context?: string | null
          agent_injection?: string | null
          last_updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['country_profiles']['Insert']>
        Relationships: []
      }

      tenant_geo_settings: {
        Row: {
          tenant_id: string
          country_code: string | null
          geo_applied_at: string | null
        }
        Insert: {
          tenant_id: string
          country_code?: string | null
          geo_applied_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['tenant_geo_settings']['Insert']>
        Relationships: []
      }

      orion_agent_intelligence: {
        Row: {
          agent_type: string
          base_prompt: string | null
          optimised_prompt: string | null
          intelligence_score: number
          version: number
          country_variants: Json
          performance_data: Json
          last_optimised_at: string | null
          next_optimisation_at: string | null
        }
        Insert: {
          agent_type: string
          base_prompt?: string | null
          optimised_prompt?: string | null
          intelligence_score?: number
          version?: number
          country_variants?: Json
          performance_data?: Json
          last_optimised_at?: string | null
          next_optimisation_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['orion_agent_intelligence']['Insert']>
        Relationships: []
      }

      orion_optimisation_log: {
        Row: {
          id: string
          agent_type: string
          trigger_reason: string | null
          previous_score: number | null
          new_score: number | null
          changes_summary: string | null
          previous_prompt: string | null
          new_prompt: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          trigger_reason?: string | null
          previous_score?: number | null
          new_score?: number | null
          changes_summary?: string | null
          previous_prompt?: string | null
          new_prompt?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['orion_optimisation_log']['Insert']>
        Relationships: []
      }

      orion_council_sessions: {
        Row: {
          id: string
          tenant_id: string | null
          conversation_id: string | null
          query: string | null
          agents_involved: string[]
          individual_responses: Json
          synthesised_response: string | null
          quality_score: number
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          conversation_id?: string | null
          query?: string | null
          agents_involved?: string[]
          individual_responses?: Json
          synthesised_response?: string | null
          quality_score?: number
          duration_ms?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['orion_council_sessions']['Insert']>
        Relationships: []
      }

      orion_forge_briefs: {
        Row: {
          id: string
          gaps_identified: Json
          quality_directives: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          gaps_identified?: Json
          quality_directives?: string | null
          status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['orion_forge_briefs']['Insert']>
        Relationships: []
      }

      // ─── Wave 2 Feature Tables ──────────────────────────────────────────────

      ab_tests: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          agent_type: string
          status: string
          traffic_split: number
          winner_variant: string | null
          started_at: string | null
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          agent_type: string
          status?: string
          traffic_split?: number
          winner_variant?: string | null
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['ab_tests']['Insert']>
        Relationships: []
      }

      ab_test_variants: {
        Row: {
          id: string
          test_id: string
          name: string
          config: Json
          traffic_percent: number
          impressions: number
          conversions: number
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          name: string
          config?: Json
          traffic_percent?: number
          impressions?: number
          conversions?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ab_test_variants']['Insert']>
        Relationships: []
      }

      agent_prompt_versions: {
        Row: {
          id: string
          agent_type: string
          prompt_text: string
          version: number
          score: number | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          prompt_text: string
          version?: number
          score?: number | null
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['agent_prompt_versions']['Insert']>
        Relationships: []
      }

      agent_recovery_log: {
        Row: {
          id: string
          agent_id: string
          issue: string
          severity: string
          action_taken: string
          success: boolean
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          issue: string
          severity: string
          action_taken: string
          success?: boolean
          details?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['agent_recovery_log']['Insert']>
        Relationships: []
      }

      agent_registry: {
        Row: {
          agent_type: string
          display_name: string
          description: string | null
          system_prompt: string | null
          sector: string | null
          model_complexity: string
          status: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          agent_type: string
          display_name: string
          description?: string | null
          system_prompt?: string | null
          sector?: string | null
          model_complexity?: string
          status?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['agent_registry']['Insert']>
        Relationships: []
      }

      agent_wallets: {
        Row: {
          agent_type: string
          balance: number
          total_earned: number
          total_spent: number
          last_transaction_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          agent_type: string
          balance?: number
          total_earned?: number
          total_spent?: number
          last_transaction_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['agent_wallets']['Insert']>
        Relationships: []
      }

      api_keys: {
        Row: {
          id: string
          tenant_id: string
          name: string
          key_hash: string
          key_prefix: string
          status: string
          permissions: Json
          rate_limit: number
          expires_at: string | null
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          key_hash: string
          key_prefix: string
          status?: string
          permissions?: Json
          rate_limit?: number
          expires_at?: string | null
          last_used_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
        Relationships: []
      }

      backup_snapshots: {
        Row: {
          id: string
          backup_id: string
          version: number
          data: Json
          size_bytes: number
          created_at: string
        }
        Insert: {
          id?: string
          backup_id: string
          version: number
          data: Json
          size_bytes?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['backup_snapshots']['Insert']>
        Relationships: []
      }

      backups: {
        Row: {
          id: string
          tenant_id: string
          name: string
          status: string
          type: string
          size_bytes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          status?: string
          type?: string
          size_bytes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['backups']['Insert']>
        Relationships: []
      }

      contact_memory_graph: {
        Row: {
          id: string
          tenant_id: string
          contact_identifier: string
          source_node: string
          target_node: string
          relationship_type: string
          weight: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          contact_identifier: string
          source_node: string
          target_node: string
          relationship_type: string
          weight?: number
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['contact_memory_graph']['Insert']>
        Relationships: []
      }

      customer_portals: {
        Row: {
          id: string
          tenant_id: string
          name: string
          subdomain: string
          agents: string[]
          custom_domain: string | null
          primary_color: string | null
          logo_url: string | null
          welcome_message: string | null
          active: boolean
          visitor_count: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          subdomain: string
          agents?: string[]
          custom_domain?: string | null
          primary_color?: string | null
          logo_url?: string | null
          welcome_message?: string | null
          active?: boolean
          visitor_count?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['customer_portals']['Insert']>
        Relationships: []
      }

      economy_transactions: {
        Row: {
          id: string
          tenant_id: string | null
          agent_type: string
          type: string
          amount: number
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          agent_type: string
          type: string
          amount: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['economy_transactions']['Insert']>
        Relationships: []
      }

      gateway_logs: {
        Row: {
          id: string
          tenant_id: string
          api_key_id: string | null
          method: string
          path: string
          status_code: number
          duration_ms: number
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          api_key_id?: string | null
          method: string
          path: string
          status_code?: number
          duration_ms?: number
          ip_address?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['gateway_logs']['Insert']>
        Relationships: []
      }

      marketplace_agents: {
        Row: {
          id: string
          agent_type: string
          display_name: string
          description: string | null
          sector: string | null
          system_prompt: string | null
          model_complexity: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          display_name: string
          description?: string | null
          sector?: string | null
          system_prompt?: string | null
          model_complexity?: string
          status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['marketplace_agents']['Insert']>
        Relationships: []
      }

      nexus_queue: {
        Row: {
          id: string
          agent_type: string
          action: string
          payload: Json
          status: string
          priority: number
          scheduled_for: string | null
          started_at: string | null
          completed_at: string | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          action: string
          payload?: Json
          status?: string
          priority?: number
          scheduled_for?: string | null
          started_at?: string | null
          completed_at?: string | null
          error?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['nexus_queue']['Insert']>
        Relationships: []
      }

      nexus_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          config: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          config?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['nexus_templates']['Insert']>
        Relationships: []
      }

      notifications: {
        Row: {
          id: string
          tenant_id: string
          title: string
          body: string
          type: string
          read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          body: string
          type?: string
          read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }

      scout_reports: {
        Row: {
          id: string
          agent_type: string
          report_type: string
          summary: string
          details: Json
          findings: string[]
          score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          report_type: string
          summary: string
          details?: Json
          findings?: string[]
          score?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['scout_reports']['Insert']>
        Relationships: []
      }

      sense_events: {
        Row: {
          id: string
          tenant_id: string
          event_type: string
          source: string
          data: Json
          severity: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          event_type: string
          source: string
          data?: Json
          severity?: string
          read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sense_events']['Insert']>
        Relationships: []
      }

      society_events: {
        Row: {
          id: string
          tenant_id: string
          agent_type: string
          event_type: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          agent_type: string
          event_type: string
          data?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['society_events']['Insert']>
        Relationships: []
      }

      swarm_council_logs: {
        Row: {
          id: string
          tenant_id: string
          query: string
          sector: string | null
          agents_involved: string[]
          responses: Json
          synthesis: string | null
          consensus: boolean
          quality_score: number | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          query: string
          sector?: string | null
          agents_involved?: string[]
          responses?: Json
          synthesis?: string | null
          consensus?: boolean
          quality_score?: number | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['swarm_council_logs']['Insert']>
        Relationships: []
      }

      syndicate_messages: {
        Row: {
          id: string
          from_agent: string
          to_agent: string | null
          message_type: string
          payload: Json
          status: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_agent: string
          to_agent?: string | null
          message_type: string
          payload?: Json
          status?: string
          read_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['syndicate_messages']['Insert']>
        Relationships: []
      }

      syndicate_routes: {
        Row: {
          id: string
          from_agent: string
          to_agent: string
          route_type: string
          priority: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_agent: string
          to_agent: string
          route_type?: string
          priority?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['syndicate_routes']['Insert']>
        Relationships: []
      }

      training_examples: {
        Row: {
          id: string
          agent_type: string
          input: string
          expected_output: string
          quality_score: number | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          input: string
          expected_output: string
          quality_score?: number | null
          active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['training_examples']['Insert']>
        Relationships: []
      }

      webhook_endpoints: {
        Row: {
          id: string
          tenant_id: string
          name: string
          url: string
          events: string[]
          secret: string | null
          status: string
          retry_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          url: string
          events: string[]
          secret?: string | null
          status?: string
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['webhook_endpoints']['Insert']>
        Relationships: []
      }

      webhook_events: {
        Row: {
          id: string
          endpoint_id: string
          event_type: string
          payload: Json
          status: string
          response_code: number | null
          response_body: string | null
          attempt: number
          next_retry_at: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          endpoint_id: string
          event_type: string
          payload: Json
          status?: string
          response_code?: number | null
          response_body?: string | null
          attempt?: number
          next_retry_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['webhook_events']['Insert']>
        Relationships: []
      }

      workflows: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          steps: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          steps?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workflows']['Insert']>
        Relationships: []
      }

      workspaces: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
        Relationships: []
      }

      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['workspace_members']['Insert']>
        Relationships: []
      }

      workspace_agents: {
        Row: {
          id: string
          workspace_id: string
          agent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          agent_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['workspace_agents']['Insert']>
        Relationships: []
      }

      tasks: {
        Row: {
          id: string
          tenant_id: string
          title: string
          status: string
          priority: string
          assigned_to: string | null
          due_date: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          status?: string
          priority?: string
          assigned_to?: string | null
          due_date?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
        Relationships: []
      }

      contacts: {
        Row: {
          id: string
          tenant_id: string
          identifier: string
          name: string | null
          email: string | null
          phone: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          identifier: string
          name?: string | null
          email?: string | null
          phone?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
        Relationships: []
      }

      callbacks: {
        Row: {
          id: string
          tenant_id: string
          contact_identifier: string
          scheduled_at: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          contact_identifier: string
          scheduled_at: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['callbacks']['Insert']>
        Relationships: []
      }

      newsletter_subscribers: {
        Row: {
          id: string
          tenant_id: string
          email: string
          name: string | null
          status: string
          subscribed_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          name?: string | null
          status?: string
          subscribed_at?: string
        }
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Insert']>
        Relationships: []
      }

      appointments: {
        Row: {
          id: string
          tenant_id: string
          contact_identifier: string
          title: string
          scheduled_at: string
          duration_minutes: number
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          contact_identifier: string
          title: string
          scheduled_at: string
          duration_minutes?: number
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
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
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Agent = Database['public']['Tables']['agents']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type AgentVersion = Database['public']['Tables']['agent_versions']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']
export type WaitlistEntry = Database['public']['Tables']['waitlist']['Row']
export type ChannelConnection = Database['public']['Tables']['channel_connections']['Row']
export type Automation = Database['public']['Tables']['automations']['Row']
export type AutomationLog = Database['public']['Tables']['automation_logs']['Row']
export type ContactMemory = Database['public']['Tables']['contact_memory']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type ForgeQueue = Database['public']['Tables']['forge_queue']['Row']
export type KnowledgeDocument = Database['public']['Tables']['knowledge_documents']['Row']
export type AgentPersona = Database['public']['Tables']['agent_personas']['Row']
export type AgentSkill = Database['public']['Tables']['agent_skills']['Row']
export type SkillListing = Database['public']['Tables']['skill_listings']['Row']
export type CountryProfile = Database['public']['Tables']['country_profiles']['Row']
export type TenantGeoSettings = Database['public']['Tables']['tenant_geo_settings']['Row']
export type OrionAgentIntelligence = Database['public']['Tables']['orion_agent_intelligence']['Row']
export type OrionOptimisationLog = Database['public']['Tables']['orion_optimisation_log']['Row']
export type OrionCouncilSession = Database['public']['Tables']['orion_council_sessions']['Row']
export type OrionForgeBrief = Database['public']['Tables']['orion_forge_briefs']['Row']
export type ABTest = Database['public']['Tables']['ab_tests']['Row']
export type ABTestVariant = Database['public']['Tables']['ab_test_variants']['Row']
export type AgentPromptVersion = Database['public']['Tables']['agent_prompt_versions']['Row']
export type AgentRecoveryLog = Database['public']['Tables']['agent_recovery_log']['Row']
export type AgentRegistry = Database['public']['Tables']['agent_registry']['Row']
export type AgentWallet = Database['public']['Tables']['agent_wallets']['Row']
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type BackupSnapshot = Database['public']['Tables']['backup_snapshots']['Row']
export type Backup = Database['public']['Tables']['backups']['Row']
export type ContactMemoryGraph = Database['public']['Tables']['contact_memory_graph']['Row']
export type CustomerPortal = Database['public']['Tables']['customer_portals']['Row']
export type EconomyTransaction = Database['public']['Tables']['economy_transactions']['Row']
export type GatewayLog = Database['public']['Tables']['gateway_logs']['Row']
export type MarketplaceAgent = Database['public']['Tables']['marketplace_agents']['Row']
export type NexusQueue = Database['public']['Tables']['nexus_queue']['Row']
export type NexusTemplate = Database['public']['Tables']['nexus_templates']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ScoutReport = Database['public']['Tables']['scout_reports']['Row']
export type SenseEvent = Database['public']['Tables']['sense_events']['Row']
export type SocietyEvent = Database['public']['Tables']['society_events']['Row']
export type SwarmCouncilLog = Database['public']['Tables']['swarm_council_logs']['Row']
export type SyndicateMessage = Database['public']['Tables']['syndicate_messages']['Row']
export type SyndicateRoute = Database['public']['Tables']['syndicate_routes']['Row']
export type TrainingExample = Database['public']['Tables']['training_examples']['Row']
export type WebhookEndpoint = Database['public']['Tables']['webhook_endpoints']['Row']
export type WebhookEvent = Database['public']['Tables']['webhook_events']['Row']
export type Workflow = Database['public']['Tables']['workflows']['Row']
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type WorkspaceAgent = Database['public']['Tables']['workspace_agents']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Callback = Database['public']['Tables']['callbacks']['Row']
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
