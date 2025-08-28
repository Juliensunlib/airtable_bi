import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { airtableService } from '../../services/airtableService';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table, 
  TrendingUp,
  Save,
  X,
  Loader2,
  Settings,
  Eye,
  Filter
} from 'lucide-react';
import type { AirtableConnection, AirtableTable, Report, ReportConfig, Filter as FilterType } from '../../types';
import toast from 'react-hot-toast';
import ChartPreview from './ChartPreview';

interface ReportBuilderProps {
  onClose: () => void;
  onSave: (report: Report) => void;
  editingReport?: Report | null;
}

const CHART_TYPES = [
  { type: 'bar', name: 'Graphique en barres', icon: BarChart3, description: 'Comparer des valeurs' },
  { type: 'line', name: 'Graphique linéaire', icon: LineChart, description: 'Évolution dans le temps' },
  { type: 'pie', name: 'Graphique circulaire', icon: PieChart, description: 'Répartition des données' },
  { type: 'doughnut', name: 'Graphique en anneau', icon: PieChart, description: 'Répartition avec centre vide' },
  { type: 'area', name: 'Graphique en aires', icon: TrendingUp, description: 'Évolution avec surface' },
  { type: 'table', name: 'Tableau', icon: Table, description: 'Données tabulaires' },
  { type: 'kpi', name: 'Indicateur KPI', icon: TrendingUp, description: 'Métrique unique' }
];

const FILTER_OPERATORS = [
  { value: 'eq', label: 'Égal à' },
  { value: 'neq', label: 'Différent de' },
  { value: 'gt', label: 'Supérieur à' },
  { value: 'lt', label: 'Inférieur à' },
  { value: 'gte', label: 'Supérieur ou égal à' },
  { value: 'lte', label: 'Inférieur ou égal à' },
  { value: 'contains', label: 'Contient' },
  { value: 'not_contains', label: 'Ne contient pas' },
  { value: 'starts_with', label: 'Commence par' },
  { value: 'ends_with', label: 'Se termine par' },
  { value: 'is_empty', label: 'Est vide' },
  { value: 'is_not_empty', label: 'N\'est pas vide' }
];

