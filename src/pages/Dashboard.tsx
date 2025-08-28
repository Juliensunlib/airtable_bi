import React from 'react';
import { PlusCircle, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
            <p className="text-gray-600 mt-1">
              Vue d'ensemble de vos données Airtable
            </p>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center mt-4 sm:mt-0 transition-colors duration-200 shadow-sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau tableau de bord
          </button>
        </div>
        
        {/* Empty state */}
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bienvenue dans AirTableau BI</h3>
            <p className="text-gray-500 mb-4">
              Commencez par créer une connexion Airtable pour visualiser vos données
            </p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Créer une connexion
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                Voir la documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}