"use client";
// src/app/(main)/admin/dashboard/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, Users, Package, TrendingUp, Clock,
  CheckCircle, Truck, XCircle, LayoutDashboard,
  BookOpen, Tag, UserCog, Loader2
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatPrix, formatDate, statutCommandeLabel, statutCommandeColor } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { Order, OrderStats, PageResponse } from "@/types";

const NAV_ADMIN = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/admin/produits", label: "Produits", icon: <BookOpen className="w-4 h-4" /> },
  { href: "/admin/commandes", label: "Commandes", icon: <ShoppingBag className="w-4 h-4" /> },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: <Users className="w-4 h-4" /> },
  { href: "/admin/promotions", label: "Promotions", icon: <Tag className="w-4 h-4" /> },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") { router.push("/"); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get("/orders/stats"),
          api.get("/orders?page=0&size=6"),
        ]);
        setStats(statsRes.data.data);
        const paged: PageResponse<Order> = ordersRes.data.data;
        setRecentOrders(paged.content);
      } catch {
        toast.error("Erreur lors du chargement du dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, role]);

  if (!isAuthenticated || role !== "ADMIN") return null;

  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar admin ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-encre text-ivoire shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        <div className="p-6 border-b" style={{ borderColor: "#2D2A26" }}>
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: "#6B6560" }}>
            Administration
          </p>
          <p className="font-display font-semibold mt-1">LibraMali</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ADMIN.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body
                         transition-colors hover:bg-white/10"
              style={{ color: "#C4BFB9" }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "#2D2A26" }}>
          <Link href="/" className="flex items-center gap-2 text-xs font-body"
            style={{ color: "#6B6560" }}>
            ← Retour au site
          </Link>
        </div>
      </aside>

      {/* ── Contenu principal ─────────────────────────────────────────── */}
      <main className="flex-1 p-6 lg:p-10 bg-ivoire overflow-auto">

        <div className="mb-8">
          <h1 className="font-display text-display-md font-bold text-encre">Dashboard</h1>
          <p className="font-body text-sm text-encre-muted mt-1">Vue d&apos;ensemble de l&apos;activité</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-encre-muted" />
          </div>
        ) : (
          <>
            {/* ── KPI Cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Commandes totales",
                  val: stats?.totalCommandes ?? 0,
                  icon: <ShoppingBag className="w-5 h-5" />,
                  color: "bg-blue-50 text-blue-600",
                },
                {
                  label: "CA total",
                  val: formatPrix(stats?.chiffreAffaireTotal ?? 0),
                  icon: <TrendingUp className="w-5 h-5" />,
                  color: "bg-green-50 text-green-600",
                },
                {
                  label: "CA ce mois",
                  val: formatPrix(stats?.chiffreAffaireMoisEnCours ?? 0),
                  icon: <TrendingUp className="w-5 h-5" />,
                  color: "bg-or/10 text-or",
                },
                {
                  label: "En attente",
                  val: stats?.enAttente ?? 0,
                  icon: <Clock className="w-5 h-5" />,
                  color: "bg-amber-50 text-amber-600",
                },
              ].map((kpi) => (
                <div key={kpi.label} className="card p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                  <p className="font-display font-bold text-2xl text-encre">{kpi.val}</p>
                  <p className="text-xs text-encre-muted font-body mt-1">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* ── Statuts en détail ────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Confirmées", val: stats?.confirmees, icon: <CheckCircle className="w-4 h-4 text-encre-muted" /> },
                { label: "Expédiées", val: stats?.expediees, icon: <Truck className="w-4 h-4 text-blue-500" /> },
                { label: "Livrées", val: stats?.livrees, icon: <CheckCircle className="w-4 h-4 text-success" /> },
                { label: "Annulées", val: stats?.annulees, icon: <XCircle className="w-4 h-4 text-error" /> },
              ].map((s) => (
                <div key={s.label} className="card p-4 flex items-center gap-3">
                  {s.icon}
                  <div>
                    <p className="font-display font-bold text-xl text-encre">{s.val ?? 0}</p>
                    <p className="text-xs text-encre-muted font-body">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Commandes récentes ───────────────────────────────────── */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-sable flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-encre">Commandes récentes</h2>
                <Link href="/admin/commandes"
                  className="text-xs text-or hover:underline font-body">
                  Voir tout →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-sable">
                      {["#", "Client", "Date", "Montant", "Statut", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sable">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-ivoire transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-encre-muted">#{order.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-encre">{order.userNom}</p>
                          <p className="text-xs text-encre-muted">{order.userEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-encre-muted">{formatDate(order.dateCommande)}</td>
                        <td className="px-4 py-3 font-display font-semibold text-encre">
                          {formatPrix(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={statutCommandeColor(order.statut)}>
                            {statutCommandeLabel(order.statut)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/commandes`}
                            className="text-xs text-or hover:underline">
                            Gérer
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Raccourcis admin ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { href: "/admin/produits", label: "Gérer les produits", icon: <BookOpen className="w-5 h-5" /> },
                { href: "/admin/commandes", label: "Gérer les commandes", icon: <Package className="w-5 h-5" /> },
                { href: "/admin/utilisateurs", label: "Gérer les utilisateurs", icon: <UserCog className="w-5 h-5" /> },
                { href: "/admin/promotions", label: "Gérer les promotions", icon: <Tag className="w-5 h-5" /> },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="card p-4 flex flex-col items-center gap-2 text-center
                             hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                  <div className="w-10 h-10 bg-sable rounded-xl flex items-center justify-center text-encre">
                    {item.icon}
                  </div>
                  <span className="text-xs font-body font-medium text-encre">{item.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
