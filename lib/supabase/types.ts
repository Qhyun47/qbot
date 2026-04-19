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
          hpi_draft: string;
          hpi_edited: string | null;
          id: string;
          model_version: string;
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
          hpi_draft: string;
          hpi_edited?: string | null;
          id?: string;
          model_version: string;
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
          hpi_draft?: string;
          hpi_edited?: string | null;
          id?: string;
          model_version?: string;
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
          cc: string | null;
          cc_has_template: boolean;
          created_at: string;
          current_result_id: string | null;
          id: string;
          status: Database["public"]["Enums"]["case_status"];
          template_key: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bed_number?: number;
          bed_zone?: Database["public"]["Enums"]["bed_zone"];
          cc?: string | null;
          cc_has_template?: boolean;
          created_at?: string;
          current_result_id?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["case_status"];
          template_key?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bed_number?: number;
          bed_zone?: Database["public"]["Enums"]["bed_zone"];
          cc?: string | null;
          cc_has_template?: boolean;
          created_at?: string;
          current_result_id?: string | null;
          id?: string;
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
          cc: string;
          content: string;
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          cc: string;
          content: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          cc?: string;
          content?: string;
          created_at?: string;
          id?: string;
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
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          input_layout: Database["public"]["Enums"]["input_layout"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          input_layout?: Database["public"]["Enums"]["input_layout"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          input_layout?: Database["public"]["Enums"]["input_layout"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
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

// 편의 타입 — enum
export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type BedZone = Database["public"]["Enums"]["bed_zone"];
export type InputLayout = Database["public"]["Enums"]["input_layout"];
