export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      case_inputs: {
        Row: {
          case_id: string;
          created_at: string;
          display_order: number;
          id: string;
          raw_text: string;
          time_offset_minutes: number | null;
          time_tag: string | null;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          display_order: number;
          id?: string;
          raw_text: string;
          time_offset_minutes?: number | null;
          time_tag?: string | null;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          raw_text?: string;
          time_offset_minutes?: number | null;
          time_tag?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "case_inputs_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      case_results: {
        Row: {
          case_id: string;
          error_message: string | null;
          generated_at: string;
          history_draft: string;
          history_edited: string | null;
          id: string;
          model_version: string;
          pe_draft: string;
          pe_edited: string | null;
          pi_draft: string;
          pi_edited: string | null;
          structured_json: Json;
          template_draft: string;
          template_edited: string | null;
          template_key_used: string;
        };
        Insert: {
          case_id: string;
          error_message?: string | null;
          generated_at?: string;
          history_draft: string;
          history_edited?: string | null;
          id?: string;
          model_version: string;
          pe_draft?: string;
          pe_edited?: string | null;
          pi_draft: string;
          pi_edited?: string | null;
          structured_json: Json;
          template_draft: string;
          template_edited?: string | null;
          template_key_used: string;
        };
        Update: {
          case_id?: string;
          error_message?: string | null;
          generated_at?: string;
          history_draft?: string;
          history_edited?: string | null;
          id?: string;
          model_version?: string;
          pe_draft?: string;
          pe_edited?: string | null;
          pi_draft?: string;
          pi_edited?: string | null;
          structured_json?: Json;
          template_draft?: string;
          template_edited?: string | null;
          template_key_used?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_results_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      cases: {
        Row: {
          bed_number: number;
          bed_zone: Database["public"]["Enums"]["bed_zone"];
          board_hidden_at: string | null;
          cc: string | null;
          cc_has_template: boolean;
          created_at: string;
          current_result_id: string | null;
          has_inputs: boolean;
          id: string;
          memo: string | null;
          status: Database["public"]["Enums"]["case_status"];
          template_key: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bed_number?: number;
          bed_zone?: Database["public"]["Enums"]["bed_zone"];
          board_hidden_at?: string | null;
          cc?: string | null;
          cc_has_template?: boolean;
          created_at?: string;
          current_result_id?: string | null;
          has_inputs?: boolean;
          id?: string;
          memo?: string | null;
          status?: Database["public"]["Enums"]["case_status"];
          template_key?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bed_number?: number;
          bed_zone?: Database["public"]["Enums"]["bed_zone"];
          board_hidden_at?: string | null;
          cc?: string | null;
          cc_has_template?: boolean;
          created_at?: string;
          current_result_id?: string | null;
          has_inputs?: boolean;
          id?: string;
          memo?: string | null;
          status?: Database["public"]["Enums"]["case_status"];
          template_key?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cases_current_result_id_fkey";
            columns: ["current_result_id"];
            isOneToOne: false;
            referencedRelation: "case_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_guidelines: {
        Row: {
          guide_key: string;
          content: string;
          created_at: string;
          id: string;
          pdf_path: string | null;
          source_type: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          guide_key: string;
          content: string;
          created_at?: string;
          id?: string;
          pdf_path?: string | null;
          source_type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          guide_key?: string;
          content?: string;
          created_at?: string;
          id?: string;
          pdf_path?: string | null;
          source_type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interview_guidelines_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          ai_access_alert_dismissed: boolean;
          ai_access_name: string | null;
          ai_access_requested_at: string | null;
          ai_access_status: "none" | "pending" | "approved" | "denied";
          avatar_url: string | null;
          created_at: string;
          fold_auto_switch: boolean;
          fold_fallback_layout: "single" | "split_vertical";
          full_name: string | null;
          id: string;
          input_layout: Database["public"]["Enums"]["input_layout"];
          is_admin: boolean;
          mobile_font_size: number;
          split_ratio: number;
          updated_at: string;
        };
        Insert: {
          ai_access_alert_dismissed?: boolean;
          ai_access_name?: string | null;
          ai_access_requested_at?: string | null;
          ai_access_status?: "none" | "pending" | "approved" | "denied";
          avatar_url?: string | null;
          created_at?: string;
          fold_auto_switch?: boolean;
          fold_fallback_layout?: "single" | "split_vertical";
          full_name?: string | null;
          id: string;
          input_layout?: Database["public"]["Enums"]["input_layout"];
          is_admin?: boolean;
          mobile_font_size?: number;
          split_ratio?: number;
          updated_at?: string;
        };
        Update: {
          ai_access_alert_dismissed?: boolean;
          ai_access_name?: string | null;
          ai_access_requested_at?: string | null;
          ai_access_status?: "none" | "pending" | "approved" | "denied";
          avatar_url?: string | null;
          created_at?: string;
          fold_auto_switch?: boolean;
          fold_fallback_layout?: "single" | "split_vertical";
          full_name?: string | null;
          id?: string;
          input_layout?: Database["public"]["Enums"]["input_layout"];
          is_admin?: boolean;
          mobile_font_size?: number;
          split_ratio?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_corrections: {
        Row: {
          id: string;
          user_id: string;
          case_id: string | null;
          section_type: "pi" | "template" | "history" | "pe";
          cc: string;
          template_key: string | null;
          case_inputs_json: Json;
          api_output: string;
          corrected_output: string;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          case_id?: string | null;
          section_type: "pi" | "template" | "history" | "pe";
          cc: string;
          template_key?: string | null;
          case_inputs_json: Json;
          api_output: string;
          corrected_output: string;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          case_id?: string | null;
          section_type?: "pi" | "template" | "history" | "pe";
          cc?: string;
          template_key?: string | null;
          case_inputs_json?: Json;
          api_output?: string;
          corrected_output?: string;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_corrections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_corrections_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_style_rules: {
        Row: {
          id: string;
          rule_text: string;
          cc: string | null;
          section_type: "pi" | "template" | "history" | "pe" | "all";
          created_at: string;
        };
        Insert: {
          id?: string;
          rule_text: string;
          cc?: string | null;
          section_type: "pi" | "template" | "history" | "pe" | "all";
          created_at?: string;
        };
        Update: {
          id?: string;
          rule_text?: string;
          cc?: string | null;
          section_type?: "pi" | "template" | "history" | "pe" | "all";
          created_at?: string;
        };
        Relationships: [];
      };
      ai_documents: {
        Row: {
          doc_path: string;
          doc_type: "md" | "json";
          content: string;
          is_editable: boolean;
          version: number;
          synced_at: string | null;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          doc_path: string;
          doc_type: "md" | "json";
          content: string;
          is_editable?: boolean;
          version?: number;
          synced_at?: string | null;
          updated_at?: string;
          updated_by?: string;
        };
        Update: {
          doc_path?: string;
          doc_type?: "md" | "json";
          content?: string;
          is_editable?: boolean;
          version?: number;
          synced_at?: string | null;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      ai_document_versions: {
        Row: {
          id: string;
          doc_path: string;
          content: string;
          version: number;
          changed_by: string;
          change_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          doc_path: string;
          content: string;
          version: number;
          changed_by?: string;
          change_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          doc_path?: string;
          content?: string;
          version?: number;
          changed_by?: string;
          change_summary?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_document_versions_doc_path_fkey";
            columns: ["doc_path"];
            isOneToOne: false;
            referencedRelation: "ai_documents";
            referencedColumns: ["doc_path"];
          },
        ];
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          case_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          case_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          case_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_logs_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      error_logs: {
        Row: {
          id: string;
          user_id: string | null;
          page_url: string;
          error_message: string;
          stack_trace: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          page_url: string;
          error_message: string;
          stack_trace?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          page_url?: string;
          error_message?: string | null;
          stack_trace?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      ai_access_requests: {
        Row: {
          id: string;
          ai_access_name: string | null;
          ai_access_status: "none" | "pending" | "approved" | "denied";
          ai_access_requested_at: string | null;
          email: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      bed_zone: "A" | "B" | "R";
      case_status: "draft" | "generating" | "completed" | "failed";
      input_layout: "single" | "split_vertical" | "split_horizontal";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      bed_zone: ["A", "B", "R"],
      case_status: ["draft", "generating", "completed", "failed"],
      input_layout: ["single", "split_vertical", "split_horizontal"],
    },
  },
} as const;

// 편의 타입 — profiles
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// 편의 타입 — cases
export type Case = Database["public"]["Tables"]["cases"]["Row"];
export type CaseInsert = Database["public"]["Tables"]["cases"]["Insert"];
export type CaseUpdate = Database["public"]["Tables"]["cases"]["Update"];

// 편의 타입 — case_inputs
export type CaseInput = Database["public"]["Tables"]["case_inputs"]["Row"];
export type CaseInputInsert =
  Database["public"]["Tables"]["case_inputs"]["Insert"];

// 편의 타입 — case_results
export type CaseResult = Database["public"]["Tables"]["case_results"]["Row"];
export type CaseResultInsert =
  Database["public"]["Tables"]["case_results"]["Insert"];
export type CaseResultUpdate =
  Database["public"]["Tables"]["case_results"]["Update"];

// 편의 타입 — interview_guidelines
export type Guideline =
  Database["public"]["Tables"]["interview_guidelines"]["Row"];
export type GuidelineInsert =
  Database["public"]["Tables"]["interview_guidelines"]["Insert"];
export type GuidelineUpdate =
  Database["public"]["Tables"]["interview_guidelines"]["Update"];

// 편의 타입 — ai_corrections
export type AiCorrection =
  Database["public"]["Tables"]["ai_corrections"]["Row"];
export type AiCorrectionInsert =
  Database["public"]["Tables"]["ai_corrections"]["Insert"];

// 편의 타입 — ai_style_rules
export type AiStyleRule = Database["public"]["Tables"]["ai_style_rules"]["Row"];
export type AiStyleRuleInsert =
  Database["public"]["Tables"]["ai_style_rules"]["Insert"];

// 편의 타입 — ai_documents
export type AiDocument = Database["public"]["Tables"]["ai_documents"]["Row"];
export type AiDocumentInsert =
  Database["public"]["Tables"]["ai_documents"]["Insert"];

// 편의 타입 — ai_document_versions
export type AiDocumentVersion =
  Database["public"]["Tables"]["ai_document_versions"]["Row"];

// 편의 타입 — error_logs
export type ErrorLog = Database["public"]["Tables"]["error_logs"]["Row"];
export type ErrorLogInsert =
  Database["public"]["Tables"]["error_logs"]["Insert"];

// 편의 타입 — enum
export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type BedZone = Database["public"]["Enums"]["bed_zone"];
export type InputLayout = Database["public"]["Enums"]["input_layout"];
export type FoldFallbackLayout = "single" | "split_vertical";
export type AiAccessStatus = "none" | "pending" | "approved" | "denied";
