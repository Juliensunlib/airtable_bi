import React, { useState, useEffect } from 'react';
import DashboardCard from '../components/dashboard/DashboardCard';
import { PlusCircle, Filter, X } from 'lucide-react';
import { Chart } from '../types';
import airtableService from '../services/airtableService';
import reportService from '../services/reportService';

function Dashboard() {
  const [showFilters, setShowFilters] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [charts, setCharts] = useState<Chart[]>([]);
  const [availableReports, setAvailableReports] = useState<Chart[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConnections();
    loadDashboardCharts();
    loadAvailableReports();
  }, []);

  const loadConnections = () => {
    const storedConnections = airtableService.getStoredConnections();
    setConnections(storedConnections);
  };

  const loadDashboardCharts = () => {
    const savedCharts = localStorage.getItem('dashboardCharts');
    if (savedCharts) {
      setCharts(JSON.parse(savedCharts));
    }
  };

  const loadAvailableReports = () => {
    const reports = reportService.getReports();
    setAvailableReports(reports);
  };

  const saveDashboardCharts = (newCharts: Chart[]) => {
    localStorage.setItem('dashboardCharts', JSON.stringify(newCharts));
    setCharts(newCharts);
  };

  const loadTables = async (connectionId: string) => {
    setIsLoading(true);
    try {
      const connection = connections.find(c => c.id === connectionId);
      if (connection) {
        const tablesData = await airtableService.getTables(connection);
        setTables(tablesData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionChange = (connectionId: string) => {
    setSelectedConnection(connectionId);
    setTables([]);
    if (connectionId) {
      loadTables(connectionId);
    }
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
  };

  const handleAddReports = () => {
    const reportsToAdd = availableReports.filter(report => 
      selectedReports.includes(report.id)
    );
    
    const newCharts = [...charts, ...reportsToAdd];
    saveDashboardCharts(newCharts);
    setSelectedReports([]);
    setShowAddReportModal(false);
  };

  const handleRemoveChart = (chartId: string) => {
    const newCharts = charts.filter(chart => chart.id !== chartId);
    saveDashboardCharts(newCharts);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h2>
            <p className="text-gray-600 mt-1">
              Visualisez les données de vos bases Airtable
            </p>
          </div>
          
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button 
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200 shadow-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </button>
            <button 
              onClick={() => setShowAddReportModal(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center transition-colors duration-200 shadow-sm"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter un rapport
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {charts.map(chart => (
            <div key={chart.id} className="relative">
              <button
                onClick={() => handleRemoveChart(chart.id)}
                className="absolute top-2 right-2 z-10 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-red-600"
                title="Retirer du tableau de bord"
              >
                <X className="h-4 w-4" />
              </button>
              <DashboardCard chart={chart} />
            </div>
          ))}
        </div>

        {charts.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rapport</h3>
              <p className="text-gray-500 mb-4">
                Commencez par ajouter des rapports à votre tableau de bord
              </p>
              <button 
                onClick={() => setShowAddReportModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Ajouter un rapport
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal des filtres */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filtres</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connexion Airtable
                </label>
                <select
                  value={selectedConnection}
                  onChange={(e) => handleConnectionChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionnez une connexion</option>
                  {connections.map((conn) => (
                    <option key={conn.id} value={conn.id}>{conn.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Période
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tables
                </label>
                <select
                  multiple
                  value={selectedTables}
                  onChange={(e) => setSelectedTables(Array.from(e.target.selectedOptions, option => option.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>{table.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajouter rapport */}
      {showAddReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter des rapports</h3>
              <button 
                onClick={() => setShowAddReportModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {availableReports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun rapport disponible. Créez d'abord des rapports dans la section "Rapports".
                </p>
              ) : (
                availableReports
                  .filter(report => !charts.some(chart => chart.id === report.id))
                  .map((report) => (
                    <label key={report.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReports([...selectedReports, report.id]);
                          } else {
                            setSelectedReports(selectedReports.filter(id => id !== report.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{report.title}</div>
                        <div className="text-xs text-gray-500">Type: {report.type}</div>
                      </div>
                    </label>
                  ))
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddReportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddReports}
                disabled={selectedReports.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter ({selectedReports.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;