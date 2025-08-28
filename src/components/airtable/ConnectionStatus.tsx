import React, { useEffect } from 'react';
import { useAirtableStore } from '../../stores/airtableStore';
import { Database, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

export default function ConnectionStatus() {
  const { 
    defaultConnection, 
    loading, 
    initializeDefaultConnection, 
    selectBase 
  } = useAirtableStore();

  useEffect(() => {
    initializeDefaultConnection();
  }, [initializeDefaultConnection]);

  if (loading) {
    return (
      <div className="card p-4">
        <div className="flex items-center">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-3" />
          <div>
            <p className="font-medium text-gray-900">Connexion à Airtable...</p>
            <p className="text-sm text-gray-500">Vérification de la connexion</p>
          </div>
        </div>
      </div>
    );
  }

  if (!defaultConnection.isConnected) {
    return (
      <div className="card p-4 border-red-200 bg-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <p className="font-medium text-red-900">Connexion Airtable échouée</p>
              <p className="text-sm text-red-600">Vérifiez votre configuration</p>
            </div>
          </div>
          <button
            onClick={initializeDefaultConnection}
            className="btn-secondary text-sm flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 border-green-200 bg-green-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
          <div>
            <p className="font-medium text-green-900">Connexion Airtable active</p>
            <p className="text-sm text-green-600">
              {defaultConnection.bases.length} base(s) disponible(s)
            </p>
          </div>
        </div>
      </div>

      {defaultConnection.bases.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner une base :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {defaultConnection.bases.map((base) => (
              <button
                key={base.id}
                onClick={() => selectBase(base)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                  defaultConnection.selectedBase?.id === base.id
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">{base.name}</p>
                    <p className="text-xs text-gray-500">{base.id}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {defaultConnection.selectedBase && defaultConnection.tables.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Tables disponibles dans "{defaultConnection.selectedBase.name}" :
          </p>
          <div className="flex flex-wrap gap-2">
            {defaultConnection.tables.map((table) => (
              <span
                key={table.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {table.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}