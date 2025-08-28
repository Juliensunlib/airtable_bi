import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { airtableService } from '../services/airtableService';
import { 
  PlusCircle, 
  Database, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { AirtableConnection, AirtableBase } from '../types';
import toast from 'react-hot-toast';

export default function Connections() {
  const { user } = useAuthStore();
  const [connections, setConnections] = useState<AirtableConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<AirtableConnection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    api_key: '',
    base_id: '',
    description: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [availableBases, setAvailableBases] = useState<AirtableBase[]>([]);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('airtable_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des connexions:', error);
      toast.error('Erreur lors du chargement des connexions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      if (editingConnection) {
        // Mise à jour
        const { error } = await supabase
          .from('airtable_connections')
          .update({
            name: formData.name,
            api_key: formData.api_key,
            base_id: formData.base_id,
            description: formData.description
          })
          .eq('id', editingConnection.id);

        if (error) throw error;
        toast.success('Connexion mise à jour !');
      } else {
        // Création
        const { error } = await supabase
          .from('airtable_connections')
          .insert({
            user_id: user.id,
            name: formData.name,
            api_key: formData.api_key,
            base_id: formData.base_id,
            description: formData.description
          });

        if (error) throw error;
        toast.success('Connexion créée !');
      }

      setShowModal(false);
      setEditingConnection(null);
      setFormData({ name: '', api_key: '', base_id: '', description: '' });
      setAvailableBases([]);
      loadConnections();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (connection: AirtableConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      api_key: connection.api_key,
      base_id: connection.base_id,
      description: connection.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (connection: AirtableConnection) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette connexion ?')) return;

    try {
      const { error } = await supabase
        .from('airtable_connections')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;
      toast.success('Connexion supprimée !');
      loadConnections();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const testConnection = async () => {
    if (!formData.api_key) {
      toast.error('Veuillez saisir une clé API');
      return;
    }

    try {
      setTestingConnection(true);
      const result = await airtableService.testConnection(formData.api_key);
      
      if (result.success) {
        toast.success('Connexion réussie !');
        // Charger les bases disponibles
        const bases = await airtableService.getBases(formData.api_key);
        setAvailableBases(bases);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setTestingConnection(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingConnection(null);
    setFormData({ name: '', api_key: '', base_id: '', description: '' });
    setAvailableBases([]);
    setShowApiKey(false);
  };

  if (loading && connections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des connexions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Connexions Airtable</h2>
            <p className="text-gray-600 mt-1">
              Gérez vos connexions aux bases Airtable
            </p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center mt-4 sm:mt-0"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle connexion
          </button>
        </div>
        
        {connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection) => (
              <div key={connection.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{connection.name}</h3>
                      <p className="text-sm text-gray-500">Base ID: {connection.base_id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {connection.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" title="Active" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" title="Inactive" />
                    )}
                  </div>
                </div>

                {connection.description && (
                  <p className="text-sm text-gray-600 mb-4">{connection.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Créé le {new Date(connection.created_at).toLocaleDateString('fr-FR')}</span>
                  {connection.last_sync && (
                    <span>Sync: {new Date(connection.last_sync).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(connection)}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(connection)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune connexion</h3>
              <p className="text-gray-500 mb-4">
                Connectez vos bases Airtable pour commencer à analyser vos données
              </p>
              <button 
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Créer votre première connexion
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingConnection ? 'Modifier la connexion' : 'Nouvelle connexion Airtable'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de la connexion *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="Ma base Airtable"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clé API Airtable *
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        required
                        value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        className="input pr-20"
                        placeholder="pat..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={testConnection}
                          disabled={testingConnection || !formData.api_key}
                          className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          {testingConnection ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Trouvez votre clé API dans les paramètres de votre compte Airtable
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID de la base *
                    </label>
                    {availableBases.length > 0 ? (
                      <select
                        required
                        value={formData.base_id}
                        onChange={(e) => setFormData({ ...formData, base_id: e.target.value })}
                        className="input"
                      >
                        <option value="">Sélectionnez une base</option>
                        {availableBases.map((base) => (
                          <option key={base.id} value={base.id}>
                            {base.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.base_id}
                        onChange={(e) => setFormData({ ...formData, base_id: e.target.value })}
                        className="input"
                        placeholder="app..."
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      L'ID de votre base Airtable (commence par "app")
                    </p>
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
                      placeholder="Description de cette connexion..."
                    />
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
                        editingConnection ? 'Mettre à jour' : 'Créer'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}