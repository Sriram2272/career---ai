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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          ai_match_score: number | null
          applied_at: string
          cover_note: string | null
          id: string
          job_posting_id: string
          resume_url: string | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          ai_match_score?: number | null
          applied_at?: string
          cover_note?: string | null
          id?: string
          job_posting_id: string
          resume_url?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          ai_match_score?: number | null
          applied_at?: string
          cover_note?: string | null
          id?: string
          job_posting_id?: string
          resume_url?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      career_plans: {
        Row: {
          ai_model: string | null
          created_at: string
          id: string
          plan_data: Json | null
          progress_pct: number | null
          student_id: string
          target_company: string | null
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          id?: string
          plan_data?: Json | null
          progress_pct?: number | null
          student_id: string
          target_company?: string | null
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          id?: string
          plan_data?: Json | null
          progress_pct?: number | null
          student_id?: string
          target_company?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          hiring_history: Json | null
          id: string
          industry: string | null
          is_active: boolean | null
          locations: string[] | null
          logo_url: string | null
          name: string
          package_max: number | null
          package_min: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          hiring_history?: Json | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          locations?: string[] | null
          logo_url?: string | null
          name: string
          package_max?: number | null
          package_min?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          hiring_history?: Json | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          locations?: string[] | null
          logo_url?: string | null
          name?: string
          package_max?: number | null
          package_min?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      featured_placements: {
        Row: {
          added_by: string | null
          company_name: string
          created_at: string
          featured_date: string | null
          id: string
          is_active: boolean | null
          package_lpa: number | null
          photo_url: string | null
          student_id: string | null
        }
        Insert: {
          added_by?: string | null
          company_name: string
          created_at?: string
          featured_date?: string | null
          id?: string
          is_active?: boolean | null
          package_lpa?: number | null
          photo_url?: string | null
          student_id?: string | null
        }
        Update: {
          added_by?: string | null
          company_name?: string
          created_at?: string
          featured_date?: string | null
          id?: string
          is_active?: boolean | null
          package_lpa?: number | null
          photo_url?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          company_id: string
          created_at: string
          deadline: string | null
          description: string | null
          eligible_branches: string[] | null
          id: string
          interview_process: Json | null
          job_type: string | null
          max_applications: number | null
          min_cgpa: number | null
          package_lpa: number | null
          skills_required: string[] | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligible_branches?: string[] | null
          id?: string
          interview_process?: Json | null
          job_type?: string | null
          max_applications?: number | null
          min_cgpa?: number | null
          package_lpa?: number | null
          skills_required?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligible_branches?: string[] | null
          id?: string
          interview_process?: Json | null
          job_type?: string | null
          max_applications?: number | null
          min_cgpa?: number | null
          package_lpa?: number | null
          skills_required?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interviews: {
        Row: {
          ai_feedback: Json | null
          created_at: string
          difficulty: string | null
          domain: string | null
          duration_seconds: number | null
          id: string
          job_type: string | null
          overall_score: number | null
          questions: Json | null
          responses: Json | null
          student_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          created_at?: string
          difficulty?: string | null
          domain?: string | null
          duration_seconds?: number | null
          id?: string
          job_type?: string | null
          overall_score?: number | null
          questions?: Json | null
          responses?: Json | null
          student_id: string
        }
        Update: {
          ai_feedback?: Json | null
          created_at?: string
          difficulty?: string | null
          domain?: string | null
          duration_seconds?: number | null
          id?: string
          job_type?: string | null
          overall_score?: number | null
          questions?: Json | null
          responses?: Json | null
          student_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          priority: Database["public"]["Enums"]["notification_priority"]
          read: boolean
          recipient_id: string | null
          sender_id: string | null
          target_audience: string | null
          target_details: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean
          recipient_id?: string | null
          sender_id?: string | null
          target_audience?: string | null
          target_details?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean
          recipient_id?: string | null
          sender_id?: string | null
          target_audience?: string | null
          target_details?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      placement_drives: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          drive_date: string | null
          id: string
          offers_count: number | null
          rounds: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          drive_date?: string | null
          id?: string
          offers_count?: number | null
          rounds?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          drive_date?: string | null
          id?: string
          offers_count?: number | null
          rounds?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_drives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          aptitude_score: number | null
          avatar_url: string | null
          backlogs: number | null
          branch: string | null
          cgpa: number | null
          created_at: string
          department: string | null
          faculty_uid: string | null
          github_url: string | null
          graduation_year: number | null
          id: string
          linkedin_url: string | null
          name: string
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          placement_status: string | null
          preferred_roles: string[] | null
          programme: string | null
          programming_score: number | null
          registration_number: string | null
          resume_url: string | null
          school: string | null
          section: string | null
          skills: string[] | null
          stream: string | null
          tenth_percent: number | null
          tier: string | null
          twelfth_percent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          aptitude_score?: number | null
          avatar_url?: string | null
          backlogs?: number | null
          branch?: string | null
          cgpa?: number | null
          created_at?: string
          department?: string | null
          faculty_uid?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id: string
          linkedin_url?: string | null
          name: string
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          placement_status?: string | null
          preferred_roles?: string[] | null
          programme?: string | null
          programming_score?: number | null
          registration_number?: string | null
          resume_url?: string | null
          school?: string | null
          section?: string | null
          skills?: string[] | null
          stream?: string | null
          tenth_percent?: number | null
          tier?: string | null
          twelfth_percent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          aptitude_score?: number | null
          avatar_url?: string | null
          backlogs?: number | null
          branch?: string | null
          cgpa?: number | null
          created_at?: string
          department?: string | null
          faculty_uid?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          linkedin_url?: string | null
          name?: string
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          placement_status?: string | null
          preferred_roles?: string[] | null
          programme?: string | null
          programming_score?: number | null
          registration_number?: string | null
          resume_url?: string | null
          school?: string | null
          section?: string | null
          skills?: string[] | null
          stream?: string | null
          tenth_percent?: number | null
          tier?: string | null
          twelfth_percent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          faculty_id: string
          faculty_remarks: string | null
          forward_remarks: string | null
          forwarded_at: string | null
          forwarded_by: string | null
          forwarded_to: string | null
          id: string
          job_posting_id: string
          message: string | null
          requested_at: string
          responded_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          faculty_id: string
          faculty_remarks?: string | null
          forward_remarks?: string | null
          forwarded_at?: string | null
          forwarded_by?: string | null
          forwarded_to?: string | null
          id?: string
          job_posting_id: string
          message?: string | null
          requested_at?: string
          responded_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          faculty_id?: string
          faculty_remarks?: string | null
          forward_remarks?: string | null
          forwarded_at?: string | null
          forwarded_by?: string | null
          forwarded_to?: string | null
          id?: string
          job_posting_id?: string
          message?: string | null
          requested_at?: string
          responded_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_scores: {
        Row: {
          category: string | null
          computed_at: string
          factors: Json | null
          id: string
          overall_score: number | null
          student_id: string
        }
        Insert: {
          category?: string | null
          computed_at?: string
          factors?: Json | null
          id?: string
          overall_score?: number | null
          student_id: string
        }
        Update: {
          category?: string | null
          computed_at?: string
          factors?: Json | null
          id?: string
          overall_score?: number | null
          student_id?: string
        }
        Relationships: []
      }
      student_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          student_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          student_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          student_id?: string
        }
        Relationships: []
      }
      student_skills: {
        Row: {
          created_at: string
          id: string
          proficiency: string | null
          skill_name: string
          source: string | null
          student_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency?: string | null
          skill_name: string
          source?: string | null
          student_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          proficiency?: string | null
          skill_name?: string
          source?: string | null
          student_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      training_attendance: {
        Row: {
          attendance_status: string | null
          created_at: string
          feedback: string | null
          id: string
          score: number | null
          student_id: string
          workshop_id: string
        }
        Insert: {
          attendance_status?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          student_id: string
          workshop_id: string
        }
        Update: {
          attendance_status?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          student_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
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
      workshops: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          duration_hours: number | null
          id: string
          instructor: string | null
          max_capacity: number | null
          scheduled_date: string | null
          status: string | null
          title: string
          updated_at: string
          workshop_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          max_capacity?: number | null
          scheduled_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          workshop_type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          max_capacity?: number | null
          scheduled_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          workshop_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_department: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      achievement_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "forwarded"
      app_role: "student" | "concern-hod" | "school-hod" | "daa" | "admin"
      notification_priority: "normal" | "urgent" | "critical"
      notification_type:
        | "approved"
        | "rejected"
        | "pending"
        | "info"
        | "warning"
        | "announcement"
      review_action: "approved" | "rejected" | "forwarded" | "returned"
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
      achievement_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "forwarded",
      ],
      app_role: ["student", "concern-hod", "school-hod", "daa", "admin"],
      notification_priority: ["normal", "urgent", "critical"],
      notification_type: [
        "approved",
        "rejected",
        "pending",
        "info",
        "warning",
        "announcement",
      ],
      review_action: ["approved", "rejected", "forwarded", "returned"],
    },
  },
} as const
