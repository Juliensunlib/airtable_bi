import React, { useState } from 'react';
import { Save, User, Lock, Bell, UserPlus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

function Settings() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    language: 'fr',
    notifications: true,
    darkMode: false
  });
  const [users, setUsers] = useState<any[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  React.useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const { data, error } = await authService.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Créer l'utilisateur via Supabase Auth
      const { data, error } = await authService.signUp(
        newUser.email,
        newUser.password,
        { username: newUser.username, role: newUser.role }
      );

      if (error) {
        throw new Error(error);
      }

      setMessage('Utilisateur créé avec succès !');
      setMessageType('success');
      setNewUser({ email: '', username: '', password: '', role: 'user' });
      setShowUserForm(false);
      loadUsers();
    } catch (error: any) {
      setMessage(error.message || 'Erreur lors de la création de l\'utilisateur');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const { error } = await authService.supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setMessage('Utilisateur supprimé avec succès');
      setMessageType('success');
      loadUsers();
    } catch (error: any) {
      setMessage(error.message || 'Erreur lors de la suppression');
      setMessageType('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Paramètres sauvegardés:', formData);
    setMessage('Paramètres sauvegardés avec succès !');
    setMessageType('success');
  };

  const MessageAlert = ({ message, type }: { message: string; type: 'success' | 'error' }) => {
    if (!message) return null;
    
    const bgColor = type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
    const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';

    return (
      <div className={`${bgColor} border-l-4 p-4 rounded mb-4`}>
        <p className={`text-sm ${textColor}`}>{message}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-600 mt-1">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
        
        <MessageAlert message={message} type={messageType} />
        
        <div className="bg-white shadow-sm rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center mb-4">
                        <User className="h-5 w-5 text-gray-500 mr-2" />
                        Profil
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Adresse email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                            Langue
                          </label>
                          <select
                            id="language"
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center mb-4">
                        <Bell className="h-5 w-5 text-gray-500 mr-2" />
                        Préférences
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            id="notifications"
                            name="notifications"
                            type="checkbox"
                            checked={formData.notifications}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                            Activer les notifications
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="darkMode"
                            name="darkMode"
                            type="checkbox"
                            checked={formData.darkMode}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-700">
                            Mode sombre
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center mb-4">
                        <Lock className="h-5 w-5 text-gray-500 mr-2" />
                        Sécurité
                      </h3>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Changer le mot de passe
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Gestion des utilisateurs - Admins seulement */}
        {user?.role === 'admin' && (
          <div className="bg-white shadow-sm rounded-xl overflow-hidden">
            <div className="px-6 py-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                  <UserPlus className="h-5 w-5 text-gray-500 mr-2" />
                  Gestion des utilisateurs
                </h3>
                <button
                  onClick={() => setShowUserForm(!showUserForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {showUserForm ? 'Annuler' : 'Nouvel utilisateur'}
                </button>
              </div>

              {showUserForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Créer un nouvel utilisateur</h4>
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="utilisateur@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom d'utilisateur *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nom Prénom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Minimum 6 caractères"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                      </label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                        <option value="viewer">Visualiseur</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowUserForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Création...' : 'Créer l\'utilisateur'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Liste des utilisateurs */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Créé le
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {userItem.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userItem.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : userItem.role === 'user'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userItem.role === 'admin' ? 'Administrateur' : 
                             userItem.role === 'user' ? 'Utilisateur' : 'Visualiseur'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userItem.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {userItem.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun utilisateur trouvé
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;