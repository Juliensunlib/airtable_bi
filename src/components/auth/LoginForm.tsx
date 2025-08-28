import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, User, Mail, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  
  const { login, register, resetPassword, isLoading, error } = useAuth();

  useEffect(() => {
    // Vérifier si on est en mode développement
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    setIsDevelopmentMode(!supabaseUrl || !supabaseKey);
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    // Validation côté client
    if (!email || !password) {
      showMessage('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }

    if (isRegisterMode && !username) {
      showMessage('Le nom d\'utilisateur est requis', 'error');
      return;
    }
    
    if (isRegisterMode) {
      const { error } = await register(email, password, username);
      if (!error) {
        showMessage('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.', 'success');
        setIsRegisterMode(false);
        setEmail('');
        setPassword('');
        setUsername('');
      } else {
        showMessage(error, 'error');
      }
    } else {
      const { error } = await login(email, password);
      if (error) {
        showMessage(error, 'error');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      showMessage('Veuillez entrer votre adresse email', 'error');
      return;
    }

    const { error } = await resetPassword(resetEmail);
    if (!error) {
      showMessage('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.', 'success');
      setShowForgotPassword(false);
      setResetEmail('');
    } else {
      showMessage(error, 'error');
    }
  };

  const MessageAlert = ({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) => {
    const bgColor = type === 'success' ? 'bg-green-50 border-green-500' : 
                   type === 'error' ? 'bg-red-50 border-red-500' : 
                   'bg-blue-50 border-blue-500';
    const textColor = type === 'success' ? 'text-green-700' : 
                     type === 'error' ? 'text-red-700' : 
                     'text-blue-700';
    const Icon = type === 'success' ? CheckCircle : AlertCircle;

    return (
      <div className={`${bgColor} border-l-4 p-4 rounded mb-4`}>
        <div className="flex items-center">
          <Icon className={`h-5 w-5 ${textColor} mr-2`} />
          <p className={`text-sm ${textColor}`}>{message}</p>
        </div>
      </div>
    );
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Réinitialiser le mot de passe
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {(error || message) && (
                <MessageAlert 
                  message={error || message} 
                  type={error ? 'error' : messageType} 
                />
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isRegisterMode ? 'Créer un compte' : 'Connexion à AirTableau BI'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegisterMode 
              ? 'Rejoignez-nous pour accéder à vos données' 
              : 'Accédez à votre tableau de bord Business Intelligence'
            }
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          {isDevelopmentMode && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Mode Développement</h4>
              <p className="text-xs text-yellow-700 mb-2">
                Supabase n'est pas configuré. Utilisez ces comptes de test :
              </p>
              <div className="space-y-1 text-xs text-yellow-700">
                <div><strong>Admin:</strong> admin@airtableau.com / admin123</div>
                <div><strong>Utilisateur:</strong> user@airtableau.com / user123</div>
                <div><strong>Demo:</strong> demo@airtableau.com / demo123</div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegisterMode && (
              <>
                {isDevelopmentMode && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      L'inscription n'est pas disponible en mode développement.
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'utilisateur *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                      placeholder="Votre nom d'utilisateur"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe * (min. 6 caractères)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {(error || message) && (
              <MessageAlert 
                message={error || message} 
                type={error ? 'error' : messageType} 
              />
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading 
                  ? (isRegisterMode ? 'Inscription...' : 'Connexion...') 
                  : (isRegisterMode ? 'S\'inscrire' : 'Se connecter')
                }
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setMessage('');
                  setEmail('');
                  setPassword('');
                  setUsername('');
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isRegisterMode 
                  ? 'Déjà un compte ? Se connecter' 
                  : 'Pas de compte ? S\'inscrire'
                }
              </button>
              
              {!isRegisterMode && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className={`text-sm ${isDevelopmentMode ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-500'}`}
                    disabled={isDevelopmentMode}
                  >
                    {isDevelopmentMode ? 'Mot de passe oublié ? (Non disponible)' : 'Mot de passe oublié ?'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Informations de déploiement */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Version {import.meta.env.VITE_APP_VERSION || '1.0.0'} - {isDevelopmentMode ? 'development (local)' : import.meta.env.VITE_ENVIRONMENT || 'development'}
          </p>
          {isDevelopmentMode && (
            <p className="text-xs text-yellow-600 mt-1">
              ⚠️ Mode développement - Configurez Supabase pour la production
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;