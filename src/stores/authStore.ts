import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { User } from '../types';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Erreur lors de la récupération du profil:', error);
          // Clear invalid session
          await supabase.auth.signOut();
          set({ user: null, initialized: true });
          return;
        }

        if (profile) {
          set({ 
            user: {
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              role: profile.role,
              preferences: profile.preferences || {}
            },
            initialized: true 
          });
        }
      } else {
        // Clear any invalid tokens from storage
        await supabase.auth.signOut();
        set({ user: null, initialized: true });
      }

      // Écouter les changements d'authentification
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            set({ 
              user: {
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                role: profile.role,
                preferences: profile.preferences || {}
              }
            });
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null });
        }
      });
    } catch (error) {
      console.error('Erreur d\'initialisation:', error);
      // Clear invalid session on any error
      await supabase.auth.signOut();
      set({ user: null, initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      toast.success('Connexion réussie !');
    } catch (error: any) {
      const message = handleSupabaseError(error);
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, username: string, fullName?: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName || username
          }
        }
      });

      if (error) throw error;
      
      if (data.user && !data.session) {
        toast.success('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
      } else {
        toast.success('Inscription réussie !');
      }
    } catch (error: any) {
      const message = handleSupabaseError(error);
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      const message = handleSupabaseError(error);
      toast.error(message);
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast.success('Email de réinitialisation envoyé !');
    } catch (error: any) {
      const message = handleSupabaseError(error);
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    set({ loading: true });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          preferences: updates.preferences
        })
        .eq('id', user.id);

      if (error) throw error;

      set({ 
        user: { ...user, ...updates }
      });
      
      toast.success('Profil mis à jour !');
    } catch (error: any) {
      const message = handleSupabaseError(error);
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));