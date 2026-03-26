"use client";
// src/app/(main)/admin/influenceurs/page.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Sparkles, Plus, Pencil, Trash2, Search, X,
  ChevronLeft, ChevronRight, Loader2, Copy,
  TrendingUp, ShoppingBag, Tag, Crown,
  AlertCircle, CheckCircle,
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
import type { InfluenceurStats, User, PageResponse } from "@/types";

/* ── Schémas Zod ─────────────────────────────────────────────────────────── */
const createSchema = z.object({
  userId:     z.coerce.number({ required_error: "Sélectionnez un utilisateur" })
                      .positive("Sélectionnez un utilisateur"),
  codePromo:  z.string()
                .min(3, "Code trop court (min 3 car.)")
                .max(20, "Code trop long (max 20 car.)")
                .regex(/^[A-Z0-9_\-]+$/, "Majuscules, chiffres, - et _ uniquement"),
  commission: z.coerce.number()
                .min(0.01, "Commission > 0%")
                .max(50,   "Commission ≤ 50%"),
});

const editSchema = z.object({
  commission: z.coerce.number()
                .min(0.01, "Commission > 0%")
                .max(50,   "Commission ≤ 50%"),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm   = z.infer<typeof editSchema>;

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[180, 120, 90, 100, 100, 90, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, icon, bg, col,
}: { label: string; value: React.ReactNode; icon: React.ReactNode; bg: string; col: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg, col)}>
        {icon}
      </div>
      <div>
        <p className="font-display font-bold text-2xl text-encre">{value}</p>
        <p className="text-xs text-encre-muted font-body">{label}</p>
      </div>
    </div>
  );
}

