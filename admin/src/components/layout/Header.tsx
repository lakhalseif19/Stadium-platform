import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Système de Gestion Numérique des Stades de Football
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="h-6 w-[1px] bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
            {user ? `${user.first_name[0]}${user.last_name[0]}` : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-900 leading-tight">
              {user ? `${user.first_name} ${user.last_name}` : 'Administrateur'}
            </p>
            <p className="text-[10px] text-gray-400">Direction des Sports (DJS)</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-2"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
