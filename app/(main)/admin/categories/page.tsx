"use client";
// src/app/(main)/admin/categories/page.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  BookMarked, Plus, Pencil, Trash2, Search, X,
  Loader2, BookOpen, AlertCircle, CheckCircle,
  Tag, BarChart2, Package, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import Modal from "@/components/ui/Modal";
import type { Category } from "@/types";

/* ── Schémas Zod ─────────────────────────────────────────────────────────── */
const categorySchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
  description: z
    .string()
    .max(500, "La description ne doit pas dépasser 500 caractères")
    .optional(),
});
type CategoryForm = z.infer<typeof categorySchema>;

/* ── Couleurs déterministes par nom ──────────────────────────────────────── */
const PALETTE = [
  { bg: "bg-blue-50",    text: "text-blue-700",    ring: "ring-blue-200" },
  { bg: "bg-green-50",   text: "text-green-700",   ring: "ring-green-200" },
  { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200" },
  { bg: "bg-purple-50",  text: "text-purple-700",  ring: "ring-purple-200" },
  { bg: "bg-red-50",     text: "text-red-700",     ring: "ring-red-200" },
  { bg: "bg-cyan-50",    text: "text-cyan-700",    ring: "ring-cyan-200" },
  { bg: "bg-pink-50",    text: "text-pink-700",    ring: "ring-pink-200" },
  { bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200" },
];

function getCouleur(nom: string) {
  let h = 0;
  for (let i = 0; i < nom.length; i++) h = nom.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/* ── Composant KPI card ──────────────────────────────────────────────────── */
function KpiCard({ label, value, icon, bg, col }: {
  label: string; value: React.ReactNode;
  icon: React.ReactNode; bg: string; col: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg, col)}>
        {icon}
      </div>
      <div>
        <p className="font-display font-bold text-2xl text-encre leading-tight">{value}</p>
        <p className="text-xs text-encre-muted font-body">{label}</p>
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sable rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-4 bg-sable rounded w-28" />
            <div className="h-3 bg-sable rounded w-16" />
          </div>
        </div>
        <div className="flex gap-1">
          <div className="w-7 h-7 bg-sable rounded-lg" />
          <div className="w-7 h-7 bg-sable rounded-lg" />
        </div>
      </div>
      <div className="h-3 bg-sable rounded w-full" />
      <div className="h-3 bg-sable rounded w-3/4" />
      <div className="flex gap-3 pt-1">
        <div className="h-6 bg-sable rounded-full w-20" />
        <div className="h-6 bg-sable rounded-full w-24" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function AdminCategoriesPage() {
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [filtered,    setFiltered]    = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");

  /* ── Modales ── */
  const [createOpen,  setCreateOpen]  = useState(false);
  const [editOpen,    setEditOpen]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<Category | null>(null);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleteTarget,setDeleteTarget]= useState<Category | null>(null);

  /* ── États de chargement ── */
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  /* ── Vue : grille ou liste ── */
  const [vue,         setVue]         = useState<"grille" | "liste">("grille");

  /* ── Formulaires ── */
  const createForm = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) });
  const editForm   = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) });

  /* ── Chargement ─────────────────────────────────────────────────────────── */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/categories");
      const list: Category[] = data?.data ?? data ?? [];
      setCategories(list);
      setFiltered(list);
    } catch {
      toast.error("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ── Recherche locale ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(categories);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      categories.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    );
  }, [search, categories]);

  /* ── KPIs ────────────────────────────────────────────────────────────────── */
  const totalCategories = categories.length;
  const totalProduits   = categories.reduce((s, c) => s + c.nbProduits, 0);
  const totalTotaux     = categories.reduce((s, c) => s + c.nbProduitsTotaux, 0);
  const catVides        = categories.filter(c => c.nbProduitsTotaux === 0).length;
  const plusGrande      = categories.reduce(
    (max, c) => c.nbProduits > (max?.nbProduits ?? 0) ? c : max,
    null as Category | null
  );

  /* ── Créer ──────────────────────────────────────────────────────────────── */
  const handleCreate = async (values: CategoryForm) => {
    setSaving(true);
    try {
      await api.post("/categories", values);
      toast.success(`Catégorie « ${values.nom} » créée !`);
      setCreateOpen(false);
      createForm.reset();
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── Ouvrir édition ──────────────────────────────────────────────────────── */
  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    editForm.reset({ nom: cat.nom, description: cat.description ?? "" });
    setEditOpen(true);
  };

  /* ── Modifier ───────────────────────────────────────────────────────────── */
  const handleEdit = async (values: CategoryForm) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await api.put(`/categories/${editTarget.id}`, values);
      toast.success(`Catégorie « ${values.nom} » mise à jour !`);
      setEditOpen(false);
      setEditTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── Ouvrir suppression ──────────────────────────────────────────────────── */
  const openDelete = (cat: Category) => {
    setDeleteTarget(cat);
    setDeleteOpen(true);
  };

  /* ── Supprimer ──────────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      toast.success(`Catégorie « ${deleteTarget.nom} » supprimée.`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Composant formulaire ────────────────────────────────────────────────── */
  const CategoryFormFields = ({
    form,
    onSubmit,
    submitLabel,
  }: {
    form: ReturnType<typeof useForm<CategoryForm>>;
    onSubmit: (v: CategoryForm) => void;
    submitLabel: string;
  }) => (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Nom */}
      <div>
        <label className="input-label">Nom de la catégorie *</label>
        <input
          {...form.register("nom")}
          placeholder="Ex : Littérature africaine"
          className="input-field"
          autoFocus
        />
        {form.formState.errors.nom && (
          <p className="text-xs text-error mt-1">{form.formState.errors.nom.message}</p>
        )}
        <p className="text-xs text-encre-muted font-body mt-1">
          La première lettre sera automatiquement mise en majuscule.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="input-label">
          Description
          <span className="ml-1 normal-case font-normal text-encre-muted">(optionnelle)</span>
        </label>
        <textarea
          {...form.register("description")}
          rows={3}
          placeholder="Décrivez brièvement cette catégorie…"
          className="input-field resize-none"
          maxLength={500}
        />
        <div className="flex justify-between mt-1">
          {form.formState.errors.description ? (
            <p className="text-xs text-error">{form.formState.errors.description.message}</p>
          ) : (
            <span />
          )}
          <span className={cn(
            "text-xs font-mono",
            (form.watch("description")?.length ?? 0) > 450 ? "text-error" : "text-encre-muted"
          )}>
            {form.watch("description")?.length ?? 0}/500
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-sable">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Enregistrement…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => { setCreateOpen(false); setEditOpen(false); }}
          className="btn-secondary"
        >
          Annuler
        </button>
      </div>
    </form>
  );

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-7">

          {/* ── En-tête ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-display-md font-bold text-encre">Catégories</h1>
              <p className="text-sm text-encre-muted font-body mt-0.5">
                {loading ? "Chargement…" : `${totalCategories} catégorie${totalCategories > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={() => { createForm.reset(); setCreateOpen(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Nouvelle catégorie
            </button>
          </div>

          {/* ── KPIs ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Catégories"
              value={totalCategories}
              icon={<BookMarked className="w-5 h-5" />}
              bg="bg-or/10" col="text-or"
            />
            <KpiCard
              label="Produits actifs"
              value={totalProduits}
              icon={<BookOpen className="w-5 h-5" />}
              bg="bg-green-50" col="text-success"
            />
            <KpiCard
              label="Total (actifs + archivés)"
              value={totalTotaux}
              icon={<Package className="w-5 h-5" />}
              bg="bg-blue-50" col="text-blue-600"
            />
            <KpiCard
              label="Catégories vides"
              value={catVides}
              icon={<Tag className="w-5 h-5" />}
              bg="bg-red-50" col="text-error"
            />
          </div>

          {/* Catégorie la plus fournie */}
          {plusGrande && (
            <div className="flex items-center gap-3 p-4 bg-or/10 border border-or/20 rounded-xl">
              <BarChart2 className="w-5 h-5 text-or shrink-0" />
              <p className="text-sm font-body text-encre">
                Catégorie la plus fournie :{" "}
                <strong className="text-encre font-semibold">« {plusGrande.nom} »</strong>
                {" "}avec{" "}
                <strong>{plusGrande.nbProduits} produit{plusGrande.nbProduits > 1 ? "s" : ""} actif{plusGrande.nbProduits > 1 ? "s" : ""}</strong>
              </p>
              <Link
                href={`/catalogue?categoryId=${plusGrande.id}`}
                className="ml-auto text-xs text-or hover:text-or-dark font-medium flex items-center gap-1 shrink-0"
              >
                Voir <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* ── Barre de recherche + toggle vue ──────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-56 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une catégorie…"
                className="pl-9 pr-9 py-2 text-sm font-body bg-white border border-sable-dark rounded-xl
                           w-full focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Résultats */}
            {search && !loading && (
              <p className="text-sm text-encre-muted font-body">
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""} pour « {search} »
              </p>
            )}

            {/* Toggle grille / liste */}
            <div className="ml-auto flex bg-sable/60 rounded-xl p-1 gap-0.5">
              {(["grille", "liste"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setVue(v)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-body capitalize transition-all",
                    vue === v ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre"
                  )}
                >
                  {v === "grille" ? "⊞ Grille" : "≡ Liste"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Contenu ──────────────────────────────────────────────── */}
          {loading ? (
            /* Skeletons */
            vue === "grille" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="divide-y divide-sable">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                      <div className="w-8 h-8 bg-sable rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 bg-sable rounded w-32" />
                        <div className="h-3 bg-sable rounded w-48" />
                      </div>
                      <div className="flex gap-3">
                        <div className="h-5 bg-sable rounded-full w-16" />
                        <div className="h-5 bg-sable rounded-full w-16" />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-7 h-7 bg-sable rounded-lg" />
                        <div className="w-7 h-7 bg-sable rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : filtered.length === 0 ? (
            /* État vide */
            <div className="py-20 text-center border-2 border-dashed border-sable rounded-3xl">
              <BookMarked className="w-12 h-12 text-sable-dark mx-auto mb-4" />
              <p className="font-display text-xl text-encre mb-2">
                {search ? `Aucun résultat pour « ${search} »` : "Aucune catégorie"}
              </p>
              <p className="text-sm text-encre-muted font-body mb-6">
                {search ? "Essayez un autre terme de recherche." : "Créez votre première catégorie pour organiser le catalogue."}
              </p>
              {search ? (
                <button onClick={() => setSearch("")} className="btn-secondary text-sm">
                  Effacer la recherche
                </button>
              ) : (
                <button onClick={() => { createForm.reset(); setCreateOpen(true); }} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Créer une catégorie
                </button>
              )}
            </div>
          ) : vue === "grille" ? (

            /* ── VUE GRILLE ──────────────────────────────────────────── */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((cat, idx) => {
                const couleur    = getCouleur(cat.nom);
                const estVide    = cat.nbProduitsTotaux === 0;
                const archiveNb  = cat.nbProduitsTotaux - cat.nbProduits;

                return (
                  <div
                    key={cat.id}
                    className="card p-5 group hover:shadow-card-hover hover:-translate-y-0.5
                               transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${Math.min(idx, 7) * 40}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Icône colorée */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1",
                          couleur.bg, couleur.ring
                        )}>
                          <BookMarked className={cn("w-5 h-5", couleur.text)} />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-encre text-sm leading-tight">
                            {cat.nom}
                          </h3>
                          <p className="text-[10px] text-encre-muted font-body">
                            ID #{cat.id}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDelete(cat)}
                          disabled={cat.nbProduitsTotaux > 0}
                          className="p-1.5 rounded-lg text-encre-muted hover:text-error hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={cat.nbProduitsTotaux > 0 ? "Impossible : des produits sont rattachés" : "Supprimer"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {cat.description ? (
                      <p className="text-xs text-encre-muted font-body leading-relaxed mb-4 line-clamp-2">
                        {cat.description}
                      </p>
                    ) : (
                      <p className="text-xs text-encre-muted/50 font-body italic mb-4">
                        Aucune description
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
                        estVide
                          ? "bg-red-50 text-error"
                          : "bg-green-50 text-success"
                      )}>
                        <BookOpen className="w-3 h-3" />
                        {cat.nbProduits} actif{cat.nbProduits > 1 ? "s" : ""}
                      </span>

                      {archiveNb > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                                         text-[10px] font-medium bg-sable text-encre-muted">
                          <Package className="w-3 h-3" />
                          {archiveNb} archivé{archiveNb > 1 ? "s" : ""}
                        </span>
                      )}

                      {estVide && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                                         text-[10px] font-medium bg-amber-50 text-amber-600">
                          <AlertCircle className="w-3 h-3" />
                          Vide
                        </span>
                      )}
                    </div>

                    {/* Lien catalogue */}
                    {cat.nbProduits > 0 && (
                      <Link
                        href={`/catalogue?categoryId=${cat.id}`}
                        className="mt-3 flex items-center gap-1 text-[10px] text-or font-medium
                                   hover:text-or-dark transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Voir dans le catalogue <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

          ) : (

            /* ── VUE LISTE ──────────────────────────────────────────── */
            <div className="card overflow-hidden">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["Catégorie", "Description", "Produits actifs", "Total", "Actions"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {filtered.map(cat => {
                    const couleur   = getCouleur(cat.nom);
                    const archiveNb = cat.nbProduitsTotaux - cat.nbProduits;
                    return (
                      <tr key={cat.id} className="hover:bg-ivoire transition-colors group">
                        {/* Nom */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1",
                              couleur.bg, couleur.ring
                            )}>
                              <BookMarked className={cn("w-4 h-4", couleur.text)} />
                            </div>
                            <div>
                              <p className="font-medium text-encre">{cat.nom}</p>
                              <p className="text-[10px] text-encre-muted">ID #{cat.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-5 py-4 max-w-xs">
                          {cat.description ? (
                            <p className="text-xs text-encre-muted truncate">{cat.description}</p>
                          ) : (
                            <span className="text-xs text-encre-muted/50 italic">—</span>
                          )}
                        </td>

                        {/* Produits actifs */}
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            cat.nbProduits === 0
                              ? "bg-red-50 text-error"
                              : "bg-green-50 text-success"
                          )}>
                            <BookOpen className="w-3.5 h-3.5" />
                            {cat.nbProduits}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-encre">{cat.nbProduitsTotaux}</span>
                            {archiveNb > 0 && (
                              <span className="text-[10px] text-encre-muted font-body">
                                ({archiveNb} archivé{archiveNb > 1 ? "s" : ""})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {cat.nbProduits > 0 && (
                              <Link
                                href={`/catalogue?categoryId=${cat.id}`}
                                className="p-1.5 rounded-lg text-encre-muted hover:text-or hover:bg-or/10 transition-colors"
                                title="Voir dans le catalogue"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            <button
                              onClick={() => openEdit(cat)}
                              className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDelete(cat)}
                              disabled={cat.nbProduitsTotaux > 0}
                              className="p-1.5 rounded-lg text-encre-muted hover:text-error hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={cat.nbProduitsTotaux > 0 ? "Des produits sont rattachés" : "Supprimer"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ════════════════════════════
            MODALE CRÉATION
        ════════════════════════════ */}
        <Modal
          open={createOpen}
          onClose={() => { setCreateOpen(false); createForm.reset(); }}
          title="Nouvelle catégorie"
          size="md"
        >
          <div className="mb-5 p-4 bg-or/10 border border-or/20 rounded-xl text-sm font-body text-encre flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-or shrink-0 mt-0.5" />
            <p>
              Le nom sera automatiquement normalisé (première lettre en majuscule).
              Les noms doublons sont refusés.
            </p>
          </div>
          <CategoryFormFields
            form={createForm}
            onSubmit={handleCreate}
            submitLabel="Créer la catégorie"
          />
        </Modal>

        {/* ════════════════════════════
            MODALE ÉDITION
        ════════════════════════════ */}
        <Modal
          open={editOpen}
          onClose={() => { setEditOpen(false); setEditTarget(null); }}
          title={editTarget ? `Modifier « ${editTarget.nom} »` : "Modifier"}
          size="md"
        >
          {editTarget && (
            <>
              {/* Stats de la catégorie en contexte */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 p-3 bg-sable/40 rounded-xl text-center">
                  <p className="font-display font-black text-2xl text-encre">{editTarget.nbProduits}</p>
                  <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider mt-0.5">
                    produit{editTarget.nbProduits > 1 ? "s" : ""} actif{editTarget.nbProduits > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex-1 p-3 bg-sable/40 rounded-xl text-center">
                  <p className="font-display font-black text-2xl text-encre">{editTarget.nbProduitsTotaux}</p>
                  <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider mt-0.5">
                    total (actifs + archivés)
                  </p>
                </div>
              </div>

              <CategoryFormFields
                form={editForm}
                onSubmit={handleEdit}
                submitLabel="Enregistrer les modifications"
              />
            </>
          )}
        </Modal>

        {/* ════════════════════════════
            MODALE SUPPRESSION
        ════════════════════════════ */}
        <Modal
          open={deleteOpen}
          onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
          title="Supprimer la catégorie"
          size="sm"
        >
          {deleteTarget && (
            <div className="space-y-5">
              {deleteTarget.nbProduitsTotaux > 0 ? (
                /* Suppression impossible */
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                    <div className="text-sm font-body text-red-800">
                      <p className="font-bold mb-1">Suppression impossible</p>
                      <p>
                        La catégorie <strong>« {deleteTarget.nom} »</strong> contient{" "}
                        <strong>
                          {deleteTarget.nbProduitsTotaux} produit{deleteTarget.nbProduitsTotaux > 1 ? "s" : ""}
                        </strong>{" "}
                        ({deleteTarget.nbProduits} actif{deleteTarget.nbProduits > 1 ? "s" : ""},
                        {" "}{deleteTarget.nbProduitsTotaux - deleteTarget.nbProduits} archivé{deleteTarget.nbProduitsTotaux - deleteTarget.nbProduits > 1 ? "s" : ""}).
                      </p>
                      <p className="mt-2">
                        Réassignez ou supprimez tous les produits rattachés avant de pouvoir
                        supprimer cette catégorie.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/produits?categoryId=${deleteTarget.id}`}
                      className="btn-secondary text-sm"
                      onClick={() => setDeleteOpen(false)}
                    >
                      Gérer les produits
                    </Link>
                    <button
                      onClick={() => setDeleteOpen(false)}
                      className="btn-primary text-sm"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                /* Confirmation suppression */
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm font-body text-amber-800">
                      <p>
                        Vous êtes sur le point de supprimer définitivement la catégorie{" "}
                        <strong>« {deleteTarget.nom} »</strong>.
                      </p>
                      <p className="mt-1.5 font-semibold">Cette action est irréversible.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                    <p className="text-sm text-green-800 font-body">
                      La catégorie est vide — la suppression est autorisée.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-error text-white rounded-full
                                 text-sm font-body font-medium hover:opacity-90 transition-opacity
                                 disabled:opacity-50"
                    >
                      {deleting
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                      {deleting ? "Suppression…" : "Supprimer définitivement"}
                    </button>
                    <button
                      onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}
                      className="btn-secondary text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
}
