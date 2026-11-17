import React from 'react';
import { ArrowRight, Building2, CalendarCheck, Layers, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  { label: 'Stades', to: '/stadiums', icon: Building2 },
  { label: 'Terrains', to: '/fields', icon: Layers },
  { label: 'Réservations', to: '/reservations', icon: CalendarCheck },
  { label: 'Usagers', to: '/users', icon: Users },
];

export const DashboardPage: React.FC = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord de gestion</h1>
      <p className="text-sm text-gray-500 mt-1">Accédez aux données opérationnelles actuelles.</p>
    </div>
    <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      Les indicateurs financiers et d’occupation ne sont pas encore fournis par l’API. Aucun chiffre de démonstration n’est affiché comme donnée réelle.
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {sections.map(({ label, to, icon: Icon }) => <Link key={to} to={to} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:border-brand-300">
        <span className="flex items-center gap-3 font-semibold text-gray-800"><Icon className="h-5 w-5 text-brand-600" />{label}</span>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </Link>)}
    </div>
  </div>
);
