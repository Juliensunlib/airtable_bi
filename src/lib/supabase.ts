import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Mode développement sans Supabase
const isDevelopmentMode = !supabaseUrl || !supabaseAnonKey;

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