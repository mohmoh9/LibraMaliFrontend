"use client";
// src/app/(main)/admin/paiements/page.tsx
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard, Search, X, ChevronLeft, ChevronRight,
  Loader2, CheckCircle, Clock, XCircle, RotateCcw,
  TrendingUp, Banknote, Smartphone, RefreshCw,
  AlertTriangle, Copy, Eye, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, formatDate, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import Modal from "@/components/ui/Modal";
import type { Payment, StatutPaiement, MethodePaiement, PageResponse } from "@/types";

/* ── Config statuts ──────────────────────────────────────────────────────── */
type StatutKey = "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "REMBOURSE";

const STATUT_CONFIG: Record<StatutKey, {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
}> = {
  EN_ATTENTE: {
    label:  "En attente",
    icon:   <Clock className="w-3.5 h-3.5" />,
    bg:     "bg-amber-50",
    text:   "text-amber-700",
    border: "border-amber-200",
  },
  CONFIRME: {
    label:  "Confirmé",
    icon:   <CheckCircle className="w-3.5 h-3.5" />,
    bg:     "bg-green-50",
    text:   "text-success",
    border: "border-green-200",
  },
  ECHOUE: {
    label:  "Échoué",
    icon:   <XCircle className="w-3.5 h-3.5" />,
    bg:     "bg-red-50",
    text:   "text-error",
    border: "border-red-200",
  },
  REMBOURSE: {
    label:  "Remboursé",
    icon:   <RotateCcw className="w-3.5 h-3.5" />,
    bg:     "bg-purple-50",
    text:   "text-purple-700",
    border: "border-purple-200",
  },
};

/* ── Config méthodes ─────────────────────────────────────────────────────── */
const METHODE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CASH:         { label: "Espèces",      icon: <Banknote className="w-3.5 h-3.5" />,    color: "text-green-700 bg-green-50" },
  MOBILE_MONEY: { label: "Mobile Money", icon: <Smartphone className="w-3.5 h-3.5" />,  color: "text-blue-700 bg-blue-50" },
  CARTE:        { label: "Carte",        icon: <CreditCard className="w-3.5 h-3.5" />,  color: "text-purple-700 bg-purple-50" },
};

/* ── Transitions autorisées ──────────────────────────────────────────────── */
const TRANSITIONS: Record<StatutKey, StatutKey[]> = {
  EN_ATTENTE: ["CONFIRME", "ECHOUE"],
  CONFIRME:   ["REMBOURSE"],
  ECHOUE:     [],
  REMBOURSE:  [],
};

/* ── Composant badge statut ──────────────────────────────────────────────── */
function StatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_CONFIG[statut as StatutKey] ?? STATUT_CONFIG.EN_ATTENTE;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      cfg.bg, cfg.text, cfg.border
    )}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ── Composant badge méthode ─────────────────────────────────────────────── */