/* ── Badge rang ───────────────────────────────────────────────────────────── */
function RangBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">🥇 Top</span>;
  if (rank === 2) return <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">🥈 #2</span>;
  if (rank === 3) return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">🥉 #3</span>;
  return null;
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AdminInfluenceursPage() {
  const [influenceurs, setInfluenceurs] = useState<InfluenceurStats[]>([]);
  const [clients,      setClients]      = useState<User[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalEls,     setTotalEls]     = useState(0);

  // Modales
  const [createOpen,   setCreateOpen]   = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<InfluenceurStats | null>(null);
  const [detailOpen,   setDetailOpen]   = useState(false);
  const [detailTarget, setDetailTarget] = useState<InfluenceurStats | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [deletingId,   setDeletingId]   = useState<number | null>(null);

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const editForm   = useForm<EditForm>  ({ resolver: zodResolver(editSchema) });

  /* ── Stats globales ─────────────────────────────────────────────────── */
  const totalCA         = influenceurs.reduce((s, i) => s + i.totalVentes, 0);
  const totalCommission = influenceurs.reduce((s, i) => s + i.commissionGagnee, 0);
  const totalCommandes  = influenceurs.reduce((s, i) => s + i.nbCommandes, 0);

  /* ── Chargement ─────────────────────────────────────────────────────── */
  const fetchInfluenceurs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/influenceurs?page=${page}&size=15`);
      const payload  = data?.data ?? data;
      let content: InfluenceurStats[] = payload?.content ?? [];

      if (search.trim()) {
        const q = search.toLowerCase();
        content = content.filter(i =>
          i.userNom.toLowerCase().includes(q)     ||
          i.userEmail.toLowerCase().includes(q)   ||
          i.codePromo.toLowerCase().includes(q)
        );
      }

      setInfluenceurs(content);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalEls(payload?.totalElements ?? content.length);
    } catch {
      toast.error("Impossible de charger les influenceurs.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Charger les utilisateurs (CLIENT uniquement) pour le select de création
  const fetchClients = useCallback(async () => {
    try {
      const { data } = await api.get("/users/role/CLIENT?page=0&size=100");
      const payload  = data?.data ?? data;
      setClients(payload?.content ?? []);
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => { fetchInfluenceurs(); }, [fetchInfluenceurs]);
  useEffect(() => { fetchClients(); },     [fetchClients]);

  /* ── Créer un influenceur ────────────────────────────────────────────── */
  const handleCreate = async (values: CreateForm) => {
    setSaving(true);
    try {
      await api.post("/influenceurs", {
        userId:     values.userId,
        codePromo:  values.codePromo.toUpperCase(),
        commission: values.commission,
      });
      toast.success("Profil influenceur créé !");
      setCreateOpen(false);
      createForm.reset();
      fetchInfluenceurs();
      fetchClients(); // retirer l'utilisateur promu du select
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── Modifier la commission ──────────────────────────────────────────── */
  const openEdit = (inf: InfluenceurStats) => {
    setEditTarget(inf);
    editForm.reset({ commission: inf.commission });
    setEditOpen(true);
  };

  const handleEdit = async (values: EditForm) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await api.patch(`/influenceurs/${editTarget.id}/commission`, {
        commission: values.commission,
      });
      toast.success("Commission mise à jour !");
      setEditOpen(false);
      setEditTarget(null);
      fetchInfluenceurs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── Supprimer un influenceur ────────────────────────────────────────── */
  const handleDelete = async (inf: InfluenceurStats) => {
    if (!confirm(
      `Rétrograder « ${inf.userNom} » au rôle CLIENT et supprimer son profil influenceur ?\n\nSes promotions liées resteront actives.`
    )) return;

    setDeletingId(inf.id);
    try {
      await api.delete(`/influenceurs/${inf.id}`);
      toast.success(`« ${inf.userNom} » rétrogradé au rôle CLIENT.`);
      fetchInfluenceurs();
      fetchClients();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Copier le code promo ────────────────────────────────────────────── */
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success(`Code « ${code} » copié !`));
  };

  /* ── Ouvrir le détail ────────────────────────────────────────────────── */
  const openDetail = (inf: InfluenceurStats) => {
    setDetailTarget(inf);
    setDetailOpen(true);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-7">

          {/* ── En-tête ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-display-md font-bold text-encre">Influenceurs</h1>
              <p className="text-sm text-encre-muted font-body mt-0.5">
                {totalEls} profil{totalEls > 1 ? "s" : ""} actif{totalEls > 1 ? "s" : ""}
              </p>
            </div>

          </div>

          {/* ── KPIs ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Influenceurs" value={totalEls}
              icon={<Crown className="w-5 h-5" />} bg="bg-amber-50" col="text-amber-600" />
            <KpiCard label="CA total généré" value={formatPrix(totalCA)}
              icon={<TrendingUp className="w-5 h-5" />} bg="bg-green-50" col="text-success" />
            <KpiCard label="Commissions dues" value={formatPrix(totalCommission)}
              icon={<Sparkles className="w-5 h-5" />} bg="bg-purple-50" col="text-purple-600" />
            <KpiCard label="Commandes apportées" value={totalCommandes}
              icon={<ShoppingBag className="w-5 h-5" />} bg="bg-blue-50" col="text-blue-600" />
          </div>

          {/* ── Recherche ────────────────────────────────────────────── */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Nom, email, code promo…"
              className="pl-9 pr-9 py-2 text-sm font-body bg-white border border-sable-dark rounded-xl
                         w-full focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(0); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ── Tableau ──────────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-sable">
                  <tr>
                    {["Rang", "Influenceur", "Code promo", "Commission", "CA généré", "Commandes", "Promos", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                    : influenceurs.length === 0
                      ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center">
                            <Sparkles className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                            <p className="font-display text-lg text-encre">Aucun influenceur</p>
                            <p className="text-sm text-encre-muted font-body mt-1">
                              Créez le premier profil influenceur.
                            </p>
                          </td>
                        </tr>
                      )
                      : influenceurs.map((inf, idx) => (
                        <tr key={inf.id}
                          onClick={() => openDetail(inf)}
                          className="hover:bg-ivoire transition-colors group cursor-pointer">

                          {/* Rang */}
                          <td className="px-4 py-3">
                            <RangBadge rank={page * 15 + idx + 1} />
                            {page * 15 + idx + 1 > 3 && (
                              <span className="text-xs text-encre-muted font-mono">
                                #{page * 15 + idx + 1}
                              </span>
                            )}
                          </td>

                          {/* Influenceur */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600
                                              flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-white font-bold text-sm">
                                  {inf.userNom.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-encre">{inf.userNom}</p>
                                <p className="text-xs text-encre-muted truncate max-w-[160px]">
                                  {inf.userEmail}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Code promo */}
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-encre text-sm bg-sable
                                               px-2.5 py-1 rounded-lg tracking-wide">
                                {inf.codePromo}
                              </span>
                              <button
                                onClick={() => copyCode(inf.codePromo)}
                                className="p-1 rounded text-encre-muted hover:text-encre hover:bg-sable/60
                                           transition-colors opacity-0 group-hover:opacity-100"
                                title="Copier le code">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Commission */}
                          <td className="px-4 py-3">
                            <span className={cn(
                              "font-bold text-sm",
                              inf.commission >= 20 ? "text-green-600"
                                : inf.commission >= 10 ? "text-amber-600"
                                : "text-encre-muted"
                            )}>
                              {inf.commission.toFixed(1)}%
                            </span>
                          </td>

                          {/* CA généré */}
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-display font-semibold text-encre">
                                {formatPrix(inf.totalVentes)}
                              </p>
                              <p className="text-xs text-success font-body">
                                Commission : {formatPrix(inf.commissionGagnee)}
                              </p>
                            </div>
                          </td>

                          {/* Commandes */}
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-encre">{inf.nbCommandes}</span>
                          </td>

                          {/* Promos actives */}
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              inf.nbPromosActives > 0
                                ? "bg-green-50 text-success"
                                : "bg-sable text-encre-muted"
                            )}>
                              <Tag className="w-3 h-3" />
                              {inf.nbPromosActives}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(inf)}
                                className="p-1.5 rounded-lg text-encre-muted hover:text-encre
                                           hover:bg-sable/60 transition-colors"
                                title="Modifier la commission">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(inf)}
                                disabled={deletingId === inf.id}
                                className="p-1.5 rounded-lg text-encre-muted hover:text-error
                                           hover:bg-red-50 transition-colors"
                                title="Supprimer le profil">
                                {deletingId === inf.id
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

        {/* ── Modale création ──────────────────────────────────────── */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)}
          title="Nouvel influenceur" size="md">
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-5">

            {/* Sélection utilisateur */}
            <div>
              <label className="input-label">Utilisateur (CLIENT) *</label>
              <select {...createForm.register("userId")} className="input-field">
                <option value="">— Sélectionner un utilisateur —</option>
                {clients.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nom} — {u.email}
                  </option>
                ))}
              </select>
              {createForm.formState.errors.userId && (
                <p className="text-xs text-error mt-1">{createForm.formState.errors.userId.message}</p>
              )}
              <p className="text-xs text-encre-muted font-body mt-1">
                Seuls les utilisateurs avec le rôle CLIENT sont listés.
                Le rôle sera automatiquement promu à INFLUENCEUR.
              </p>
            </div>

            {/* Code promo */}
            <div>
              <label className="input-label">Code promo *</label>
              <input
                {...createForm.register("codePromo")}
                placeholder="EX: INFLUMAX20"
                className="input-field font-mono uppercase"
                onChange={e => createForm.setValue("codePromo", e.target.value.toUpperCase())}
              />
              {createForm.formState.errors.codePromo && (
                <p className="text-xs text-error mt-1">{createForm.formState.errors.codePromo.message}</p>
              )}
              <p className="text-xs text-encre-muted font-body mt-1">
                3–20 caractères. Majuscules, chiffres, tirets (-) et underscores (_) uniquement.
              </p>
            </div>

            {/* Commission */}
            <div>
              <label className="input-label">Taux de commission (%) *</label>
              <div className="relative">
                <input
                  type="number" step="0.01" min={0.01} max={50}
                  {...createForm.register("commission")}
                  placeholder="10"
                  className="input-field pr-8"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm
                                 text-encre-muted font-body">%</span>
              </div>
              {createForm.formState.errors.commission && (
                <p className="text-xs text-error mt-1">{createForm.formState.errors.commission.message}</p>
              )}
              <p className="text-xs text-encre-muted font-body mt-1">
                Entre 0.01% et 50%. Ce taux s'applique au CA total généré via son code.
              </p>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 font-body">
                <p className="font-semibold mb-1">Promotion automatique du rôle</p>
                <p>
                  L'utilisateur sélectionné verra son rôle passer de <strong>CLIENT</strong>{" "}
                  à <strong>INFLUENCEUR</strong> automatiquement lors de la création.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-sable">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer le profil
              </button>
              <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </Modal>

        {/* ── Modale édition commission ─────────────────────────────── */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)}
          title={editTarget ? `Modifier « ${editTarget.userNom} »` : "Modifier"} size="sm">
          {editTarget && (
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-5">

              {/* Info influenceur */}
              <div className="flex items-center gap-3 p-4 bg-sable/40 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600
                                flex items-center justify-center shrink-0">
                  <span className="text-white font-bold">{editTarget.userNom.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-encre text-sm">{editTarget.userNom}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs bg-sable text-encre px-2 py-0.5 rounded">
                      {editTarget.codePromo}
                    </span>
                    <span className="text-xs text-encre-muted">
                      Commission actuelle : <strong>{editTarget.commission.toFixed(1)}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Nouvelle commission */}
              <div>
                <label className="input-label">Nouveau taux de commission (%) *</label>
                <div className="relative">
                  <input
                    type="number" step="0.01" min={0.01} max={50}
                    {...editForm.register("commission")}
                    className="input-field pr-8"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-encre-muted">%</span>
                </div>
                {editForm.formState.errors.commission && (
                  <p className="text-xs text-error mt-1">{editForm.formState.errors.commission.message}</p>
                )}
              </div>

              {/* Aperçu commission gagnée */}
              {editForm.watch("commission") > 0 && editTarget.totalVentes > 0 && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-sm font-body animate-fade-in">
                  <p className="text-xs text-encre-muted mb-1">
                    Sur le CA actuel ({formatPrix(editTarget.totalVentes)}) :
                  </p>
                  <p className="font-bold text-success">
                    Commission due ≈{" "}
                    {formatPrix(editTarget.totalVentes * (editForm.watch("commission") ?? 0) / 100)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-sable">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
                <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* ── Modale détail influenceur ─────────────────────────────── */}
        <Modal open={detailOpen} onClose={() => setDetailOpen(false)}
          title={detailTarget ? `Profil — ${detailTarget.userNom}` : "Détail"} size="md">
          {detailTarget && (
            <div className="space-y-6">

              {/* Identité */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600
                                flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-2xl">
                    {detailTarget.userNom.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-encre">{detailTarget.userNom}</h3>
                  <p className="text-sm text-encre-muted font-body">{detailTarget.userEmail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-or font-mono text-xs">{detailTarget.codePromo}</span>
                    <button onClick={() => copyCode(detailTarget.codePromo)}
                      className="p-1 text-encre-muted hover:text-or transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats détaillées */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "CA total généré",       value: formatPrix(detailTarget.totalVentes),      icon: <TrendingUp className="w-4 h-4" />, bg: "bg-green-50", col: "text-success" },
                  { label: "Commission gagnée",      value: formatPrix(detailTarget.commissionGagnee), icon: <Sparkles className="w-4 h-4" />,   bg: "bg-purple-50", col: "text-purple-600" },
                  { label: "Commandes apportées",    value: detailTarget.nbCommandes,                  icon: <ShoppingBag className="w-4 h-4" />, bg: "bg-blue-50", col: "text-blue-600" },
                  { label: "Promotions actives",     value: detailTarget.nbPromosActives,              icon: <Tag className="w-4 h-4" />,        bg: "bg-amber-50", col: "text-amber-600" },
                ].map(s => (
                  <div key={s.label} className="card p-4 flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", s.bg, s.col)}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg text-encre">{s.value}</p>
                      <p className="text-xs text-encre-muted font-body">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Taux commission */}
              <div className="p-4 bg-sable/40 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-1">
                    Taux de commission
                  </p>
                  <p className="font-display font-bold text-3xl text-encre">
                    {detailTarget.commission.toFixed(1)}
                    <span className="text-xl text-encre-muted ml-1">%</span>
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-success" />
              </div>

              {/* Panier moyen */}
              {detailTarget.nbCommandes > 0 && (
                <div className="flex items-center justify-between text-sm font-body px-1">
                  <span className="text-encre-muted">Panier moyen</span>
                  <span className="font-semibold text-encre">
                    {formatPrix(detailTarget.totalVentes / detailTarget.nbCommandes)}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-sable">
                <button onClick={() => { setDetailOpen(false); openEdit(detailTarget); }}
                  className="btn-secondary flex-1 justify-center">
                  <Pencil className="w-4 h-4" />
                  Modifier la commission
                </button>
                <button
                  onClick={() => { setDetailOpen(false); handleDelete(detailTarget); }}
                  disabled={deletingId === detailTarget.id}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-body font-medium
                             text-error border border-error/30 rounded-full hover:bg-red-50
                             transition-colors disabled:opacity-40">
                  {deletingId === detailTarget.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
}
