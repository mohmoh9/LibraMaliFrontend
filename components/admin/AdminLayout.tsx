"use client";
// src/components/admin/AdminLayout.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, BookOpen, ShoppingBag,
  Users, Tag, Heart, Star, ArrowLeft, Sparkles, CreditCard, Truck, Folder, Menu, X, BookMarked
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/commandes",    label: "Commandes",     icon: ShoppingBag },
  { href: "/admin/livraison",    label: "Livraisons",    icon: Truck },
  { href: "/admin/paiement",     label: "Paiements",     icon: CreditCard },
  { href: "/admin/categories",   label: "Categories",    icon: BookMarked },
  { href: "/admin/produits",     label: "Produits",      icon: BookOpen },
  { href: "/admin/utilisateurs", label: "Utilisateurs",  icon: Users },
  { href: "/admin/promotions",   label: "Promotions",    icon: Tag },
  { href: "/admin/influenceur",  label: "influenceurs",  icon: Sparkles },
  { href: "/admin/avis",         label: "Avis",          icon: Star },
  { href: "/admin/favoris",      label: "Favoris",       icon: Heart },
];

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  return (
<div className="flex min-h-screen bg-ivoire">
      {/* Bouton Toggle Mobile - Placé à gauche pour ne pas gêner les toasts/notifs */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-[60] p-4 bg-encre text-ivoire rounded-full shadow-2xl active:scale-95 transition-transform"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col w-64 bg-encre text-ivoire shrink-0 fixed lg:sticky top-0 h-screen z-50 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>

        {/* En-tête sidebar */}
        <div className="p-5 border-b" style={{ borderColor: "#2D2A26" }}>
          <p className="font-body text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#6B6560" }}>
            Administration
          </p>
          <p className="font-display font-semibold text-ivoire mt-0.5">LibraMali</p>
        </div>

        {/* Navigation */}
<nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)} // ✅ UX Mobile
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all",
                  active ? "bg-white/10 text-ivoire" : "text-[#9B9590] hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-or" />}
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

{/* Overlay avec flou pour un look premium */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-encre/40 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content - Ajout d'une marge basse sur mobile pour le bouton flottant */}
      <main className="flex-1 min-w-0 overflow-auto p-4 lg:p-10 pb-24 lg:pb-10">
        {children}
      </main>
    </div>
  );
}
