import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérifier si les variables d'environnement sont valides
const isValidUrl = (url: string) => {
  if (!url || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidKey = (key: string) => {
  return key && key.trim() !== '' && key.length > 10;
};

// Mode développement sans Supabase si les variables ne sont pas valides
const isDevelopmentMode = !isValidUrl(supabaseUrl) || !isValidKey(supabaseAnonKey);

export const supabase = isDevelopmentMode 
  ? null 
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

export const isSupabaseEnabled = !isDevelopmentMode;

// Helper pour les erreurs Supabase
export const handleSupabaseError = (error: any) => {
  console.error('Supabase Error:', error);
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error_description) {
    return error.error_description;
  }
  
  return 'Une erreur inattendue s\'est produite';
};