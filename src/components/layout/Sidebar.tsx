import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  Settings, 
  LogOut, 
  User,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { 
      path: '/dashboard', 
      name: 'Tableau de bord', 
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble de vos données'
    },
    { 
      path: '/connections', 
      name: 'Connexions', 
      icon: Database,
      description: 'Gérer vos bases Airtable'
    },
    { 
      path: '/reports', 
      name: 'Rapports', 
      icon: BarChart3,
      description: 'Créer et gérer vos rapports'
    },
    { 
      path: '/settings', 
      name: 'Paramètres', 
      icon: Settings,
      description: 'Configuration de l\'application'
    },
  ];

  const handleNavClick = () => {
    onClose();
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">AirTableau BI</h1>
                <p className="text-blue-100 text-sm">Business Intelligence</p>
              </div>
            </div>
            <button 
              className="p-2 rounded-lg hover:bg-blue-500 transition-colors duration-200 text-white"
              onClick={onClose}
              title="Fermer le menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {user.role === 'admin' ? 'Administrateur' : 
                   user.role === 'user' ? 'Utilisateur' : 'Visualiseur'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
                onClick={handleNavClick}
              >
                <Icon className={`mr-4 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
          >
            <LogOut size={20} className="mr-4 text-gray-500 group-hover:text-red-600" />
            <div className="flex-1 text-left">
              <div className="font-medium">Déconnexion</div>
              <div className="text-xs text-gray-500">Quitter l'application</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}