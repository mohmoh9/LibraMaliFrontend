"use client";
// src/app/(main)/catalogue/page.tsx
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Search, Loader2, Heart } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/catalogue/ProductCard";
import { useFavoris } from "@/hooks/useFavoris";
import { useAuthStore } from "@/store/auth.store";
import type { Product, Category, PageResponse, ApiResponse } from "@/types";

const TRIS = [
  { val: "titre",       label: "A → Z" },
  { val: "creeLe",      label: "Nouveautés" },
  { val: "prix",        label: "Prix ↑" },
  { val: "noteMoyenne", label: "Mieux notés" },
];

const PAGE_SIZE = 15;

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function SkeletonBook() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="bg-slate-200 rounded-r-lg rounded-l-sm w-full shadow-sm" style={{ aspectRatio: "2/3" }} />
      <div className="space-y-2 px-0.5">
        <div className="h-2.5 bg-slate-200 w-1/3 rounded" />
        <div className="h-3.5 bg-slate-200 w-full rounded" />
        <div className="h-3 bg-slate-200 w-1/2 rounded" />
      </div>
    </div>
  );
}

/* ── Contenu principal (séparé pour Suspense) ────────────────────────────── */
function CatalogueContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [products,      setProducts]      = useState<Product[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [showFavorisOnly, setShowFavorisOnly] = useState(false);

  // Favoris
  const { isFavori, toggleFavori, isToggling } = useFavoris();

  // Paramètres URL
  const q          = searchParams.get("q")          ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const sortBy     = searchParams.get("sortBy")     ?? "creeLe";
  const direction  = searchParams.get("direction")  ?? (sortBy === "prix" ? "asc" : "desc");
  const page       = Number(searchParams.get("page") ?? "0");

  /* ── Navigation ─────────────────────────────────────────────────────── */
  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    if (!value) p.delete(key); else p.set(key, value);
    p.delete("page");
    router.push(`/catalogue?${p.toString()}`, { scroll: false });
  };

  const gotoPage = (n: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(n));
    router.push(`/catalogue?${p.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Chargement produits ─────────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const baseParams = `page=${page}&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`;
      let url = `/products?${baseParams}`;

      if (q) {
        url = `/products/search?q=${encodeURIComponent(q)}${categoryId ? `&categoryId=${categoryId}` : ""}&${baseParams}`;
      } else if (categoryId) {
        url = `/products/category/${categoryId}?${baseParams}`;
      }

      const response = await api.get<ApiResponse<PageResponse<Product>>>(url);
      const apiData  = response.data;

      if (apiData.success && apiData.data) {
        setProducts(apiData.data.content);
        setTotalPages(apiData.data.totalPages);
        setTotalElements(apiData.data.totalElements);
      } else {
        // Fallback si wrapper ApiResponse absent
        const payload = (apiData as any)?.data ?? apiData;
        setProducts(payload?.content ?? []);
        setTotalPages(payload?.totalPages ?? 1);
        setTotalElements(payload?.totalElements ?? 0);
      }
    } catch (err) {
      console.error("Erreur chargement produits:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [q, categoryId, sortBy, direction, page]);

  useEffect(() => {
    api.get<ApiResponse<Category[]>>("/categories")
      .then(({ data }) => { if (data.success) setCategories(data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Filtrage local pour "Mes favoris uniquement"
  const productsAffiches = showFavorisOnly
    ? products.filter(p => isFavori(p.id))
    : products;

  const activeFiltersCount = [q, categoryId].filter(Boolean).length;
  const catLabel = categories.find(c => String(c.id) === categoryId)?.nom;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {showFavorisOnly ? "Mes favoris" : q ? `Résultats pour « ${q} »` : catLabel ?? "Tous nos ouvrages"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {loading
              ? "Recherche en cours..."
              : showFavorisOnly
                ? `${productsAffiches.length} favori${productsAffiches.length > 1 ? "s" : ""} sur cette page`
                : `${totalElements.toLocaleString("fr-FR")} livre${totalElements > 1 ? "s" : ""} trouvé(s)`}
          </p>
        </div>

        {/* Bouton "Mes favoris" — visible si connecté */}
        {isAuthenticated && (
          <button
            onClick={() => setShowFavorisOnly(v => !v)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
              showFavorisOnly
                ? "bg-red-500 text-white shadow-md shadow-red-200"
                : "bg-white border border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-4 h-4 transition-all", showFavorisOnly && "fill-white")} />
            {showFavorisOnly ? "Voir tout" : "Mes favoris"}
          </button>
        )}
      </div>

      <div className="flex gap-10">

        {/* ── Sidebar desktop ──────────────────────────────────────────── */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <FilterPanel
              categories={categories}
              selectedCategory={categoryId}
              onCategoryChange={(id: string) => setParam("categoryId", id || null)}
              onReset={() => { setParam("categoryId", null); setParam("q", null); }}
            />
          </div>
        </aside>

        {/* ── Zone principale ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtres mobile */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>

              {q && <Tag label={q} icon={<Search className="w-3 h-3" />} onRemove={() => setParam("q", null)} />}
              {catLabel && <Tag label={catLabel} onRemove={() => setParam("categoryId", null)} variant="dark" />}
            </div>

            {/* Tri — masqué en mode favoris */}
            {!showFavorisOnly && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Tri</span>
                <select
                  value={sortBy}
                  onChange={(e) => setParam("sortBy", e.target.value)}
                  className="bg-transparent border-none text-sm font-semibold text-slate-900 focus:ring-0 cursor-pointer"
                >
                  {TRIS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Grille */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonBook key={i} />)}
            </div>
          ) : productsAffiches.length === 0 ? (
            <EmptyState
              message={
                showFavorisOnly
                  ? "Vous n'avez pas encore de favoris sur cette page."
                  : undefined
              }
              onReset={() => {
                if (showFavorisOnly) setShowFavorisOnly(false);
                else router.push("/catalogue");
              }}
              resetLabel={showFavorisOnly ? "Voir tout le catalogue" : undefined}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
              {productsAffiches.map((p, i) => (
                <div
                  key={p.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <ProductCard
                    product={p}
                    isFavori={isFavori(p.id)}
                    onToggleFavori={(e) => toggleFavori(p.id, e)}
                    isToggling={isToggling(p.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination — masquée en mode favoris */}
          {!loading && !showFavorisOnly && totalPages > 1 && (
            <Pagination current={page} total={totalPages} onPageChange={gotoPage} />
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      {filtersOpen && (
        <MobileFilters
          categories={categories}
          selectedCategory={categoryId}
          onClose={() => setFiltersOpen(false)}
          onCategoryChange={(id: string) => { setParam("categoryId", id); setFiltersOpen(false); }}
          onReset={() => { setParam("categoryId", null); setParam("q", null); setFiltersOpen(false); }}
        />
      )}
    </div>
  );
}

/* ── Sous-composants ─────────────────────────────────────────────────────── */

function Tag({ label, onRemove, icon, variant = "default" }: any) {
  return (
    <span className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
      variant === "dark" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
    )}>
      {icon}
      <span className="max-w-[120px] truncate">{label}</span>
      <button onClick={onRemove} className="hover:scale-110 transition-transform ml-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

function EmptyState({
  onReset, message, resetLabel,
}: { onReset: () => void; message?: string; resetLabel?: string }) {
  return (
    <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-3xl">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-6">
        <Search className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun ouvrage trouvé</h3>
      <p className="text-slate-500 max-w-xs mx-auto mb-8 text-sm">
        {message ?? "Nous n'avons pas trouvé de correspondance. Essayez d'élargir vos critères."}
      </p>
      <button
        onClick={onReset}
        className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors"
      >
        {resetLabel ?? "Réinitialiser la recherche"}
      </button>
    </div>
  );
}

function Pagination({ current, total, onPageChange }: any) {
  return (
    <div className="flex items-center justify-center gap-4 pt-12 border-t border-slate-100">
      <button disabled={current === 0} onClick={() => onPageChange(current - 1)}
        className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-20 transition-colors">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className="text-slate-900">Page {current + 1}</span>
        <span className="text-slate-300">sur</span>
        <span className="text-slate-500">{total}</span>
      </div>
      <button disabled={current >= total - 1} onClick={() => onPageChange(current + 1)}
        className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-20 transition-colors">
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

function MobileFilters({ categories, selectedCategory, onClose, onCategoryChange, onReset }: any) {
  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-xs bg-white p-8 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Filtres</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
        </div>
        <FilterPanel categories={categories} selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange} onReset={onReset} />
      </div>
    </div>
  );
}

function FilterPanel({ categories, selectedCategory, onCategoryChange, onReset }: any) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">Rayons</h3>
        <div className="flex flex-col gap-1.5">
          <button onClick={() => onCategoryChange("")}
            className={cn("text-left px-4 py-3 rounded-xl text-sm transition-all",
              !selectedCategory ? "bg-slate-900 text-white font-bold shadow-lg shadow-slate-200" : "hover:bg-slate-50 text-slate-600")}>
            Tous les livres
          </button>
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => onCategoryChange(String(cat.id))}
              className={cn("text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-all",
                String(cat.id) === selectedCategory ? "bg-slate-900 text-white font-bold shadow-lg shadow-slate-200" : "hover:bg-slate-50 text-slate-600")}>
              <span className="truncate mr-2">{cat.nom}</span>
              <span className="text-[10px] opacity-40 font-mono">({cat.nbProduits})</span>
            </button>
          ))}
        </div>
      </div>
      {selectedCategory && (
        <button onClick={onReset} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-2">
          <X className="w-3 h-3" /> Réinitialiser
        </button>
      )}
    </div>
  );
}

/* ── Export avec Suspense ────────────────────────────────────────────────── */
export default function CataloguePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
        <p className="text-slate-400 font-medium">Ouverture de la librairie...</p>
      </div>
    }>
      <CatalogueContent />
    </Suspense>
  );
}
