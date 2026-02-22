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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      states: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          media_type: string | null
          media_url: string
          title: string | null
          visible: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url: string
          title?: string | null
          visible?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string
          title?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      ai_chat_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          user_name: string | null
          message: string
          ai_response: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          user_name?: string | null
          message: string
          ai_response: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          user_name?: string | null
          message?: string
          ai_response?: string
        }
        Relationships: []
      }
      alumni_profiles: {
        Row: {
          achievements: string | null
          created_at: string | null
          full_name: string
          id: string
          instagram_url: string | null
          is_featured: boolean | null
          journey_text: string | null
          linkedin_url: string | null
          photo_url: string | null
          visible: boolean | null
        }
        Insert: {
          achievements?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          instagram_url?: string | null
          is_featured?: boolean | null
          journey_text?: string | null
          linkedin_url?: string | null
          photo_url?: string | null
          visible?: boolean | null
        }
        Update: {
          achievements?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          is_featured?: boolean | null
          journey_text?: string | null
          linkedin_url?: string | null
          photo_url?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          priority: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          title?: string
        }
        Relationships: []
      }
      guides: {
        Row: {
          file_url: string
          id: string
          title: string
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          file_url: string
          id?: string
          title: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          file_url?: string
          id?: string
          title?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      mou_templates: {
        Row: {
          category: string
          file_url: string
          id: string
          title: string
          uploaded_at: string | null
          visible: boolean | null
        }
        Insert: {
          category: string
          file_url: string
          id?: string
          title: string
          uploaded_at?: string | null
          visible?: boolean | null
        }
        Update: {
          category?: string
          file_url?: string
          id?: string
          title?: string
          uploaded_at?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      news: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          media: Json | null
          is_published: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          media?: Json | null
          is_published?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          media?: Json | null
          is_published?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string
          date_of_birth: string | null
          designation: string | null
          district: string | null
          division: string | null
          email: string
          full_name: string
          id: string
          institution: string | null
          motivation: string | null
          phone: string
          photo_url: string | null
          prant: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          applied_at?: string
          date_of_birth?: string | null
          designation?: string | null
          district?: string | null
          division?: string | null
          email: string
          full_name: string
          id?: string
          institution?: string | null
          motivation?: string | null
          phone: string
          photo_url?: string | null
          prant?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          applied_at?: string
          date_of_birth?: string | null
          designation?: string | null
          district?: string | null
          division?: string | null
          email?: string
          full_name?: string
          id?: string
          institution?: string | null
          motivation?: string | null
          phone?: string
          photo_url?: string | null
          prant?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      brochures: {
        Row: {
          created_at: string
          description: string | null
          download_count: number | null
          file_url: string
          id: string
          is_active: boolean | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_url: string
          id?: string
          is_active?: boolean | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: []
      }
      collaboration_logos: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string
          title: string
          visible: boolean | null
          website_link: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url: string
          title: string
          visible?: boolean | null
          website_link?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string
          title?: string
          visible?: boolean | null
          website_link?: string | null
        }
        Relationships: []
      }
      cms_blocks: {
        Row: {
          content: Json
          id: string
          section: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          section: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          section?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string | null
          event_type: string | null
          id: string
          image_urls: string[] | null
          is_published: boolean | null
          location: string | null
          title: string
          updated_at: string
          collab_states: string[] | null
          is_joint_initiative: boolean | null
          proposed_by: string | null
          approval_status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          image_urls?: string[] | null
          is_published?: boolean | null
          location?: string | null
          title: string
          updated_at?: string
          collab_states?: string[] | null
          is_joint_initiative?: boolean | null
          proposed_by?: string | null
          approval_status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          image_urls?: string[] | null
          is_published?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string
          collab_states?: string[] | null
          is_joint_initiative?: boolean | null
          proposed_by?: string | null
          approval_status?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string | null
          event_type: string | null
          id: string
          image_urls: string[] | null
          is_published: boolean | null
          location: string | null
          title: string
          updated_at: string
          collab_states: string[] | null
          is_joint_initiative: boolean | null
          proposed_by: string | null
          approval_status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          image_urls?: string[] | null
          is_published?: boolean | null
          location?: string | null
          title: string
          updated_at?: string
          collab_states?: string[] | null
          is_joint_initiative?: boolean | null
          proposed_by?: string | null
          approval_status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          image_urls?: string[] | null
          is_published?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string
          collab_states?: string[] | null
          is_joint_initiative?: boolean | null
          proposed_by?: string | null
          approval_status?: string | null
        }
        Relationships: []
      }
      id_templates: {
        Row: {
          created_at: string
          design_config: Json
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          design_config?: Json
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          design_config?: Json
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      leaders: {
        Row: {
          created_at: string
          designation: string | null
          display_order: number | null
          district: string | null
          facebook_url: string | null
          full_name: string
          id: string
          instagram_url: string | null
          is_active: boolean | null
          linkedin_url: string | null
          photo_url: string | null
          prant: string | null
          role: string
          twitter_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          designation?: string | null
          display_order?: number | null
          district?: string | null
          facebook_url?: string | null
          full_name: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          photo_url?: string | null
          prant?: string | null
          role: string
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          designation?: string | null
          display_order?: number | null
          district?: string | null
          facebook_url?: string | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          photo_url?: string | null
          prant?: string | null
          role?: string
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prant_districts: {
        Row: {
          created_at: string
          display_order: number | null
          district: string
          id: string
          is_active: boolean | null
          prant: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          district: string
          id?: string
          is_active?: boolean | null
          prant: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          district?: string
          id?: string
          is_active?: boolean | null
          prant?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          designation: string | null
          district: string | null
          id_card_issued_at: string | null
          is_leadership: boolean | null
          is_alumni: boolean | null
          journey_text: string | null
          achievements_list: string | null
          contribution_details: string | null
          bio: string | null
          division: string | null
          email: string
          facebook_url: string | null
          full_name: string
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          membership_id: string | null
          phone: string | null
          prant: string | null
          state: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          event_manager_expiry: string | null
          allow_email_sharing: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          designation?: string | null
          district?: string | null
          division?: string | null
          email: string
          facebook_url?: string | null
          full_name: string
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          membership_id?: string | null
          phone?: string | null
          prant?: string | null
          state?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          event_manager_expiry?: string | null
          allow_email_sharing?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          designation?: string | null
          district?: string | null
          division?: string | null
          email?: string
          facebook_url?: string | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          membership_id?: string | null
          phone?: string | null
          prant?: string | null
          state?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          event_manager_expiry?: string | null
          allow_email_sharing?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
      | "MEMBER"
      | "DESIGNATORY"
      | "STATE_CO_CONVENER"
      | "STATE_CONVENER"
      | "NATIONAL_CO_CONVENER"
      | "NATIONAL_CONVENER"
      | "ADMIN"
      | "SUPER_CONTROLLER"
      application_status: "pending" | "approved" | "rejected"
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
    Enums: {
      app_role: [
        "MEMBER",
        "DESIGNATORY",
        "STATE_CO_CONVENER",
        "STATE_CONVENER",
        "NATIONAL_CO_CONVENER",
        "NATIONAL_CONVENER",
        "ADMIN",
        "SUPER_CONTROLLER",
      ],
      application_status: ["pending", "approved", "rejected"],
    },
  },
} as const
