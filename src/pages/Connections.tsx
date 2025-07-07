import React, { useState, useEffect } from 'react';
import ConnectionForm from '../components/connections/ConnectionForm';
import ConnectionsList from '../components/connections/ConnectionsList';
import { PlusCircle } from 'lucide-react';
import airtableService from '../services/airtableService';
import { AirtableConnection } from '../types';

function Connections() {
  const [showForm, setShowForm] = useState(false);
  const [connections, setConnections] = useState<AirtableConnection[]>([]);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    const storedConnections = airtableService.getStoredConnections();
    setConnections(storedConnections);
  };

  const handleConnectionSuccess = () => {
    setShowForm(false);
    loadConnections();
  };

  const handleDeleteConnection = (id: string) => {
    const updatedConnections = connections.filter(conn => conn.id !== id);
    localStorage.setItem('airtableConnections', JSON.stringify(updatedConnections));
    setConnections(updatedConnections);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Connexions Airtable</h2>
            <p className="text-gray-600 mt-1">
              Configurez vos connexions aux bases Airtable
            </p>
          </div>
          
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center mt-4 sm:mt-0 transition-colors duration-200 shadow-sm"
          >
            {showForm ? (
              'Annuler'
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouvelle connexion
              </>
            )}
          </button>
        </div>
        
        {showForm && (
          <div className="mb-6">
            <ConnectionForm onSuccess={handleConnectionSuccess} />
          </div>
        )}
        
        <div className="pb-8">
          <ConnectionsList 
            connections={connections}
            onDelete={handleDeleteConnection}
          />
        </div>
      </div>
    </div>
  );
}

export default Connections;