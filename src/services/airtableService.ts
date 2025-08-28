import type { AirtableConnection, AirtableBase, AirtableTable, AirtableRecord, Filter } from '../types';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_META_API = 'https://api.airtable.com/v0/meta';

// Configuration automatique avec les variables d'environnement
const DEFAULT_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const DEFAULT_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

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
      const errorText = await response.text();
      let errorMessage = `Erreur API Airtable (${response.status})`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Méthode pour obtenir la clé API par défaut
  getDefaultApiKey(): string | null {
    return DEFAULT_API_KEY || null;
  }

  // Méthode pour obtenir l'ID de base par défaut
  getDefaultBaseId(): string | null {
    return DEFAULT_BASE_ID || null;
  }

  // Méthode pour tester la connexion avec les paramètres par défaut
  async testDefaultConnection(): Promise<{ success: boolean; message: string; bases?: AirtableBase[] }> {
    if (!DEFAULT_API_KEY) {
      return { success: false, message: 'Clé API Airtable non configurée' };
    }

    try {
      const bases = await this.getBases(DEFAULT_API_KEY);
      return { 
        success: true, 
        message: `Connexion réussie - ${bases.length} base(s) trouvée(s)`,
        bases 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Impossible de se connecter à Airtable' 
      };
    }
  }

  async testConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest(`${AIRTABLE_META_API}/bases`, apiKey);
      return { success: true, message: 'Connexion réussie' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Impossible de se connecter à Airtable' 
      };
    }
  }

  async getBases(apiKey: string): Promise<AirtableBase[]> {
    try {
      const data = await this.makeRequest(`${AIRTABLE_META_API}/bases`, apiKey);
      return data.bases || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des bases:', error);
      return [];
    }
  }

  async getTables(connection: AirtableConnection): Promise<AirtableTable[]> {
    try {
      const data = await this.makeRequest(
        `${AIRTABLE_META_API}/bases/${connection.base_id}/tables`,
        connection.api_key
      );
      return data.tables || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      return [];
    }
  }

  async getTableSchema(connection: AirtableConnection, tableId: string): Promise<AirtableTable | null> {
    try {
      const data = await this.makeRequest(
        `${AIRTABLE_META_API}/bases/${connection.base_id}/tables/${tableId}`,
        connection.api_key
      );
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du schéma:', error);
      return null;
    }
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
    try {
      const params = new URLSearchParams();

      if (options.fields?.length) {
        options.fields.forEach(field => params.append('fields[]', field));
      }

      if (options.maxRecords) {
        params.append('maxRecords', Math.min(options.maxRecords, 100).toString());
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
    } catch (error) {
      console.error('Erreur lors de la récupération des enregistrements:', error);
      return { records: [] };
    }
  }

  private buildFilterFormula(filters: Filter[]): string {
    const formulas = filters.map(filter => {
      const field = `{${filter.field}}`;
      const value = typeof filter.value === 'string' ? `'${filter.value.replace(/'/g, "\\'")}'` : filter.value;

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
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            const [start, end] = filter.value;
            return `AND(${field} >= ${start}, ${field} <= ${end})`;
          }
          return '';
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
    let attempts = 0;
    const maxAttempts = 50; // Limite de sécurité

    do {
      if (attempts >= maxAttempts) {
        console.warn('Limite d\'attempts atteinte pour getAllRecords');
        break;
      }

      const result = await this.getRecords(connection, tableId, {
        ...options,
        offset,
        maxRecords: 100 // Limite Airtable
      });

      allRecords.push(...result.records);
      offset = result.offset;
      attempts++;

      // Petite pause pour éviter les limites de taux
      if (offset) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } while (offset);

    return allRecords;
  }

  // Méthode utilitaire pour transformer les données Airtable en format Chart.js
  transformDataForChart(
    records: AirtableRecord[],
    labelField: string,
    valueField: string,
    chartType: string = 'bar'
  ) {
    const dataMap = new Map<string, number>();

    records.forEach(record => {
      const label = String(record.fields[labelField] || 'Sans nom');
      const value = Number(record.fields[valueField]) || 0;
      
      if (dataMap.has(label)) {
        dataMap.set(label, dataMap.get(label)! + value);
      } else {
        dataMap.set(label, value);
      }
    });

    const labels = Array.from(dataMap.keys());
    const data = Array.from(dataMap.values());

    const colors = this.generateColors(labels.length);

    return {
      labels,
      datasets: [{
        label: valueField,
        data,
        backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? colors : colors[0],
        borderColor: chartType === 'pie' || chartType === 'doughnut' ? colors.map(c => c.replace('0.8', '1')) : colors[0].replace('0.8', '1'),
        borderWidth: 1
      }]
    };
  }

  private generateColors(count: number): string[] {
    const baseColors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(245, 158, 11, 0.8)',   // Yellow
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(14, 165, 233, 0.8)',   // Sky
      'rgba(34, 197, 94, 0.8)',    // Emerald
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }
}

export const airtableService = new AirtableService();