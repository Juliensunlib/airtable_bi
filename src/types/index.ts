export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface AirtableConnection {
  id: string;
  name: string;
  apiKey: string;
  baseId: string;
  lastSync: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  charts: Chart[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chart {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'table' | 'kpi' | 'doughnut' | 'area' | 'scatter' | 'bubble' | 'radar' | 'polar';
  config: ChartConfig;
  data: any;
}

export interface ChartConfig {
  tableId?: string;
  fields?: string[];
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  filters?: Filter[];
  colors?: string[];
  displayOptions?: {
    showValues?: boolean;
    showPercentages?: boolean;
    showLegend?: boolean;
    showGrid?: boolean;
    stacked?: boolean;
    orientation?: 'vertical' | 'horizontal';
    valueFormat?: 'number' | 'currency' | 'percentage' | 'decimal';
    decimalPlaces?: number;
    currencySymbol?: string;
    dateFormat?: string;
  };
  style?: {
    backgroundColor?: string;
    borderRadius?: number;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    padding?: number;
  };
  axis?: {
    xAxis?: {
      title?: string;
      showTitle?: boolean;
      showLabels?: boolean;
      labelRotation?: number;
    };
    yAxis?: {
      title?: string;
      showTitle?: boolean;
      showLabels?: boolean;
      min?: number;
      max?: number;
      stepSize?: number;
    };
  };
}

export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty' | 'between';
  value: any;
  type?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
  additionalData?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface TableColumn {
  field: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  format?: {
    type: string;
    options?: Record<string, any>;
  };
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  align?: 'left' | 'center' | 'right';
}