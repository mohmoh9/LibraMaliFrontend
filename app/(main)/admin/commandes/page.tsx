"use client";
// src/app/(main)/admin/commandes/page.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, ChevronDown, FileText, Search, X,
  ChevronLeft, ChevronRight, Users, TrendingUp,
  ShoppingBag, Clock, CheckCircle, XCircle,
  Filter, Calendar, SlidersHorizontal, User,
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, formatDate, formatDateCourte, statutCommandeLabel, statutCommandeColor, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import type { Order, PageResponse, OrderStats } from "@/types";

/* ── Constantes ──────────────────────────────────────────────────────────── */

type StatutCommande = "EN_ATTENTE" | "CONFIRMEE" | "EXPEDIEE" | "LIVREE" | "ANNULEE";

const STATUTS: StatutCommande[] = ["EN_ATTENTE", "CONFIRMEE", "EXPEDIEE", "LIVREE", "ANNULEE"];

const TRANSITIONS: Record<StatutCommande, StatutCommande[]> = {
  EN_ATTENTE: ["CONFIRMEE", "ANNULEE"],
  CONFIRMEE:  ["EXPEDIEE", "ANNULEE"],
  EXPEDIEE:   ["LIVREE"],
  LIVREE:     [],
  ANNULEE:    [],
};

