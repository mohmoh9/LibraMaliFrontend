"use client";
// src/app/(main)/mon-compte/commandes/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, FileText, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, formatDate, statutCommandeLabel, statutCommandeColor } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { Order, PageResponse } from "@/types";

export default function MesCommandesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [devisLoadingId, setDevisLoadingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchOrders();
  }, [isAuthenticated, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/my?page=${page}&size=8`);
      const paged: PageResponse<Order> = data.data;
      setOrders(paged.content);
      setTotalPages(paged.totalPages);
    } catch {
      toast.error("Impossible de charger vos commandes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm("Annuler cette commande ?")) return;
    setCancellingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      toast.success("Commande annulée.");
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  const handleDevis = async (orderId: number) => {
    setDevisLoadingId(orderId);
    try {
      const res = await api.post(`/devis/commande/${orderId}`, {}, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url;
      a.download = `devis_commande_${orderId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de générer le devis.");
    } finally {
      setDevisLoadingId(null);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* En-tête espace client */}
      <div className="flex gap-6 mb-10 border-b border-sable pb-6">
        <Link href="/mon-compte/commandes"
          className="font-body text-sm font-medium text-encre border-b-2 border-encre pb-1 -mb-[25px]">
          Mes commandes
        </Link>
        <Link href="/mon-compte/profil"
          className="font-body text-sm text-encre-muted hover:text-encre transition-colors">
          Mon profil
        </Link>
      </div>

      <h1 className="font-display text-display-md font-bold text-encre mb-8">Mes commandes</h1>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Package className="w-12 h-12 text-sable-dark mx-auto" />
          <p className="font-display text-xl text-encre">Aucune commande pour l&apos;instant</p>
          <p className="text-sm text-encre-muted font-body">Vos commandes apparaîtront ici.</p>
          <Link href="/catalogue" className="btn-primary inline-flex mt-4">
            Découvrir le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              {/* En-tête commande */}
              <div className="p-4 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-body font-medium text-encre text-sm">
                      Commande #{order.id}
                    </p>
                    <p className="text-xs text-encre-muted font-body">
                      {formatDate(order.dateCommande)}
                    </p>
                  </div>
                  <span className={statutCommandeColor(order.statut)}>
                    {statutCommandeLabel(order.statut)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-encre">
                    {formatPrix(order.total)}
                  </span>

                  {/* Actions */}
                  <button onClick={() => handleDevis(order.id)}
                    disabled={devisLoadingId === order.id}
                    title="Télécharger le devis"
                    className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors">
                    {devisLoadingId === order.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <FileText className="w-4 h-4" />}
                  </button>

                  {order.statut === "EN_ATTENTE" && (
                    <button onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                      title="Annuler la commande"
                      className="p-1.5 rounded-lg text-error hover:bg-red-50 transition-colors">
                      {cancellingId === order.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <X className="w-4 h-4" />}
                    </button>
                  )}

                  <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors">
                    {expandedId === order.id
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Détail articles */}
              {expandedId === order.id && (
                <div className="border-t border-sable px-4 pb-4 pt-3 space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm font-body">
                        <span className="text-encre-muted">
                          {item.productTitre} — {item.productAuteur} ×{item.quantite}
                        </span>
                        <span className="text-encre">{formatPrix(item.sousTotal)}</span>
                      </div>
                    ))}
                  </div>

                  {order.codePromoUtilise && (
                    <div className="flex justify-between text-sm font-body text-success">
                      <span>Code promo ({order.codePromoUtilise})</span>
                      <span>-{formatPrix((order.montantReduction ?? 0))}</span>
                    </div>
                  )}

                  {order.adresseLivraison && (
                    <p className="text-xs text-encre-muted font-body pt-2 border-t border-sable">
                      📍 {order.adresseLivraison}
                    </p>
                  )}

                  {/* Suivi livraison */}
                  {order.delivery?.numeroSuivi && (
                    <Link href={`/api/deliveries/track/${order.delivery.numeroSuivi}`}
                      className="text-xs text-or hover:underline font-body">
                      Suivi : {order.delivery.numeroSuivi}
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
            ← Précédent
          </button>
          <span className="flex items-center text-sm text-encre-muted font-body px-4">
            Page {page + 1} / {totalPages}
          </span>
          <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
