import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Stadium } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Search, Building2, MapPin, Edit2 } from 'lucide-react';
import { api } from '../api/client';

interface StadiumList { data: Stadium[]; total: number; }
export const StadiumsPage: React.FC = () => {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Stadium | null>(null);
  const [form, setForm] = useState({ name_fr: '', name_ar: '', name_en: '', address: '' });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const result = await api.get<StadiumList>('/stadiums?page=1&limit=100'); setStadiums(result.data); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossible de charger les stades.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => stadiums.filter((item) => `${item.name_fr} ${item.name_ar} ${item.address} ${item.commune_name ?? ''}`.toLowerCase().includes(search.toLowerCase())), [stadiums, search]);
  const openEdit = (stadium: Stadium) => { setEditing(stadium); setForm({ name_fr: stadium.name_fr, name_ar: stadium.name_ar, name_en: stadium.name_en, address: stadium.address }); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editing) return;
    setError(null); setNotice(null);
    try {
      const updated = await api.put<Stadium>(`/stadiums/${editing.id}`, { ...form, commune_id: editing.commune_id });
      setStadiums((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated, commune_name: item.commune_name, fields_count: item.fields_count } : item));
      setEditing(null); setNotice('Stade mis à jour.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'La mise à jour a échoué.'); }
  };
  const toggle = async (stadium: Stadium) => {
    setError(null); setNotice(null);
    try {
      const result = await api.patch<{ id: string; is_active: boolean }>(`/stadiums/${stadium.id}/toggle-active`);
      setStadiums((current) => current.map((item) => item.id === result.id ? { ...item, is_active: result.is_active } : item)); setNotice('Statut du stade mis à jour.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'La mise à jour a échoué.'); }
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900">Gestion des Stades</h1><p className="text-sm text-gray-500 mt-1">Données et mises à jour issues de l’API.</p></div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">La création est indisponible : aucune API de référence des communes n’est exposée pour fournir un `commune_id` valide.</div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="relative mb-5 max-w-md"><Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" /><input aria-label="Rechercher un stade" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, commune ou adresse..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm" /></div>
      {notice && <p role="status" className="mb-4 text-sm text-green-700">{notice}</p>}{error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p role="status" className="py-8 text-center text-gray-500">Chargement…</p>}{!loading && !error && filtered.length === 0 && <p className="py-8 text-center text-gray-500">Aucun stade trouvé.</p>}
      {!loading && filtered.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="p-3">Stade</th><th className="p-3">Commune / Adresse</th><th className="p-3">Terrains</th><th className="p-3">État</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y">{filtered.map((stadium) => <tr key={stadium.id}>
        <td className="p-3"><Building2 className="inline h-4 w-4 mr-2 text-gray-400" />{stadium.name_fr}</td><td className="p-3"><MapPin className="inline h-3 w-3 mr-1" />{stadium.commune_name ?? '—'}<div className="text-xs text-gray-500">{stadium.address}</div></td><td className="p-3">{stadium.fields_count ?? '—'}</td><td className="p-3"><Badge variant={stadium.is_active ? 'success' : 'danger'}>{stadium.is_active ? 'Actif' : 'Inactif'}</Badge></td><td className="p-3"><button aria-label={`Modifier ${stadium.name_fr}`} onClick={() => openEdit(stadium)} className="mr-3"><Edit2 className="inline h-4 w-4" /></button><button onClick={() => void toggle(stadium)} className="text-brand-700 underline">{stadium.is_active ? 'Désactiver' : 'Activer'}</button></td>
      </tr>)}</tbody></table></div>}
      <button onClick={() => void load()} disabled={loading} className="mt-4 rounded border px-3 py-1 disabled:opacity-40">Actualiser</button>
    </div>
    <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title="Modifier le stade"><form onSubmit={save} className="space-y-4">{(['name_fr', 'name_ar', 'name_en', 'address'] as const).map((key) => <label key={key} className="block text-sm">{key}<input required={key !== 'name_en'} value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} className="mt-1 w-full rounded border p-2" /></label>)}<button className="rounded bg-brand-600 px-4 py-2 text-white">Enregistrer</button></form></Modal>
  </div>;
};
