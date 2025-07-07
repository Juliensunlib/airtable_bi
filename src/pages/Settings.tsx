import React, { useState } from 'react';
import { Save, User, Lock, Bell } from 'lucide-react';

function Settings() {
  const [formData, setFormData] = useState({
    email: 'admin@example.com',
    language: 'fr',
    notifications: true,
    darkMode: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Paramètres sauvegardés:', formData);
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
        
        <div className="bg-white shadow-sm rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit}>
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
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Adresse email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                            Langue
                          </label>
                          <select
                            id="language"
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center mb-4">
                        <Bell className="h-5 w-5 text-gray-500 mr-2" />
                        Préférences
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            id="notifications"
                            name="notifications"
                            type="checkbox"
                            checked={formData.notifications}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                            Activer les notifications
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="darkMode"
                            name="darkMode"
                            type="checkbox"
                            checked={formData.darkMode}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-700">
                            Mode sombre
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center mb-4">
                        <Lock className="h-5 w-5 text-gray-500 mr-2" />
                        Sécurité
                      </h3>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Changer le mot de passe
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;