import React from 'react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3,
  LineChart,
  PieChart,
  Table,
  TrendingUp,
  Loader2
} from 'lucide-react';
import type { Report } from '../types';
import toast from 'react-hot-toast';
import ReportBuilder from '../components/reports/ReportBuilder';

const CHART_ICONS = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  doughnut: PieChart,
  area: TrendingUp,
  table: Table,
  kpi: TrendingUp
};

export default function Reports() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          airtable_connections (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setShowBuilder(true);
  };

  const handleDelete = async (report: Report) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);

      if (error) throw error;
      toast.success('Rapport supprimé !');
      loadReports();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleSaveReport = (report: Report) => {
    loadReports();
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setEditingReport(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rapports</h2>
            <p className="text-gray-600 mt-1">
              Créez et gérez vos rapports personnalisés
            </p>
          </div>
          
          <button 
            onClick={() => setShowBuilder(true)}
            className="btn-primary flex items-center mt-4 sm:mt-0"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau rapport
          </button>
        </div>
        
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const IconComponent = CHART_ICONS[report.type as keyof typeof CHART_ICONS] || FileText;
              return (
                <div key={report.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{report.type}</p>
                      </div>
                    </div>
                  </div>

                  {report.description && (
                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>
                      Source: {(report as any).airtable_connections?.name || 'Connexion supprimée'}
                    </span>
                    <span>
                      {new Date(report.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(report)}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(report)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rapport</h3>
              <p className="text-gray-500 mb-4">
                Créez des rapports personnalisés à partir de vos données Airtable
              </p>
              <button 
                onClick={() => setShowBuilder(true)}
                className="btn-primary"
              >
                Créer votre premier rapport
              </button>
            </div>
          </div>
        )}

        {/* Report Builder Modal */}
        {showBuilder && (
          <ReportBuilder
            onClose={closeBuilder}
            onSave={handleSaveReport}
            editingReport={editingReport}
          />
        )}
      </div>
    </div>
  );
}