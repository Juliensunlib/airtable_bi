import { AirtableConnection } from '../types';

const API_BASE_URL = 'https://api.airtable.com/v0';
const META_API_URL = 'https://api.airtable.com/v0/meta';

class AirtableService {
  async getBases(apiKey: string): Promise<any> {
    try {
      const response = await fetch(`${META_API_URL}/bases`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des bases. Vérifiez votre clé API.');
      }

      const data = await response.json();
      return data.bases.map((base: any) => ({
        id: base.id,
        name: base.name
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des bases:', error);
      throw error;
    }
  }

  async getTables(connection: AirtableConnection): Promise<any> {
    try {
      const response = await fetch(`${META_API_URL}/bases/${connection.baseId}/tables`, {
        headers: {
          'Authorization': `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Airtable API Error:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText
        });

        let errorMessage = 'Erreur lors de la récupération des tables. ';
        if (response.status === 403) {
          errorMessage += 'Vérifiez les permissions de votre clé API.';
        } else if (response.status === 404) {
          errorMessage += 'Base introuvable. Vérifiez l\'ID de la base.';
        } else if (response.status === 401) {
          errorMessage += 'Clé API invalide ou expirée.';
        } else {
          errorMessage += `Code d'erreur: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.tables.map((table: any) => ({
        id: table.id,
        name: table.name
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      throw error;
    }
  }

  async getTableSchema(connection: AirtableConnection, tableId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/${connection.baseId}/${tableId}`, {
        headers: {
          'Authorization': `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Airtable API Error:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText
        });

        let errorMessage = 'Erreur lors de la récupération du schéma. ';
        if (response.status === 403) {
          errorMessage += 'Vérifiez les permissions de votre clé API.';
        } else if (response.status === 404) {
          errorMessage += 'Table ou base introuvable.';
        } else if (response.status === 401) {
          errorMessage += 'Clé API invalide ou expirée.';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const sampleRecord = data.records?.[0] || {};
      const fields = Object.keys(sampleRecord.fields || {}).map(fieldName => ({
        id: fieldName,
        name: fieldName,
        type: this.inferFieldType(sampleRecord.fields[fieldName])
      }));

      return fields;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération du schéma:', error);
      throw error;
    }
  }

  private inferFieldType(value: any): string {
    if (value instanceof Date) return 'date';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      // Check if it's an array of attachments (documents/PDFs)
      if (value.length > 0 && typeof value[0] === 'object' && value[0].url && value[0].filename) {
        return 'attachment';
      }
      // Check if it's an array of linked records
      if (value.length > 0 && typeof value[0] === 'object' && value[0].id) {
        return 'linkedRecord';
      }
      return 'multipleSelect';
    }
    if (typeof value === 'object' && value !== null) {
      // Check if it's an attachment (document/PDF)
      if (value.url && value.filename) {
        return 'attachment';
      }
      // Check if it's a linked record
      if (value.id && (value.name || value.title)) {
        return 'linkedRecord';
      }
    }
    if (typeof value === 'string') {
      // Check if string is ISO date format
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'date';
      // Check if string is date format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
    }
    return typeof value;
  }

  private formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private buildDateFilter(operator: string, value: string, field: string): string {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    switch (operator) {
      case 'between':
        const [start, end] = value.split(',').map(d => new Date(d.trim()));
        return `AND({${field}} >= '${this.formatDateToYYYYMMDD(start)}', {${field}} <= '${this.formatDateToYYYYMMDD(end)}')`;
      case 'currentMonth':
        return `AND({${field}} >= '${this.formatDateToYYYYMMDD(startOfMonth)}', {${field}} <= '${this.formatDateToYYYYMMDD(endOfMonth)}')`;
      case 'lastMonth':
        return `AND({${field}} >= '${this.formatDateToYYYYMMDD(startOfLastMonth)}', {${field}} <= '${this.formatDateToYYYYMMDD(endOfLastMonth)}')`;
      case 'currentYear':
        return `AND({${field}} >= '${this.formatDateToYYYYMMDD(startOfYear)}', {${field}} <= '${this.formatDateToYYYYMMDD(endOfYear)}')`;
      case 'last30Days':
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return `AND({${field}} >= '${this.formatDateToYYYYMMDD(thirtyDaysAgo)}', {${field}} <= '${this.formatDateToYYYYMMDD(today)}')`;
      case 'last7Days':
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return `AND({${field}} >= '${this.formatDateToYYYYMMDD(sevenDaysAgo)}', {${field}} <= '${this.formatDateToYYYYMMDD(today)}')`;
      default:
        return '';
    }
  }

  private buildAttachmentFilter(operator: string, value: string, field: string): string {
    const fieldRef = `{${field}}`;
    
    switch (operator) {
      case 'hasAttachment':
        return `LEN(${fieldRef}) > 0`;
      case 'noAttachment':
        return `LEN(${fieldRef}) = 0`;
      case 'filenameContains':
        return `FIND('${value}', CONCATENATE(${fieldRef})) > 0`;
      case 'filenameNotContains':
        return `FIND('${value}', CONCATENATE(${fieldRef})) = 0`;
      case 'fileTypeIs':
        // Check for specific file extensions
        const extension = value.toLowerCase();
        return `FIND('.${extension}', LOWER(CONCATENATE(${fieldRef}))) > 0`;
      case 'isPDF':
        return `FIND('.pdf', LOWER(CONCATENATE(${fieldRef}))) > 0`;
      case 'isNotPDF':
        return `FIND('.pdf', LOWER(CONCATENATE(${fieldRef}))) = 0`;
      default:
        return '';
    }
  }

  // New method to resolve linked record names
  async resolveLinkedRecords(connection: AirtableConnection, tableId: string, recordIds: string[]): Promise<Record<string, string>> {
    try {
      const queryParams = new URLSearchParams();
      recordIds.forEach(id => {
        queryParams.append('records[]', id);
      });

      const response = await fetch(`${API_BASE_URL}/${connection.baseId}/${tableId}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Could not resolve linked records:', response.status);
        return {};
      }

      const data = await response.json();
      const nameMap: Record<string, string> = {};

      data.records.forEach((record: any) => {
        // Try to find a name field (common field names for display)
        const nameField = record.fields.Name || 
                         record.fields.Nom || 
                         record.fields.Title || 
                         record.fields.Titre || 
                         record.fields.Label ||
                         Object.values(record.fields)[0]; // Fallback to first field

        nameMap[record.id] = nameField || record.id;
      });

      return nameMap;
    } catch (error) {
      console.warn('Error resolving linked records:', error);
      return {};
    }
  }

  async getTableData(
    connection: AirtableConnection,
    tableId: string,
    options: {
      fields?: string[];
      filters?: Array<{ field: string; operator: string; value: string; type?: string }>;
      groupBy?: string;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      limit?: number;
    } = {}
  ): Promise<any> {
    try {
      const {
        fields = [],
        filters = [],
        groupBy,
        sortBy,
        sortDirection = 'asc',
        limit = 1000
      } = options;

      const queryParams = new URLSearchParams();
      
      // Fix: Properly format field names for Airtable API
      if (fields.length > 0) {
        fields.forEach(field => {
          queryParams.append('fields[]', field);
        });
      }

      if (limit) {
        queryParams.append('maxRecords', limit.toString());
      }

      if (filters.length > 0) {
        const filterFormulas = filters.map(({ field, operator, value, type }) => {
          if (type === 'date') {
            return this.buildDateFilter(operator, value, field);
          }
          
          if (type === 'attachment') {
            return this.buildAttachmentFilter(operator, value, field);
          }

          const fieldRef = `{${field}}`;
          switch (operator) {
            case 'eq': return `${fieldRef} = '${value}'`;
            case 'neq': return `${fieldRef} != '${value}'`;
            case 'gt': return type === 'number' ? `${fieldRef} > ${value}` : `${fieldRef} > '${value}'`;
            case 'lt': return type === 'number' ? `${fieldRef} < ${value}` : `${fieldRef} < '${value}'`;
            case 'gte': return type === 'number' ? `${fieldRef} >= ${value}` : `${fieldRef} >= '${value}'`;
            case 'lte': return type === 'number' ? `${fieldRef} <= ${value}` : `${fieldRef} <= '${value}'`;
            case 'contains': return `FIND('${value}', ${fieldRef}) > 0`;
            case 'notContains': return `OR(FIND('${value}', ${fieldRef}) = 0, ${fieldRef} = '')`;
            case 'startsWith': return `LEFT(${fieldRef}, ${value.length}) = '${value}'`;
            case 'endsWith': return `RIGHT(${fieldRef}, ${value.length}) = '${value}'`;
            case 'isEmpty': return `OR(${fieldRef} = '', ${fieldRef} = BLANK())`;
            case 'isNotEmpty': return `AND(${fieldRef} != '', ${fieldRef} != BLANK())`;
            default: return '';
          }
        });

        const validFormulas = filterFormulas.filter(Boolean);
        if (validFormulas.length > 0) {
          const filterFormula = validFormulas.length > 1 ? 
            `AND(${validFormulas.join(', ')})` : 
            validFormulas[0];
          queryParams.append('filterByFormula', filterFormula);
          console.log('Applied filter formula:', filterFormula); // Debug
        }
      }

      if (sortBy) {
        queryParams.append('sort[0][field]', sortBy);
        queryParams.append('sort[0][direction]', sortDirection);
      }

      const url = `${API_BASE_URL}/${connection.baseId}/${tableId}?${queryParams.toString()}`;
      console.log('Airtable API URL:', url); // For debugging

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Airtable API Error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          responseBody: errorText
        });
        throw new Error(`Erreur lors de la récupération des données (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Raw data from Airtable:', data); // Debug raw data

      // Process linked records and attachments
      const processedRecords = await Promise.all(
        data.records.map(async (record: any) => {
          const processedFields = { ...record.fields };
          
          // Process each field
          for (const [fieldName, fieldValue] of Object.entries(processedFields)) {
            if (Array.isArray(fieldValue) && fieldValue.length > 0) {
              // Check if it's an array of attachments
              if (fieldValue[0].url && fieldValue[0].filename) {
                // Keep attachment objects as-is for proper rendering
                processedFields[fieldName] = fieldValue;
              }
              // Check if it's an array of record IDs (linked records)
              else if (typeof fieldValue[0] === 'string' && fieldValue[0].startsWith('rec')) {
                try {
                  processedFields[fieldName] = fieldValue.map(id => `Enregistrement ${id.slice(-4)}`);
                } catch (error) {
                  console.warn(`Could not resolve linked records for field ${fieldName}:`, error);
                }
              }
            } else if (typeof fieldValue === 'string' && fieldValue.startsWith('rec')) {
              // Single linked record
              processedFields[fieldName] = `Enregistrement ${fieldValue.slice(-4)}`;
            } else if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.url && fieldValue.filename) {
              // Single attachment - keep as-is
              processedFields[fieldName] = fieldValue;
            }
          }
          
          return {
            ...record,
            fields: processedFields
          };
        })
      );

      console.log('Processed records:', processedRecords); // Debug processed data

      if (groupBy) {
        const grouped = processedRecords.reduce((acc: any, record: any) => {
          let key = record.fields[groupBy];
          
          // Handle date grouping
          if (key && typeof key === 'string' && /^\d{4}-\d{2}-\d{2}/.test(key)) {
            key = key.split('T')[0];
          }
          
          // Handle attachment grouping (group by presence of attachments)
          if (Array.isArray(key) && key.length > 0 && key[0].filename) {
            key = 'Avec documents';
          } else if (Array.isArray(key) && key.length === 0) {
            key = 'Sans documents';
          }
          
          // Handle null/undefined keys
          if (key === null || key === undefined || key === '') {
            key = 'Non défini';
          }
          
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(record);
          return acc;
        }, {});

        console.log('Grouped data:', grouped); // Debug grouped data

        return {
          records: Object.entries(grouped).map(([key, records]) => ({
            groupKey: key,
            records
          }))
        };
      }

      return {
        ...data,
        records: processedRecords
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  }

  async createConnection(name: string, apiKey: string, baseId: string): Promise<AirtableConnection> {
    try {
      await this.getBases(apiKey);
      
      const newConnection: AirtableConnection = {
        id: `conn_${Date.now()}`,
        name,
        apiKey,
        baseId,
        lastSync: new Date()
      };
      
      const connections = this.getStoredConnections();
      connections.push(newConnection);
      localStorage.setItem('airtableConnections', JSON.stringify(connections));
      
      return newConnection;
    } catch (error) {
      console.error('Erreur lors de la création de la connexion:', error);
      throw new Error('Impossible de créer la connexion. Vérifiez vos informations.');
    }
  }

  getStoredConnections(): AirtableConnection[] {
    try {
      const stored = localStorage.getItem('airtableConnections');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des connexions:', error);
      return [];
    }
  }
}

export default new AirtableService();