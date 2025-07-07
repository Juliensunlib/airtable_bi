import React, { useState, useEffect } from 'react';
import { BarChart4, Table as TableIcon, PieChart, Activity, Save, Filter, Calendar, BarChartIcon as ChartIcon, Search, FileText } from 'lucide-react';
import airtableService from '../../services/airtableService';
import { AirtableConnection, Chart, TableColumn } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReportBuilderProps {
  onSave: (report: Chart) => void;
  onCancel: () => void;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({ onSave, onCancel }) => {
  const [connections, setConnections] = useState<AirtableConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [fields, setFields] = useState<any[]>([]);
  const [fieldSearch, setFieldSearch] = useState('');
  const [chartType, setChartType] = useState<Chart['type']>('bar');
  const [chartTitle, setChartTitle] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<Array<{ field: string; operator: string; value: string; type?: string }>>([]);
  const [groupBy, setGroupBy] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [displayOptions, setDisplayOptions] = useState({
    showValues: true,
    showPercentages: false,
    showLegend: true,
    showGrid: true,
    stacked: false,
    orientation: 'vertical',
    valueFormat: 'number',
    decimalPlaces: 2,
    currencySymbol: '€'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedConnections = airtableService.getStoredConnections();
    setConnections(storedConnections);
  }, []);

  const loadTables = async (connectionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const connection = connections.find(c => c.id === connectionId);
      if (connection) {
        const tablesData = await airtableService.getTables(connection);
        setTables(tablesData);
      }
    } catch (err: any) {
      setError(err.message || "Impossible de charger les tables");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFields = async (tableId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const connection = connections.find(c => c.id === selectedConnection);
      if (connection) {
        const tableData = await airtableService.getTableData(connection, tableId);
        if (tableData.records.length > 0) {
          const fieldTypes = await airtableService.getTableSchema(connection, tableId);
          setFields(fieldTypes);
        }
      }
    } catch (err: any) {
      setError(err.message || "Impossible de charger les champs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionChange = (connectionId: string) => {
    setSelectedConnection(connectionId);
    setSelectedTable('');
    setFields([]);
    loadTables(connectionId);
  };

  const handleTableChange = (tableId: string) => {
    setSelectedTable(tableId);
    setSelectedFields([]);
    setFilters([]);
    setGroupBy('');
    setSortBy('');
    loadFields(tableId);
  };

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'eq', value: '', type: 'string' }]);
  };

  const updateFilter = (index: number, field: string, value: string) => {
    const newFilters = [...filters];
    if (field === 'field') {
      const fieldType = fields.find(f => f.name === value)?.type || 'string';
      newFilters[index] = { 
        ...newFilters[index], 
        [field]: value,
        type: fieldType,
        operator: getDefaultOperatorForType(fieldType),
        value: ''
      };
    } else {
      newFilters[index] = { ...newFilters[index], [field]: value };
    }
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const getDefaultOperatorForType = (type: string) => {
    switch (type) {
      case 'date':
        return 'currentMonth';
      case 'attachment':
        return 'hasAttachment';
      case 'number':
        return 'eq';
      default:
        return 'eq';
    }
  };

  const getOperatorOptions = (type: string) => {
    if (type === 'date') {
      return [
        { value: 'currentMonth', label: 'Mois en cours' },
        { value: 'lastMonth', label: 'Mois précédent' },
        { value: 'currentYear', label: 'Année en cours' },
        { value: 'last30Days', label: 'Derniers 30 jours' },
        { value: 'last7Days', label: 'Derniers 7 jours' },
        { value: 'between', label: 'Entre deux dates' }
      ];
    }

    if (type === 'attachment') {
      return [
        { value: 'hasAttachment', label: 'a des documents' },
        { value: 'noAttachment', label: 'n\'a pas de documents' },
        { value: 'filenameContains', label: 'nom de fichier contient' },
        { value: 'filenameNotContains', label: 'nom de fichier ne contient pas' },
        { value: 'fileTypeIs', label: 'type de fichier est' },
        { value: 'isPDF', label: 'est un PDF' },
        { value: 'isNotPDF', label: 'n\'est pas un PDF' }
      ];
    }

    if (type === 'number') {
      return [
        { value: 'eq', label: 'égal à' },
        { value: 'neq', label: 'différent de' },
        { value: 'gt', label: 'supérieur à' },
        { value: 'lt', label: 'inférieur à' },
        { value: 'gte', label: 'supérieur ou égal à' },
        { value: 'lte', label: 'inférieur ou égal à' },
        { value: 'between', label: 'entre' }
      ];
    }

    return [
      { value: 'eq', label: 'égal à' },
      { value: 'neq', label: 'différent de' },
      { value: 'contains', label: 'contient' },
      { value: 'notContains', label: 'ne contient pas' },
      { value: 'startsWith', label: 'commence par' },
      { value: 'endsWith', label: 'finit par' },
      { value: 'isEmpty', label: 'est vide' },
      { value: 'isNotEmpty', label: 'n\'est pas vide' }
    ];
  };

  const needsValueInput = (operator: string, type: string) => {
    if (type === 'attachment') {
      return ['filenameContains', 'filenameNotContains', 'fileTypeIs'].includes(operator);
    }
    if (type === 'date') {
      return operator === 'between';
    }
    return !['isEmpty', 'isNotEmpty', 'hasAttachment', 'noAttachment', 'isPDF', 'isNotPDF', 'currentMonth', 'lastMonth', 'currentYear', 'last30Days', 'last7Days'].includes(operator);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chartTitle || !selectedTable || selectedFields.length === 0) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoading(true);
    try {
      const connection = connections.find(c => c.id === selectedConnection);
      if (!connection) throw new Error("Connexion non trouvée");

      const config = {
        tableId: selectedTable,
        fields: selectedFields,
        filters,
        groupBy,
        sortBy,
        sortDirection,
        displayOptions,
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
        axis: {
          xAxis: {
            showTitle: true,
            showLabels: true,
            labelRotation: 0
          },
          yAxis: {
            showTitle: true,
            showLabels: true,
            min: undefined,
            max: undefined,
            stepSize: undefined
          }
        }
      };

      console.log('Fetching data with config:', config); // Debug

      const rawData = await airtableService.getTableData(connection, selectedTable, {
        fields: selectedFields,
        filters,
        groupBy,
        sortBy,
        sortDirection
      });

      console.log('Raw data received:', rawData); // Debug

      const chartData = transformDataForChart(rawData, chartType, selectedFields, groupBy);
      console.log('Transformed chart data:', chartData); // Debug

      const newChart: Chart = {
        id: `chart_${Date.now()}`,
        title: chartTitle,
        type: chartType,
        config,
        data: chartData
      };

      onSave(newChart);
    } catch (err: any) {
      console.error('Error creating report:', err);
      setError(err.message || "Erreur lors de la création du rapport");
    } finally {
      setIsLoading(false);
    }
  };

  const transformDataForChart = (rawData: any, type: Chart['type'], fields: string[], groupByField?: string) => {
    console.log('Transforming data:', { rawData, type, fields, groupByField }); // Debug

    if (!rawData.records || rawData.records.length === 0) {
      console.log('No records found in raw data');
      return null;
    }

    switch (type) {
      case 'table':
        const columns: TableColumn[] = fields.map(field => ({
          field,
          header: field,
          type: inferColumnType(rawData.records[0].fields[field]),
          sortable: true,
          filterable: true
        }));

        return {
          columns,
          rows: rawData.records.map((record: any) => record.fields)
        };

      case 'kpi':
        const kpiField = fields[0];
        const values = rawData.records.map((record: any) => record.fields[kpiField]);
        const numericValues = values.filter((v: any) => typeof v === 'number');
        const total = numericValues.reduce((sum: number, val: number) => sum + val, 0);
        
        const previousTotal = total * 0.9;
        const trend = ((total - previousTotal) / previousTotal) * 100;

        return {
          value: total,
          label: kpiField,
          trend: Number(trend.toFixed(1))
        };

      default:
        if (groupByField) {
          console.log('Processing grouped data for chart');
          
          // Handle grouped data (from groupBy parameter)
          if (rawData.records[0] && rawData.records[0].groupKey !== undefined) {
            const groupedData: Record<string, number> = {};
            
            rawData.records.forEach((group: any) => {
              const key = group.groupKey;
              const count = group.records.length;
              groupedData[key] = count;
            });

            console.log('Grouped data result:', groupedData);

            return {
              labels: Object.keys(groupedData),
              datasets: [{
                label: 'Nombre d\'enregistrements',
                data: Object.values(groupedData)
              }]
            };
          } else {
            // Manual grouping if not already grouped
            const groupedData = groupDataByField(rawData.records, groupByField, fields[0]);
            console.log('Manual grouped data:', groupedData);

            return {
              labels: Object.keys(groupedData),
              datasets: [{
                label: fields[0] || 'Valeur',
                data: Object.values(groupedData)
              }]
            };
          }
        } else {
          // No grouping - use raw data
          console.log('Processing ungrouped data for chart');
          
          const labels = rawData.records.map((record: any) => {
            const value = record.fields[fields[0]];
            // Handle date formatting for labels
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
              return value.split('T')[0]; // Extract date part
            }
            return value || 'Non défini';
          });

          const data = rawData.records.map((record: any) => {
            const value = record.fields[fields[1] || fields[0]];
            return typeof value === 'number' ? value : 1; // Count if not numeric
          });

          return {
            labels,
            datasets: [{
              label: fields[1] || fields[0] || 'Valeur',
              data
            }]
          };
        }
    }
  };

  const inferColumnType = (value: any): TableColumn['type'] => {
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
      if (/^[€$]/.test(value)) return 'currency';
      if (value.endsWith('%')) return 'percentage';
    }
    return 'text';
  };

  const groupDataByField = (records: any[], groupField: string, valueField: string) => {
    console.log('Manual grouping by field:', { groupField, valueField, recordsCount: records.length });
    
    return records.reduce((acc: any, record: any) => {
      let key = record.fields[groupField];
      
      // Handle date grouping
      if (key && typeof key === 'string' && /^\d{4}-\d{2}-\d{2}/.test(key)) {
        key = key.split('T')[0]; // Extract date part
      }
      
      // Handle attachment grouping
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
        acc[key] = 0;
      }
      
      const value = record.fields[valueField];
      acc[key] += typeof value === 'number' ? value : 1;
      return acc;
    }, {});
  };

  const filteredFields = fields.filter(field => 
    field.name.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  const chartTypes = [
    { type: 'bar', icon: BarChart4, label: 'Graphique en barres' },
    { type: 'line', icon: Activity, label: 'Graphique en ligne' },
    { type: 'pie', icon: PieChart, label: 'Graphique circulaire' },
    { type: 'doughnut', icon: ChartIcon, label: 'Graphique en anneau' },
    { type: 'table', icon: TableIcon, label: 'Tableau' },
    { type: 'kpi', icon: ChartIcon, label: 'Indicateur clé' },
  ];

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'date':
        return <Calendar className="inline-block ml-1 h-4 w-4 text-gray-400" />;
      case 'attachment':
        return <FileText className="inline-block ml-1 h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Créer un nouveau rapport</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre du rapport
          </label>
          <input
            type="text"
            value={chartTitle}
            onChange={(e) => setChartTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Entrez un titre"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Connexion Airtable
          </label>
          <select
            value={selectedConnection}
            onChange={(e) => handleConnectionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionnez une connexion</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>{conn.name}</option>
            ))}
          </select>
        </div>

        {tables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionnez une table</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>{table.name}</option>
              ))}
            </select>
          </div>
        )}

        {fields.length > 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Champs à afficher
              </label>
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Rechercher un champ..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {filteredFields.map((field) => (
                  <label key={field.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, field.name]);
                        } else {
                          setSelectedFields(selectedFields.filter(f => f !== field.name));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {field.name}
                      {getFieldIcon(field.type)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Filtres
                </label>
                <button
                  type="button"
                  onClick={addFilter}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Ajouter un filtre
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(index, 'field', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner un champ</option>
                      {fields.map((field) => (
                        <option key={field.id} value={field.name}>
                          {field.name} {field.type === 'attachment' ? '📎' : field.type === 'date' ? '📅' : ''}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                      className="w-48 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {getOperatorOptions(filter.type || 'string').map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    {needsValueInput(filter.operator, filter.type || 'string') && (
                      <>
                        {filter.type === 'date' && filter.operator === 'between' ? (
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="date"
                              value={filter.value.split(',')[0] || ''}
                              onChange={(e) => {
                                const [, endDate] = filter.value.split(',');
                                updateFilter(index, 'value', `${e.target.value},${endDate || ''}`);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="date"
                              value={filter.value.split(',')[1] || ''}
                              onChange={(e) => {
                                const [startDate] = filter.value.split(',');
                                updateFilter(index, 'value', `${startDate || ''},${e.target.value}`);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        ) : filter.type === 'attachment' && filter.operator === 'fileTypeIs' ? (
                          <select
                            value={filter.value}
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Sélectionner un type</option>
                            <option value="pdf">PDF</option>
                            <option value="doc">Word</option>
                            <option value="docx">Word (nouveau)</option>
                            <option value="xls">Excel</option>
                            <option value="xlsx">Excel (nouveau)</option>
                            <option value="jpg">Image JPEG</option>
                            <option value="png">Image PNG</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder={filter.type === 'attachment' ? 'Nom de fichier...' : 'Valeur'}
                          />
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFilter(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grouper par
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Aucun groupement</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.name}>
                    {field.name} {field.type === 'attachment' ? '📎' : field.type === 'date' ? '📅' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trier par
              </label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Aucun tri</option>
                  {fields.map((field) => (
                    <option key={field.id} value={field.name}>{field.name}</option>
                  ))}
                </select>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="asc">Croissant</option>
                  <option value="desc">Décroissant</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options d'affichage
              </label>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={displayOptions.showValues}
                    onChange={(e) => setDisplayOptions({...displayOptions, showValues: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Afficher les valeurs</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={displayOptions.showPercentages}
                    onChange={(e) => setDisplayOptions({...displayOptions, showPercentages: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Afficher les pourcentages</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={displayOptions.showLegend}
                    onChange={(e) => setDisplayOptions({...displayOptions, showLegend: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Afficher la légende</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={displayOptions.showGrid}
                    onChange={(e) => setDisplayOptions({...displayOptions, showGrid: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Afficher la grille</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={displayOptions.stacked}
                    onChange={(e) => setDisplayOptions({...displayOptions, stacked: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Empiler les données</label>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Format des valeurs</label>
                  <select
                    value={displayOptions.valueFormat}
                    onChange={(e) => setDisplayOptions({...displayOptions, valueFormat: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="number">Nombre</option>
                    <option value="currency">Monnaie</option>
                    <option value="percentage">Pourcentage</option>
                    <option value="decimal">Décimal</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de visualisation
          </label>
          <div className="grid grid-cols-2 gap-4">
            {chartTypes.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setChartType(type as Chart['type'])}
                className={`flex items-center p-3 border rounded-lg transition-colors duration-200 ${
                  chartType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors duration-200 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Création...' : 'Créer le rapport'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportBuilder;