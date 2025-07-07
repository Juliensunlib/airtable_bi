import React, { useState } from 'react';
import { Database, Save } from 'lucide-react';
import airtableService from '../../services/airtableService';

interface ConnectionFormProps {
  onSuccess: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseId, setBaseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bases, setBases] = useState<any[]>([]);
  const [step, setStep] = useState(1);

  const fetchBases = async () => {
    if (!apiKey) {
      setError('Veuillez entrer une clé API');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const basesData = await airtableService.getBases(apiKey);
      setBases(basesData);
      setStep(2);
    } catch (err) {
      setError('Impossible de récupérer les bases. Vérifiez votre clé API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !apiKey || !baseId) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await airtableService.createConnection(name, apiKey, baseId);
      onSuccess();
    } catch (err) {
      setError('Erreur lors de la création de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <Database className="mr-2 h-5 w-5 text-blue-600" />
        Nouvelle connexion Airtable
      </h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <div className="mb-4">
              <label htmlFor="name\" className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la connexion
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ma connexion Airtable"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Clé API Airtable
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="key..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Vous pouvez trouver votre clé API dans les paramètres de votre compte Airtable.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={fetchBases}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
              >
                {isLoading ? 'Chargement...' : 'Continuer'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-4">
              <label htmlFor="baseId" className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionnez une base
              </label>
              <select
                id="baseId"
                value={baseId}
                onChange={(e) => setBaseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Sélectionnez une base</option>
                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
              >
                {isLoading ? (
                  'Enregistrement...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer la connexion
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default ConnectionForm;