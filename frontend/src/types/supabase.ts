// Database types for Supabase tables
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          google_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          google_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          google_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      personas: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          config: Record<string, any>;
          style_settings: Record<string, any>;
          tech_interests: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          config?: Record<string, any>;
          style_settings?: Record<string, any>;
          tech_interests?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          config?: Record<string, any>;
          style_settings?: Record<string, any>;
          tech_interests?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      generated_posts: {
        Row: {
          id: string;
          user_id: string;
          persona_id: string | null;
          content: string;
          metadata: Record<string, any>;
          source_content_ids: string[];
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          persona_id?: string | null;
          content: string;
          metadata?: Record<string, any>;
          source_content_ids?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          persona_id?: string | null;
          content?: string;
          metadata?: Record<string, any>;
          source_content_ids?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_sources: {
        Row: {
          id: string;
          user_id: string;
          source_type: string;
          name: string;
          url: string;
          config: Record<string, any>;
          last_fetched_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: string;
          name: string;
          url: string;
          config?: Record<string, any>;
          last_fetched_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: string;
          name?: string;
          url?: string;
          config?: Record<string, any>;
          last_fetched_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      content_embeddings: {
        Row: {
          id: string;
          user_id: string;
          chunk_id: string;
          embedding: number[];
          model_name: string;
          similarity_threshold: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chunk_id: string;
          embedding: number[];
          model_name?: string;
          similarity_threshold?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          chunk_id?: string;
          embedding?: number[];
          model_name?: string;
          similarity_threshold?: number;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          ai_settings: Record<string, any>;
          notification_settings: Record<string, any>;
          generation_settings: Record<string, any>;
          privacy_settings: Record<string, any>;
          resource_limits: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          ai_settings?: Record<string, any>;
          notification_settings?: Record<string, any>;
          generation_settings?: Record<string, any>;
          privacy_settings?: Record<string, any>;
          resource_limits?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          ai_settings?: Record<string, any>;
          notification_settings?: Record<string, any>;
          generation_settings?: Record<string, any>;
          privacy_settings?: Record<string, any>;
          resource_limits?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          api_provider: string;
          operation: string;
          input_tokens: number;
          output_tokens: number;
          cost_usd: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          api_provider: string;
          operation: string;
          input_tokens?: number;
          output_tokens?: number;
          cost_usd?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          api_provider?: string;
          operation?: string;
          input_tokens?: number;
          output_tokens?: number;
          cost_usd?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_user_content: {
        Args: {
          target_user_id: string;
          query_vector: number[];
          similarity_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          content: string;
          similarity: number;
          metadata: Record<string, any>;
        }[];
      };
      get_user_rag_metrics: {
        Args: {
          target_user_id: string;
          start_date?: string;
          end_date?: string;
        };
        Returns: {
          total_queries: number;
          avg_similarity: number;
          content_sources: number;
          quality_score: number;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Utility types for better type safety
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Persona = Database['public']['Tables']['personas']['Row'];
export type PersonaInsert = Database['public']['Tables']['personas']['Insert'];
export type PersonaUpdate = Database['public']['Tables']['personas']['Update'];

export type GeneratedPost =
  Database['public']['Tables']['generated_posts']['Row'];
export type GeneratedPostInsert =
  Database['public']['Tables']['generated_posts']['Insert'];
export type GeneratedPostUpdate =
  Database['public']['Tables']['generated_posts']['Update'];

export type ContentSource =
  Database['public']['Tables']['content_sources']['Row'];
export type ContentSourceInsert =
  Database['public']['Tables']['content_sources']['Insert'];
export type ContentSourceUpdate =
  Database['public']['Tables']['content_sources']['Update'];

export type ContentEmbedding =
  Database['public']['Tables']['content_embeddings']['Row'];
export type ContentEmbeddingInsert =
  Database['public']['Tables']['content_embeddings']['Insert'];
export type ContentEmbeddingUpdate =
  Database['public']['Tables']['content_embeddings']['Update'];

export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserSettingsInsert =
  Database['public']['Tables']['user_settings']['Insert'];
export type UserSettingsUpdate =
  Database['public']['Tables']['user_settings']['Update'];

export type ApiUsageLog = Database['public']['Tables']['api_usage_logs']['Row'];
export type ApiUsageLogInsert =
  Database['public']['Tables']['api_usage_logs']['Insert'];
export type ApiUsageLogUpdate =
  Database['public']['Tables']['api_usage_logs']['Update'];

// Function types
export type UserContentSearchResult =
  Database['public']['Functions']['search_user_content']['Returns'][0];
export type UserRAGMetrics =
  Database['public']['Functions']['get_user_rag_metrics']['Returns'];

// Common enums
export type PostStatus = 'draft' | 'published' | 'archived';
export type SourceType = 'github' | 'rss' | 'news';
export type ApiProvider = 'openai' | 'github' | 'rss';
