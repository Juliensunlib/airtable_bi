import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAirtableStore } from '../stores/airtableStore';
import { supabase } from '../lib/supabase';
import { PlusCircle, BarChart3, Database, FileText, TrendingUp, Users, Activity } from 'lucide-react';
import type { AirtableConnection, Report, Dashboard as DashboardType } from '../types';
import ConnectionStatus from '../components/airtable/ConnectionStatus';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { defaultConnection } = useAirtableStore();
  const [stats, setStats] = useState({
    connections: 0,
    reports: 0,
    dashboards: 0
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les statistiques
      const [connectionsResult, reportsResult, dashboardsResult] = await Promise.all([
        supabase
          .from('airtable_connections')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('dashboards')
          .select('id')
          .eq('user_id', user.id)
      ]);

      setStats({
        connections: connectionsResult.data?.length || 0,
        reports: reportsResult.data?.length || 0,
        dashboards: dashboardsResult.data?.length || 0
      });

      setRecentReports(reportsResult.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    description: string;
  }) => (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.full_name || user?.username} 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Voici un aperçu de vos données et analyses
          </p>
        </div>

        {/* Airtable Connection Status */}
        <div className="mb-8">
          <ConnectionStatus />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Connexions"
            value={stats.connections}
            icon={Database}
            color="bg-blue-500"
            description="Bases Airtable connectées"
          />
          <StatCard
            title="Rapports"
            value={stats.reports}
            icon={FileText}
            color="bg-green-500"
            description="Rapports créés"
          />
          <StatCard
            title="Tableaux de bord"
            value={stats.dashboards}
            icon={BarChart3}
            color="bg-purple-500"
            description="Dashboards configurés"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Reports */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Rapports récents</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Voir tout
              </button>
            </div>

            {recentReports.length > 0 ? (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{report.name}</p>
                      <p className="text-xs text-gray-500">
                        {report.type} • {new Date(report.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun rapport créé</p>
                <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Créer votre premier rapport
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h2>
            
            <div className="space-y-4">
              <button className="w-full flex items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                <div className="h-10 w-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900">Nouvelle connexion</p>
                  <p className="text-xs text-gray-500">Connecter une base Airtable</p>
                </div>
              </button>

              <button className="w-full flex items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 group">
                <div className="h-10 w-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900">Nouveau rapport</p>
                  <p className="text-xs text-gray-500">Créer un rapport personnalisé</p>
                </div>
              </button>

              <button className="w-full flex items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group">
                <div className="h-10 w-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900">Nouveau tableau de bord</p>
                  <p className="text-xs text-gray-500">Organiser vos rapports</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        {stats.connections === 0 && (
          <div className="mt-8 card p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Commencez votre analyse</h3>
              <p className="text-gray-500 mb-6">
                Connectez votre première base Airtable pour commencer à créer des rapports et des tableaux de bord
              </p>
              <div className="space-y-3">
                <button className="btn-primary w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer une connexion Airtable
                </button>
                <button className="btn-secondary w-full">
                  Voir la documentation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}