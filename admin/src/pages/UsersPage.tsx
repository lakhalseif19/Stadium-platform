import React, { useCallback, useEffect, useState } from 'react';
import { User } from '../types';
import { Badge } from '../components/common/Badge';
import { Search, Users, Phone, Mail } from 'lucide-react';
import { api } from '../api/client';

interface UserList { data: User[]; total: number; }
const PAGE_SIZE = 20;

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<UserList>(`/users?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`);
      setUsers(result.data);
      setTotal(result.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const toggleUser = async (user: User) => {
    setNotice(null);
    setError(null);
    try {
      const updated = await api.patch<{ id: string; is_active: boolean }>(`/users/${user.id}/toggle-active`);
      setUsers((current) => current.map((entry) => entry.id === updated.id ? { ...entry, is_active: updated.is_active } : entry));
      setNotice('Statut du compte mis à jour.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'La mise à jour a échoué.');
    }
  };

  const filtered = users.filter((user) => `${user.first_name} ${user.last_name} ${user.phone ?? ''} ${user.email ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900">Utilisateurs & Gardiens</h1><p className="text-sm text-gray-500 mt-1">Données chargées depuis l’API. La création et l’attribution des rôles ne sont pas activées dans l’interface.</p></div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6 max-w-md relative"><Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" /><input aria-label="Rechercher parmi les utilisateurs de la page" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom, téléphone ou email..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm" /></div>
      {notice && <p role="status" className="mb-4 text-sm text-green-700">{notice}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p role="status" className="py-8 text-center text-gray-500">Chargement…</p>}
      {!loading && !error && filtered.length === 0 && <p className="py-8 text-center text-gray-500">Aucun utilisateur sur cette page.</p>}
      {!loading && !error && filtered.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="py-3 px-4">Nom complet</th><th className="py-3 px-4">Contact</th><th className="py-3 px-4">Rôles</th><th className="py-3 px-4">Téléphone vérifié</th><th className="py-3 px-4">Compte</th><th className="py-3 px-4">Action</th></tr></thead>
        <tbody className="divide-y divide-gray-100">{filtered.map((user) => <tr key={user.id}>
          <td className="py-4 px-4 font-semibold"><Users className="inline w-4 h-4 mr-2 text-gray-400" />{user.first_name} {user.last_name}</td>
          <td className="py-4 px-4 text-xs">{user.phone && <div><Phone className="inline w-3 h-3 mr-1" />{user.phone}</div>}{user.email && <div><Mail className="inline w-3 h-3 mr-1" />{user.email}</div>}</td>
          <td className="py-4 px-4">{user.roles?.length ? user.roles.join(', ') : '—'}</td>
          <td className="py-4 px-4"><Badge variant={user.phone_verified ? 'success' : 'warning'}>{user.phone_verified ? 'Vérifié' : 'Non vérifié'}</Badge></td>
          <td className="py-4 px-4"><Badge variant={user.is_active ? 'success' : 'danger'}>{user.is_active ? 'Actif' : 'Bloqué'}</Badge></td>
          <td className="py-4 px-4"><button onClick={() => void toggleUser(user)} className="text-sm text-brand-700 underline">{user.is_active ? 'Désactiver' : 'Activer'}</button></td>
        </tr>)}</tbody>
      </table></div>}
      <div className="mt-5 flex items-center justify-between text-sm"><span>{total} utilisateur(s) au total</span><div className="flex gap-2"><button disabled={page === 0 || loading} onClick={() => setPage((current) => current - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Précédent</button><span className="px-2 py-1">{page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><button disabled={(page + 1) * PAGE_SIZE >= total || loading} onClick={() => setPage((current) => current + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Suivant</button></div></div>
    </div>
  </div>;
};