export default function ReportBuilder({ onClose, onSave, editingReport }: ReportBuilderProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<AirtableConnection[]>([]);
  const [tables, setTables] = useState<AirtableTable[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<AirtableConnection | null>(null);
  const [selectedTable, setSelectedTable] = useState<AirtableTable | null>(null);
  
  const [reportData, setReportData] = useState({
    name: editingReport?.name || '',
    description: editingReport?.description || '',
    type: editingReport?.type || 'bar',
    config: editingReport?.config || {
      fields: [],
      filters: [],
      group_by: '',
      sort_by: '',
      sort_direction: 'asc',
      limit: 100,
      chart_options: {
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        show_legend: true,
        show_values: false,
        show_grid: true,
        stacked: false,
        responsive: true
      }
    } as ReportConfig
  });

  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      loadTables();
    }
  }, [selectedConnection]);

  const loadConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('airtable_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des connexions:', error);
      toast.error('Erreur lors du chargement des connexions');
    }
  };

  const loadTables = async () => {
    if (!selectedConnection) return;

    try {
      setLoading(true);
      const tablesData = await airtableService.getTables(selectedConnection);
      setTables(tablesData);
    } catch (error) {
      console.error('Erreur lors du chargement des tables:', error);
      toast.error('Erreur lors du chargement des tables');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    if (!selectedConnection || !selectedTable || !reportData.config.fields.length) return;

    try {
      setLoadingPreview(true);
      const records = await airtableService.getRecords(selectedConnection, selectedTable.id, {
        fields: reportData.config.fields,
        filters: reportData.config.filters,
        maxRecords: reportData.config.limit || 100
      });

      if (records.records.length > 0 && reportData.config.fields.length >= 2) {
        const chartData = airtableService.transformDataForChart(
          records.records,
          reportData.config.fields[0],
          reportData.config.fields[1],
          reportData.type
        );
        setPreviewData(chartData);
      } else {
        setPreviewData(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'aperçu:', error);
      toast.error('Erreur lors du chargement de l\'aperçu');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!user || !selectedConnection || !selectedTable) return;

    try {
      setLoading(true);

      const reportPayload = {
        user_id: user.id,
        connection_id: selectedConnection.id,
        name: reportData.name,
        description: reportData.description,
        type: reportData.type,
        config: {
          ...reportData.config,
          table_id: selectedTable.id,
          table_name: selectedTable.name
        }
      };

      let result;
      if (editingReport) {
        result = await supabase
          .from('reports')
          .update(reportPayload)
          .eq('id', editingReport.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('reports')
          .insert(reportPayload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(editingReport ? 'Rapport mis à jour !' : 'Rapport créé !');
      onSave(result.data);
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => {
    setReportData({
      ...reportData,
      config: {
        ...reportData.config,
        filters: [
          ...reportData.config.filters || [],
          { field: '', operator: 'eq', value: '' }
        ]
      }
    });
  };

  const updateFilter = (index: number, filter: Partial<FilterType>) => {
    const newFilters = [...(reportData.config.filters || [])];
    newFilters[index] = { ...newFilters[index], ...filter };
    setReportData({
      ...reportData,
      config: {
        ...reportData.config,
        filters: newFilters
      }
    });
  };

  const removeFilter = (index: number) => {
    const newFilters = [...(reportData.config.filters || [])];
    newFilters.splice(index, 1);
    setReportData({
      ...reportData,
      config: {
        ...reportData.config,
        filters: newFilters
      }
    });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du rapport *
            </label>
            <input
              type="text"
              required
              value={reportData.name}
              onChange={(e) => setReportData({ ...reportData, name: e.target.value })}
              className="input"
              placeholder="Mon rapport Airtable"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={reportData.description}
              onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Description du rapport..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de rapport *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHART_TYPES.map((chart) => {
                const Icon = chart.icon;
                return (
                  <button
                    key={chart.type}
                    type="button"
                    onClick={() => setReportData({ ...reportData, type: chart.type as any })}
                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      reportData.type === chart.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Icon className={`h-5 w-5 mr-2 ${
                        reportData.type === chart.type ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <span className="font-medium text-gray-900">{chart.name}</span>
                    </div>
                    <p className="text-sm text-gray-500">{chart.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Source de données</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connexion Airtable *
            </label>
            <select
              required
              value={selectedConnection?.id || ''}
              onChange={(e) => {
                const connection = connections.find(c => c.id === e.target.value);
                setSelectedConnection(connection || null);
                setSelectedTable(null);
              }}
              className="input"
            >
              <option value="">Sélectionnez une connexion</option>
              {connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.name}
                </option>
              ))}
            </select>
          </div>

          {selectedConnection && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table *
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Chargement des tables...</span>
                </div>
              ) : (
                <select
                  required
                  value={selectedTable?.id || ''}
                  onChange={(e) => {
                    const table = tables.find(t => t.id === e.target.value);
                    setSelectedTable(table || null);
                  }}
                  className="input"
                >
                  <option value="">Sélectionnez une table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration des données</h3>
        
        {selectedTable && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Champs à inclure *
              </label>
              <div className="space-y-2">
                {selectedTable.fields?.map((field) => (
                  <label key={field.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportData.config.fields.includes(field.name)}
                      onChange={(e) => {
                        const newFields = e.target.checked
                          ? [...reportData.config.fields, field.name]
                          : reportData.config.fields.filter(f => f !== field.name);
                        setReportData({
                          ...reportData,
                          config: { ...reportData.config, fields: newFields }
                        });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {field.name} ({field.type})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Filtres
                </label>
                <button
                  type="button"
                  onClick={addFilter}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Ajouter un filtre
                </button>
              </div>
              
              {reportData.config.filters?.map((filter, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                    className="input flex-1"
                  >
                    <option value="">Champ</option>
                    {selectedTable.fields?.map((field) => (
                      <option key={field.id} value={field.name}>
                        {field.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, { operator: e.target.value as any })}
                    className="input flex-1"
                  >
                    {FILTER_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    className="input flex-1"
                    placeholder="Valeur"
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite d'enregistrements
                </label>
                <input
                  type="number"
                  value={reportData.config.limit || 100}
                  onChange={(e) => setReportData({
                    ...reportData,
                    config: { ...reportData.config, limit: parseInt(e.target.value) || 100 }
                  })}
                  className="input"
                  min="1"
                  max="1000"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu et finalisation</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Aperçu du rapport</span>
            <button
              type="button"
              onClick={loadPreview}
              disabled={loadingPreview || !reportData.config.fields.length}
              className="btn-secondary text-sm flex items-center"
            >
              {loadingPreview ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Actualiser l'aperçu
                </>
              )}
            </button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px] flex items-center justify-center">
            {loadingPreview ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Génération de l'aperçu...</p>
              </div>
            ) : previewData ? (
              <ChartPreview 
                data={previewData} 
                type={reportData.type} 
                options={reportData.config.chart_options}
              />
            ) : (
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Cliquez sur "Actualiser l'aperçu" pour voir votre rapport
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingReport ? 'Modifier le rapport' : 'Créer un nouveau rapport'}
            </h2>
            <p className="text-sm text-gray-500">Étape {step} sur 4</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-2 bg-gray-50 border-b">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <button
            type="button"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="btn-secondary"
          >
            {step === 1 ? 'Annuler' : 'Précédent'}
          </button>
          
          <div className="flex space-x-3">
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !reportData.name) ||
                  (step === 2 && (!selectedConnection || !selectedTable)) ||
                  (step === 3 && !reportData.config.fields.length)
                }
                className="btn-primary"
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingReport ? 'Mettre à jour' : 'Créer le rapport'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}