import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/common/Badge";
import { CreditCard, Search } from "lucide-react";
import { api } from "../api/client";

interface PaymentRow {
  id: string;
  reservation_id?: string | null;
  subscription_id?: string | null;
  amount: string | number;
  currency: string;
  status: string;
  provider_transaction_id?: string | null;
  created_at: string;
}
export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api
      .get<PaymentRow[]>("/payments?limit=100&offset=0")
      .then(setPayments)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger les paiements.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(
    () =>
      payments.filter((payment) =>
        `${payment.id} ${payment.provider_transaction_id ?? ""} ${payment.reservation_id ?? ""} ${payment.subscription_id ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [payments, search],
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Suivi des paiements
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Consultation des enregistrements de paiement existants.
        </p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Le traitement des paiements est indisponible tant qu un fournisseur reel
        et son schema de persistance ne sont pas valides. Les enregistrements
        existants ne prouvent pas une transaction bancaire.
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="relative mb-5 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            aria-label="Rechercher les paiements"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence..."
            className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm"
          />
        </div>
        {loading && (
          <p role="status" className="py-8 text-center">
            Chargement…
          </p>
        )}
        {error && (
          <p role="alert" className="py-8 text-center text-red-600">
            {error}
          </p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="py-8 text-center text-gray-500">
            Aucun paiement trouvé.
          </p>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-3">Paiement</th>
                  <th className="p-3">Cible</th>
                  <th className="p-3">Transaction provider</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Montant / devise</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((payment) => (
                  <tr key={payment.id}>
                    <td className="p-3 font-mono">
                      <CreditCard className="mr-2 inline h-4 w-4 text-brand-600" />
                      {payment.id}
                    </td>
                    <td className="p-3 text-xs">
                      {payment.reservation_id
                        ? `Réservation ${payment.reservation_id}`
                        : payment.subscription_id
                          ? `Abonnement ${payment.subscription_id}`
                          : "—"}
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {payment.provider_transaction_id ?? "—"}
                    </td>
                    <td className="p-3 text-xs">
                      {new Date(payment.created_at).toLocaleString("fr-DZ")}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          payment.status === "PAID"
                            ? "success"
                            : payment.status === "FAILED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {payment.amount} {payment.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
