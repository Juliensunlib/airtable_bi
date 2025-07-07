import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  
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

  const handleHelpClick = () => {
    window.open('https://support.airtable.com/', '_blank');
  };

  const handleNotificationClick = () => {
    alert('Aucune nouvelle notification');
  };

  return (
    <header className="bg-white shadow-sm border-b px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center relative z-40">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 mr-4"
          title="Menu"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <button 
          onClick={handleHelpClick}
          className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          title="Aide"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        
        <button 
          onClick={handleNotificationClick}
          className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative transition-colors duration-200"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
        </button>
      </div>
    </header>
  );
}

export default Header;