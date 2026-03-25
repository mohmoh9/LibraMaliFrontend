"use client";
// src/app/(main)/admin/promotions/page.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Plus, Tag, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Loader2, X, CheckCircle,
  Clock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, formatDateCourte, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import Modal from "@/components/ui/Modal";
import type { Promotion, Product, PageResponse, InfluenceurStats } from "@/types";

/* ── Schéma Zod ─────────────────────────────────────────────────────────── */
const promoSchema = z.object({
  code:        z.string()
                 .min(3, "Code trop court (min 3 caractères)")
                 .max(50)
                 .regex(/^[A-Z0-9_\-]+$/, "Majuscules, chiffres, tirets et underscores uniquement"),
  pourcentage: z.coerce.number()
                 .min(0.01, "La réduction doit être > 0")
                 .max(100,  "La réduction ne peut pas dépasser 100%"),
  dateDebut:   z.string().min(1, "Date de début obligatoire"),
  dateFin:     z.string().min(1, "Date de fin obligatoire"),
  productId:   z.coerce.number().optional(),
  influenceurId: z.string().optional().nullable(), // Ajoutez ceci
}).refine(d => new Date(d.dateFin) > new Date(d.dateDebut), {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["dateFin"],
});
type PromoForm = z.infer<typeof promoSchema>;

/* ── Helpers ────────────────────────────────────────────────────────────── */
function toInputDate(isoStr: string) {
  return isoStr ? isoStr.slice(0, 16) : "";
}

