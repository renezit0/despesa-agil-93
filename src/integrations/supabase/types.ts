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
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          contact_email: string | null
          contact_name: string
          contact_user_id: string
          created_at: string
          id: string
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name: string
          contact_user_id: string
          created_at?: string
          id?: string
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string
          contact_user_id?: string
          created_at?: string
          id?: string
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          created_at: string
          current_installment: number | null
          description: string | null
          due_date: string
          early_payment_discount_rate: number | null
          financing_discount_amount: number | null
          financing_months_paid: number | null
          financing_months_total: number | null
          financing_paid_amount: number | null
          financing_total_amount: number | null
          id: string
          installments: number | null
          is_financing: boolean | null
          is_paid: boolean
          is_recurring: boolean
          needs_approval: boolean | null
          notes: string | null
          original_amount: number | null
          paid_at: string | null
          payment_proof_url: string | null
          recurring_start_date: string | null
          recurring_type: string | null
          shared_with_user_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          current_installment?: number | null
          description?: string | null
          due_date: string
          early_payment_discount_rate?: number | null
          financing_discount_amount?: number | null
          financing_months_paid?: number | null
          financing_months_total?: number | null
          financing_paid_amount?: number | null
          financing_total_amount?: number | null
          id?: string
          installments?: number | null
          is_financing?: boolean | null
          is_paid?: boolean
          is_recurring?: boolean
          needs_approval?: boolean | null
          notes?: string | null
          original_amount?: number | null
          paid_at?: string | null
          payment_proof_url?: string | null
          recurring_start_date?: string | null
          recurring_type?: string | null
          shared_with_user_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          current_installment?: number | null
          description?: string | null
          due_date?: string
          early_payment_discount_rate?: number | null
          financing_discount_amount?: number | null
          financing_months_paid?: number | null
          financing_months_total?: number | null
          financing_paid_amount?: number | null
          financing_total_amount?: number | null
          id?: string
          installments?: number | null
          is_financing?: boolean | null
          is_paid?: boolean
          is_recurring?: boolean
          needs_approval?: boolean | null
          notes?: string | null
          original_amount?: number | null
          paid_at?: string | null
          payment_proof_url?: string | null
          recurring_start_date?: string | null
          recurring_type?: string | null
          shared_with_user_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approver_user_id: string
          created_at: string
          expense_id: string
          id: string
          notes: string | null
          payment_date: string
          requester_user_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approver_user_id: string
          created_at?: string
          expense_id: string
          id?: string
          notes?: string | null
          payment_date: string
          requester_user_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approver_user_id?: string
          created_at?: string
          expense_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          requester_user_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          cep: string | null
          cpf: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      shared_expenses: {
        Row: {
          amount: number
          created_at: string
          expense_id: string
          id: string
          is_paid: boolean
          paid_at: string | null
          shared_with_user_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          expense_id: string
          id?: string
          is_paid?: boolean
          paid_at?: string | null
          shared_with_user_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_id?: string
          id?: string
          is_paid?: boolean
          paid_at?: string | null
          shared_with_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_expenses_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_expenses_for_month: {
        Args: { target_month: string; target_user_id: string }
        Returns: {
          amount: number
          approved_at: string
          approved_by: string
          category_id: string
          created_at: string
          current_installment: number
          description: string
          due_date: string
          early_payment_discount_rate: number
          financing_discount_amount: number
          financing_months_paid: number
          financing_months_total: number
          financing_paid_amount: number
          financing_total_amount: number
          id: string
          installments: number
          is_financing: boolean
          is_paid: boolean
          is_recurring: boolean
          needs_approval: boolean
          notes: string
          original_amount: number
          paid_at: string
          payment_proof_url: string
          recurring_type: string
          shared_with_user_id: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }[]
      }
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
