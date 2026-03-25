"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Plus, Search, Pencil, Trash2, 
  Tag, Loader2, X, Info, BookOpen 
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

/* ── Schéma de validation Zod ────────────────────────────────────────────── */
const categorySchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
});
type CategoryForm = z.infer<typeof categorySchema>;

/* ── Skeleton de chargement ──────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[250, 400, 100].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<CategoryForm>({ 
    resolver: zodResolver(categorySchema) 
  });

  /* ── Chargement des données ───────────────────────────────────────────── */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/categories");
      // On s'adapte au format de réponse (data.data ou data direct)
      setCategories(data.data ?? data);
    } catch (err) {
      toast.error("Erreur lors du chargement des catégories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ── Gestion des actions ──────────────────────────────────────────────── */
  const openCreate = () => {
    setEditCategory(null);
    form.reset({ nom: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditCategory(c);
    form.reset({
      nom: c.nom,
      description: c.description ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditCategory(null);
  };

  const handleSave = async (values: CategoryForm) => {
    setSaving(true);
    try {
      if (editCategory) {
        await api.put(`/categories/${editCategory.id}`, values);
        toast.success("Catégorie mise à jour !");
      } else {
        await api.post("/categories", values);
        toast.success("Catégorie créée !");
      }
      fetchCategories();
      closeModal();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(`Supprimer la catégorie « ${c.nom} » ?\nNote : Cela échouera si des livres y sont encore rattachés.`)) return;
    
    try {
      await api.delete(`/categories/${c.id}`);
      toast.success("Catégorie supprimée avec succès.");
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  /* ── Filtrage côté client ─────────────────────────────────────────────── */
  const filteredCategories = categories.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-6">
          
          {/* ── En-tête ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-display-md font-bold text-encre">Catégories</h1>
              <p className="text-sm text-encre-muted font-body mt-0.5">
                {categories.length} catégorie{categories.length > 1 ? "s" : ""} au total
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" /> Nouvelle catégorie
            </button>
          </div>

          {/* ── Filtres ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une catégorie..."
                className="pl-9 pr-9 py-2 text-sm font-body bg-white border border-sable-dark rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or w-64 text-encre"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Tableau ──────────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["Nom", "Description", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-16 text-center">
                        <Tag className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                        <p className="font-display text-lg text-encre">Aucune catégorie trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(c => (
                      <tr key={c.id} className="hover:bg-ivoire transition-colors group">
                        <td className="px-4 py-4">
                          <span className="font-medium text-encre">{c.nom}</span>
                        </td>
                        <td className="px-4 py-4 text-encre-muted max-w-md">
                          <p className="truncate">{c.description || "—"}</p>
                        </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-sable-dark" />
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            (c as any).nbProduits > 0 ? "bg-sable text-encre" : "bg-ivoire text-encre-muted"
                          )}>
                            {(c as any).nbProduits || 0}
                          </span>
                        </div>
                      </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEdit(c)}
                              className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(c)}
                              className="p-1.5 rounded-lg text-encre-muted hover:text-error hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Modale de création/édition ─────────────────────────────── */}
        <Modal
          open={modalOpen}
          onClose={closeModal}
          title={editCategory ? `Modifier « ${editCategory.nom} »` : "Nouvelle catégorie"}
          size="md"
        >
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5 animate-fade-in">
            <div className="space-y-4">
              {/* Champ Nom */}
              <div>
                <label className="input-label flex items-center gap-2">
                  Nom de la catégorie *
                </label>
                <input 
                  {...form.register("nom")} 
                  className="input-field" 
                  placeholder="Ex: Littérature, Science-Fiction..." 
                />
                {form.formState.errors.nom && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.nom.message}</p>
                )}
              </div>

              {/* Champ Description */}
              <div>
                <label className="input-label">Description</label>
                <textarea 
                  {...form.register("description")} 
                  rows={4}
                  className="input-field resize-none" 
                  placeholder="Expliquez brièvement le contenu de cette catégorie..." 
                />
              </div>
            </div>

            {/* Actions de la modale */}
            <div className="flex gap-3 pt-4 border-t border-sable">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editCategory ? "Enregistrer les modifications" : "Créer la catégorie"}
              </button>
              <button type="button" onClick={closeModal} className="btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
}