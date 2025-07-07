import React, { useState, useEffect } from 'react';
import { FileText, PlusCircle, Trash2 } from 'lucide-react';
import ReportBuilder from '../components/reports/ReportBuilder';
import { Chart } from '../types';
import reportService from '../services/reportService';
import DashboardCard from '../components/dashboard/DashboardCard';

function Reports() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [reports, setReports] = useState<Chart[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const savedReports = reportService.getReports();
    setReports(savedReports);
  };

  const handleSaveChart = (chart: Chart) => {
    try {
      reportService.saveReport(chart);
      loadReports();
      setShowBuilder(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    try {
      reportService.deleteReport(reportId);
      loadReports();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

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
            onClick={() => setShowBuilder(!showBuilder)}
            className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center mt-4 sm:mt-0 transition-colors duration-200 shadow-sm"
          >
            {showBuilder ? (
              'Annuler'
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouveau rapport
              </>
            )}
          </button>
        </div>

        {showBuilder ? (
          <div className="mb-8">
            <ReportBuilder
              onSave={handleSaveChart}
              onCancel={() => setShowBuilder(false)}
            />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rapport</h3>
              <p className="text-gray-500 mb-4">
                Commencez par créer votre premier rapport
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Créer un rapport
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {reports.map((report) => (
              <div key={report.id} className="relative">
                <button
                  onClick={() => handleDeleteReport(report.id)}
                  className="absolute top-2 right-2 z-10 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-red-600"
                  title="Supprimer le rapport"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <DashboardCard chart={report} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;