import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  BarChart3,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { Dashboard, Report, DashboardLayout } from '../../types';
import toast from 'react-hot-toast';
import ChartPreview from '../reports/ChartPreview';
import { airtableService } from '../../services/airtableService';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardBuilderProps {
  dashboard: Dashboard;
  onClose: () => void;
  onSave: (dashboard: Dashboard) => void;
}

export default function DashboardBuilder({ dashboard, onClose, onSave }: DashboardBuilderProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [availableReports, setAvailableReports] = useState<Report[]>([]);
  const [dashboardReports, setDashboardReports] = useState<Report[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: DashboardLayout[] }>({
    lg: dashboard.layout || []
  });
  const [showAddReport, setShowAddReport] = useState(false);
  const [reportData, setReportData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (user) {
      loadReports();
      loadDashboardReports();
    }
  }, [user, dashboard.id]);

  const loadReports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableReports(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast.error('Erreur lors du chargement des rapports');
    }
  };

  const loadDashboardReports = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_reports')
        .select(`
          *,
          reports (*)
        `)
        .eq('dashboard_id', dashboard.id);

      if (error) throw error;
      
      const reports = data?.map(dr => dr.reports).filter(Boolean) || [];
      setDashboardReports(reports);

      // Load data for each report
      for (const report of reports) {
        loadReportData(report);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports du dashboard:', error);
    }
  };

  const loadReportData = async (report: Report) => {
    try {
      const { data: connection } = await supabase
        .from('airtable_connections')
        .select('*')
        .eq('id', report.connection_id)
        .single();

      if (!connection) return;

      const records = await airtableService.getRecords(connection, report.config.table_id!, {
        fields: report.config.fields,
        filters: report.config.filters,
        maxRecords: report.config.limit || 100
      });

      if (records.records.length > 0 && report.config.fields.length >= 2) {
        const chartData = airtableService.transformDataForChart(
          records.records,
          report.config.fields[0],
          report.config.fields[1],
          report.type
        );
        
        setReportData(prev => ({
          ...prev,
          [report.id]: chartData
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du rapport:', error);
    }
  };

  const addReportToDashboard = async (reportId: string) => {
    try {
      setLoading(true);

      // Find next available position
      const existingLayouts = layouts.lg || [];
      const maxY = existingLayouts.length > 0 ? Math.max(...existingLayouts.map(l => l.y + l.h)) : 0;

      const newLayout: DashboardLayout = {
        i: reportId,
        x: 0,
        y: maxY,
        w: 6,
        h: 4,
        minW: 3,
        minH: 3
      };

      // Add to dashboard_reports table
      const { error } = await supabase
        .from('dashboard_reports')
        .insert({
          dashboard_id: dashboard.id,
          report_id: reportId,
          position_x: newLayout.x,
          position_y: newLayout.y,
          width: newLayout.w,
          height: newLayout.h
        });

      if (error) throw error;

      // Update local state
      setLayouts({
        ...layouts,
        lg: [...existingLayouts, newLayout]
      });

      // Reload dashboard reports
      loadDashboardReports();
      setShowAddReport(false);
      toast.success('Rapport ajouté au tableau de bord !');
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du rapport:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout du rapport');
    } finally {
      setLoading(false);
    }
  };

  const removeReportFromDashboard = async (reportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce rapport du tableau de bord ?')) return;

    try {
      const { error } = await supabase
        .from('dashboard_reports')
        .delete()
        .eq('dashboard_id', dashboard.id)
        .eq('report_id', reportId);

      if (error) throw error;

      // Update layouts
      const newLayouts = {
        ...layouts,
        lg: layouts.lg.filter(l => l.i !== reportId)
      };
      setLayouts(newLayouts);

      // Remove from dashboard reports
      setDashboardReports(prev => prev.filter(r => r.id !== reportId));
      
      toast.success('Rapport retiré du tableau de bord');
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleLayoutChange = (layout: any[], layouts: any) => {
    setLayouts(layouts);
  };

  const saveDashboard = async () => {
    try {
      setLoading(true);

      // Update dashboard layout
      const { error: dashboardError } = await supabase
        .from('dashboards')
        .update({ layout: layouts.lg })
        .eq('id', dashboard.id);

      if (dashboardError) throw dashboardError;

      // Update individual report positions
      for (const layout of layouts.lg) {
        const { error } = await supabase
          .from('dashboard_reports')
          .update({
            position_x: layout.x,
            position_y: layout.y,
            width: layout.w,
            height: layout.h
          })
          .eq('dashboard_id', dashboard.id)
          .eq('report_id', layout.i);

        if (error) console.error('Erreur lors de la mise à jour de la position:', error);
      }

      const updatedDashboard = { ...dashboard, layout: layouts.lg };
      onSave(updatedDashboard);
      toast.success('Tableau de bord sauvegardé !');
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const renderReportWidget = (report: Report) => {
    const data = reportData[report.id];
    
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{report.name}</h3>
            {report.description && (
              <p className="text-xs text-gray-500 mt-1">{report.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => removeReportFromDashboard(report.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
              title="Retirer du tableau de bord"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          {data ? (
            <ChartPreview 
              data={data} 
              type={report.type} 
              options={report.config.chart_options}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chargement...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{dashboard.name}</h1>
          <p className="text-sm text-gray-500">Éditeur de tableau de bord</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddReport(true)}
            className="btn-secondary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un rapport
          </button>
          
          <button
            onClick={saveDashboard}
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
                Sauvegarder
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 overflow-auto p-6">
        {dashboardReports.length > 0 ? (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
          >
            {dashboardReports.map((report) => (
              <div key={report.id}>
                {renderReportWidget(report)}
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tableau de bord vide
              </h3>
              <p className="text-gray-500 mb-4">
                Ajoutez des rapports pour commencer à visualiser vos données
              </p>
              <button
                onClick={() => setShowAddReport(true)}
                className="btn-primary"
              >
                Ajouter votre premier rapport
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Report Modal */}
      {showAddReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Ajouter un rapport au tableau de bord
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {availableReports.filter(r => !dashboardReports.find(dr => dr.id === r.id)).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableReports
                    .filter(report => !dashboardReports.find(dr => dr.id === report.id))
                    .map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 hover:border-blue-500 transition-colors duration-200 cursor-pointer"
                        onClick={() => addReportToDashboard(report.id)}
                      >
                        <div className="flex items-center mb-2">
                          <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                          <h4 className="font-medium text-gray-900">{report.name}</h4>
                        </div>
                        {report.description && (
                          <p className="text-sm text-gray-500 mb-2">{report.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Type: {report.type}</span>
                          <span>{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Aucun rapport disponible. Créez d'abord des rapports pour les ajouter à ce tableau de bord.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t">
              <button
                onClick={() => setShowAddReport(false)}
                className="btn-secondary w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}