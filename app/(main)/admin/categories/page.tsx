"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, MoreVertical, 
  Folder, BookOpen, Loader2, AlertCircle, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // États pour le formulaire (Ajout/Edition)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ nom: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/categories");
      setCategories(data.data);
    } catch (err) {
      toast.error("Impossible de charger les catégories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) return;

    setSubmitting(true);
    try {
      if (editingCategory) {
        const { data } = await api.put(`/admin/categories/${editingCategory.id}`, formData);
        setCategories(categories.map(c => c.id === editingCategory.id ? data.data : c));
        toast.success("Catégorie mise à jour");
      } else {
        const { data } = await api.post("/admin/categories", formData);
        setCategories([data.data, ...categories]);
        toast.success("Catégorie créée avec succès");
      }
      closeModal();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette catégorie ?")) return;

    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      toast.success("Catégorie supprimée");
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ nom: category.nom, description: category.description || "" });
    } else {
      setEditingCategory(null);
      setFormData({ nom: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ nom: "", description: "" });
  };

  const filteredCategories = categories.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
          <AdminGuard>
                <AdminLayout>
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catégories</h1>
          <p className="text-slate-500 font-medium mt-1">Gérez les rayons de votre librairie</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Ajouter une catégorie
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Rechercher une catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-medium"
        />
      </div>

      {/* Table / Grille */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
          <p className="text-slate-400 font-bold animate-pulse">Chargement des catégories...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Nom</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Description</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-slate-900 transition-all shadow-sm">
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">{category.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-500 line-clamp-1 max-w-xs italic">
                      {category.description || "Aucune description"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(category)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCategories.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium">Aucune catégorie trouvée</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Formulaire */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900">
              {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nom du rayon</label>
                <input 
                  autoFocus
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="Ex: Science-Fiction, Développement Personnel..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-bold text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description (Optionnel)</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Une brève description de cette collection..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submitting || !formData.nom.trim()}
                  className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {editingCategory ? "Enregistrer" : "Créer le rayon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
          </AdminLayout>
          </AdminGuard>
  );
}