function MethodeBadge({ methode }: { methode: string }) {
  const cfg = METHODE_CONFIG[methode] ?? { label: methode, icon: <CreditCard className="w-3.5 h-3.5" />, color: "text-encre-muted bg-sable" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", cfg.color)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[60, 100, 160, 110, 120, 100, 90, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon, bg, col, sub }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  bg: string; col: string; sub?: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg, col)}>
        {icon}
      </div>
      <div>
        <p className="font-display font-bold text-2xl text-encre leading-tight">{value}</p>
        <p className="text-xs text-encre-muted font-body">{label}</p>
        {sub && <p className="text-[10px] text-encre-muted font-body mt-0.5 opacity-70">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────────────── */
export default function AdminPaiementsPage() {
  const [payments,    setPayments]    = useState<Payment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterStatut,setFilterStatut]= useState<StatutKey | "">("");
  const [filterMeth,  setFilterMeth]  = useState<string>("");
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalEls,    setTotalEls]    = useState(0);

  // Modale détail
  const [detailPay,   setDetailPay]   = useState<Payment | null>(null);
  const [detailOpen,  setDetailOpen]  = useState(false);

  // Changement de statut
  const [updatingId,  setUpdatingId]  = useState<number | null>(null);
  const [openMenuId,  setOpenMenuId]  = useState<number | null>(null);

  /* ── Stats KPI calculées ─────────────────────────────────────────────── */
  const caTotal        = payments.filter(p => p.statut === "CONFIRME").reduce((s, p) => s + p.montant, 0);
  const nbEnAttente    = payments.filter(p => p.statut === "EN_ATTENTE").length;
  const nbRembourses   = payments.filter(p => p.statut === "REMBOURSE").length;
  const nbEchoues      = payments.filter(p => p.statut === "ECHOUE").length;

  /* ── Chargement ─────────────────────────────────────────────────────── */
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      if (filterStatut) params.set("statut", filterStatut);

      const { data } = await api.get(`/admin/payments?${params}`);
      const payload  = data?.data ?? data;
      let content: Payment[] = payload?.content ?? [];

      // Filtrage client : méthode + recherche texte
      if (filterMeth) {
        content = content.filter(p => p.methode === filterMeth);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        content = content.filter(p =>
          String(p.id).includes(q)                         ||
          String(p.orderId).includes(q)                    ||
          p.userNom?.toLowerCase().includes(q)             ||
          p.userEmail?.toLowerCase().includes(q)           ||
          p.referenceTransaction?.toLowerCase().includes(q)
        );
      }

      setPayments(content);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalEls(payload?.totalElements ?? content.length);
    } catch {
      toast.error("Impossible de charger les paiements.");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatut, filterMeth, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  /* ── Changement de statut ────────────────────────────────────────────── */
  const handleStatutChange = async (payment: Payment, newStatut: StatutKey) => {
    setOpenMenuId(null);
    setUpdatingId(payment.id);
    try {
      const { data } = await api.patch(
        `/admin/payments/${payment.id}/statut?statut=${newStatut}`
      );
      const updated: Payment = data?.data ?? data;
      setPayments(ps => ps.map(p => p.id === payment.id ? { ...p, statut: newStatut as StatutPaiement } : p));
      if (detailPay?.id === payment.id) {
        setDetailPay(prev => prev ? { ...prev, statut: newStatut as StatutPaiement } : null);
      }
      toast.success(`Paiement #${payment.id} → ${STATUT_CONFIG[newStatut].label}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Copier référence ────────────────────────────────────────────────── */
  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref).then(() => toast.success("Référence copiée !"));
  };

  /* ── Ouvrir détail ───────────────────────────────────────────────────── */
  const openDetail = async (payment: Payment) => {
    // Charger les détails complets
    try {
      const { data } = await api.get(`/admin/payments/${payment.id}`);
      setDetailPay(data?.data ?? data);
    } catch {
      setDetailPay(payment);
    }
    setDetailOpen(true);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-7">

          {/* ── En-tête ──────────────────────────────────────────────── */}
          <div>
            <h1 className="font-display text-display-md font-bold text-encre">Paiements</h1>
            <p className="text-sm text-encre-muted font-body mt-0.5">
              {totalEls} paiement{totalEls > 1 ? "s" : ""} enregistré{totalEls > 1 ? "s" : ""}
            </p>
          </div>

          {/* ── KPIs ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="CA confirmé"
              value={formatPrix(caTotal)}
              icon={<TrendingUp className="w-5 h-5" />}
              bg="bg-green-50" col="text-success"
            />
            <KpiCard
              label="En attente"
              value={nbEnAttente}
              icon={<Clock className="w-5 h-5" />}
              bg="bg-amber-50" col="text-amber-600"
              sub={nbEnAttente > 0 ? "À confirmer" : undefined}
            />
            <KpiCard
              label="Remboursés"
              value={nbRembourses}
              icon={<RotateCcw className="w-5 h-5" />}
              bg="bg-purple-50" col="text-purple-600"
            />
            <KpiCard
              label="Échoués"
              value={nbEchoues}
              icon={<XCircle className="w-5 h-5" />}
              bg="bg-red-50" col="text-error"
            />
          </div>

          {/* Alerte paiements en attente */}
          {nbEnAttente > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 font-body">
                <strong>{nbEnAttente} paiement{nbEnAttente > 1 ? "s" : ""} Mobile Money</strong> attend{nbEnAttente > 1 ? "ent" : ""} votre confirmation.
              </p>
              <button
                onClick={() => { setFilterStatut("EN_ATTENTE"); setPage(0); }}
                className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
              >
                Voir →
              </button>
            </div>
          )}

          {/* ── Filtres ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="ID, client, référence…"
                className="pl-9 pr-9 py-2 text-sm font-body bg-white border border-sable-dark rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or w-60"
              />
              {search && (
                <button onClick={() => { setSearch(""); setPage(0); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtre statut */}
            <div className="flex bg-sable/60 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => { setFilterStatut(""); setPage(0); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-body transition-all",
                  !filterStatut ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre"
                )}
              >
                Tous
              </button>
              {(Object.keys(STATUT_CONFIG) as StatutKey[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setFilterStatut(s); setPage(0); }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body transition-all whitespace-nowrap",
                    filterStatut === s
                      ? "bg-white text-encre shadow-sm font-medium"
                      : "text-encre-muted hover:text-encre"
                  )}
                >
                  {STATUT_CONFIG[s].label}
                </button>
              ))}
            </div>

            {/* Filtre méthode */}
            <div className="flex bg-sable/60 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => { setFilterMeth(""); setPage(0); }}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-body transition-all",
                  !filterMeth ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre")}>
                Toutes
              </button>
              {Object.entries(METHODE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setFilterMeth(key); setPage(0); }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body transition-all whitespace-nowrap",
                    filterMeth === key
                      ? "bg-white text-encre shadow-sm font-medium"
                      : "text-encre-muted hover:text-encre"
                  )}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tableau ──────────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["#", "Client", "Commande", "Méthode", "Montant", "Statut", "Date", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                    : payments.length === 0
                      ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center">
                            <CreditCard className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                            <p className="font-display text-lg text-encre">Aucun paiement trouvé</p>
                            <p className="text-sm text-encre-muted font-body mt-1">
                              Modifiez les filtres ou revenez plus tard.
                            </p>
                          </td>
                        </tr>
                      )
                      : payments.map(payment => {
                        const statut     = payment.statut as StatutKey;
                        const transitions = TRANSITIONS[statut] ?? [];
                        const isUpdating  = updatingId === payment.id;

                        return (
                          <tr
                            key={payment.id}
                            onClick={() => openDetail(payment)}
                            className="hover:bg-ivoire transition-colors group cursor-pointer"
                          >
                            {/* ID */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs text-encre-muted">#{payment.id}</span>
                            </td>

                            {/* Client */}
                            <td className="px-4 py-3">
                              {payment.userNom ? (
                                <div>
                                  <p className="font-medium text-encre text-sm">{payment.userNom}</p>
                                  <p className="text-xs text-encre-muted truncate max-w-[140px]">
                                    {payment.userEmail}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-encre-muted">—</span>
                              )}
                            </td>

                            {/* Commande */}
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <Link
                                href="/admin/commandes"
                                className="inline-flex items-center gap-1 text-xs text-or hover:underline font-mono"
                              >
                                #CMD{payment.orderId}
                              </Link>
                            </td>

                            {/* Méthode */}
                            <td className="px-4 py-3">
                              <MethodeBadge methode={payment.methode} />
                            </td>

                            {/* Montant */}
                            <td className="px-4 py-3">
                              <span className="font-display font-bold text-encre">
                                {formatPrix(payment.montant)}
                              </span>
                            </td>

                            {/* Statut */}
                            <td className="px-4 py-3">
                              <StatutBadge statut={payment.statut} />
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3 text-xs text-encre-muted whitespace-nowrap">
                              {formatDate(payment.datePaiement)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">

                                {/* Bouton détail */}
                                <button
                                  onClick={() => openDetail(payment)}
                                  className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors"
                                  title="Voir le détail"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Menu changement de statut */}
                                {transitions.length > 0 && (
                                  <div className="relative">
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => setOpenMenuId(openMenuId === payment.id ? null : payment.id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-sable rounded-lg
                                                 text-xs font-body text-encre hover:bg-sable-dark transition-colors"
                                    >
                                      {isUpdating
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <RefreshCw className="w-3 h-3" />}
                                      <ChevronDown className="w-3 h-3" />
                                    </button>

                                    {openMenuId === payment.id && (
                                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl
                                                      shadow-float border border-sable py-1 z-20 animate-fade-in">
                                        <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-encre-muted font-body">
                                          Changer le statut
                                        </p>
                                        {transitions.map(t => {
                                          const cfg = STATUT_CONFIG[t];
                                          return (
                                            <button
                                              key={t}
                                              onClick={() => handleStatutChange(payment, t)}
                                              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-body
                                                         hover:bg-sable transition-colors"
                                            >
                                              <span className={cn("flex items-center gap-1 font-medium", cfg.text)}>
                                                {cfg.icon} {cfg.label}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ───────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-full border border-sable-dark text-encre-muted
                           hover:border-encre hover:text-encre disabled:opacity-40 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-encre-muted font-body px-3">
                Page {page + 1} sur {totalPages}
              </span>
              <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-full border border-sable-dark text-encre-muted
                           hover:border-encre hover:text-encre disabled:opacity-40 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Modale détail paiement ────────────────────────────────── */}
        <Modal
          open={detailOpen}
          onClose={() => { setDetailOpen(false); setDetailPay(null); }}
          title={detailPay ? `Paiement #${detailPay.id}` : "Détail"}
          size="md"
        >
          {detailPay && (
            <div className="space-y-6">

              {/* Statut + méthode */}
              <div className="flex items-center gap-3 flex-wrap">
                <StatutBadge statut={detailPay.statut} />
                <MethodeBadge methode={detailPay.methode} />
                <span className="ml-auto font-display font-bold text-2xl text-encre">
                  {formatPrix(detailPay.montant)}
                </span>
              </div>

              {/* Infos principales */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "ID paiement",  value: `#${detailPay.id}` },
                  { label: "Commande",     value: `#${detailPay.orderId}`, link: "/admin/commandes" },
                  { label: "Date",         value: formatDate(detailPay.datePaiement) },
                  { label: "Montant",      value: formatPrix(detailPay.montant) },
                ].map(item => (
                  <div key={item.label} className="bg-sable/30 rounded-xl p-3">
                    <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-1">
                      {item.label}
                    </p>
                    {item.link ? (
                      <Link href={item.link}
                        className="font-mono font-bold text-or text-sm hover:underline">
                        {item.value}
                      </Link>
                    ) : (
                      <p className="font-mono font-semibold text-encre text-sm">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Référence transaction */}
              {detailPay.referenceTransaction && (
                <div className="p-4 bg-sable/30 rounded-xl">
                  <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-2">
                    Référence de transaction
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-encre bg-white px-3 py-1.5 rounded-lg border border-sable-dark flex-1 truncate">
                      {detailPay.referenceTransaction}
                    </code>
                    <button
                      onClick={() => copyRef(detailPay.referenceTransaction!)}
                      className="p-2 rounded-lg text-encre-muted hover:text-encre hover:bg-sable transition-colors"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Client */}
              {detailPay.userNom && (
                <div className="p-4 bg-sable/30 rounded-xl">
                  <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-2">Client</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-encre rounded-full flex items-center justify-center shrink-0">
                      <span className="text-ivoire text-sm font-bold">
                        {detailPay.userNom.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-encre text-sm">{detailPay.userNom}</p>
                      <p className="text-xs text-encre-muted">{detailPay.userEmail}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Machine d'états — transitions disponibles */}
              {(() => {
                const statut     = detailPay.statut as StatutKey;
                const transitions = TRANSITIONS[statut] ?? [];
                if (transitions.length === 0) return null;

                return (
                  <div className="border-t border-sable pt-5 space-y-3">
                    <p className="text-xs font-body uppercase tracking-wider text-encre-muted">
                      Changer le statut
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {transitions.map(t => {
                        const cfg = STATUT_CONFIG[t];
                        const isUpdating = updatingId === detailPay.id;

                        return (
                          <button
                            key={t}
                            onClick={() => handleStatutChange(detailPay, t)}
                            disabled={isUpdating}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium",
                              "border transition-all disabled:opacity-50",
                              cfg.bg, cfg.text, cfg.border,
                              "hover:shadow-sm"
                            )}
                          >
                            {isUpdating
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : cfg.icon}
                            Marquer comme {cfg.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explication des transitions */}
                    <p className="text-xs text-encre-muted font-body">
                      {statut === "EN_ATTENTE" &&
                        "Confirmez la réception du paiement Mobile Money, ou marquez-le comme échoué si la transaction n'a pas abouti."}
                      {statut === "CONFIRME" &&
                        "Le remboursement s'effectue manuellement. Assurez-vous d'avoir rendu les fonds au client avant de valider."}
                    </p>
                  </div>
                );
              })()}

              {/* Badge statut terminal */}
              {(detailPay.statut === "ECHOUE" || detailPay.statut === "REMBOURSE") && (
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-xl text-xs font-body border",
                  detailPay.statut === "ECHOUE"
                    ? "bg-red-50 text-error border-red-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
                )}>
                  <XCircle className="w-4 h-4 shrink-0" />
                  {detailPay.statut === "ECHOUE"
                    ? "Ce paiement a échoué. Pour une nouvelle tentative, le client doit soumettre un nouveau paiement."
                    : "Ce paiement a été remboursé. Le cycle est terminé."}
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Fermer le menu dropdown en cliquant ailleurs */}
        {openMenuId !== null && (
          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
