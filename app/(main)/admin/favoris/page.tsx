"use client";
// src/app/(main)/admin/favoris/page.tsx
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart, Trash2, Search, ChevronLeft, ChevronRight,
  Loader2, X, Users, BookOpen, TrendingUp, ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, formatDate, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import type { PageResponse } from "@/types";

/* ── Types locaux ────────────────────────────────────────────────────────── */
interface FavoriAdmin {
  id:              number;
  productId:       number;
  productTitre:    string;
  productAuteur:   string;
  productImageUrl?: string;
  productPrix:     number;
  productActif:    boolean;
  ajouteLe:        string;
  // enrichi côté liste
  userId?:         number;
  userNom?:        string;
}

interface TopProduit {
  productId:    number;
  productTitre: string;
  productAuteur: string;
  productImageUrl?: string;
  productPrix:  number;
  nbFavoris:    number;
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[44, 200, 160, 90, 100, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="skeleton w-10 h-14 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/4 rounded" />
      </div>
    </div>
  );
}

export default function AdminFavorisPage() {
  const [favoris,     setFavoris]     = useState<FavoriAdmin[]>([]);
  const [topProduits, setTopProduits] = useState<TopProduit[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingTop,  setLoadingTop]  = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterActif, setFilterActif] = useState<boolean | "">("");
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalEls,    setTotalEls]    = useState(0);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);

  /* ── Chargement favoris ──────────────────────────────────────────────── */
  const fetchFavoris = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      const { data } = await api.get(`/admin/favoris?${params}`);
      const payload = data?.data ?? data;
      let content: FavoriAdmin[] = payload?.content ?? [];

      // Filtrage client
      if (filterActif !== "") {
        content = content.filter(f => f.productActif === filterActif);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        content = content.filter(f =>
          f.productTitre.toLowerCase().includes(q) ||
          f.productAuteur.toLowerCase().includes(q) ||
          f.userNom?.toLowerCase().includes(q)
        );
      }

      setFavoris(content);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalEls(payload?.totalElements ?? content.length);
    } catch {
      toast.error("Impossible de charger les favoris.");
      setFavoris([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterActif, search]);

  /* ── Top produits en favoris ─────────────────────────────────────────── */
  const fetchTopProduits = useCallback(async () => {
    setLoadingTop(true);
    try {
      // On charge les produits les plus populaires en récupérant tous les favoris
      // et en agrégeant côté client (l'API n'expose pas encore ce endpoint)
      const { data } = await api.get("/admin/favoris?page=0&size=100");
      const payload = data?.data ?? data;
      const all: FavoriAdmin[] = payload?.content ?? [];

      // Agréger par produit
      const map = new Map<number, TopProduit>();
      for (const f of all) {
        if (map.has(f.productId)) {
          map.get(f.productId)!.nbFavoris++;
        } else {
          map.set(f.productId, {
            productId:       f.productId,
            productTitre:    f.productTitre,
            productAuteur:   f.productAuteur,
            productImageUrl: f.productImageUrl,
            productPrix:     f.productPrix,
            nbFavoris:       1,
          });
        }
      }
      const top = Array.from(map.values())
        .sort((a, b) => b.nbFavoris - a.nbFavoris)
        .slice(0, 5);
      setTopProduits(top);
    } catch {
      setTopProduits([]);
    } finally {
      setLoadingTop(false);
    }
  }, []);

  useEffect(() => { fetchFavoris(); },    [fetchFavoris]);
  useEffect(() => { fetchTopProduits(); }, [fetchTopProduits]);

  /* ── Suppression ─────────────────────────────────────────────────────── */
  const handleDelete = async (f: FavoriAdmin) => {
    if (!confirm(`Supprimer ce favori (« ${f.productTitre} ») ?`)) return;
    setDeletingId(f.id);
    try {
      await api.delete(`/admin/favoris/${f.id}`);
      setFavoris(fs => fs.filter(x => x.id !== f.id));
      setTotalEls(n => n - 1);
      toast.success("Favori supprimé.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Stats ───────────────────────────────────────────────────────────── */
  const archivesEnFavori = favoris.filter(f => !f.productActif).length;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-6">

          {/* ── En-tête ─────────────────────────────────────────────── */}
          <div>
            <h1 className="font-display text-display-md font-bold text-encre">Favoris</h1>
            <p className="text-sm text-encre-muted font-body mt-0.5">
              {totalEls} favori{totalEls > 1 ? "s" : ""} enregistré{totalEls > 1 ? "s" : ""}
            </p>
          </div>

          {/* ── KPIs ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Total favoris",
                val: totalEls,
                icon: <Heart className="w-4 h-4" />,
                bg: "bg-red-50", col: "text-red-500",
              },
              {
                label: "Produits actifs en favori",
                val: favoris.filter(f => f.productActif).length,
                icon: <BookOpen className="w-4 h-4" />,
                bg: "bg-green-50", col: "text-success",
              },
              {
                label: "Produits archivés en favori",
                val: archivesEnFavori,
                icon: <TrendingUp className="w-4 h-4" />,
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

          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Colonne principale : tableau ────────────────────── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Filtres */}
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                    placeholder="Produit, auteur, client…"
                    className="pl-9 pr-9 py-2 text-sm font-body bg-white border border-sable-dark
                               rounded-xl focus:outline-none focus:ring-2 focus:ring-or/30
                               focus:border-or w-56"
                  />
                  {search && (
                    <button onClick={() => { setSearch(""); setPage(0); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex bg-sable/60 rounded-xl p-1 gap-0.5">
                  {[
                    { val: "" as const,    label: "Tous" },
                    { val: true as const,  label: "Actifs" },
                    { val: false as const, label: "Archivés" },
                  ].map(f => (
                    <button
                      key={String(f.val)}
                      onClick={() => { setFilterActif(f.val); setPage(0); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-body transition-all",
                        filterActif === f.val
                          ? "bg-white text-encre shadow-sm font-medium"
                          : "text-encre-muted hover:text-encre"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tableau */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-body">
                    <thead className="border-b border-sable">
                      <tr>
                        {["Couverture", "Livre", "Produit", "Ajouté le", "Statut", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sable">
                      {loading
                        ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                        : favoris.length === 0
                          ? (
                            <tr>
                              <td colSpan={6} className="py-16 text-center">
                                <Heart className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                                <p className="font-display text-lg text-encre">Aucun favori</p>
                                <p className="text-sm text-encre-muted font-body mt-1">
                                  Aucun client n&apos;a encore ajouté de favoris.
                                </p>
                              </td>
                            </tr>
                          )
                          : favoris.map(f => {
                            const imgOk = f.productImageUrl &&
                              (f.productImageUrl.startsWith("http") ||
                               f.productImageUrl.startsWith("/"));
                            return (
                              <tr key={f.id} className="hover:bg-ivoire transition-colors group">
                                {/* Image */}
                                <td className="px-4 py-3">
                                  <div className="w-8 h-11 bg-sable rounded-md overflow-hidden relative shrink-0">
                                    {imgOk ? (
                                      <Image src={f.productImageUrl!} alt={f.productTitre}
                                        fill className="object-cover" />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <ImageIcon className="w-3.5 h-3.5 text-encre/20" />
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Titre / auteur */}
                                <td className="px-4 py-3 max-w-[200px]">
                                  <Link href={`/produit/${f.productId}`}
                                    className="font-medium text-encre hover:text-or transition-colors truncate block text-sm">
                                    {f.productTitre}
                                  </Link>
                                  <p className="text-xs text-encre-muted truncate">{f.productAuteur}</p>
                                  <p className="text-xs text-encre-muted font-body mt-0.5">
                                    {formatPrix(f.productPrix)}
                                  </p>
                                </td>

                                {/* Client */}
                                <td className="px-4 py-3">
                                  {f.userNom ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-encre rounded-full flex items-center justify-center shrink-0">
                                        <span className="text-ivoire text-[10px] font-bold">
                                          {f.userNom.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <span className="text-sm text-encre">{f.userNom}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-encre-muted">—</span>
                                  )}
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3 text-xs text-encre-muted whitespace-nowrap">
                                  {formatDate(f.ajouteLe)}
                                </td>

                                {/* Statut produit */}
                                <td className="px-4 py-3">
                                  {f.productActif ? (
                                    <span className="badge-success">Actif</span>
                                  ) : (
                                    <span className="badge-warning">Archivé</span>
                                  )}
                                </td>

                                {/* Suppression */}
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => handleDelete(f)}
                                    disabled={deletingId === f.id}
                                    className="p-1.5 rounded-lg text-encre-muted hover:text-error
                                               hover:bg-red-50 transition-colors opacity-0
                                               group-hover:opacity-100"
                                    title="Supprimer ce favori"
                                  >
                                    {deletingId === f.id
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : <Trash2 className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
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

            {/* ── Colonne latérale : top produits ─────────────────── */}
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-or" />
                  <h2 className="font-display font-bold text-encre">Top 5 livres</h2>
                </div>
                <p className="text-xs text-encre-muted font-body mb-4">
                  Livres les plus ajoutés en favoris
                </p>

                <div className="space-y-3">
                  {loadingTop
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                    : topProduits.length === 0
                      ? (
                        <p className="text-sm text-encre-muted font-body text-center py-6">
                          Aucune donnée disponible.
                        </p>
                      )
                      : topProduits.map((p, i) => {
                        const imgOk = p.productImageUrl &&
                          (p.productImageUrl.startsWith("http") ||
                           p.productImageUrl.startsWith("/"));
                        return (
                          <div key={p.productId}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-sable/30
                                       transition-colors cursor-default">
                            {/* Rang */}
                            <span className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              i === 0 ? "bg-or text-white"
                                : i === 1 ? "bg-encre-muted text-white"
                                : i === 2 ? "bg-sable-dark text-encre"
                                : "bg-sable text-encre-muted"
                            )}>
                              {i + 1}
                            </span>

                            {/* Miniature */}
                            <div className="w-8 h-11 bg-sable rounded-md overflow-hidden relative shrink-0">
                              {imgOk ? (
                                <Image src={p.productImageUrl!} alt={p.productTitre}
                                  fill className="object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <ImageIcon className="w-3 h-3 text-encre/20" />
                                </div>
                              )}
                            </div>

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                              <Link href={`/produit/${p.productId}`}
                                className="text-sm font-medium text-encre hover:text-or transition-colors
                                           truncate block">
                                {p.productTitre}
                              </Link>
                              <p className="text-xs text-encre-muted truncate">{p.productAuteur}</p>
                            </div>

                            {/* Compteur */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                              <span className="text-xs font-bold text-encre">{p.nbFavoris}</span>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              </div>

              {/* Note info */}
              <div className="p-4 bg-sable/40 rounded-xl text-xs text-encre-muted font-body leading-relaxed">
                <p className="font-medium text-encre mb-1">À propos des favoris</p>
                <p>
                  Les favoris permettent aux clients de sauvegarder des livres pour plus tard.
                  Un produit archivé reste dans les favoris — il apparaît avec le badge
                  <span className="badge-warning ml-1">Archivé</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
