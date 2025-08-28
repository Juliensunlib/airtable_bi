import React from 'react';
import { PlusCircle, FileText } from 'lucide-react';

export default function Reports() {
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
          
          <button className="btn-primary flex items-center mt-4 sm:mt-0">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau rapport
          </button>
        </div>
        
        {/* Empty state */}
        <div className="text-center py-12 card">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rapport</h3>
            <p className="text-gray-500 mb-4">
              Créez des rapports personnalisés à partir de vos données Airtable
            </p>
            <button className="btn-primary">
              Créer votre premier rapport
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}