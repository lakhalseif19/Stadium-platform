import React, { useEffect, useState } from 'react';
import { AuditLog } from '../types';
import { Clock } from 'lucide-react';
import { api } from '../api/client';

interface AuditPage { data: AuditLog[]; total: number; }
export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.get<AuditPage>('/audit?limit=100&offset=0').then((result) => { setLogs(result.data); setTotal(result.total); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Impossible de charger les journaux.')).finally(() => setLoading(false)); }, []);
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-gray-900">Journaux d’audit</h1><p className="mt-1 text-sm text-gray-500">{total} entrée(s) rapportées par l’API; affichage des 100 plus récentes.</p></div><div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
    {loading && <p role="status" className="py-8 text-center">Chargement…</p>}{error && <p role="alert" className="py-8 text-center text-red-600">{error}</p>}{!loading && !error && logs.length === 0 && <p className="py-8 text-center text-gray-500">Aucune entrée d’audit.</p>}
    {!loading && !error && logs.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-3">Horodatage</th><th className="p-3">Action</th><th className="p-3">Entité</th><th className="p-3">Adresse IP</th><th className="p-3">Valeurs après modification</th></tr></thead><tbody className="divide-y">{logs.map((log) => <tr key={log.id}><td className="p-3 text-xs"><Clock className="mr-1 inline h-3.5 w-3.5"/>{new Date(log.created_at).toLocaleString('fr-DZ')}</td><td className="p-3 font-mono text-xs">{log.action}</td><td className="p-3 text-xs">{log.entity_type}<div className="text-gray-400">{log.entity_id}</div></td><td className="p-3 font-mono text-xs">{log.ip_address ?? '—'}</td><td className="p-3"><pre className="max-w-sm overflow-x-auto rounded border bg-gray-50 p-2 text-[11px]">{JSON.stringify(log.new_values, null, 2) ?? '—'}</pre></td></tr>)}</tbody></table></div>}
  </div></div>;
};
