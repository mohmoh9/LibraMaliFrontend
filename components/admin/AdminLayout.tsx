"use client";
// src/components/admin/AdminLayout.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, ShoppingBag,
  Users, Tag, ArrowLeft, Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/categories",   label: "Categories",    icon: Folder },
  { href: "/admin/produits",     label: "Produits",      icon: BookOpen },
  { href: "/admin/commandes",    label: "Commandes",     icon: ShoppingBag },
  { href: "/admin/utilisateurs", label: "Utilisateurs",  icon: Users },
  { href: "/admin/promotions",   label: "Promotions",    icon: Tag },
];

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-ivoire">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-encre text-ivoire shrink-0
                         sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">

        {/* En-tête sidebar */}
        <div className="p-5 border-b" style={{ borderColor: "#2D2A26" }}>
          <p className="font-body text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#6B6560" }}>
            Administration
          </p>
          <p className="font-display font-semibold text-ivoire mt-0.5">LibraMali</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all",
                  active
                    ? "bg-white/10 text-ivoire font-medium"
                    : "text-[#9B9590] hover:bg-white/5 hover:text-[#C4BFB9]"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-or" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Pied sidebar */}
        <div className="p-4 border-t" style={{ borderColor: "#2D2A26" }}>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-body transition-colors
                       hover:text-[#C4BFB9]"
            style={{ color: "#6B6560" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au site
          </Link>
        </div>
      </aside>

      {/* ── Contenu ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
