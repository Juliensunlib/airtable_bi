import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, 
  LayoutDashboard, 
  Edit, 
  Trash2, 
  Eye, 
  Share2,
  Loader2,
  Settings
} from 'lucide-react';
import type { Dashboard } from '../types';
import toast from 'react-hot-toast';
import DashboardBuilder from '../components/dashboard/DashboardBuilder';

export default function Dashboards() {
  const { user } = useAuthStore();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });

  useEffect(() => {
    if (user) {
      loadDashboards();
    }
  }, [user]);

  const loadDashboards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDashboards(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tableaux de bord:', error);
      toast.error('Erreur lors du chargement des tableaux de bord');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      if (editingDashboard) {
        // Mise à jour
        const { error } = await supabase
          .from('dashboards')
          .update({
            name: formData.name,
            description: formData.description,
            is_public: formData.is_public
          })
          .eq('id', editingDashboard.id);

        if (error) throw error;
        toast.success('Tableau de bord mis à jour !');
      } else {
        // Création
        const { error } = await supabase
          .from('dashboards')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            is_public: formData.is_public,
            layout: []
          });

        if (error) throw error;
        toast.success('Tableau de bord créé !');
      }

      setShowModal(false);
      setEditingDashboard(null);
      setFormData({ name: '', description: '', is_public: false });
      loadDashboards();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setFormData({
      name: dashboard.name,
      description: dashboard.description || '',
      is_public: dashboard.is_public
    });
    setShowModal(true);
  };

  const handleDelete = async (dashboard: Dashboard) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tableau de bord ?')) return;

    try {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', dashboard.id);

      if (error) throw error;
      toast.success('Tableau de bord supprimé !');
      loadDashboards();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const openBuilder = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setShowBuilder(true);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setSelectedDashboard(null);
  };

  const handleSaveDashboard = (dashboard: Dashboard) => {
    loadDashboards();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDashboard(null);
    setFormData({ name: '', description: '', is_public: false });
  };

  if (loading && dashboards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des tableaux de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tableaux de bord</h2>
            <p className="text-gray-600 mt-1">
              Créez et gérez vos tableaux de bord personnalisés
            </p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center mt-4 sm:mt-0"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau tableau de bord
          </button>
        </div>
        
        {dashboards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <div key={dashboard.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <LayoutDashboard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{dashboard.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {dashboard.is_public && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Share2 className="h-3 w-3 mr-1" />
                            Public
                          </span>
                        )}
                        {dashboard.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Par défaut
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {dashboard.description && (
                  <p className="text-sm text-gray-600 mb-4">{dashboard.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>
                    {dashboard.layout?.length || 0} rapport(s)
                  </span>
                  <span>
                    {new Date(dashboard.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openBuilder(dashboard)}
                    className="flex-1 btn-primary text-sm py-2 flex items-center justify-center"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Éditer
                  </button>
                  <button
                    onClick={() => handleEdit(dashboard)}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(dashboard)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun tableau de bord</h3>
              <p className="text-gray-500 mb-4">
                Créez des tableaux de bord pour organiser et visualiser vos rapports
              </p>
              <button 
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Créer votre premier tableau de bord
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingDashboard ? 'Modifier le tableau de bord' : 'Nouveau tableau de bord'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du tableau de bord *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="Mon tableau de bord"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="Description du tableau de bord..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Rendre ce tableau de bord public
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-secondary flex-1"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-1 flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Sauvegarde...
                        </>
                      ) : (
                        editingDashboard ? 'Mettre à jour' : 'Créer'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Builder */}
        {showBuilder && selectedDashboard && (
          <DashboardBuilder
            dashboard={selectedDashboard}
            onClose={closeBuilder}
            onSave={handleSaveDashboard}
          />
        )}
      </div>
    </div>
  );
}