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
      clause_library: {
        Row: {
          body: string
          created_at: string
          id: string
          is_jurisdiction_agnostic: boolean
          jurisdictions: string[]
          purpose: string
          review_status: string
          slug: string
          tags: string[]
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_jurisdiction_agnostic?: boolean
          jurisdictions?: string[]
          purpose: string
          review_status?: string
          slug: string
          tags?: string[]
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_jurisdiction_agnostic?: boolean
          jurisdictions?: string[]
          purpose?: string
          review_status?: string
          slug?: string
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      doc_sessions: {
        Row: {
          answers: Json
          created_at: string
          id: string
          messages: Json
          status: string
          template_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          messages?: Json
          status?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          messages?: Json
          status?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_drafts: {
        Row: {
          body: string
          created_at: string
          id: string
          session_id: string
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          session_id: string
          version: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          session_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_drafts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "doc_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_clauses: {
        Row: {
          approved_at: string | null
          body: string
          created_at: string
          id: string
          library_clause_id: string | null
          requirement: string | null
          session_id: string
          source: string
          status: string
          title: string
          warnings: Json
        }
        Insert: {
          approved_at?: string | null
          body: string
          created_at?: string
          id?: string
          library_clause_id?: string | null
          requirement?: string | null
          session_id: string
          source: string
          status?: string
          title: string
          warnings?: Json
        }
        Update: {
          approved_at?: string | null
          body?: string
          created_at?: string
          id?: string
          library_clause_id?: string | null
          requirement?: string | null
          session_id?: string
          source?: string
          status?: string
          title?: string
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "session_clauses_library_clause_id_fkey"
            columns: ["library_clause_id"]
            isOneToOne: false
            referencedRelation: "clause_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_clauses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "doc_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      template_clauses: {
        Row: {
          action: string
          body: string
          created_at: string
          decision: string
          heading: string
          id: string
          note: string
          origin: string
          position: number
          sources: Json
          template_id: string
          user_id: string
          verdict: string
        }
        Insert: {
          action?: string
          body: string
          created_at?: string
          decision?: string
          heading?: string
          id?: string
          note?: string
          origin?: string
          position: number
          sources?: Json
          template_id: string
          user_id?: string
          verdict?: string
        }
        Update: {
          action?: string
          body?: string
          created_at?: string
          decision?: string
          heading?: string
          id?: string
          note?: string
          origin?: string
          position?: number
          sources?: Json
          template_id?: string
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_clauses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "uploaded_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_templates: {
        Row: {
          created_at: string
          file_path: string
          id: string
          messages: Json
          mime_type: string
          name: string
          original_text: string
          stage: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          messages?: Json
          mime_type: string
          name: string
          original_text?: string
          stage?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          messages?: Json
          mime_type?: string
          name?: string
          original_text?: string
          stage?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
