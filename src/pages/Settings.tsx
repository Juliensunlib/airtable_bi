import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { User, Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-600 mt-1">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
        
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
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
                          value={user?.username || ''}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          value={user?.full_name || ''}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rôle
                        </label>
                        <input
                          type="text"
                          value={user?.role === 'admin' ? 'Administrateur' : user?.role === 'user' ? 'Utilisateur' : 'Visualiseur'}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Notifications par email
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
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
                        <select className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-8">
              <div className="flex justify-end">
                <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}