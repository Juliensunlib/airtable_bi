import type { AirtableConnection, AirtableBase, AirtableTable, AirtableRecord, Filter } from '../types';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_META_API = 'https://api.airtable.com/v0/meta';

class AirtableService {
  private async makeRequest(url: string, apiKey: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async testConnection(apiKey: string): Promise<boolean> {
    try {
      await this.makeRequest(`${AIRTABLE_META_API}/bases`, apiKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getBases(apiKey: string): Promise<AirtableBase[]> {
    const data = await this.makeRequest(`${AIRTABLE_META_API}/bases`, apiKey);
    return data.bases || [];
  }

  async getTables(connection: AirtableConnection): Promise<AirtableTable[]> {
    const data = await this.makeRequest(
      `${AIRTABLE_META_API}/bases/${connection.base_id}/tables`,
      connection.api_key
    );
    return data.tables || [];
  }

  async getTableSchema(connection: AirtableConnection, tableId: string): Promise<AirtableTable> {
    const data = await this.makeRequest(
      `${AIRTABLE_META_API}/bases/${connection.base_id}/tables/${tableId}`,
      connection.api_key
    );
    return data;
  }

  async getRecords(
    connection: AirtableConnection,
    tableId: string,
    options: {
      fields?: string[];
      filters?: Filter[];
      sort?: { field: string; direction: 'asc' | 'desc' }[];
      maxRecords?: number;
      offset?: string;
    } = {}
  ): Promise<{ records: AirtableRecord[]; offset?: string }> {
    const params = new URLSearchParams();

    if (options.fields?.length) {
      options.fields.forEach(field => params.append('fields[]', field));
    }

    if (options.maxRecords) {
      params.append('maxRecords', options.maxRecords.toString());
    }

    if (options.offset) {
      params.append('offset', options.offset);
    }

    if (options.sort?.length) {
      options.sort.forEach((sort, index) => {
        params.append(`sort[${index}][field]`, sort.field);
        params.append(`sort[${index}][direction]`, sort.direction);
      });
    }

    if (options.filters?.length) {
      const filterFormula = this.buildFilterFormula(options.filters);
      if (filterFormula) {
        params.append('filterByFormula', filterFormula);
      }
    }

    const url = `${AIRTABLE_API_BASE}/${connection.base_id}/${tableId}?${params.toString()}`;
    const data = await this.makeRequest(url, connection.api_key);

    return {
      records: data.records || [],
      offset: data.offset
    };
  }

  private buildFilterFormula(filters: Filter[]): string {
    const formulas = filters.map(filter => {
      const field = `{${filter.field}}`;
      const value = typeof filter.value === 'string' ? `'${filter.value}'` : filter.value;

      switch (filter.operator) {
        case 'eq':
          return `${field} = ${value}`;
        case 'neq':
          return `${field} != ${value}`;
        case 'gt':
          return `${field} > ${value}`;
        case 'lt':
          return `${field} < ${value}`;
        case 'gte':
          return `${field} >= ${value}`;
        case 'lte':
          return `${field} <= ${value}`;
        case 'contains':
          return `FIND(${value}, ${field}) > 0`;
        case 'not_contains':
          return `FIND(${value}, ${field}) = 0`;
        case 'starts_with':
          return `LEFT(${field}, ${filter.value.length}) = ${value}`;
        case 'ends_with':
          return `RIGHT(${field}, ${filter.value.length}) = ${value}`;
        case 'is_empty':
          return `OR(${field} = '', ${field} = BLANK())`;
        case 'is_not_empty':
          return `AND(${field} != '', ${field} != BLANK())`;
        case 'between':
          const [start, end] = filter.value;
          return `AND(${field} >= ${start}, ${field} <= ${end})`;
        default:
          return '';
      }
    }).filter(Boolean);

    if (formulas.length === 0) return '';
    if (formulas.length === 1) return formulas[0];
    return `AND(${formulas.join(', ')})`;
  }

  async getAllRecords(
    connection: AirtableConnection,
    tableId: string,
    options: Parameters<typeof this.getRecords>[2] = {}
  ): Promise<AirtableRecord[]> {
    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const result = await this.getRecords(connection, tableId, {
        ...options,
        offset,
        maxRecords: 100 // Airtable limit
      });

      allRecords.push(...result.records);
      offset = result.offset;
    } while (offset);

    return allRecords;
  }
}

export const airtableService = new AirtableService();