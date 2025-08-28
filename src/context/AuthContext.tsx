import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    // Vérifier l'utilisateur actuel au chargement
    const checkUser = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier d'abord si Supabase est configuré
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Variables Supabase manquantes');
          if (mounted) {
            setError('Configuration Supabase manquante. Veuillez vérifier vos variables d\'environnement.');
            setUser(null);
            setInitialized(true);
          }
          return;
        }
        
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          setInitialized(true);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', err);
        if (mounted) {
          setUser(null);
          setError('Erreur de connexion à la base de données');
          setInitialized(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkUser();

    // Écouter les changements d'authentification
    let subscription: any = null;
    
    // Seulement si Supabase est configuré
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const { data } = authService.onAuthStateChange((user) => {
        if (mounted) {
          setUser(user);
          setIsLoading(false);
          setError(null);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Fonction de fallback pour le mode développement
  const loginFallback = async (email: string, password: string) => {
    // Mode développement avec comptes locaux
    const devAccounts = [
      { email: 'admin@airtableau.com', password: 'admin123', username: 'admin', role: 'admin' as const },
      { email: 'user@airtableau.com', password: 'user123', username: 'user', role: 'user' as const },
      { email: 'demo@airtableau.com', password: 'demo123', username: 'demo', role: 'viewer' as const }
    ];

    const account = devAccounts.find(acc => acc.email === email && acc.password === password);
    
    if (account) {
      const user: AuthUser = {
        id: `dev_${account.username}`,
        email: account.email,
        username: account.username,
        role: account.role
      };
      
      // Stocker en local pour la session
      localStorage.setItem('devUser', JSON.stringify(user));
      setUser(user);
      return { error: null };
    }
    
    return { error: 'Email ou mot de passe incorrect' };
  };

  // Vérifier s'il y a un utilisateur dev en local
  useEffect(() => {
    if (!initialized) return;
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // Mode développement - vérifier le localStorage
      const devUser = localStorage.getItem('devUser');
      if (devUser) {
        try {
          const user = JSON.parse(devUser);
          setUser(user);
        } catch (err) {
          localStorage.removeItem('devUser');
        }
      }
    }
  }, [initialized]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Si Supabase n'est pas configuré, utiliser le mode développement
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Mode développement activé - Supabase non configuré');
      const result = await loginFallback(email, password);
      setIsLoading(false);
      if (result.error) {
        setError(result.error);
      }
      return result;
    }

    try {
      const { data, error } = await authService.signIn(email, password);
      
      if (error) {
        setError(error);
        return { error };
      }

      // L'utilisateur sera mis à jour via onAuthStateChange
      return { error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur de connexion';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setError('Inscription non disponible en mode développement');
      return { error: 'Inscription non disponible en mode développement' };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await authService.signUp(email, password, { username });
      
      if (error) {
        setError(error);
        return { error };
      }

      return { error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // Mode développement
      localStorage.removeItem('devUser');
      setUser(null);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors de la déconnexion:', err);
      setError('Erreur lors de la déconnexion');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setError('Réinitialisation non disponible en mode développement');
      return { error: 'Réinitialisation non disponible en mode développement' };
    }
    
    setError(null);
    try {
      const { error } = await authService.resetPassword(email);
      if (error) {
        setError(error);
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la réinitialisation';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        resetPassword,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};