const STATUT_ICON: Record<StatutCommande, React.ReactNode> = {
  EN_ATTENTE: <Clock className="w-3.5 h-3.5" />,
  CONFIRMEE:  <CheckCircle className="w-3.5 h-3.5" />,
  EXPEDIEE:   <ShoppingBag className="w-3.5 h-3.5" />,
  LIVREE:     <CheckCircle className="w-3.5 h-3.5" />,
  ANNULEE:    <XCircle className="w-3.5 h-3.5" />,
};

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[60, 180, 110, 100, 90, 100].map((w, i) => (
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
        {sub && <p className="text-[10px] text-encre-muted/70 mt-0.5 font-body">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Chip filtre actif ────────────────────────────────────────────────────── */
function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-encre text-ivoire
                     text-xs font-body font-medium rounded-full">
      {label}
      <button onClick={onRemove}
        className="hover:text-or transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function AdminCommandesPage() {
  /* ── Données ── */
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [stats,       setStats]       = useState<OrderStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalEls,    setTotalEls]    = useState(0);
  const [page,        setPage]        = useState(0);

  /* ── Filtres ── */
  const [filterStatut,  setFilterStatut]  = useState<string>("");
  const [searchClient,  setSearchClient]  = useState("");        // saisi en live
  const [searchDebounced, setSearchDebounced] = useState("");    // après debounce
  const [dateDebut,     setDateDebut]     = useState("");
  const [dateFin,       setDateFin]       = useState("");
  const [showDatePanel, setShowDatePanel] = useState(false);
  const datePanelRef = useRef<HTMLDivElement>(null);

  /* ── Actions ── */
  const [updatingId,    setUpdatingId]    = useState<number | null>(null);
  const [devisLoadingId,setDevisLoadingId]= useState<number | null>(null);
  const [openMenuId,    setOpenMenuId]    = useState<number | null>(null);

  /* ── Debounce recherche client (300ms) ──────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(searchClient);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchClient]);

  /* ── Fermer panel dates en cliquant ailleurs ─────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (datePanelRef.current && !datePanelRef.current.contains(e.target as Node)) {
        setShowDatePanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Chargement stats ────────────────────────────────────────────────────── */
  useEffect(() => {
    api.get("/orders/stats")
      .then(({ data }) => setStats(data?.data ?? data))
      .catch(() => {});
  }, []);

  /* ── Chargement commandes ────────────────────────────────────────────────── */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      if (filterStatut) params.set("statut", filterStatut);

      const { data } = await api.get(`/orders?${params}`);
      const payload = data?.data ?? data;
      let content: Order[] = payload?.content ?? [];

      /* ── Filtres client côté frontend ── */
      if (searchDebounced.trim()) {
        const q = searchDebounced.toLowerCase();
        content = content.filter(o =>
          o.userNom?.toLowerCase().includes(q)   ||
          o.userEmail?.toLowerCase().includes(q) ||
          String(o.id).includes(q)               ||
          String(o.userId).includes(q)
        );
      }

      /* ── Filtre par plage de dates ── */
      if (dateDebut) {
        const from = new Date(dateDebut).getTime();
        content = content.filter(o => new Date(o.dateCommande).getTime() >= from);
      }
      if (dateFin) {
        const to = new Date(dateFin + "T23:59:59").getTime();
        content = content.filter(o => new Date(o.dateCommande).getTime() <= to);
      }

      setOrders(content);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalEls(payload?.totalElements ?? content.length);
    } catch {
      toast.error("Erreur lors du chargement des commandes.");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatut, searchDebounced, dateDebut, dateFin]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* ── Changement de statut ────────────────────────────────────────────────── */
  const handleStatusChange = async (orderId: number, newStatut: string) => {
    setOpenMenuId(null);
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { statut: newStatut });
      toast.success(`Commande #${orderId} → ${statutCommandeLabel(newStatut)}`);
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Devis PDF ───────────────────────────────────────────────────────────── */
  const handleDevis = async (orderId: number) => {
    setDevisLoadingId(orderId);
    try {
      const res = await api.post(`/devis/commande/${orderId}`, {}, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `devis_${orderId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de générer le devis.");
    } finally {
      setDevisLoadingId(null);
    }
  };

  /* ── Reset tous filtres ──────────────────────────────────────────────────── */
  const resetAll = () => {
    setFilterStatut("");
    setSearchClient("");
    setSearchDebounced("");
    setDateDebut("");
    setDateFin("");
    setPage(0);
  };

  /* ── Filtres actifs ──────────────────────────────────────────────────────── */
  const hasActiveFilters = !!(filterStatut || searchDebounced || dateDebut || dateFin);
  const nbFiltres        = [filterStatut, searchDebounced, (dateDebut || dateFin)].filter(Boolean).length;

  /* ── Filtres utilisateurs uniques (pour l'autocomplétion rapide) ─────────── */
  const clientsUniques = Array.from(
    new Map(orders.map(o => [o.userId, { id: o.userId, nom: o.userNom, email: o.userEmail }])).values()
  ).slice(0, 6);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-7">

          {/* ── En-tête ──────────────────────────────────────────────── */}
          <div>
            <h1 className="font-display text-display-md font-bold text-encre">Commandes</h1>
            <p className="text-sm text-encre-muted font-body mt-0.5">
              {loading ? "Chargement…" : `${totalEls.toLocaleString("fr-FR")} commande${totalEls > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* ── KPIs stats ───────────────────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard
                label="En attente"
                value={stats.enAttente}
                icon={<Clock className="w-5 h-5" />}
                bg="bg-amber-50" col="text-amber-600"
                sub={stats.enAttente > 0 ? "À traiter" : undefined}
              />
              <KpiCard
                label="Confirmées"
                value={stats.confirmees}
                icon={<CheckCircle className="w-5 h-5" />}
                bg="bg-blue-50" col="text-blue-600"
              />
              <KpiCard
                label="Livrées"
                value={stats.livrees}
                icon={<ShoppingBag className="w-5 h-5" />}
                bg="bg-green-50" col="text-success"
              />
              <KpiCard
                label="CA total"
                value={formatPrix(stats.chiffreAffaireTotal)}
                icon={<TrendingUp className="w-5 h-5" />}
                bg="bg-or/10" col="text-or"
                sub={`Ce mois : ${formatPrix(stats.chiffreAffaireMoisEnCours)}`}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              ZONE DE FILTRES — PRINCIPALE
          ════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl shadow-card border border-sable/50 p-5 space-y-5">

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-encre-muted" />
              <span className="text-xs font-bold text-encre uppercase tracking-wider">
                Filtres & recherche
              </span>
              {nbFiltres > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-encre text-ivoire text-[10px]
                                 font-black flex items-center justify-center">
                  {nbFiltres}
                </span>
              )}
            </div>

            {/* Ligne 1 : recherche client + dates + bouton reset */}
            <div className="flex flex-wrap gap-3 items-start">

              {/* ── Recherche client ─────────────────────────────── */}
              <div className="flex-1 min-w-64">
                <label className="block text-[10px] font-bold text-encre-muted uppercase tracking-wider mb-1.5">
                  <User className="w-3 h-3 inline mr-1" />
                  Rechercher un client
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                  <input
                    value={searchClient}
                    onChange={e => setSearchClient(e.target.value)}
                    placeholder="Nom, email ou n° de commande…"
                    className="pl-9 pr-9 py-2.5 text-sm font-body bg-ivoire border border-sable-dark
                               rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-or/30
                               focus:border-or transition-all"
                  />
                  {searchClient && (
                    <button
                      onClick={() => setSearchClient("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Suggestions rapides (clients dans la page courante) */}
                {searchClient && clientsUniques.length > 0 && (
                  <div className="mt-1.5 bg-white border border-sable rounded-xl shadow-card overflow-hidden z-20">
                    <p className="px-3 py-1.5 text-[10px] text-encre-muted font-body uppercase tracking-wider
                                  border-b border-sable bg-ivoire">
                      Clients sur cette page
                    </p>
                    {clientsUniques.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSearchClient(c.nom ?? "")}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-ivoire
                                   transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-encre text-ivoire flex items-center
                                        justify-center text-[10px] font-bold shrink-0">
                          {(c.nom ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-encre">{c.nom}</p>
                          <p className="text-xs text-encre-muted">{c.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Plage de dates ───────────────────────────────── */}
              <div className="relative" ref={datePanelRef}>
                <label className="block text-[10px] font-bold text-encre-muted uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Période
                </label>
                <button
                  onClick={() => setShowDatePanel(v => !v)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body border transition-all",
                    (dateDebut || dateFin)
                      ? "bg-encre text-ivoire border-encre"
                      : "bg-ivoire text-encre-muted border-sable-dark hover:border-encre hover:text-encre"
                  )}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  {dateDebut || dateFin
                    ? `${dateDebut ? formatDateCourte(dateDebut) : "…"} → ${dateFin ? formatDateCourte(dateFin) : "…"}`
                    : "Toutes les dates"
                  }
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showDatePanel && "rotate-180")} />
                </button>

                {/* Panel dates */}
                {showDatePanel && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-2xl shadow-float
                                  border border-sable p-5 z-30 animate-fade-in">
                    <p className="text-xs font-bold text-encre uppercase tracking-wider mb-4">
                      Filtrer par période
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-encre-muted font-body uppercase tracking-wider mb-1.5">
                          Du
                        </label>
                        <input
                          type="date"
                          value={dateDebut}
                          max={dateFin || undefined}
                          onChange={e => { setDateDebut(e.target.value); setPage(0); }}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-encre-muted font-body uppercase tracking-wider mb-1.5">
                          Au
                        </label>
                        <input
                          type="date"
                          value={dateFin}
                          min={dateDebut || undefined}
                          onChange={e => { setDateFin(e.target.value); setPage(0); }}
                          className="input-field text-sm"
                        />
                      </div>
                    </div>

                    {/* Raccourcis rapides */}
                    <div className="mt-4 pt-4 border-t border-sable">
                      <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider mb-2">
                        Raccourcis
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            label: "Aujourd'hui",
                            fn: () => {
                              const t = new Date().toISOString().slice(0, 10);
                              setDateDebut(t); setDateFin(t); setPage(0);
                            },
                          },
                          {
                            label: "7 derniers jours",
                            fn: () => {
                              const fin   = new Date();
                              const debut = new Date();
                              debut.setDate(debut.getDate() - 7);
                              setDateDebut(debut.toISOString().slice(0, 10));
                              setDateFin(fin.toISOString().slice(0, 10));
                              setPage(0);
                            },
                          },
                          {
                            label: "Ce mois-ci",
                            fn: () => {
                              const now   = new Date();
                              const debut = new Date(now.getFullYear(), now.getMonth(), 1);
                              setDateDebut(debut.toISOString().slice(0, 10));
                              setDateFin(now.toISOString().slice(0, 10));
                              setPage(0);
                            },
                          },
                          {
                            label: "30 derniers jours",
                            fn: () => {
                              const fin   = new Date();
                              const debut = new Date();
                              debut.setDate(debut.getDate() - 30);
                              setDateDebut(debut.toISOString().slice(0, 10));
                              setDateFin(fin.toISOString().slice(0, 10));
                              setPage(0);
                            },
                          },
                        ].map(s => (
                          <button
                            key={s.label}
                            onClick={() => { s.fn(); setShowDatePanel(false); }}
                            className="px-3 py-2 bg-ivoire hover:bg-sable/60 rounded-lg text-xs
                                       font-body text-encre transition-colors text-left"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(dateDebut || dateFin) && (
                      <button
                        onClick={() => { setDateDebut(""); setDateFin(""); setPage(0); setShowDatePanel(false); }}
                        className="mt-3 w-full text-xs text-error hover:underline font-body font-medium flex items-center gap-1 justify-center"
                      >
                        <X className="w-3 h-3" /> Effacer les dates
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── Reset global ─────────────────────────────────── */}
              {hasActiveFilters && (
                <div className="flex flex-col justify-end">
                  <label className="block text-[10px] font-bold text-transparent uppercase tracking-wider mb-1.5 select-none">
                    reset
                  </label>
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-body font-medium
                               text-error border border-error/30 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Réinitialiser
                  </button>
                </div>
              )}
            </div>

            {/* Ligne 2 : filtre statut */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-encre-muted uppercase tracking-wider">
                <Filter className="w-3 h-3 inline mr-1" />
                Filtrer par statut
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setFilterStatut(""); setPage(0); }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-body transition-all",
                    !filterStatut
                      ? "bg-encre text-ivoire font-medium"
                      : "bg-sable text-encre-muted hover:text-encre hover:bg-sable-dark"
                  )}
                >
                  Toutes
                </button>
                {STATUTS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setFilterStatut(s); setPage(0); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-all",
                      filterStatut === s
                        ? "bg-encre text-ivoire font-medium"
                        : "bg-sable text-encre-muted hover:text-encre hover:bg-sable-dark"
                    )}
                  >
                    {STATUT_ICON[s]}
                    {statutCommandeLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {/* Chips filtres actifs */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-sable">
                <span className="text-[10px] text-encre-muted font-body uppercase tracking-wider shrink-0">
                  Filtres actifs :
                </span>
                {searchDebounced && (
                  <ActiveFilterChip
                    label={`Client : « ${searchDebounced} »`}
                    onRemove={() => { setSearchClient(""); setSearchDebounced(""); setPage(0); }}
                  />
                )}
                {filterStatut && (
                  <ActiveFilterChip
                    label={`Statut : ${statutCommandeLabel(filterStatut)}`}
                    onRemove={() => { setFilterStatut(""); setPage(0); }}
                  />
                )}
                {(dateDebut || dateFin) && (
                  <ActiveFilterChip
                    label={`Période : ${dateDebut ? formatDateCourte(dateDebut) : "…"} → ${dateFin ? formatDateCourte(dateFin) : "…"}`}
                    onRemove={() => { setDateDebut(""); setDateFin(""); setPage(0); }}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── Tableau ──────────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["#", "Client", "Date", "Montant", "Statut", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                    : orders.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 bg-sable/50 rounded-full flex items-center justify-center">
                                {searchDebounced
                                  ? <Users className="w-7 h-7 text-encre-muted" />
                                  : <ShoppingBag className="w-7 h-7 text-encre-muted" />}
                              </div>
                              <p className="font-display text-lg text-encre">
                                {searchDebounced
                                  ? `Aucune commande pour « ${searchDebounced} »`
                                  : "Aucune commande trouvée"}
                              </p>
                              <p className="text-sm text-encre-muted font-body">
                                {hasActiveFilters ? "Essayez de modifier vos filtres." : "Les commandes apparaîtront ici."}
                              </p>
                              {hasActiveFilters && (
                                <button onClick={resetAll}
                                  className="text-sm text-or hover:underline font-body font-medium">
                                  Réinitialiser tous les filtres
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                      : orders.map(order => {
                        const statut      = order.statut as StatutCommande;
                        const transitions = TRANSITIONS[statut] ?? [];
                        const isUpdating  = updatingId === order.id;

                        return (
                          <tr key={order.id} className="hover:bg-ivoire transition-colors group">
                            {/* ID */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs text-encre-muted">#CMD{order.id}</span>
                            </td>

                            {/* Client */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-encre text-ivoire flex items-center
                                                justify-center text-xs font-bold shrink-0">
                                  {(order.userNom ?? "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-encre text-sm">
                                    {/* Surlignage du terme recherché */}
                                    {searchDebounced && order.userNom?.toLowerCase().includes(searchDebounced.toLowerCase())
                                      ? (() => {
                                          const idx = order.userNom!.toLowerCase().indexOf(searchDebounced.toLowerCase());
                                          return (
                                            <>
                                              {order.userNom!.slice(0, idx)}
                                              <mark className="bg-or/30 text-encre rounded">
                                                {order.userNom!.slice(idx, idx + searchDebounced.length)}
                                              </mark>
                                              {order.userNom!.slice(idx + searchDebounced.length)}
                                            </>
                                          );
                                        })()
                                      : order.userNom}
                                  </p>
                                  <p className="text-xs text-encre-muted truncate max-w-[160px]">
                                    {order.userEmail}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3 text-encre-muted text-xs whitespace-nowrap">
                              {formatDate(order.dateCommande)}
                            </td>

                            {/* Montant */}
                            <td className="px-4 py-3">
                              <span className="font-display font-semibold text-encre">
                                {formatPrix(order.total)}
                              </span>
                              {order.montantReduction && order.montantReduction > 0 && (
                                <div>
                                <p className="text-[10px] text-success font-body">
                                  -{formatPrix(order.montantReduction)}
                                </p>
                                </div>
                              )}
                            </td>

                            {/* Statut */}
                            <td className="px-4 py-3">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                statutCommandeColor(order.statut)
                              )}>
                                {STATUT_ICON[statut]}
                                {statutCommandeLabel(order.statut)}
                              </span>
                            </td>

                            {/* Actions */}
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
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ───────────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
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

        {/* Fermer le menu dropdown en cliquant ailleurs */}
        {openMenuId !== null && (
          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
