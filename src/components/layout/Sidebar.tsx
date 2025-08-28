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
  X,
  Shield,
  Eye
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
      path: '/dashboards', 
      name: 'Tableaux de bord', 
      icon: LayoutDashboard,
      description: 'Organiser vos rapports'
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'viewer':
        return 'Visualiseur';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
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
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
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
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <User size={20} className="text-white" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {user.full_name || user.username}
                </p>
                <p className="text-xs text-gray-500 mb-1">@{user.username}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1">{getRoleLabel(user.role)}</span>
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
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm' 
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