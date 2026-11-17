import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Layers,
  CalendarCheck,
  CreditCard,
  Users,
  Trophy,
  ShieldAlert,
  Sliders,
  DollarSign,
  FileText,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Stades', href: '/stadiums', icon: Building2 },
  { name: 'Terrains', href: '/fields', icon: Layers },
  { name: 'Réservations', href: '/reservations', icon: CalendarCheck },
  { name: 'Abonnements', href: '/subscriptions', icon: Sliders },
  { name: 'Équipes', href: '/teams', icon: Users },
  { name: 'Tournois', href: '/tournaments', icon: Trophy },
  { name: 'Fermetures', href: '/closures', icon: ShieldAlert },
  { name: 'Tarifs & Saisons', href: '/pricing', icon: DollarSign },
  { name: 'Paiements', href: '/payments', icon: CreditCard },
  { name: 'Utilisateurs & Gardes', href: '/users', icon: Users },
  { name: 'Journaux d’audit', href: '/audit', icon: FileText },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white shadow-lg">
          S
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">STADIUM SÉTIF</h1>
          <p className="text-xs text-slate-400">Administration Wilaya 19</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 text-center">
        Version 1.0.0 — Sétif V1
      </div>
    </aside>
  );
};
