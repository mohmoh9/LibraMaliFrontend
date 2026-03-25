"use client";
// src/app/(main)/admin/produits/page.tsx
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Search, Pencil, Archive, RotateCcw,
  Package, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
  Star, X, ImageIcon, Info,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import Modal from "@/components/ui/Modal";
import ImageUploader from "@/components/admin/ImageUploader";
import type { Product, Category, PageResponse } from "@/types";

/* ── Schéma Zod ──────────────────────────────────────────────────────────── */
const productSchema = z.object({
  titre:       z.string().min(1, "Titre obligatoire"),
  auteur:      z.string().min(1, "Auteur obligatoire"),
  prix:        z.coerce.number().positive("Le prix doit être positif"),
  stock:       z.coerce.number().int().min(0, "Stock ≥ 0"),
  categoryId:  z.coerce.number().optional(),
  description: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

type ViewMode   = "actifs" | "archivés";
type ModalTab   = "infos" | "image";

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[40, 200, 120, 80, 80, 100, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminProduitsPage() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState<ViewMode>("actifs");
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("");
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalEls,    setTotalEls]    = useState(0);

  // Modale
  const [modalOpen,      setModalOpen]      = useState(false);
  const [modalTab,       setModalTab]       = useState<ModalTab>("infos");
  const [editProduct,    setEditProduct]    = useState<Product | null>(null);
  const [savedProductId, setSavedProductId] = useState<number | null>(null);
  const [saving,         setSaving]         = useState(false);

  // L'ID effectif dans la modale (édition existante ou produit fraîchement créé)
  const activeProductId = editProduct?.id ?? savedProductId;

  const form = useForm<ProductForm>({ resolver: zodResolver(productSchema) });

  /* ── Chargement ───────────────────────────────────────────────────────── */
  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url: string;
      if (view === "archivés") {
        url = `/products/admin/archived?page=${page}&size=15`;
      } else if (search.trim()) {
        url = `/products/search?q=${encodeURIComponent(search)}${catFilter ? `&categoryId=${catFilter}` : ""}&page=${page}&size=15`;
      } else if (catFilter) {
        url = `/products/category/${catFilter}?page=${page}&size=15`;
      } else {
        url = `/products?page=${page}&size=15`;
      }
      const { data } = await api.get(url);
      const payload  = data?.data ?? data;
      setProducts(payload?.content ?? []);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalEls(payload?.totalElements ?? 0);
    } catch {
      toast.error("Erreur lors du chargement des produits.");
    } finally {
      setLoading(false);
    }
  }, [view, search, catFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Ouvrir modale ────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditProduct(null);
    setSavedProductId(null);
    setModalTab("infos");
    form.reset({ titre: "", auteur: "", prix: 0, stock: 0, description: "" });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setSavedProductId(null);
    setModalTab("infos");
    form.reset({
      titre:       p.titre,
      auteur:      p.auteur,
      prix:        p.prix,
      stock:       p.stock,
      categoryId:  p.categoryId,
      description: p.description ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditProduct(null);
    setSavedProductId(null);
    setModalTab("infos");
    fetchProducts();
  };

  /* ── Sauvegarder informations ─────────────────────────────────────────── */
  const handleSave = async (values: ProductForm) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId || undefined,
      };

      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, payload);
        toast.success("Informations mises à jour !");
        // Passer à l'onglet image
        setModalTab("image");
      } else {
        const { data } = await api.post("/products", payload);
        const created: Product = data.data;
        toast.success("Produit créé ! Vous pouvez maintenant ajouter une image.");
        setSavedProductId(created.id);
        // Passer automatiquement à l'onglet image
        setModalTab("image");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── Archive / Restaurer ──────────────────────────────────────────────── */
  const handleArchive = async (p: Product) => {
    if (!confirm(`Archiver « ${p.titre} » ?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success("Produit archivé.");
      fetchProducts();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleRestore = async (p: Product) => {
    try {
      await api.patch(`/products/${p.id}/restore`);
      toast.success("Produit restauré.");
      fetchProducts();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  /* ── Stock rapide ─────────────────────────────────────────────────────── */
  const handleStockChange = async (id: number, stock: number) => {
    try {
      await api.patch(`/products/${id}/stock`, { stock });
      setProducts(ps => ps.map(p => p.id === id ? { ...p, stock } : p));
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  /* ── Image mise à jour dans la modale ────────────────────────────────── */
  const handleImageSuccess = (newUrl: string | null) => {
    // Mettre à jour l'image dans la liste sans recharger
    if (activeProductId) {
      setProducts(ps => ps.map(p =>
        p.id === activeProductId ? { ...p, imageUrl: newUrl ?? undefined } : p
      ));
    }
    if (editProduct) {
      setEditProduct(prev => prev ? { ...prev, imageUrl: newUrl ?? undefined } : null);
    }
  };

  /* ── Titre modale ─────────────────────────────────────────────────────── */
  const modalTitle = editProduct
    ? `Modifier « ${editProduct.titre} »`
    : savedProductId
      ? "Produit créé — ajouter une image"
      : "Nouveau produit";

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-6">

          {/* ── En-tête ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-display-md font-bold text-encre">Produits</h1>
              <p className="text-sm text-encre-muted font-body mt-0.5">
                {totalEls} produit{totalEls > 1 ? "s" : ""} {view}
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" /> Nouveau produit
            </button>
          </div>

          {/* ── Filtres ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            {/* Toggle vue */}
            <div className="flex bg-sable/60 rounded-xl p-1 gap-0.5">
              {(["actifs", "archivés"] as ViewMode[]).map(v => (
                <button key={v} onClick={() => { setView(v); setPage(0); }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-body transition-all capitalize",
                    view === v ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre"
                  )}>
                  {v}
                </button>
              ))}
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Titre, auteur…"
                className="pl-9 pr-9 py-2 text-sm font-body bg-white border border-sable-dark rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or w-56"
              />
              {search && (
                <button onClick={() => { setSearch(""); setPage(0); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Catégorie */}
            <select
              value={catFilter}
              onChange={e => { setCatFilter(e.target.value); setPage(0); }}
              className="px-3 py-2 text-sm font-body bg-white border border-sable-dark rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or text-encre"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          {/* ── Tableau ──────────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["Image", "Titre / Auteur", "Catégorie", "Prix", "Stock", "Note", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                    : products.length === 0
                      ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <Package className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                            <p className="font-display text-lg text-encre">Aucun produit</p>
                          </td>
                        </tr>
                      )
                      : products.map(p => {
                        const imgOk = p.imageUrl &&
                          (p.imageUrl.startsWith("http") || p.imageUrl.startsWith("/"));

                        return (
                          <tr key={p.id} className="hover:bg-ivoire transition-colors group">

                            {/* Image */}
                            <td className="px-4 py-3">
                              <div className="w-9 h-12 bg-sable rounded-lg overflow-hidden relative shrink-0">
                                {imgOk ? (
                                  <Image src={p.imageUrl!} alt={p.titre} fill className="object-cover" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4 text-encre/20" />
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Titre */}
                            <td className="px-4 py-3 max-w-[220px]">
                              <p className="font-medium text-encre truncate">{p.titre}</p>
                              <p className="text-xs text-encre-muted truncate">{p.auteur}</p>
                            </td>

                            {/* Catégorie */}
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 bg-sable rounded-full text-encre-muted">
                                {p.categoryNom ?? "—"}
                              </span>
                            </td>

                            {/* Prix */}
                            <td className="px-4 py-3 font-display font-semibold text-encre whitespace-nowrap">
                              {formatPrix(p.prix)}
                            </td>

                            {/* Stock éditable inline */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {p.stock <= 5 && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                                )}
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={p.stock}
                                  onBlur={e => {
                                    const v = parseInt(e.target.value);
                                    if (!isNaN(v) && v !== p.stock) handleStockChange(p.id, v);
                                  }}
                                  className={cn(
                                    "w-16 px-2 py-1 text-sm text-center rounded-lg border font-mono",
                                    "focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or",
                                    p.stock === 0 ? "border-error text-error bg-red-50"
                                      : p.stock <= 5 ? "border-warning text-warning bg-amber-50"
                                      : "border-sable-dark bg-white text-encre"
                                  )}
                                />
                              </div>
                            </td>

                            {/* Note */}
                            <td className="px-4 py-3">
                              {p.nbAvis > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-or fill-or" />
                                  <span className="text-xs text-encre">{p.noteMoyenne.toFixed(1)}</span>
                                  <span className="text-xs text-encre-muted">({p.nbAvis})</span>
                                </div>
                              ) : <span className="text-xs text-encre-muted">—</span>}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(p)}
                                  className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors"
                                  title="Modifier">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {p.actif ? (
                                  <button onClick={() => handleArchive(p)}
                                    className="p-1.5 rounded-lg text-encre-muted hover:text-warning hover:bg-amber-50 transition-colors"
                                    title="Archiver">
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button onClick={() => handleRestore(p)}
                                    className="p-1.5 rounded-lg text-encre-muted hover:text-success hover:bg-green-50 transition-colors"
                                    title="Restaurer">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
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

        {/* ── Modale Créer / Modifier ───────────────────────────────── */}
        <Modal
          open={modalOpen}
          onClose={closeModal}
          title={modalTitle}
          size="lg"
        >
          {/* Onglets Infos / Image */}
          <div className="flex gap-1 bg-sable/50 p-1 rounded-xl mb-6 w-fit">
            {([
              { key: "infos", label: "Informations", icon: <Info className="w-3.5 h-3.5" /> },
              { key: "image", label: "Image",        icon: <ImageIcon className="w-3.5 h-3.5" />,
                disabled: !activeProductId },
            ] as const).map(tab => (
              <button
                key={tab.key}
                type="button"
                disabled={"disabled" in tab && tab.disabled}
                onClick={() => setModalTab(tab.key as ModalTab)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body transition-all",
                  modalTab === tab.key
                    ? "bg-white text-encre shadow-sm font-medium"
                    : "text-encre-muted hover:text-encre disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {tab.icon}
                {tab.label}
                {"disabled" in tab && tab.disabled && (
                  <span className="text-[10px] text-encre-muted ml-1">(créer d&apos;abord)</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Onglet Informations ───────────────────────────────── */}
          {modalTab === "infos" && (
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-4">

                {/* Titre */}
                <div className="sm:col-span-2">
                  <label className="input-label">Titre *</label>
                  <input {...form.register("titre")} className="input-field" placeholder="Titre du livre" />
                  {form.formState.errors.titre && (
                    <p className="text-xs text-error mt-1">{form.formState.errors.titre.message}</p>
                  )}
                </div>

                {/* Auteur */}
                <div>
                  <label className="input-label">Auteur *</label>
                  <input {...form.register("auteur")} className="input-field" placeholder="Nom de l'auteur" />
                  {form.formState.errors.auteur && (
                    <p className="text-xs text-error mt-1">{form.formState.errors.auteur.message}</p>
                  )}
                </div>

                {/* Catégorie */}
                <div>
                  <label className="input-label">Catégorie</label>
                  <select {...form.register("categoryId")} className="input-field">
                    <option value="">Sans catégorie</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Prix */}
                <div>
                  <label className="input-label">Prix (FCFA) *</label>
                  <input type="number" min={0} {...form.register("prix")}
                    className="input-field" placeholder="5000" />
                  {form.formState.errors.prix && (
                    <p className="text-xs text-error mt-1">{form.formState.errors.prix.message}</p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <label className="input-label">Stock *</label>
                  <input type="number" min={0} {...form.register("stock")}
                    className="input-field" placeholder="0" />
                  {form.formState.errors.stock && (
                    <p className="text-xs text-error mt-1">{form.formState.errors.stock.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="input-label">Description</label>
                  <textarea {...form.register("description")} rows={3}
                    className="input-field resize-none" placeholder="Résumé du livre…" />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-sable">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editProduct ? "Enregistrer et continuer →" : "Créer le produit →"}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Fermer
                </button>
              </div>
            </form>
          )}

          {/* ── Onglet Image ──────────────────────────────────────── */}
          {modalTab === "image" && activeProductId && (
            <div className="space-y-6 animate-fade-in">
              <ImageUploader
                productId={activeProductId}
                currentImageUrl={
                  editProduct?.imageUrl ??
                  (savedProductId ? undefined : undefined)
                }
                onSuccess={handleImageSuccess}
              />

              <div className="flex gap-3 pt-4 border-t border-sable">
                <button
                  type="button"
                  onClick={() => setModalTab("infos")}
                  className="btn-secondary text-sm"
                >
                  ← Retour aux informations
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-primary text-sm"
                >
                  Terminer
                </button>
              </div>
            </div>
          )}
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
}
