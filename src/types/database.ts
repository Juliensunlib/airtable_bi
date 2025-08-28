export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'user' | 'viewer';
          preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user' | 'viewer';
          preferences?: Record<string, any>;
        };
        Update: {
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user' | 'viewer';
          preferences?: Record<string, any>;
        };
      };
      airtable_connections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          api_key: string;
          base_id: string;
          description: string | null;
          is_active: boolean;
          last_sync: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          api_key: string;
          base_id: string;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          api_key?: string;
          base_id?: string;
          description?: string | null;
          is_active?: boolean;
          last_sync?: string | null;
        };
      };
      dashboards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          layout: any[];
          is_default: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string | null;
          layout?: any[];
          is_default?: boolean;
          is_public?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          layout?: any[];
          is_default?: boolean;
          is_public?: boolean;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string;
          name: string;
          description: string | null;
          type: 'bar' | 'line' | 'pie' | 'doughnut' | 'table' | 'kpi' | 'area' | 'scatter';
          config: Record<string, any>;
          data_cache: any | null;
          cache_expires_at: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          connection_id: string;
          name: string;
          description?: string | null;
          type: 'bar' | 'line' | 'pie' | 'doughnut' | 'table' | 'kpi' | 'area' | 'scatter';
          config: Record<string, any>;
          data_cache?: any | null;
          cache_expires_at?: string | null;
          is_public?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'table' | 'kpi' | 'area' | 'scatter';
          config?: Record<string, any>;
          data_cache?: any | null;
          cache_expires_at?: string | null;
          is_public?: boolean;
        };
      };
      dashboard_reports: {
        Row: {
          id: string;
          dashboard_id: string;
          report_id: string;
          position_x: number;
          position_y: number;
          width: number;
          height: number;
          created_at: string;
        };
        Insert: {
          dashboard_id: string;
          report_id: string;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
        };
        Update: {
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
        };
      };
    };
  };
}