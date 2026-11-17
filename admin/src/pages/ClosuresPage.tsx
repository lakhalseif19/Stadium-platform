import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Plus, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { Field, Stadium } from '../types';

interface ClosureRow { id: string; field_id: string; field_name: string; stadium_name: string; reason: string; reason_details: string; starts_at: string; ends_at: string; }
interface Page<T> { data: T[]; total: number; }
export const ClosuresPage: React.FC = () => {
  const [closures, setClosures] = useState<ClosureRow[]>([]); const [fields, setFields] = useState<Field[]>([]); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ field_id: '', reason: 'maintenance', reason_details: '', starts_at: '', ends_at: '' });
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rows, stadiumPage] = await Promise.all([api.get<ClosureRow[]>('/closures'), api.get<Page<Stadium>>('/stadiums?page=1&limit=100')]);
      const allFields = (await Promise.all(stadiumPage.data.map((stadium) => api.get<Field[]>(`/fields?stadium_id=${encodeURIComponent(stadium.id)}`)))).flat();
      setClosures(rows); setFields(allFields);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossible de charger les fermetures.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setNotice(null);
    try { await api.post('/closures', { ...form, starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString() }); setModal(false); setNotice('Fermeture enregistrée.'); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'La création a échoué.'); }
    finally { setSaving(false); }
  };
  return <div className="space-y-6"><div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Fermetures exceptionnelles</h1><p className="mt-1 text-sm text-gray-500">Historique chargé depuis le backend; les dates passées restent visibles.</p></div><button disabled={!fields.length} onClick={() => { setForm((current) => ({ ...current, field_id: fields[0]?.id ?? '' })); setModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4"/>Déclarer une fermeture</button></div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">La réouverture anticipée n’est pas disponible : le schéma actuel conserve les fermetures sans champ d’état/historique de réouverture.</div>
    {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}{error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">{loading && <p role="status" className="py-8 text-center">Chargement…</p>}{!loading && !error && closures.length === 0 && <p className="py-8 text-center text-gray-500">Aucune fermeture enregistrée.</p>}{!loading && closures.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-3">Terrain / stade</th><th className="p-3">Motif</th><th className="p-3">Détails</th><th className="p-3">Période</th><th className="p-3">Période actuelle</th></tr></thead><tbody className="divide-y">{closures.map((closure) => { const now = Date.now(); const current = new Date(closure.starts_at).getTime() <= now && now < new Date(closure.ends_at).getTime(); const scheduled = now < new Date(closure.starts_at).getTime(); return <tr key={closure.id}><td className="p-3"><ShieldAlert className="mr-2 inline h-4 w-4 text-amber-600"/>{closure.field_name}<div className="text-xs text-gray-500">{closure.stadium_name}</div></td><td className="p-3"><Badge variant="warning">{closure.reason}</Badge></td><td className="p-3 text-xs">{closure.reason_details || '—'}</td><td className="p-3 text-xs">{new Date(closure.starts_at).toLocaleString('fr-DZ')} – {new Date(closure.ends_at).toLocaleString('fr-DZ')}</td><td className="p-3"><Badge variant={current ? 'danger' : scheduled ? 'info' : 'neutral'}>{current ? 'En cours' : scheduled ? 'Planifiée' : 'Terminée'}</Badge></td></tr>; })}</tbody></table></div>}</div>
    <Modal isOpen={modal} onClose={() => setModal(false)} title="Déclarer une fermeture"><form onSubmit={create} className="space-y-3"><label className="block text-sm">Terrain<select required value={form.field_id} onChange={(e) => setForm((current) => ({ ...current, field_id: e.target.value }))} className="mt-1 w-full rounded border p-2">{fields.map((field) => <option key={field.id} value={field.id}>{field.name_fr} ({field.id})</option>)}</select></label><label className="block text-sm">Motif<select value={form.reason} onChange={(e) => setForm((current) => ({ ...current, reason: e.target.value }))} className="mt-1 w-full rounded border p-2">{['maintenance', 'works', 'technical_problem', 'event', 'administrative_decision', 'other'].map((reason) => <option key={reason}>{reason}</option>)}</select></label><label className="block text-sm">Détails<textarea required value={form.reason_details} onChange={(e) => setForm((current) => ({ ...current, reason_details: e.target.value }))} className="mt-1 w-full rounded border p-2"/></label><div className="grid grid-cols-2 gap-3">{(['starts_at', 'ends_at'] as const).map((key) => <label key={key} className="text-sm">{key}<input required type="datetime-local" value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} className="mt-1 w-full rounded border p-2"/></label>)}</div><button disabled={saving} className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-40">{saving ? 'Enregistrement…' : 'Confirmer'}</button></form></Modal>
  </div>;
};
