import { createClient } from '@supabase/supabase-js';

// Configuration Supabase pour la production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;

// Créer le client Supabase seulement si les variables sont disponibles
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
} else {
  console.warn('Variables Supabase manquantes - mode développement activé');
}

export { supabase };

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role: 'admin' | 'user' | 'viewer';
}

class AuthService {
  // Inscription avec email/mot de passe
  async signUp(email: string, password: string, userData: { username: string; role?: string }) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            role: userData.role || 'user'
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Erreur d\'inscription:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      return { data: null, error: this.getErrorMessage(error) };
    }
  }

  // Connexion avec email/mot de passe
  async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erreur de connexion:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      return { data: null, error: this.getErrorMessage(error) };
    }
  }

  // Déconnexion
  async signOut() {
    if (!supabase) {
      return { error: null };
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      return { error: this.getErrorMessage(error) };
    }
  }

  // Récupérer l'utilisateur actuel
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!supabase) {
      return null;
    }
    
    try {
      // Vérifier d'abord s'il y a une session active
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erreur lors de la récupération de la session:', sessionError);
        return null;
      }
      
      if (!session) {
        // Pas de session active, retourner null sans erreur
        return null;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        return null;
      }
      
      if (!user) return null;

      // Récupérer le profil utilisateur depuis la table users
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('username, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        // Fallback sur les métadonnées si le profil n'existe pas encore
        return {
          id: user.id,
          email: user.email!,
          username: user.user_metadata?.username || user.email?.split('@')[0],
          role: user.user_metadata?.role || 'user'
        };
      }

      return {
        id: user.id,
        email: user.email!,
        username: profile?.username || user.email?.split('@')[0],
        role: profile?.role || 'user'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  // Écouter les changements d'authentification
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!supabase) {
      // Retourner un mock pour éviter les erreurs
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
    
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // Réinitialiser le mot de passe
  async resetPassword(email: string) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      return { error: this.getErrorMessage(error) };
    }
  }

  // Mettre à jour le mot de passe
  async updatePassword(newPassword: string) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      return { error: this.getErrorMessage(error) };
    }
  }

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated(): Promise<boolean> {
    if (!supabase) {
      return false;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      return false;
    }
  }

  // Obtenir la session actuelle
  async getSession() {
    if (!supabase) {
      return null;
    }
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
  }

  // Gestion des messages d'erreur
  private getErrorMessage(error: any): string {
    if (error.message) {
      switch (error.message) {
        case 'Invalid login credentials':
          return 'Email ou mot de passe incorrect';
        case 'Email not confirmed':
          return 'Veuillez confirmer votre email avant de vous connecter';
        case 'User already registered':
          return 'Un compte existe déjà avec cette adresse email';
        case 'Password should be at least 6 characters':
          return 'Le mot de passe doit contenir au moins 6 caractères';
        case 'Unable to validate email address: invalid format':
          return 'Format d\'email invalide';
        case 'Signup is disabled':
          return 'Les inscriptions sont temporairement désactivées';
        default:
          return error.message;
      }
    }
    return 'Une erreur inattendue s\'est produite';
  }
}

export default new AuthService();