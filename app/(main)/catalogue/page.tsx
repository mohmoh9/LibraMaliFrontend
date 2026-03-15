"use client";
// src/app/(main)/catalogue/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/catalogue/ProductCard";
import type { Product, Category, PageResponse } from "@/types";

const TRIS = [
  { val: "creeLe", label: "Nouveautés" },
  { val: "prix", label: "Prix croissant" },
  { val: "noteMoyenne", label: "Mieux notés" },
  { val: "titre", label: "Titre A→Z" },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card">
      <div className="skeleton h-52" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-5 w-1/3 rounded mt-4" />
      </div>
    </div>
  );
}

export default function CataloguePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Paramètres
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "creeLe";
  const direction = searchParams.get("direction") ?? "desc";
  const page = Number(searchParams.get("page") ?? "0");
  const pageSize = 12;

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`/catalogue?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/catalogue?${params.toString()}`);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = "";
      if (q) {
        url = `/products/search?q=${encodeURIComponent(q)}${categoryId ? `&categoryId=${categoryId}` : ""}&page=${page}&size=${pageSize}&sortBy=${sortBy}&direction=${direction}`;
      } else if (categoryId) {
        url = `/products/category/${categoryId}?page=${page}&size=${pageSize}&sortBy=${sortBy}&direction=${direction}`;
      } else {
        url = `/products?page=${page}&size=${pageSize}&sortBy=${sortBy}&direction=${direction}`;
      }
      const { data } = await api.get(url);
      const paged: PageResponse<Product> = data.data;
      setProducts(paged.content);
      setTotalPages(paged.totalPages);
      setTotalElements(paged.totalElements);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [q, categoryId, sortBy, direction, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data.data)).catch(() => {});
  }, []);

  const activeFiltersCount = [q, categoryId].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="mb-8 space-y-1">
        <h1 className="font-display text-display-md font-bold text-encre">
          {q ? `Résultats pour « ${q} »` : categoryId
            ? (categories.find(c => String(c.id) === categoryId)?.nom ?? "Catalogue")
            : "Catalogue"}
        </h1>
        {!loading && (
          <p className="text-sm text-encre-muted font-body">
            {totalElements} livre{totalElements > 1 ? "s" : ""} trouvé{totalElements > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="flex gap-8">

        {/* ── Sidebar filtres (desktop) ─────────────────────────────────── */}
        <aside className="hidden lg:block w-60 shrink-0 space-y-8">
          <FilterPanel
            categories={categories}
            selectedCategory={categoryId}
            onCategoryChange={(id) => setParam("categoryId", id)}
            onReset={() => { setParam("categoryId", null); setParam("q", null); }}
          />
        </aside>

        {/* ── Contenu principal ─────────────────────────────────────────── */}
        <div className="flex-1 space-y-6">

          {/* Barre d'outils */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              {/* Filtre mobile */}
              <button
                onClick={() => setFiltersOpen(true)}
                className={cn(
                  "lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-body",
                  "border-sable-dark text-encre hover:border-encre transition-colors"
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="w-4.5 h-4.5 bg-or text-white text-[10px] font-bold rounded-full
                                   flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Tags actifs */}
              {q && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-sable rounded-full text-xs font-body text-encre">
                  <Search className="w-3 h-3" />
                  {q}
                  <button onClick={() => setParam("q", null)}>
                    <X className="w-3 h-3 text-encre-muted hover:text-encre" />
                  </button>
                </span>
              )}
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-encre-muted hidden sm:block">Trier par</span>
              <div className="flex bg-sable/60 rounded-full p-0.5 gap-0.5">
                {TRIS.map((tri) => (
                  <button
                    key={tri.val}
                    onClick={() => {
                      setParam("sortBy", tri.val);
                      setParam("direction", tri.val === "prix" ? "asc" : "desc");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-body transition-all",
                      sortBy === tri.val
                        ? "bg-white text-encre shadow-sm font-medium"
                        : "text-encre-muted hover:text-encre"
                    )}
                  >
                    {tri.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grille produits */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="text-5xl">📚</div>
              <p className="font-display text-xl text-encre">Aucun livre trouvé</p>
              <p className="text-sm text-encre-muted font-body">
                Essayez d&apos;autres mots-clés ou parcourez le catalogue complet.
              </p>
              <button
                onClick={() => router.push("/catalogue")}
                className="btn-secondary mt-4"
              >
                Voir tout le catalogue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
              {products.map((p, i) => (
                <div key={p.id} className="animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms`, opacity: 0, animationFillMode: "forwards" }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-full border border-sable-dark text-encre-muted
                           hover:border-encre hover:text-encre disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "w-9 h-9 rounded-full text-sm font-body transition-all",
                        pageNum === page
                          ? "bg-encre text-ivoire font-medium"
                          : "text-encre-muted hover:bg-sable hover:text-encre"
                      )}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-full border border-sable-dark text-encre-muted
                           hover:border-encre hover:text-encre disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drawer filtres mobile */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-encre/40 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-float
                          p-6 overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold">Filtres</h3>
              <button onClick={() => setFiltersOpen(false)}>
                <X className="w-5 h-5 text-encre-muted" />
              </button>
            </div>
            <FilterPanel
              categories={categories}
              selectedCategory={categoryId}
              onCategoryChange={(id) => { setParam("categoryId", id); setFiltersOpen(false); }}
              onReset={() => { setParam("categoryId", null); setParam("q", null); setFiltersOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant filtres ─────────────────────────────────────────────────────────
function FilterPanel({
  categories, selectedCategory, onCategoryChange, onReset,
}: {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-body text-xs uppercase tracking-widest text-encre-muted mb-3">
          Catégories
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange("")}
            className={cn(
              "w-full text-left px-3 py-2 rounded-xl text-sm font-body transition-colors",
              !selectedCategory
                ? "bg-encre text-ivoire font-medium"
                : "text-encre hover:bg-sable/60"
            )}
          >
            Toutes les catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(String(cat.id))}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-sm font-body transition-colors flex justify-between items-center",
                String(cat.id) === selectedCategory
                  ? "bg-encre text-ivoire font-medium"
                  : "text-encre hover:bg-sable/60"
              )}
            >
              <span>{cat.nom}</span>
              <span className={cn(
                "text-xs rounded-full px-1.5",
                String(cat.id) === selectedCategory ? "bg-white/20 text-ivoire" : "text-encre-muted"
              )}>
                {cat.nbProduits}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <button onClick={onReset}
          className="w-full text-xs text-encre-muted hover:text-error flex items-center gap-1 transition-colors">
          <X className="w-3 h-3" /> Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
