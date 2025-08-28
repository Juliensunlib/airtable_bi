import React from 'react';
import { PlusCircle, Database } from 'lucide-react';

export default function Connections() {
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
          
          <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center mt-4 sm:mt-0 transition-colors duration-200 shadow-sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle connexion
          </button>
        </div>
        
        {/* Empty state */}
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune connexion</h3>
            <p className="text-gray-500 mb-4">
              Connectez vos bases Airtable pour commencer à analyser vos données
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Créer votre première connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}