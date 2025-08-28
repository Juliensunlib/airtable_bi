import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { User, Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateProfile, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    full_name: user?.full_name || '',
    preferences: {
      notifications: user?.preferences?.notifications || true,
      dark_mode: user?.preferences?.dark_mode || false,
      language: user?.preferences?.language || 'fr'
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile({
        username: formData.username,
        full_name: formData.full_name,
        preferences: formData.preferences
      });
    } catch (error) {
      // Error handled by store
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        [key]: value
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-600 mt-1">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
        
        <div className="card overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-8">
              <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center mb-4">
                        <User className="h-5 w-5 text-gray-500 mr-2" />
                        Profil
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom d'utilisateur
                          </label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom complet
                          </label>
                          <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="input"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rôle
                          </label>
                          <input
                            type="text"
                            value={user?.role === 'admin' ? 'Administrateur' : user?.role === 'user' ? 'Utilisateur' : 'Visualiseur'}
                            className="input bg-gray-50"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center mb-4">
                        <SettingsIcon className="h-5 w-5 text-gray-500 mr-2" />
                        Préférences
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.preferences.notifications}
                            onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            Notifications par email
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.preferences.dark_mode}
                            onChange={(e) => handlePreferenceChange('dark_mode', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            Mode sombre
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Langue
                          </label>
                          <select 
                            value={formData.preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                            className="input"
                          >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-end">
                <button 
                  type="submit"
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
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}