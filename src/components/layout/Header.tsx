import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Menu, Bell, Search, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Tableau de bord';
      case '/connections':
        return 'Connexions Airtable';
      case '/reports':
        return 'Rapports';
      case '/settings':
        return 'Paramètres';
      default:
        return 'AirTableau BI';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Vue d\'ensemble de vos données et analyses';
      case '/connections':
        return 'Gérez vos connexions aux bases Airtable';
      case '/reports':
        return 'Créez et gérez vos rapports personnalisés';
      case '/settings':
        return 'Configurez vos préférences';
      default:
        return '';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b px-4 sm:px-6 lg:px-8 py-4 relative z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 mr-4 lg:hidden"
            title="Menu"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
            <p className="text-sm text-gray-500 hidden sm:block">{getPageDescription()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search - Hidden on mobile */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            />
          </div>
          
          {/* Notifications */}
          <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative transition-colors duration-200">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="ml-2 hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {user?.full_name || user?.username}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}