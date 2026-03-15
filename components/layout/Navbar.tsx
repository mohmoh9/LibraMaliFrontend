"use client";
// src/components/layout/Navbar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, User, Search, Menu, X, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, nom, role, logout } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    logout();
    router.push("/");
  };

  const totalArticles = cart?.nombreArticles ?? 0;

  const navLinks = [
    { href: "/catalogue", label: "Catalogue" },
    { href: "/catalogue?nouveautes=true", label: "Nouveautés" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-ivoire/95 backdrop-blur-md border-b border-sable-dark shadow-sm"
          : "bg-ivoire border-b border-sable"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-encre rounded-lg flex items-center justify-center
                            group-hover:bg-or transition-colors duration-300">
              <BookOpen className="w-4 h-4 text-ivoire" />
            </div>
            <span className="font-display text-xl font-semibold text-encre tracking-tight">
              LibraMali
            </span>
          </Link>

          {/* Nav desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-body text-sm transition-colors duration-200",
                  pathname === link.href
                    ? "text-encre font-medium"
                    : "text-encre-muted hover:text-encre"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Recherche */}
            {searchOpen ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQ.trim()) router.push(`/catalogue?q=${encodeURIComponent(searchQ)}`);
                  setSearchOpen(false);
                }}
                className="flex items-center gap-2 animate-slide-in"
              >
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Titre, auteur…"
                  className="w-48 px-3 py-1.5 text-sm bg-sable rounded-full border border-sable-dark
                             focus:outline-none focus:ring-2 focus:ring-or/30 font-body"
                />
                <button type="button" onClick={() => setSearchOpen(false)}
                  className="p-1 text-encre-muted hover:text-encre">
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full text-encre-muted hover:text-encre hover:bg-sable/60 transition-all"
                aria-label="Rechercher"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            )}

            {/* Panier */}
            <Link
              href="/panier"
              className="relative p-2 rounded-full text-encre-muted hover:text-encre hover:bg-sable/60 transition-all"
              aria-label={`Panier (${totalArticles} articles)`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {totalArticles > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-or text-white
                                 text-[10px] font-bold rounded-full flex items-center justify-center
                                 animate-fade-in">
                  {totalArticles > 9 ? "9+" : totalArticles}
                </span>
              )}
            </Link>

            {/* Compte */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full
                                   hover:bg-sable/60 transition-all">
                  <div className="w-7 h-7 bg-encre rounded-full flex items-center justify-center">
                    <span className="text-ivoire text-xs font-bold">
                      {nom?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-encre">
                    {nom?.split(" ")[0]}
                  </span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl
                                shadow-float border border-sable py-2 opacity-0 invisible
                                group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {role === "ADMIN" && (
                    <Link href="/admin/dashboard" className="dropdown-item">
                      Dashboard admin
                    </Link>
                  )}
                  <Link href="/mon-compte/commandes" className="dropdown-item">
                    Mes commandes
                  </Link>
                  <Link href="/mon-compte/profil" className="dropdown-item">
                    Mon profil
                  </Link>
                  <hr className="my-1 border-sable" />
                  <button onClick={handleLogout}
                    className="dropdown-item text-error w-full text-left">
                    Se déconnecter
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="btn-primary py-2 px-4 text-xs">
                Connexion
              </Link>
            )}

            {/* Burger mobile */}
            <button
              className="md:hidden p-2 rounded-full text-encre-muted hover:bg-sable/60"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-sable py-4 space-y-1 animate-slide-up">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-body text-encre hover:bg-sable/60 rounded-xl">
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <style jsx>{`
        .dropdown-item {
          display: block;
          padding: 8px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1A1814;
          transition: background 0.15s;
        }
        .dropdown-item:hover { background: #E8E0D0; }
        .text-error { color: #C0392B; }
      `}</style>
    </header>
  );
}
