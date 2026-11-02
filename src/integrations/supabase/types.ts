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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          ends_at: string
          id: string
          is_sample: boolean
          notes: string | null
          service_id: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          ends_at: string
          id?: string
          is_sample?: boolean
          notes?: string | null
          service_id?: string | null
          source?: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          ends_at?: string
          id?: string
          is_sample?: boolean
          notes?: string | null
          service_id?: string | null
          source?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          appointment_buffer_minutes: number
          appointment_policy: string | null
          created_at: string
          currency: string
          description: string | null
          email: string | null
          handoff_email: string | null
          handoff_name: string | null
          handoff_phone: string | null
          id: string
          logo_url: string | null
          name: string
          opening_hours: Json
          phone: string | null
          special_hours: Json
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          appointment_buffer_minutes?: number
          appointment_policy?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          email?: string | null
          handoff_email?: string | null
          handoff_name?: string | null
          handoff_phone?: string | null
          id?: string
          logo_url?: string | null
          name: string
          opening_hours?: Json
          phone?: string | null
          special_hours?: Json
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          appointment_buffer_minutes?: number
          appointment_policy?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          email?: string | null
          handoff_email?: string | null
          handoff_name?: string | null
          handoff_phone?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          opening_hours?: Json
          phone?: string | null
          special_hours?: Json
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          appointment_id: string | null
          business_id: string
          caller_name: string | null
          created_at: string
          customer_id: string | null
          duration_seconds: number
          external_call_id: string | null
          handled_by: string
          id: string
          is_sample: boolean
          outcome: Database["public"]["Enums"]["call_outcome"]
          phone: string
          recording_url: string | null
          started_at: string
          summary: string | null
          transcript: string | null
        }
        Insert: {
          appointment_id?: string | null
          business_id: string
          caller_name?: string | null
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number
          external_call_id?: string | null
          handled_by?: string
          id?: string
          is_sample?: boolean
          outcome: Database["public"]["Enums"]["call_outcome"]
          phone: string
          recording_url?: string | null
          started_at?: string
          summary?: string | null
          transcript?: string | null
        }
        Update: {
          appointment_id?: string | null
          business_id?: string
          caller_name?: string | null
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number
          external_call_id?: string | null
          handled_by?: string
          id?: string
          is_sample?: boolean
          outcome?: Database["public"]["Enums"]["call_outcome"]
          phone?: string
          recording_url?: string | null
          started_at?: string
          summary?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_sample: boolean
          last_interaction_at: string | null
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_sample?: boolean
          last_interaction_at?: string | null
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_sample?: boolean
          last_interaction_at?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          business_id: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          is_sample: boolean
          kind: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          business_id: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_sample?: boolean
          kind?: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          business_id?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_sample?: boolean
          kind?: string
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          business_id: string
          config: Json
          created_at: string
          id: string
          kind: string
          provider: string | null
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          business_id: string
          config?: Json
          created_at?: string
          id?: string
          kind: string
          provider?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          business_id?: string
          config?: Json
          created_at?: string
          id?: string
          kind?: string
          provider?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      receptionist_settings: {
        Row: {
          after_hours_behavior: string
          business_description: string | null
          business_id: string
          created_at: string
          enabled: boolean
          fallback_message: string
          greeting: string
          handoff_enabled: boolean
          handoff_phone: string | null
          handoff_trigger: string | null
          id: string
          instructions: string | null
          languages: string[]
          opening_hours: Json
          receptionist_name: string
          updated_at: string
        }
        Insert: {
          after_hours_behavior?: string
          business_description?: string | null
          business_id: string
          created_at?: string
          enabled?: boolean
          fallback_message?: string
          greeting?: string
          handoff_enabled?: boolean
          handoff_phone?: string | null
          handoff_trigger?: string | null
          id?: string
          instructions?: string | null
          languages?: string[]
          opening_hours?: Json
          receptionist_name?: string
          updated_at?: string
        }
        Update: {
          after_hours_behavior?: string
          business_description?: string | null
          business_id?: string
          created_at?: string
          enabled?: boolean
          fallback_message?: string
          greeting?: string
          handoff_enabled?: boolean
          handoff_phone?: string | null
          handoff_trigger?: string | null
          id?: string
          instructions?: string | null
          languages?: string[]
          opening_hours?: Json
          receptionist_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receptionist_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          is_sample: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_sample?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_sample?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_history: Json
          business_id: string
          created_at: string
          id: string
          included_minutes: number
          is_sample: boolean
          monthly_price: number
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_history?: Json
          business_id: string
          created_at?: string
          id?: string
          included_minutes?: number
          is_sample?: boolean
          monthly_price?: number
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_history?: Json
          business_id?: string
          created_at?: string
          id?: string
          included_minutes?: number
          is_sample?: boolean
          monthly_price?: number
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_business_admin: { Args: { _bid: string }; Returns: boolean }
      is_business_member: { Args: { _bid: string }; Returns: boolean }
      seed_sample_data: { Args: { _bid: string }; Returns: undefined }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      call_outcome:
        | "answered"
        | "booked"
        | "transferred"
        | "missed"
        | "voicemail"
      integration_status: "not_connected" | "needs_configuration" | "connected"
      member_role: "owner" | "admin" | "staff"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      call_outcome: [
        "answered",
        "booked",
        "transferred",
        "missed",
        "voicemail",
      ],
      integration_status: ["not_connected", "needs_configuration", "connected"],
      member_role: ["owner", "admin", "staff"],
    },
  },
} as const
