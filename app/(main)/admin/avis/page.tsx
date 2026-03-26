"use client";
// src/app/(main)/admin/avis/page.tsx
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Star, Trash2, CheckCircle, Search, ChevronLeft,
  ChevronRight, Loader2, X, MessageSquare, ShieldCheck,
  AlertCircle, BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import type { Review, PageResponse } from "@/types";

/* ── Composant étoiles ───────────────────────────────────────────────────── */
function Etoiles({ note, size = "sm" }: { note: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={cn(cls, s <= note ? "text-or fill-or" : "text-sable-dark fill-sable-dark")}
        />
      ))}
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[100, 160, 180, 80, 200, 90, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Couleur note ─────────────────────────────────────────────────────────── */
function noteCouleur(note: number): string {
  if (note >= 4) return "text-success bg-green-50";
  if (note === 3) return "text-warning bg-amber-50";
  return "text-error bg-red-50";
}

export default function AdminAvisPage() {
  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterNote,  setFilterNote]  = useState<number | "">("");
  const [filterAchat, setFilterAchat] = useState<boolean | "">("");
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalEls,    setTotalEls]    = useState(0);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);
  const [expanded,    setExpanded]    = useState<number | null>(null);

  // Stats calculées localement sur la page courante
  const moyennePage = reviews.length
    ? (reviews.reduce((s, r) => s + r.note, 0) / reviews.length).toFixed(1)
    : "—";
  const verifies = reviews.filter(r => r.achatVerifie).length;

  /* ── Chargement ──────────────────────────────────────────────────────── */
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Pas d'endpoint admin global pour les avis — on pagine /api/reviews
      // en filtrant côté client pour la note (l'API filtre par produit uniquement)
      const params = new URLSearchParams({ page: String(page), size: "15" });
      const { data } = await api.get(`/reviews/admin?${params}`);
      const payload = data?.data ?? data;
      const content: Review[] = payload?.content ?? [];

      // Filtrage client (note + achat vérifié + recherche)
      let filtered = content;
      if (filterNote !== "") filtered = filtered.filter(r => r.note === filterNote);
      if (filterAchat !== "") filtered = filtered.filter(r => r.achatVerifie === filterAchat);
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(r =>
          r.userNom.toLowerCase().includes(q) ||
          r.productTitre.toLowerCase().includes(q) ||
          r.commentaire?.toLowerCase().includes(q)
        );
      }

      setReviews(filtered);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalEls(payload?.totalElements ?? content.length);
    } catch {
      // Fallback : charger les avis du premier produit ou retourner vide
      setReviews([]);
      setTotalEls(0);
      toast.error("Impossible de charger les avis.");
    } finally {
      setLoading(false);
    }
  }, [page, filterNote, filterAchat, search]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  /* ── Suppression ─────────────────────────────────────────────────────── */
  const handleDelete = async (review: Review) => {
    if (!confirm(`Supprimer l'avis de « ${review.userNom} » sur « ${review.productTitre} » ?`)) return;
    setDeletingId(review.id);
    try {
      await api.delete(`/admin/reviews/${review.id}`);
      setReviews(rs => rs.filter(r => r.id !== review.id));
      setTotalEls(n => n - 1);
      toast.success("Avis supprimé et note moyenne recalculée.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-6">

          {/* ── En-tête ─────────────────────────────────────────────── */}
          <div>
            <h1 className="font-display text-display-md font-bold text-encre">Avis clients</h1>
            <p className="text-sm text-encre-muted font-body mt-0.5">
              Modération des avis — {totalEls} avis au total
            </p>
          </div>

          {/* ── KPIs ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total avis",
                val: totalEls,
                icon: <MessageSquare className="w-4 h-4" />,
                bg: "bg-sable", col: "text-encre-muted",
              },
              {
                label: "Note moyenne",
                val: moyennePage,
                icon: <Star className="w-4 h-4" />,
                bg: "bg-or/10", col: "text-or",
              },
              {
                label: "Achats vérifiés",
                val: verifies,
                icon: <ShieldCheck className="w-4 h-4" />,
                bg: "bg-green-50", col: "text-success",
              },
              {
                label: "Non vérifiés",
                val: reviews.length - verifies,
                icon: <AlertCircle className="w-4 h-4" />,
                bg: "bg-amber-50", col: "text-warning",
              },
            ].map(k => (
              <div key={k.label} className="card p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", k.bg, k.col)}>
                  {k.icon}
                </div>
                <div>
                  <p className="font-display font-bold text-xl text-encre">{k.val}</p>
                  <p className="text-xs text-encre-muted font-body">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filtres ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Client, produit, commentaire…"
                className="pl-9 pr-9 py-2 text-sm font-body bg-white border border-sable-dark rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or w-64"
              />
              {search && (
                <button onClick={() => { setSearch(""); setPage(0); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtre note */}
            <div className="flex bg-sable/60 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => { setFilterNote(""); setPage(0); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-body transition-all",
                  filterNote === "" ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre"
                )}
              >
                Toutes
              </button>
              {[5, 4, 3, 2, 1].map(n => (
                <button
                  key={n}
                  onClick={() => { setFilterNote(n); setPage(0); }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body transition-all",
                    filterNote === n ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre"
                  )}
                >
                  {n}<Star className="w-2.5 h-2.5 fill-current" />
                </button>
              ))}
            </div>

            {/* Filtre achat vérifié */}
            <div className="flex bg-sable/60 rounded-xl p-1 gap-0.5">
              {[
                { val: "" as const,    label: "Tous" },
                { val: true as const,  label: "✓ Vérifiés" },
                { val: false as const, label: "Non vérifiés" },
              ].map(f => (
                <button
                  key={String(f.val)}
                  onClick={() => { setFilterAchat(f.val); setPage(0); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-body transition-all",
                    filterAchat === f.val
                      ? "bg-white text-encre shadow-sm font-medium"
                      : "text-encre-muted hover:text-encre"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tableau ─────────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["Auteur", "Produit", "Note", "Vérifié", "Commentaire", "Date", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                    : reviews.length === 0
                      ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <Star className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                            <p className="font-display text-lg text-encre">Aucun avis trouvé</p>
                            <p className="text-sm text-encre-muted font-body mt-1">
                              Modifiez les filtres ou revenez plus tard.
                            </p>
                          </td>
                        </tr>
                      )
                      : reviews.map(review => (
                        <>
                          <tr
                            key={review.id}
                            className="hover:bg-ivoire transition-colors group cursor-pointer"
                            onClick={() => setExpanded(expanded === review.id ? null : review.id)}
                          >
                            {/* Auteur */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-encre rounded-full flex items-center justify-center shrink-0">
                                  <span className="text-ivoire text-xs font-bold">
                                    {review.userNom.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-encre text-sm whitespace-nowrap">
                                    {review.userNom}
                                  </p>
                                  <p className="text-xs text-encre-muted">#{review.userId}</p>
                                </div>
                              </div>
                            </td>

                            {/* Produit */}
                            <td className="px-4 py-3 max-w-[180px]">
                              <Link
                                href={`/produit/${review.productId}`}
                                onClick={e => e.stopPropagation()}
                                className="text-sm text-encre hover:text-or transition-colors truncate block"
                              >
                                {review.productTitre}
                              </Link>
                            </td>

                            {/* Note */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs font-bold px-2 py-0.5 rounded-full",
                                  noteCouleur(review.note)
                                )}>
                                  {review.note}/5
                                </span>
                                <Etoiles note={review.note} />
                              </div>
                            </td>

                            {/* Achat vérifié */}
                            <td className="px-4 py-3">
                              {review.achatVerifie ? (
                                <span className="inline-flex items-center gap-1 text-xs text-success bg-green-50
                                                 px-2 py-0.5 rounded-full font-medium">
                                  <CheckCircle className="w-3 h-3" /> Vérifié
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-encre-muted
                                                 bg-sable px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" /> Non vérifié
                                </span>
                              )}
                            </td>

                            {/* Commentaire (aperçu) */}
                            <td className="px-4 py-3 max-w-[200px]">
                              {review.commentaire ? (
                                <p className="text-xs text-encre-muted truncate">
                                  {review.commentaire}
                                </p>
                              ) : (
                                <span className="text-xs text-encre-muted italic">Sans commentaire</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3 text-xs text-encre-muted whitespace-nowrap">
                              {formatDate(review.creeLe)}
                              {review.misAJourLe && (
                                <p className="text-[10px] text-encre-muted/60 mt-0.5">
                                  modifié {formatDate(review.misAJourLe)}
                                </p>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleDelete(review)}
                                disabled={deletingId === review.id}
                                className="p-1.5 rounded-lg text-encre-muted hover:text-error
                                           hover:bg-red-50 transition-colors opacity-0
                                           group-hover:opacity-100"
                                title="Supprimer cet avis"
                              >
                                {deletingId === review.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* Ligne dépliée — commentaire complet */}
                          {expanded === review.id && review.commentaire && (
                            <tr key={`${review.id}-expanded`} className="bg-ivoire">
                              <td colSpan={7} className="px-4 py-3 pl-16">
                                <div className="flex items-start gap-3">
                                  <MessageSquare className="w-4 h-4 text-encre-muted mt-0.5 shrink-0" />
                                  <p className="text-sm text-encre font-body leading-relaxed">
                                    {review.commentaire}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ──────────────────────────────────────────── */}
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
      </AdminLayout>
    </AdminGuard>
  );
}
