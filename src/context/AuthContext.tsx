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

  useEffect(() => {
    let mounted = true;

    // Vérifier l'utilisateur actuel au chargement
    const checkUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', err);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (mounted) {
        setUser(user);
        setIsLoading(false);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
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