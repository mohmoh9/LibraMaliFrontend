"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Crown, Search, TrendingUp, Users, 
  DollarSign, Percent, Trash2, 
  Loader2, ChevronLeft, ChevronRight,
  Award, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";

/* ── Types ────────────────────────────────────────────────────────────── */
interface InfluenceurStats {
  id: number;
  userNom: string;
  codePromo: string;
  commission: number;
  nbCommandes: number;
  totalVentes: number;
  totalCommissions: number;
}

interface PageResponse {
  content: InfluenceurStats[];
  totalPages: number;
  totalElements: number;
}

/* ── Composant Stat Card ───────────────────────────────────────────────── */
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4 border-sable/50 shadow-sm bg-white">
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
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  /* ── Fetch Data ─────────────────────────────────────────────────────── */
  const fetchInfluenceurs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/influenceurs?page=${page}&size=10`);
      const paged: PageResponse = res.data;
      
      setData(paged.content);
      setTotalPages(paged.totalPages);
      setTotalElements(paged.totalElements);
    } catch (err) {
      toast.error("Erreur lors du chargement des statistiques.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchInfluenceurs();
  }, [fetchInfluenceurs]);

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const handleUpdateCommission = async (id: number, current: number) => {
    const newVal = window.prompt(`Nouveau taux de commission (%) pour ce partenaire :`, current.toString());
    if (!newVal || isNaN(Number(newVal))) return;

    setActionLoading(id);
    try {
      await api.patch(`/influenceurs/${id}/commission`, { commission: Number(newVal) });
      toast.success("Commission mise à jour.");
      fetchInfluenceurs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (inf: InfluenceurStats) => {
    if (!confirm(`Supprimer le profil influenceur de ${inf.userNom} ?\nL'utilisateur redeviendra un client standard.`)) return;
    
    setActionLoading(inf.id);
    try {
      await api.delete(`/influenceurs/${inf.id}`);
      toast.success("Profil supprimé.");
      fetchInfluenceurs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrage local pour la recherche
  const filteredData = data.filter(inf => 
    inf.userNom.toLowerCase().includes(search.toLowerCase()) || 
    inf.codePromo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-6 h-6 text-or" />
                <h1 className="font-display text-2xl font-bold text-encre">Statistiques Partenaires</h1>
              </div>
              <p className="text-encre-muted font-body">Suivez les performances et ventes générées par vos influenceurs.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
              <input
                type="text"
                placeholder="Nom ou code promo..."
                className="input-field pl-10 w-full md:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="CA Total Influenceurs" 
              value={formatPrix(data.reduce((acc, curr) => acc + curr.totalVentes, 0))} 
              icon={<TrendingUp className="w-6 h-6" />} 
              color="bg-emerald-50 text-emerald-600" 
            />
            <StatCard 
              label="Commissions Dues" 
              value={formatPrix(data.reduce((acc, curr) => acc + curr.totalCommissions, 0))} 
              icon={<DollarSign className="w-6 h-6" />} 
              color="bg-or/10 text-or" 
            />
            <StatCard 
              label="Ventes Converties" 
              value={data.reduce((acc, curr) => acc + curr.nbCommandes, 0)} 
              icon={<BarChart3 className="w-6 h-6" />} 
              color="bg-blue-50 text-blue-600" 
            />
            <StatCard 
              label="Total Partenaires" 
              value={totalElements} 
              icon={<Award className="w-6 h-6" />} 
              color="bg-purple-50 text-purple-600" 
            />
          </div>

          {/* Tableau */}
          <div className="card overflow-hidden border-sable bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-sable/20 border-b border-sable text-xs uppercase tracking-widest text-encre-muted font-bold">
                    <th className="px-6 py-4">Influenceur</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Commission (%)</th>
                    <th className="px-6 py-4">Ventes</th>
                    <th className="px-6 py-4">CA Généré</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sable">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-sable/40 rounded w-full" /></td>
                      </tr>
                    ))
                  ) : filteredData.map((inf) => (
                    <tr key={inf.id} className="hover:bg-ivoire transition-colors">
                      <td className="px-6 py-4 font-display font-bold text-encre">{inf.userNom}</td>
                      <td className="px-6 py-4">
                        <span className="bg-sable px-2 py-1 rounded text-xs font-mono font-bold">{inf.codePromo}</span>
                      </td>
                      <td className="px-6 py-4 text-success font-bold">{inf.commission}%</td>
                      <td className="px-6 py-4 text-encre-muted">{inf.nbCommandes}</td>
                      <td className="px-6 py-4 font-bold text-encre">{formatPrix(inf.totalVentes)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateCommission(inf.id, inf.commission)}
                            className="p-2 hover:bg-or/10 text-or rounded-lg transition-colors"
                            title="Modifier commission"
                          >
                            <Percent className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(inf)}
                            className="p-2 hover:bg-red-50 text-error rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            {actionLoading === inf.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
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
            <div className="flex items-center justify-center gap-4">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 disabled:opacity-30">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-body">Page {page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-2 disabled:opacity-30">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}