function StatutBadge({ promo }: { promo: Promotion }) {
  if (!promo.actif) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body bg-sable text-encre-muted">
        <X className="w-3 h-3" /> Désactivée
      </span>
    );
  }
  if (promo.valide) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body bg-green-50 text-success font-medium">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    );
  }
  const now = new Date();
  const debut = new Date(promo.dateDebut);
  if (debut > now) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body bg-blue-50 text-blue-600">
        <Clock className="w-3 h-3" /> Programmée
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body bg-amber-50 text-warning">
      <AlertCircle className="w-3 h-3" /> Expirée
    </span>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {/* On passe de 6 à 7 colonnes dans le map */}
      {[80, 60, 140, 100, 100, 90, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminPromotionsPage() {
  const [promos,     setPromos]     = useState<Promotion[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEls,   setTotalEls]   = useState(0);

  // Modale
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editPromo,  setEditPromo]  = useState<Promotion | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<PromoForm>({ resolver: zodResolver(promoSchema) });
const [influenceurs, setInfluenceurs] = useState<InfluenceurStats[]>([]);
const selectedInfluenceurId = form.watch("influenceurId");
  /* ── Chargement ─────────────────────────────────────────────────────── */
useEffect(() => {
  let isMounted = true; // Empêche les fuites de mémoire sur un composant démonté
  
  const loadData = async () => {
    // Optionnel : tu peux ajouter setLoading(true) ici
    try {
      const [prodRes, infRes] = await Promise.all([
        api.get("/products?size=100"), // On demande une taille large si c'est pour un select
        api.get("/influenceurs/list")
      ]);

      if (!isMounted) return;

      // Extraction sécurisée avec valeurs par défaut
      const productList = prodRes.data?.data?.content || [];
      const influenceurList = infRes.data?.data || [];

      setProducts(productList);
      setInfluenceurs(influenceurList);
      
      console.log(`Données chargées : ${productList.length} produits, ${influenceurList.length} influenceurs`);
      
    } catch (err) {
      if (!isMounted) return;
      console.error("Erreur chargement ressources:", err);
      toast.error("Impossible de charger les listes de produits ou d'influenceurs");
      setProducts([]);
      setInfluenceurs([]);
    } finally {
      // if (isMounted) setLoading(false);
    }
  };

  loadData();

  return () => {
    isMounted = false; // Nettoyage lors du démontage du composant
  };
}, []);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/promotions?page=${page}&size=15`);
      const paged: PageResponse<Promotion> = data.data;
      setPromos(paged.content);
      setTotalPages(paged.totalPages);
      setTotalEls(paged.totalElements);
    } catch {
      toast.error("Impossible de charger les promotions.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  /* ── Modale ─────────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditPromo(null);
    const now = new Date();
    const plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    form.reset({
      code: "",
      pourcentage: 10,
      dateDebut: now.toISOString().slice(0, 16),
      dateFin: plus30.toISOString().slice(0, 16),
      productId: undefined,
    });
    setModalOpen(true);
  };

const openEdit = (p: Promotion) => {
  setEditPromo(p);
  form.reset({
    code:         p.code,
    pourcentage: p.pourcentage,
    dateDebut:   toInputDate(p.dateDebut),
    dateFin:     toInputDate(p.dateFin),
    productId:   p.productId ?? undefined,
    influenceurId: p.influenceurId?.toString() ?? "", // Ajoute cette ligne
  });
  setModalOpen(true);
};

  /* ── Sauvegarder ────────────────────────────────────────────────────── */
const handleSave = async (values: PromoForm) => {
  setSaving(true);
  try {
    const payload = {
      ...values,
      code: values.code.toUpperCase(),
      // Conversion forcée en nombre ou null
      productId: values.productId ? Number(values.productId) : null,
      influenceurId: values.influenceurId ? Number(values.influenceurId) : null,
      dateDebut: new Date(values.dateDebut).toISOString(),
      dateFin: new Date(values.dateFin).toISOString(),
    };

    if (editPromo) {
      await api.put(`/promotions/${editPromo.id}`, payload);
      toast.success("Promotion mise à jour !");
    } else {
      await api.post("/promotions", payload);
      toast.success("Promotion créée !");
    }
    
    setModalOpen(false);
    fetchPromos(); // Recharge la liste
  } catch (err) {
    toast.error(getErrorMessage(err));
  } finally {
    setSaving(false);
  }
};

  /* ── Toggle actif ───────────────────────────────────────────────────── */
  const handleToggle = async (promo: Promotion) => {
    setTogglingId(promo.id);
    try {
      await api.patch(`/promotions/${promo.id}/toggle`);
      setPromos(ps => ps.map(p => p.id === promo.id ? { ...p, actif: !p.actif } : p));
      toast.success(promo.actif ? "Promotion désactivée." : "Promotion activée !");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Supprimer ──────────────────────────────────────────────────────── */
  const handleDelete = async (promo: Promotion) => {
    if (!confirm(`Supprimer définitivement le code « ${promo.code} » ?`)) return;
    setDeletingId(promo.id);
    try {
      await api.delete(`/promotions/${promo.id}`);
      toast.success("Promotion supprimée.");
      fetchPromos();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Stats rapides ──────────────────────────────────────────────────── */
  const actives   = promos.filter(p => p.valide).length;
  const inactives = promos.filter(p => !p.actif).length;
  const expirees  = promos.filter(p => p.actif && !p.valide && new Date(p.dateFin) < new Date()).length;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-6">

          {/* ── En-tête ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-display-md font-bold text-encre">Promotions</h1>
              <p className="text-sm text-encre-muted font-body mt-0.5">
                {totalEls} code{totalEls > 1 ? "s" : ""} promo au total
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" /> Nouveau code promo
            </button>
          </div>

          {/* ── KPIs ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Actives",     val: actives,   icon: <CheckCircle className="w-4 h-4" />, bg: "bg-green-50",  col: "text-success" },
              { label: "Désactivées", val: inactives,  icon: <X className="w-4 h-4" />,          bg: "bg-sable",     col: "text-encre-muted" },
              { label: "Expirées",    val: expirees,   icon: <AlertCircle className="w-4 h-4" />, bg: "bg-amber-50",  col: "text-warning" },
            ].map(k => (
              <div key={k.label} className="card p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg, k.col)}>
                  {k.icon}
                </div>
                <div>
                  <p className="font-display font-bold text-xl text-encre">{k.val}</p>
                  <p className="text-xs text-encre-muted font-body">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tableau ─────────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["Code", "Réduction", "Période", "Produit", "Influenceur", "Statut", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                    : promos.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <Tag className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                            <p className="font-display text-lg text-encre">Aucune promotion</p>
                            <p className="text-sm text-encre-muted font-body mt-1">
                              Créez votre premier code promo.
                            </p>
                          </td>
                        </tr>
                      )
                      : promos.map(promo => (
                        <tr key={promo.id} className={cn(
                          "hover:bg-ivoire transition-colors group",
                          !promo.actif && "opacity-60"
                        )}>
                          {/* Code */}
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-encre text-sm bg-sable px-2.5 py-1 rounded-lg">
                              {promo.code}
                            </span>
                          </td>

                          {/* Réduction */}
                          <td className="px-4 py-3">
                            <span className="font-display font-bold text-or text-lg">
                              {promo.pourcentage}%
                            </span>
                          </td>

                          {/* Période */}
                          <td className="px-4 py-3 text-encre-muted whitespace-nowrap">
                            <p className="text-xs">{formatDateCourte(promo.dateDebut)}</p>
                            <p className="text-xs">→ {formatDateCourte(promo.dateFin)}</p>
                          </td>

                          {/* Produit */}
                          <td className="px-4 py-3">
                            {promo.productTitre ? (
                              <span className="text-xs text-encre bg-sable px-2 py-1 rounded-full max-w-[140px] truncate block">
                                {promo.productTitre}
                              </span>
                            ) : (
                              <span className="text-xs text-encre-muted">Global (panier)</span>
                            )}
                          </td>

                          {/* Influenceur */}
<td className="px-4 py-3">
  {promo.influenceurNom ? (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-encre">
        {promo.influenceurNom}
      </span>
      <span className="text-[10px] text-or font-body uppercase tracking-tight">
        Partenaire
      </span>
    </div>
  ) : (
    <span className="text-xs text-encre-muted italic">Interne</span>
  )}
</td>

                          {/* Statut */}
                          <td className="px-4 py-3">
                            <StatutBadge promo={promo} />
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Modifier */}
                              <button onClick={() => openEdit(promo)}
                                className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors"
                                title="Modifier">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle actif */}
                              <button
                                onClick={() => handleToggle(promo)}
                                disabled={togglingId === promo.id}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors",
                                  promo.actif
                                    ? "text-success hover:bg-green-50"
                                    : "text-encre-muted hover:bg-sable/60 hover:text-encre"
                                )}
                                title={promo.actif ? "Désactiver" : "Activer"}
                              >
                                {togglingId === promo.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : promo.actif
                                    ? <ToggleRight className="w-4 h-4" />
                                    : <ToggleLeft className="w-4 h-4" />}
                              </button>

                              {/* Supprimer */}
                              <button
                                onClick={() => handleDelete(promo)}
                                disabled={deletingId === promo.id}
                                className="p-1.5 rounded-lg text-encre-muted hover:text-error hover:bg-red-50 transition-colors"
                                title="Supprimer définitivement"
                              >
                                {deletingId === promo.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
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

        {/* ── Modale Créer / Modifier ──────────────────────────────── */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editPromo ? `Modifier « ${editPromo.code} »` : "Nouveau code promo"}
          size="md"
        >
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5">

            {/* Code */}
            <div>
              <label className="input-label">Code *</label>
              <input
                {...form.register("code")}
                placeholder="EX: LIRE20"
                className="input-field font-mono uppercase"
                onChange={e => form.setValue("code", e.target.value.toUpperCase())}
              />
              <p className="text-xs text-encre-muted font-body mt-1">
                Majuscules, chiffres, tirets et underscores uniquement.
              </p>
              {form.formState.errors.code && (
                <p className="text-xs text-error mt-1">{form.formState.errors.code.message}</p>
              )}
            </div>

            {/* Pourcentage */}
            <div>
              <label className="input-label">Réduction (%) *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={100}
                  {...form.register("pourcentage")}
                  className="input-field pr-10"
                  placeholder="10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-body text-encre-muted">%</span>
              </div>
              {form.formState.errors.pourcentage && (
                <p className="text-xs text-error mt-1">{form.formState.errors.pourcentage.message}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Date de début *</label>
                <input type="datetime-local" {...form.register("dateDebut")} className="input-field" />
                {form.formState.errors.dateDebut && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.dateDebut.message}</p>
                )}
              </div>
              <div>
                <label className="input-label">Date de fin *</label>
                <input type="datetime-local" {...form.register("dateFin")} className="input-field" />
                {form.formState.errors.dateFin && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.dateFin.message}</p>
                )}
              </div>
            </div>

{/* Influenceur lié */}
<div className="bg-or/5 p-4 rounded-xl border border-or/10 space-y-3">
  <div>
    <label className="input-label text-or-dark">
      Influenceur / Partenaire{" "}
      <span className="normal-case tracking-normal opacity-70">(Lien direct)</span>
    </label>
    <select 
      {...form.register("influenceurId")} 
      className="input-field border-or/20 focus:border-or focus:ring-or/20"
    >
      <option value="">Aucun (Promotion Interne)</option>
      {Array.isArray(influenceurs) && influenceurs.map((inf) => (
        <option key={inf.id} value={inf.id}>
          {inf.userNom}
        </option>
      ))}
    </select>
  </div>

  {/* Code Promo - On l'affiche juste après l'influenceur pour la cohérence */}
  <div>
    <label className="input-label">Code du coupon *</label>
    <input
      {...form.register("code")}
      placeholder="EX: MALI20"
      className="input-field font-mono uppercase font-bold"
      onChange={e => form.setValue("code", e.target.value.toUpperCase())}
    />
    <p className="text-[10px] text-encre-muted uppercase tracking-widest mt-1">
      {selectedInfluenceurId 
        ? "⚠️ Doit correspondre au code de l'influenceur pour le suivi."
        : "Utilisez un code unique pour cette promotion interne."}
    </p>
  </div>
</div>

{/* Produit lié */}
<div className="pt-2">
  <label className="input-label">
    Produit ciblé <span className="text-encre-muted/50 normal-case">(Optionnel)</span>
  </label>
  <select {...form.register("productId")} className="input-field">
    <option value="">Toute la boutique (Global)</option>
    {Array.isArray(products) && products.map(p => (
      <option key={p.id} value={p.id}>{p.titre} — {p.auteur}</option>
    ))}
  </select>
</div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-sable">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editPromo ? "Enregistrer" : "Créer le code promo"}
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
}
