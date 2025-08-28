export interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'viewer';
  preferences: Record<string, any>;
}

export interface AirtableConnection {
  id: string;
  user_id: string;
  name: string;
  api_key: string;
  base_id: string;
  description?: string;
  is_active: boolean;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  layout: DashboardLayout[];
  is_default: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface Report {
  id: string;
  user_id: string;
  connection_id: string;
  name: string;
  description?: string;
  type: ReportType;
  config: ReportConfig;
  data_cache?: any;
  cache_expires_at?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type ReportType = 'bar' | 'line' | 'pie' | 'doughnut' | 'table' | 'kpi' | 'area' | 'scatter';

export interface ReportConfig {
  table_id?: string;
  table_name?: string;
  fields: string[];
  filters?: Filter[];
  group_by?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  limit?: number;
  chart_options?: ChartOptions;
}

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
  type?: string;
}

export type FilterOperator = 
  | 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' 
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'is_empty' | 'is_not_empty' | 'between';

export interface ChartOptions {
  colors?: string[];
  show_legend?: boolean;
  show_values?: boolean;
  show_grid?: boolean;
  stacked?: boolean;
  responsive?: boolean;
  title?: string;
  x_axis_label?: string;
  y_axis_label?: string;
}

export interface AirtableBase {
  id: string;
  name: string;
  permission_level: string;
}

export interface AirtableTable {
  id: string;
  name: string;
  primary_field_id: string;
  fields?: AirtableField[];
}

export interface AirtableField {
  id: string;
  name: string;
  type: string;
  options?: any;
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  created_time: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}