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
      ai_usage_logs: {
        Row: {
          case_id: string;
          created_at: string;
          id: string;
          input_tokens: number | null;
          output_tokens: number | null;
          user_id: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          user_id: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "service_access_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      case_inputs: {
        Row: {
          case_id: string;
          created_at: string;
          display_order: number;
          id: string;
          raw_text: string;
          section_override: string | null;
          time_offset_minutes: number | null;
          time_tag: string | null;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          display_order: number;
          id?: string;
          raw_text: string;
          section_override?: string | null;
          time_offset_minutes?: number | null;
          time_tag?: string | null;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          raw_text?: string;
          section_override?: string | null;
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
      case_photos: {
        Row: {
          case_id: string;
          created_at: string;
          file_name: string;
          file_size: number;
          id: string;
          mime_type: string;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          file_name: string;
          file_size: number;
          id?: string;
          mime_type: string;
          storage_path: string;
          user_id: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          file_name?: string;
          file_size?: number;
          id?: string;
          mime_type?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_photos_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "service_access_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      case_results: {
        Row: {
          antithrombotic_at: string | null;
          antithrombotic_check: string | null;
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
          template_keys_used: string[];
          underlying_disease: string | null;
          underlying_disease_at: string | null;
        };
        Insert: {
          antithrombotic_at?: string | null;
          antithrombotic_check?: string | null;
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
          template_keys_used?: string[];
          underlying_disease?: string | null;
          underlying_disease_at?: string | null;
        };
        Update: {
          antithrombotic_at?: string | null;
          antithrombotic_check?: string | null;
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
          template_keys_used?: string[];
          underlying_disease?: string | null;
          underlying_disease_at?: string | null;
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
          bed_explicitly_set: boolean;
          bed_number: number;
          bed_zone: Database["public"]["Enums"]["bed_zone"];
          board_hidden_at: string | null;
          cc: string | null;
          cc_has_template: boolean;
          ccs: string[] | null;
          created_at: string;
          current_result_id: string | null;
          has_inputs: boolean;
          id: string;
          memo: string | null;
          status: Database["public"]["Enums"]["case_status"];
          template_key: string | null;
          template_keys: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bed_explicitly_set?: boolean;
          bed_number?: number;
          bed_zone?: Database["public"]["Enums"]["bed_zone"];
          board_hidden_at?: string | null;
          cc?: string | null;
          cc_has_template?: boolean;
          ccs?: string[] | null;
          created_at?: string;
          current_result_id?: string | null;
          has_inputs?: boolean;
          id?: string;
          memo?: string | null;
          status?: Database["public"]["Enums"]["case_status"];
          template_key?: string | null;
          template_keys?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bed_explicitly_set?: boolean;
          bed_number?: number;
          bed_zone?: Database["public"]["Enums"]["bed_zone"];
          board_hidden_at?: string | null;
          cc?: string | null;
          cc_has_template?: boolean;
          ccs?: string[] | null;
          created_at?: string;
          current_result_id?: string | null;
          has_inputs?: boolean;
          id?: string;
          memo?: string | null;
          status?: Database["public"]["Enums"]["case_status"];
          template_key?: string | null;
          template_keys?: string[];
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
          {
            foreignKeyName: "cases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "service_access_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_photos: {
        Row: {
          created_at: string;
          file_name: string;
          file_size: number;
          id: string;
          mime_type: string;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_size: number;
          id?: string;
          mime_type: string;
          storage_path: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_size?: number;
          id?: string;
          mime_type?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "service_access_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      error_logs: {
        Row: {
          created_at: string;
          error_message: string;
          id: string;
          page_url: string;
          stack_trace: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          error_message: string;
          id?: string;
          page_url: string;
          stack_trace?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          error_message?: string;
          id?: string;
          page_url?: string;
          stack_trace?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "error_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "service_access_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_guidelines: {
        Row: {
          content: string;
          created_at: string;
          guide_key: string;
          id: string;
          pdf_path: string | null;
          source_type: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          guide_key: string;
          id?: string;
          pdf_path?: string | null;
          source_type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          guide_key?: string;
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
          {
            foreignKeyName: "interview_guidelines_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "service_access_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          case_input_font_size: number;
          created_at: string;
          fold_auto_switch: boolean;
          fold_case_input_font_size: number;
          fold_fallback_layout: string;
          fold_guideline_font_size: number;
          full_name: string | null;
          fullscreen_mode: boolean | null;
          guideline_font_size: number;
          id: string;
          input_layout: Database["public"]["Enums"]["input_layout"];
          is_admin: boolean;
          mobile_font_size: number;
          service_access_status: string;
          split_ratio: number;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          case_input_font_size?: number;
          created_at?: string;
          fold_auto_switch?: boolean;
          fold_case_input_font_size?: number;
          fold_fallback_layout?: string;
          fold_guideline_font_size?: number;
          full_name?: string | null;
          fullscreen_mode?: boolean | null;
          guideline_font_size?: number;
          id: string;
          input_layout?: Database["public"]["Enums"]["input_layout"];
          is_admin?: boolean;
          mobile_font_size?: number;
          service_access_status?: string;
          split_ratio?: number;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          case_input_font_size?: number;
          created_at?: string;
          fold_auto_switch?: boolean;
          fold_case_input_font_size?: number;
          fold_fallback_layout?: string;
          fold_guideline_font_size?: number;
          full_name?: string | null;
          fullscreen_mode?: boolean | null;
          guideline_font_size?: number;
          id?: string;
          input_layout?: Database["public"]["Enums"]["input_layout"];
          is_admin?: boolean;
          mobile_font_size?: number;
          service_access_status?: string;
          split_ratio?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      service_access_requests: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          is_admin: boolean | null;
          service_access_status: string | null;
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

// 편의 타입 별칭
export type BedZone = Database["public"]["Enums"]["bed_zone"];
export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type InputLayout = Database["public"]["Enums"]["input_layout"];
export type FoldFallbackLayout = "single" | "split_vertical";

export type Case = Tables<"cases">;
export type CaseInput = Tables<"case_inputs">;
export type CaseResult = Tables<"case_results">;
export type CasePhoto = Tables<"case_photos">;
export type DashboardPhoto = Tables<"dashboard_photos">;
export type Guideline = Tables<"interview_guidelines">;
export type ErrorLog = Tables<"error_logs">;
export type ServiceAccessStatus = string;
