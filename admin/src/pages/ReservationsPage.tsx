import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/common/Badge';
import { Search, Calendar, Filter, QrCode } from 'lucide-react';
import { api } from '../api/client';

interface ReservationRow {
  id: string;
  user_name: string;
  field_name: string;
  stadium_name: string;
  coverage: string;
  type: string;
  starts_at: string;
  ends_at: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'PENDING_PAYMENT' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';
}

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ReservationRow[]>('/reservations').then(setReservations)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Impossible de charger les réservations.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => reservations.filter((r) => {
    const query = searchTerm.toLowerCase();
    return (r.user_name?.toLowerCase().includes(query) || r.stadium_name?.toLowerCase().includes(query) || r.field_name?.toLowerCase().includes(query))
      && (statusFilter === 'ALL' || r.status === statusFilter);
  }), [reservations, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Réservations</h1>
        <p className="text-sm text-gray-500 mt-1">Réservations renvoyées par le service backend.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input aria-label="Rechercher les réservations" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher par usager, stade ou terrain..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select aria-label="Filtrer par statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="ALL">Tous les statuts</option>
              {['CONFIRMED', 'CHECKED_IN', 'PENDING_PAYMENT', 'CANCELLED', 'EXPIRED', 'COMPLETED'].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>
        {loading && <p role="status" className="py-8 text-center text-gray-500">Chargement…</p>}
        {error && <p role="alert" className="py-8 text-center text-red-600">{error}</p>}
        {!loading && !error && filtered.length === 0 && <p className="py-8 text-center text-gray-500">Aucune réservation trouvée.</p>}
        {!loading && !error && filtered.length > 0 && <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium"><tr><th className="py-3 px-4">Usager / ID</th><th className="py-3 px-4">Stade & Terrain</th><th className="py-3 px-4">Couverture</th><th className="py-3 px-4">Créneau</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Statut</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{filtered.map((r) => <tr key={r.id}>
              <td className="py-4 px-4 font-medium">{r.user_name || '—'}<div className="text-[11px] text-gray-400 font-mono flex items-center gap-1"><QrCode className="w-3 h-3" />{r.id}</div></td>
              <td className="py-4 px-4"><div>{r.stadium_name}</div><div className="text-xs text-gray-400">{r.field_name}</div></td>
              <td className="py-4 px-4">{r.coverage}</td>
              <td className="py-4 px-4 text-xs"><Calendar className="inline w-3.5 h-3.5 mr-1" />{new Date(r.starts_at).toLocaleString('fr-DZ')} – {new Date(r.ends_at).toLocaleTimeString('fr-DZ')}</td>
              <td className="py-4 px-4">{r.type}</td>
              <td className="py-4 px-4"><Badge variant={r.status === 'CONFIRMED' ? 'success' : r.status === 'CHECKED_IN' ? 'info' : r.status === 'PENDING_PAYMENT' ? 'warning' : 'danger'}>{r.status}</Badge></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </div>
    </div>
  );
};
