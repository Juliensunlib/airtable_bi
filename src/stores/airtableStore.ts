import { create } from 'zustand';
import { airtableService } from '../services/airtableService';
import type { AirtableBase, AirtableTable, AirtableConnection } from '../types';
import toast from 'react-hot-toast';

interface AirtableState {
  // État de la connexion par défaut
  defaultConnection: {
    isConnected: boolean;
    apiKey: string | null;
    baseId: string | null;
    bases: AirtableBase[];
    selectedBase: AirtableBase | null;
    tables: AirtableTable[];
  };
  
  // État général
  loading: boolean;
  
  // Actions
  initializeDefaultConnection: () => Promise<void>;
  selectBase: (base: AirtableBase) => Promise<void>;
  loadTables: (baseId: string) => Promise<void>;
  testConnection: () => Promise<boolean>;
}

export const useAirtableStore = create<AirtableState>((set, get) => ({
  defaultConnection: {
    isConnected: false,
    apiKey: null,
    baseId: null,
    bases: [],
    selectedBase: null,
    tables: []
  },
  loading: false,

  initializeDefaultConnection: async () => {
    set({ loading: true });
    
    try {
      const apiKey = airtableService.getDefaultApiKey();
      
      if (!apiKey) {
        console.warn('Aucune clé API Airtable configurée');
        set({ loading: false });
        return;
      }

      const result = await airtableService.testDefaultConnection();
      
      if (result.success && result.bases) {
        set({
          defaultConnection: {
            isConnected: true,
            apiKey,
            baseId: airtableService.getDefaultBaseId(),
            bases: result.bases,
            selectedBase: null,
            tables: []
          },
          loading: false
        });
        
        toast.success(`Connexion Airtable établie - ${result.bases.length} base(s) disponible(s)`);
        
        // Sélectionner automatiquement la première base si un baseId par défaut est configuré
        const defaultBaseId = airtableService.getDefaultBaseId();
        if (defaultBaseId && result.bases.length > 0) {
          const defaultBase = result.bases.find(base => base.id === defaultBaseId) || result.bases[0];
          await get().selectBase(defaultBase);
        }
      } else {
        set({
          defaultConnection: {
            ...get().defaultConnection,
            isConnected: false
          },
          loading: false
        });
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'initialisation de la connexion Airtable:', error);
      set({ loading: false });
      toast.error('Erreur de connexion Airtable');
    }
  },

  selectBase: async (base: AirtableBase) => {
    const { defaultConnection } = get();
    
    if (!defaultConnection.apiKey) {
      toast.error('Aucune connexion Airtable active');
      return;
    }

    set({ loading: true });
    
    try {
      await get().loadTables(base.id);
      
      set({
        defaultConnection: {
          ...defaultConnection,
          selectedBase: base,
          baseId: base.id
        },
        loading: false
      });
      
      toast.success(`Base "${base.name}" sélectionnée`);
    } catch (error) {
      set({ loading: false });
      toast.error('Erreur lors de la sélection de la base');
    }
  },

  loadTables: async (baseId: string) => {
    const { defaultConnection } = get();
    
    if (!defaultConnection.apiKey) {
      throw new Error('Aucune clé API disponible');
    }

    try {
      const connection: AirtableConnection = {
        id: 'default',
        user_id: 'default',
        name: 'Connexion par défaut',
        api_key: defaultConnection.apiKey,
        base_id: baseId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const tables = await airtableService.getTables(connection);
      
      set({
        defaultConnection: {
          ...defaultConnection,
          tables
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des tables:', error);
      throw error;
    }
  },

  testConnection: async () => {
    const result = await airtableService.testDefaultConnection();
    return result.success;
  }
}));