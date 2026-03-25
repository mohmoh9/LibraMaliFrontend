"use client";
// src/app/(main)/admin/utilisateurs/page.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Search, UserCog, Shield, User, Crown,
  Trash2, ChevronLeft, ChevronRight, Loader2,
  CheckCircle, XCircle, X, MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import type { User as UserType, Role, PageResponse } from "@/types";
// ... tes imports existants
import { useForm } from "react-hook-form"; // Optionnel, ou utilise des states

/* ── Modale Influenceur ────────────────────────────────────────────────── */
function InfluenceurModal({ 
  user, 
  onClose, 
  onConfirm 
}: { 
  user: UserType; 
  onClose: () => void; 
  onConfirm: (data: { codePromo: string; commission: number }) => void 
}) {
  const [code, setCode] = useState("");
  const [comm, setComm] = useState(10);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-encre/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-float border border-sable">
        <h3 className="font-display text-xl font-bold text-encre mb-1">Promouvoir {user.nom}</h3>
        <p className="text-xs text-encre-muted mb-6">Un profil influenceur sera créé avec les paramètres suivants.</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-encre-muted mb-1.5 block">Code Promo unique</label>
            <input 
              className="input-field uppercase" 
              placeholder="EX: MALI20" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-encre-muted mb-1.5 block">Commission (%)</label>
            <input 
              type="number" 
              className="input-field" 
              value={comm} 
              onChange={e => setComm(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button 
            disabled={!code || code.length < 3}
            onClick={() => onConfirm({ codePromo: code, commission: comm })} 
            className="btn-primary flex-1 bg-or border-or hover:bg-or-dark"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
/* ── Config rôles ───────────────────────────────────────────────────────── */
const ROLE_CONFIG: Record<Role, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  CLIENT:      { label: "Client",      icon: <User className="w-3 h-3" />,       color: "text-encre-muted", bg: "bg-sable" },
  ADMIN:       { label: "Admin",       icon: <Shield className="w-3 h-3" />,     color: "text-blue-700",    bg: "bg-blue-50" },
  INFLUENCEUR: { label: "Influenceur", icon: <Crown className="w-3 h-3" />,      color: "text-or",          bg: "bg-or/10" },
};

const ROLES: Role[] = ["CLIENT", "ADMIN", "INFLUENCEUR"];

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[36, 200, 160, 100, 90, 90, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Badge rôle ─────────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium", cfg.bg, cfg.color)}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function AdminUtilisateursPage() {
  const [users,      setUsers]      = useState<UserType[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEls,   setTotalEls]   = useState(0);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [loadingId,  setLoadingId]  = useState<number | null>(null);
  const [promotingUser, setPromotingUser] = useState<UserType | null>(null);

  /* ── Chargement ─────────────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url: string;
      if (search.trim()) {
        url = `/users/search?q=${encodeURIComponent(search)}&page=${page}&size=15`;
      } else if (roleFilter) {
        url = `/users/role/${roleFilter}?page=${page}&size=15`;
      } else {
        url = `/users?page=${page}&size=15`;
      }
      const { data } = await api.get(url);
      const paged: PageResponse<UserType> = data.data;
      setUsers(paged.content);
      setTotalPages(paged.totalPages);
      setTotalEls(paged.totalElements);
    } catch {
      toast.error("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Changement de rôle ─────────────────────────────────────────────── */
const handleRoleChange = async (userId: number, newRole: Role) => {
  if (newRole === "INFLUENCEUR") {
    const user = users.find(u => u.id === userId);
    if (user) {
      setPromotingUser(user);
      setOpenMenuId(null); // IMPORTANT : Fermer le dropdown immédiatement
    }
    return;
  }

    // Sinon, changement de rôle classique (Admin <-> Client)
setLoadingId(userId);
  setOpenMenuId(null);
  try {
    await api.patch(`/users/${userId}/role`, { role: newRole });
    setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success("Rôle mis à jour !");
  } catch (err) {
    toast.error(getErrorMessage(err));
  } finally {
    setLoadingId(null);
  }
};

  /* Nouveau : Création du profil influenceur */
const confirmPromotion = async (data: { codePromo: string; commission: number }) => {
  if (!promotingUser) return;
  
  // Validation locale simple avant envoi
  if (!data.codePromo.trim()) {
    toast.error("Le code promo est requis.");
    return;
  }

  const targetId = promotingUser.id;
  setLoadingId(targetId);
  setPromotingUser(null); // Ferme la modale immédiatement pour feedback UI

  try {
    await api.post("/influenceurs", {
      userId: targetId,
      codePromo: data.codePromo.trim().toUpperCase(),
      commission: data.commission || 10 // Valeur par défaut si 0 ou null
    });
    
    // Mettre à jour la liste locale
    setUsers(us => us.map(u => u.id === targetId ? { ...u, role: "INFLUENCEUR" } : u));
    toast.success(`${promotingUser.nom} est désormais Influenceur !`);
  } catch (err) {
    toast.error(getErrorMessage(err));
    // Optionnel : re-fetcher les users en cas d'erreur pour resynchroniser l'UI
    fetchUsers();
  } finally {
    setLoadingId(null);
  }
};

  /* ── Suppression ────────────────────────────────────────────────────── */
  const handleDelete = async (user: UserType) => {
    if (!confirm(`Supprimer le compte de « ${user.nom} » ? Cette action est irréversible.`)) return;
    setLoadingId(user.id);
    try {
      await api.delete(`/users/${user.id}`);
      toast.success("Compte supprimé.");
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingId(null);
    }
  };

  /* ── Stats rapides ──────────────────────────────────────────────────── */
  const clientCount      = users.filter(u => u.role === "CLIENT").length;
  const adminCount       = users.filter(u => u.role === "ADMIN").length;
  const influenceurCount = users.filter(u => u.role === "INFLUENCEUR").length;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-6">

          {/* ── En-tête ─────────────────────────────────────────────── */}
          <div>
            <h1 className="font-display text-display-md font-bold text-encre">Utilisateurs</h1>
            <p className="text-sm text-encre-muted font-body mt-0.5">
              {totalEls} compte{totalEls > 1 ? "s" : ""} enregistré{totalEls > 1 ? "s" : ""}
            </p>
          </div>

          {/* ── KPIs rôles ──────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Clients",      val: clientCount,      icon: <User className="w-4 h-4" />,        bg: "bg-sable",   col: "text-encre-muted" },
              { label: "Admins",       val: adminCount,       icon: <Shield className="w-4 h-4" />,      bg: "bg-blue-50", col: "text-blue-600" },
              { label: "Influenceurs", val: influenceurCount, icon: <Crown className="w-4 h-4" />,       bg: "bg-or/10",   col: "text-or" },
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

          {/* ── Filtres ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Nom, email…"
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

            {/* Filtre rôle */}
            <div className="flex bg-sable/60 rounded-xl p-1 gap-0.5">
              <button onClick={() => { setRoleFilter(""); setPage(0); }}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-body transition-all",
                  !roleFilter ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre")}>
                Tous
              </button>
              {ROLES.map(r => (
                <button key={r} onClick={() => { setRoleFilter(r); setPage(0); }}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-body transition-all capitalize",
                    roleFilter === r ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre")}>
                  {ROLE_CONFIG[r].label}
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
                    {["", "Nom", "Email", "Rôle", "Vérifié", "Inscrit le", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading
                    ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                    : users.length === 0
                      ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <UserCog className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                            <p className="font-display text-lg text-encre">Aucun utilisateur trouvé</p>
                          </td>
                        </tr>
                      )
                      : users.map(u => (
                        <tr key={u.id} className="hover:bg-ivoire transition-colors group">

                          {/* Avatar */}
                          <td className="px-4 py-3">
                            <div className="w-8 h-8 bg-encre rounded-full flex items-center justify-center shrink-0">
                              <span className="text-ivoire text-xs font-bold">{u.nom.charAt(0).toUpperCase()}</span>
                            </div>
                          </td>

                          {/* Nom */}
                          <td className="px-4 py-3 font-medium text-encre whitespace-nowrap">{u.nom}</td>

                          {/* Email */}
                          <td className="px-4 py-3 text-encre-muted max-w-[200px] truncate">{u.email}</td>

                          {/* Rôle */}
                          <td className="px-4 py-3">
                            <RoleBadge role={u.role} />
                          </td>

                          {/* Vérifié */}
                          <td className="px-4 py-3">
                            {u.emailVerifie
                              ? <CheckCircle className="w-4 h-4 text-success" />
                              : <XCircle className="w-4 h-4 text-encre-muted" />}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-encre-muted whitespace-nowrap">
                            {formatDate(u.creeLe)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            {loadingId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-encre-muted" />
                            ) : (
                              <div className="relative">
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                                  className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60
                                             transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* Menu dropdown */}
                                {openMenuId === u.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl
                                                  shadow-float border border-sable z-20 py-1 animate-fade-in">
                                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-encre-muted">
                                      Changer le rôle
                                    </p>
                                    {ROLES.filter(r => r !== u.role).map(r => {
                                      const cfg = ROLE_CONFIG[r];
                                      return (
                                        <button key={r} onClick={() => handleRoleChange(u.id, r)}
                                          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-body
                                                     text-encre hover:bg-sable transition-colors">
                                          <span className={cn("flex items-center gap-1", cfg.color)}>
                                            {cfg.icon} {cfg.label}
                                          </span>
                                        </button>
                                      );
                                    })}
                                    <hr className="my-1 border-sable" />
                                    <button onClick={() => { setOpenMenuId(null); handleDelete(u); }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-body
                                                 text-error hover:bg-red-50 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Supprimer le compte
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
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

        {/* Fermer le menu en cliquant ailleurs */}
        {openMenuId !== null && (
          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
        )}

        {/* Ajout de la modale à la fin du JSX */}
        {promotingUser && (
          <InfluenceurModal 
            user={promotingUser} 
            onClose={() => setPromotingUser(null)} 
            onConfirm={confirmPromotion} 
          />
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
