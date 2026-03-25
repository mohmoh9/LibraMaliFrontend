"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Crown, Search, TrendingUp, Users, 
  DollarSign, Percent, Trash2, ExternalLink,
  Loader2, ChevronLeft, ChevronRight, X,
  MoreVertical, ArrowUpRight, Award
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import type { InfluenceurStats, PageResponse } from "@/types";

/* ── Composant Stat Card ───────────────────────────────────────────────── */
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4 border-sable/50 shadow-sm">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-body text-encre-muted uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-display font-bold text-encre">{value}</p>
      </div>
    </div>
  );
}

export default function AdminInfluenceursPage() {
  const [data, setData] = useState<InfluenceurStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  /* ── Chargement des données ─────────────────────────────────────────── */
  const fetchInfluenceurs = useCallback(async () => {
    setLoading(true);
    try {
      // Ton endpoint GET /api/influenceurs supporte la pagination
      const { data: res } = await api.get(`/influenceurs?page=${page}&size=10`);
      const paged: PageResponse<InfluenceurStats> = res.data;
      
      setData(paged.content);
      setTotalPages(paged.totalPages);
      setTotalElements(paged.totalElements);
    } catch (err) {
      toast.error("Erreur lors du chargement des statistiques influenceurs.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchInfluenceurs();
  }, [fetchInfluenceurs]);

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const handleUpdateCommission = async (id: number, currentComm: number) => {
    const newVal = window.prompt(`Modifier le taux de commission (%) pour cet influenceur :`, currentComm.toString());
    if (newVal === null || isNaN(Number(newVal))) return;

    setLoadingId(id);
    try {
      await api.patch(`/influenceurs/${id}/commission`, { commission: Number(newVal) });
      toast.success("Commission mise à jour.");
      fetchInfluenceurs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteProfile = async (inf: InfluenceurStats) => {
    if (!confirm(`Supprimer le profil influenceur de ${inf.userNom} ?\n\nL'utilisateur redeviendra un 'CLIENT' simple.`)) return;
    
    setLoadingId(inf.id);
    try {
      await api.delete(`/influenceurs/${inf.id}`);
      toast.success("Profil supprimé avec succès.");
      fetchInfluenceurs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingId(null);
    }
  };

  /* ── Stats Globales (calculées sur la page actuelle pour l'exemple) ── */
  const totalCA = data.reduce((acc, curr) => acc + curr.totalVentes, 0);
  const totalComm = data.reduce((acc, curr) => acc + curr.commission, 0);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-or/10 rounded-lg">
                  <Crown className="w-5 h-5 text-or" />
                </div>
                <h1 className="font-display text-display-sm font-bold text-encre">Performance Influenceurs</h1>
              </div>
              <p className="text-encre-muted font-body">
                Suivez l'impact de vos partenaires sur les ventes globales.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                <input
                  type="text"
                  placeholder="Rechercher un partenaire..."
                  className="input-field pl-10 py-2 w-full md:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Chiffre d'Affaires" 
              value={formatPrix(totalCA)} 
              icon={<TrendingUp className="w-6 h-6" />} 
              color="bg-emerald-50 text-emerald-600" 
            />
            <StatCard 
              label="Commissions à payer" 
              value={formatPrix(totalComm)} 
              icon={<DollarSign className="w-6 h-6" />} 
              color="bg-or/10 text-or" 
            />
            <StatCard 
              label="Ventes Totales" 
              value={data.reduce((acc, curr) => acc + curr.nbCommandes, 0)} 
              icon={<Users className="w-6 h-6" />} 
              color="bg-blue-50 text-blue-600" 
            />
            <StatCard 
              label="Partenaires Actifs" 
              value={totalElements} 
              icon={<Award className="w-6 h-6" />} 
              color="bg-purple-50 text-purple-600" 
            />
          </div>

          {/* Tableau des Influenceurs */}
          <div className="card overflow-hidden border-sable">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sable/30 border-b border-sable text-xs uppercase tracking-widest text-encre-muted font-bold">
                    <th className="px-6 py-4">Partenaire</th>
                    <th className="px-6 py-4 text-center">Code Promo</th>
                    <th className="px-6 py-4">Taux Comm.</th>
                    <th className="px-6 py-4">Commandes</th>
                    <th className="px-6 py-4">CA Généré</th>
                    <th className="px-6 py-4">Commission</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="px-6 py-8"><div className="h-4 bg-sable/50 rounded w-full" /></td>
                      </tr>
                    ))
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <p className="text-encre-muted font-body">Aucun influenceur trouvé.</p>
                      </td>
                    </tr>
                  ) : data.map((inf) => (
                    <tr key={inf.id} className="group hover:bg-ivoire transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-encre flex items-center justify-center text-ivoire font-bold text-sm">
                            {inf.userNom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-display font-bold text-encre">{inf.userNom}</p>
                            <p className="text-xs text-encre-muted font-body">ID #{inf.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs font-bold bg-sable px-2.5 py-1 rounded-md text-encre">
                          {inf.codePromo}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-body text-encre">
                        <div className="flex items-center gap-1.5 text-success font-bold">
                          <Percent className="w-3.5 h-3.5" />
                          {inf.commission}%
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body text-encre">{inf.nbCommandes}</td>
                      <td className="px-6 py-4 font-body font-bold text-encre">
                        {formatPrix(inf.totalVentes)}
                      </td>
                      <td className="px-6 py-4 font-body text-or font-bold">
                        {formatPrix(inf.commission)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {loadingId === inf.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-encre-muted" />
                          ) : (
                            <>
                              <button 
                                onClick={() => handleUpdateCommission(inf.id, inf.commission)}
                                className="p-2 rounded-xl text-encre-muted hover:text-encre hover:bg-sable transition-all"
                                title="Modifier commission"
                              >
                                <Percent className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProfile(inf)}
                                className="p-2 rounded-xl text-encre-muted hover:text-error hover:bg-red-50 transition-all"
                                title="Supprimer le profil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button 
                disabled={page === 0} 
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-full border border-sable hover:border-encre disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-body text-sm text-encre-muted">
                Page <span className="text-encre font-bold">{page + 1}</span> sur {totalPages}
              </span>
              <button 
                disabled={page >= totalPages - 1} 
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-full border border-sable hover:border-encre disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      </AdminLayout>
    </AdminGuard>
  );
}