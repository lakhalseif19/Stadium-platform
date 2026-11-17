import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Field, Stadium, BookingMode } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Clock, Edit2, Plus, Search } from 'lucide-react';
import { api } from '../api/client';

interface Page<T> { data: T[]; total: number; }
interface FieldPayload { stadium_id: string; name_fr: string; name_ar: string; name_en: string; booking_mode: BookingMode; opens_at: string; closes_at: string; }
export const FieldsPage: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Field | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const emptyForm: FieldPayload = { stadium_id: '', name_fr: '', name_ar: '', name_en: '', booking_mode: 'FULL_AND_HALF', opens_at: '08:00', closes_at: '23:00' };
  const [form, setForm] = useState<FieldPayload>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const stadiumPage = await api.get<Page<Stadium>>('/stadiums?page=1&limit=100');
      setStadiums(stadiumPage.data);
      const grouped = await Promise.all(stadiumPage.data.map(async (stadium) => {
        const rows = await api.get<Field[]>(`/fields?stadium_id=${encodeURIComponent(stadium.id)}`);
        return rows.map((field) => ({ ...field, stadium_name: stadium.name_fr }));
      }));
      setFields(grouped.flat());
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossible de charger les terrains.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => fields.filter((field) => `${field.name_fr} ${field.name_ar} ${field.stadium_name ?? ''}`.toLowerCase().includes(search.toLowerCase())), [fields, search]);
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, stadium_id: stadiums[0]?.id ?? '' }); setModalOpen(true); };
  const openEdit = (field: Field) => { setEditing(field); setForm({ stadium_id: field.stadium_id, name_fr: field.name_fr, name_ar: field.name_ar, name_en: field.name_en, booking_mode: field.booking_mode, opens_at: field.opens_at, closes_at: field.closes_at }); setModalOpen(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setNotice(null);
    try {
      if (editing) await api.put(`/fields/${editing.id}`, form);
      else await api.post('/fields', form);
      setModalOpen(false); setNotice(editing ? 'Terrain mis à jour.' : 'Terrain créé.'); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'La sauvegarde a échoué.'); }
    finally { setSaving(false); }
  };
  const toggle = async (field: Field) => {
    setError(null); setNotice(null);
    try { const result = await api.patch<{ id: string; is_active: boolean }>(`/fields/${field.id}/toggle-active`); setFields((current) => current.map((item) => item.id === result.id ? { ...item, is_active: result.is_active } : item)); setNotice('Disponibilité du terrain mise à jour.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'La mise à jour a échoué.'); }
  };

  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Terrains de jeu</h1><p className="mt-1 text-sm text-gray-500">Terrains chargés et gérés via l’API.</p></div><button disabled={!stadiums.length || loading} onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Nouveau terrain</button></div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Les écritures nécessitent la permission backend de gestion des terrains; l’interface affiche l’erreur API si le compte connecté ne l’a pas.</div>
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><div className="relative mb-5 max-w-md"><Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400"/><input aria-label="Rechercher un terrain" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un terrain ou stade..." className="w-full rounded-lg border px-10 py-2 text-sm"/></div>
      {notice && <p role="status" className="mb-4 text-sm text-green-700">{notice}</p>}{error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}{loading && <p role="status" className="py-8 text-center">Chargement…</p>}{!loading && !error && filtered.length === 0 && <p className="py-8 text-center text-gray-500">Aucun terrain trouvé.</p>}
      {!loading && filtered.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-3">Terrain</th><th className="p-3">Stade</th><th className="p-3">Mode</th><th className="p-3">Horaires</th><th className="p-3">État</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y">{filtered.map((field) => <tr key={field.id}><td className="p-3">{field.name_fr}</td><td className="p-3">{field.stadium_name}</td><td className="p-3">{field.booking_mode}</td><td className="p-3"><Clock className="mr-1 inline h-3.5 w-3.5"/>{field.opens_at}–{field.closes_at}</td><td className="p-3"><Badge variant={field.is_active ? 'success' : 'danger'}>{field.is_active ? 'Actif' : 'Inactif'}</Badge></td><td className="p-3"><button aria-label={`Modifier ${field.name_fr}`} onClick={() => openEdit(field)} className="mr-3"><Edit2 className="inline h-4 w-4"/></button><button onClick={() => void toggle(field)} className="text-brand-700 underline">{field.is_active ? 'Désactiver' : 'Activer'}</button></td></tr>)}</tbody></table></div>}
    </div>
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le terrain' : 'Nouveau terrain'}><form onSubmit={save} className="space-y-3"><label className="block text-sm">Stade<select required value={form.stadium_id} onChange={(e) => setForm((current) => ({ ...current, stadium_id: e.target.value }))} className="mt-1 w-full rounded border p-2">{stadiums.map((stadium) => <option key={stadium.id} value={stadium.id}>{stadium.name_fr}</option>)}</select></label>{(['name_fr', 'name_ar', 'name_en'] as const).map((key) => <label key={key} className="block text-sm">{key}<input required={key !== 'name_en'} value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} className="mt-1 w-full rounded border p-2"/></label>)}<label className="block text-sm">Mode<select value={form.booking_mode} onChange={(e) => setForm((current) => ({ ...current, booking_mode: e.target.value as BookingMode }))} className="mt-1 w-full rounded border p-2"><option value="FULL_AND_HALF">Complet / demi-terrain</option><option value="FULL_ONLY">Complet uniquement</option></select></label><div className="grid grid-cols-2 gap-3">{(['opens_at', 'closes_at'] as const).map((key) => <label key={key} className="text-sm">{key}<input required type="time" value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} className="mt-1 w-full rounded border p-2"/></label>)}</div><button disabled={saving} className="rounded bg-brand-600 px-4 py-2 text-white disabled:opacity-40">{saving ? 'Enregistrement…' : 'Enregistrer'}</button></form></Modal>
  </div>;
};
