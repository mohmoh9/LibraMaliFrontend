"use client";
// src/app/(main)/admin/commandes/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronDown, FileText } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, formatDate, statutCommandeLabel, statutCommandeColor } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import type { Order, PageResponse } from "@/types";

type StatutCommande = "EN_ATTENTE" | "CONFIRMEE" | "EXPEDIEE" | "LIVREE" | "ANNULEE";
const STATUTS: StatutCommande[] = ["EN_ATTENTE", "CONFIRMEE", "EXPEDIEE", "LIVREE", "ANNULEE"];
const TRANSITIONS: Record<StatutCommande, StatutCommande[]> = {
  EN_ATTENTE: ["CONFIRMEE", "ANNULEE"],
  CONFIRMEE: ["EXPEDIEE", "ANNULEE"],
  EXPEDIEE: ["LIVREE"],
  LIVREE: [],
  ANNULEE: [],
};

export default function AdminCommandesPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [devisLoadingId, setDevisLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") { router.push("/"); return; }
  }, [isAuthenticated, role]);

  useEffect(() => { fetchOrders(); }, [page, filterStatut]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      if (filterStatut) params.set("statut", filterStatut);
      const { data } = await api.get(`/orders?${params}`);
      const paged: PageResponse<Order> = data.data;
      setOrders(paged.content);
      setTotalPages(paged.totalPages);
    } catch {
      toast.error("Erreur lors du chargement des commandes.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatut: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { statut: newStatut });
      toast.success("Statut mis à jour !");
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDevis = async (orderId: number) => {
    setDevisLoadingId(orderId);
    try {
      const res = await api.post(`/devis/commande/${orderId}`, {}, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url;
      a.download = `devis_${orderId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Impossible de générer le devis."); }
    finally { setDevisLoadingId(null); }
  };

  if (!isAuthenticated || role !== "ADMIN") return null;

  return (
          <AdminGuard>
            <AdminLayout>
    <div className="flex min-h-screen bg-ivoire">

      <main className="flex-1 p-6 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="font-display text-display-md font-bold text-encre">Commandes</h1>

          {/* Filtre statut */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setFilterStatut(""); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                !filterStatut ? "bg-encre text-ivoire" : "bg-sable text-encre-muted hover:text-encre"}`}>
              Toutes
            </button>
            {STATUTS.map(s => (
              <button key={s} onClick={() => { setFilterStatut(s); setPage(0); }}
                className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                  filterStatut === s ? "bg-encre text-ivoire" : "bg-sable text-encre-muted hover:text-encre"}`}>
                {statutCommandeLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-encre-muted" /></div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["#CMD", "Client", "Date", "Montant", "Statut", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {orders.map(order => {
                    const transitions = TRANSITIONS[order.statut as StatutCommande] ?? [];
                    return (
                      <tr key={order.id} className="hover:bg-ivoire transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-encre-muted">#CMD{order.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-encre">{order.userNom}</p>
                          <p className="text-xs text-encre-muted">{order.userEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-encre-muted">{formatDate(order.dateCommande)}</td>
                        <td className="px-4 py-3 font-display font-semibold text-encre">
                          {formatPrix(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={statutCommandeColor(order.statut)}>
                            {statutCommandeLabel(order.statut)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {transitions.length > 0 && (
                              <div className="relative group">
                                <button
                                  disabled={updatingId === order.id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-sable rounded-lg
                                             text-xs font-body text-encre hover:bg-sable-dark transition-colors">
                                  {updatingId === order.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <>Changer <ChevronDown className="w-3 h-3" /></>}
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl
                                               shadow-float border border-sable py-1 z-10
                                               opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                               transition-all duration-150">
                                  {transitions.map(t => (
                                    <button key={t} onClick={() => handleStatusChange(order.id, t)}
                                      className="block w-full text-left px-3 py-2 text-xs font-body
                                                 text-encre hover:bg-sable transition-colors">
                                      → {statutCommandeLabel(t)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button onClick={() => handleDevis(order.id)}
                              disabled={devisLoadingId === order.id}
                              className="p-1.5 text-encre-muted hover:text-encre transition-colors">
                              {devisLoadingId === order.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <FileText className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Précédent</button>
            <span className="flex items-center text-sm text-encre-muted font-body px-4">
              {page + 1} / {totalPages}
            </span>
            <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Suivant →</button>
          </div>
        )}
      </main>
    </div>
          </AdminLayout>
          </AdminGuard>
  );
}
