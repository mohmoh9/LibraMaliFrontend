"use client";
// src/app/(main)/page.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Star, Truck, Shield, BookOpen,
  ShoppingBag, Sparkles, Flame, ChevronRight,
  Heart, Quote, Search, Phone, Mail, MapPin,
  Clock, Package, RefreshCcw, ChevronLeft,
  TrendingUp, Award, Users, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatPrix, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { useFavoris } from "@/hooks/useFavoris";
import ProductCard from "@/components/catalogue/ProductCard";
import type { Product, Category } from "@/types";

/* ═══════════════════════════════════════════════════════════
   DONNÉES STATIQUES
═══════════════════════════════════════════════════════════ */

const TEMOIGNAGES = [
  {
    id: 1,
    nom: "Awa Kouyaté",
    ville: "Bamako",
    note: 5,
    texte: "LibraMali a changé ma façon de lire. En deux clics, j'ai reçu les derniers romans d'Aminata Sow Fall. La livraison a été rapide et les livres en parfait état.",
    initiale: "A",
  },
  {
    id: 2,
    nom: "Mamadou Diallo",
    ville: "Koutiala",
    note: 5,
    texte: "Enfin une librairie qui comprend les besoins des maliens. Le paiement par Orange Money est une vraie révolution. Je commande chaque mois sans hésiter.",
    initiale: "M",
  },
  {
    id: 3,
    nom: "Fatoumata Coulibaly",
    ville: "Ségou",
    note: 5,
    texte: "Le catalogue est impressionnant. J'ai trouvé des livres académiques introuvables ailleurs à Ségou. Mes étudiants me remercient chaque jour !",
    initiale: "F",
  },
  {
    id: 4,
    nom: "Ibrahim Traoré",
    ville: "Mopti",
    note: 4,
    texte: "Service client au top. J'ai eu un problème avec ma commande et l'équipe a tout arrangé en moins de 24h. Je recommande à tous mes collègues.",
    initiale: "I",
  },
];

const AVANTAGES = [
  {
    icon: <Truck className="w-6 h-6" />,
    titre: "Livraison 24h à Bamako",
    desc: "Commandez avant 16h, recevez le lendemain. Livraison dans toutes les communes.",
    bg: "bg-blue-50", col: "text-blue-600",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    titre: "Paiement sécurisé",
    desc: "Orange Money, Moov Money, Wave ou espèces à la livraison. 100% sécurisé.",
    bg: "bg-green-50", col: "text-success",
  },
  {
    icon: <Package className="w-6 h-6" />,
    titre: "Livres originaux garantis",
    desc: "Tous nos livres sont neufs, originaux et en parfait état. Aucune contrefaçon.",
    bg: "bg-amber-50", col: "text-amber-600",
  },
  {
    icon: <RefreshCcw className="w-6 h-6" />,
    titre: "Retour facile 7 jours",
    desc: "Un problème avec votre commande ? Retour gratuit sous 7 jours, sans question.",
    bg: "bg-purple-50", col: "text-purple-600",
  },
];

const STATS = [
  { val: "5 000+", label: "Titres disponibles",   icon: <BookOpen className="w-5 h-5" /> },
  { val: "12 000+", label: "Clients satisfaits",  icon: <Users className="w-5 h-5" /> },
  { val: "24h",    label: "Délai de livraison",   icon: <Clock className="w-5 h-5" /> },
  { val: "4.9/5",  label: "Note moyenne clients", icon: <Star className="w-5 h-5" /> },
];

const FAQ = [
  {
    q: "Livrez-vous en dehors de Bamako ?",
    a: "Oui ! Nous livrons dans toutes les grandes villes du Mali : Ségou, Mopti, Sikasso, Koutiala et bien d'autres. Les délais varient de 2 à 5 jours ouvrés.",
  },
  {
    q: "Comment fonctionne le paiement à la livraison ?",
    a: "Vous payez en espèces directement au livreur à la réception de votre colis. Aucun prépaiement requis pour ce mode.",
  },
  {
    q: "Puis-je retourner un livre si je change d'avis ?",
    a: "Oui, vous disposez de 7 jours après la réception pour nous retourner un livre en parfait état. Le remboursement est effectué sous 48h.",
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Dès l'expédition, vous recevez un email avec votre numéro de suivi. Vous pouvez suivre votre colis en temps réel depuis votre espace client.",
  },
  {
    q: "Proposez-vous des devis pour les établissements scolaires ?",
    a: "Absolument. Nous proposons des tarifs préférentiels et des devis personnalisés pour les écoles, universités et bibliothèques. Contactez-nous par email.",
  },
];

const GENRES = [
  { nom: "Littérature africaine", emoji: "🌍", color: "from-amber-500 to-orange-500" },
  { nom: "Romans & Fiction",      emoji: "📖", color: "from-blue-500 to-indigo-500" },
  { nom: "Sciences & Techniques", emoji: "🔬", color: "from-green-500 to-teal-500" },
  { nom: "Histoire & Politique",  emoji: "🏛️", color: "from-purple-500 to-pink-500" },
  { nom: "Jeunesse & Enfants",    emoji: "🌟", color: "from-yellow-400 to-amber-500" },
  { nom: "Développement perso",   emoji: "🧠", color: "from-rose-500 to-pink-500" },
  { nom: "Religion & Spiritualité",emoji: "☪️", color: "from-slate-600 to-slate-800" },
  { nom: "Business & Économie",   emoji: "📊", color: "from-cyan-500 to-blue-500" },
];

/* ═══════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════════ */

function StarRow({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={cn("w-4 h-4", s <= note ? "text-or fill-or" : "text-sable-dark")} />
      ))}
    </div>
  );
}

function SectionHeader({
  label, title, subtitle, center = false,
}: { label: string; title: React.ReactNode; subtitle?: string; center?: boolean }) {
  return (
    <div className={cn("mb-12", center && "text-center")}>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-or mb-3">
        <span className="w-6 h-px bg-or inline-block" />
        {label}
        <span className="w-6 h-px bg-or inline-block" />
      </span>
      <h2 className="font-display text-3xl lg:text-4xl font-bold text-encre leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-encre-muted font-body mt-3 text-base max-w-xl leading-relaxed"
          style={center ? { margin: "0.75rem auto 0" } : {}}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function BookSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="bg-sable rounded-r-lg rounded-l-sm" style={{ aspectRatio: "2/3" }} />
      <div className="space-y-2">
        <div className="h-3 bg-sable w-1/2 rounded" />
        <div className="h-4 bg-sable w-full rounded" />
        <div className="h-3 bg-sable w-1/3 rounded" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { isFavori, toggleFavori, isToggling } = useFavoris();

  const [newProducts,      setNewProducts]      = useState<Product[]>([]);
  const [popularProducts,  setPopularProducts]  = useState<Product[]>([]);
  const [promoProducts,    setPromoProducts]    = useState<Product[]>([]);
  const [categories,       setCategories]       = useState<Category[]>([]);
  const [loadingNew,       setLoadingNew]       = useState(true);
  const [loadingPop,       setLoadingPop]       = useState(true);
  const [loadingPromo,     setLoadingPromo]     = useState(true);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [openFaqIdx,       setOpenFaqIdx]       = useState<number | null>(null);
  const [testimonialIdx,   setTestimonialIdx]   = useState(0);
  const [email,            setEmail]            = useState("");
  const [newsletterSent,   setNewsletterSent]   = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  /* ── Chargements ─────────────────────────────────────────────────────── */
  useEffect(() => {
    // Nouveautés
    api.get("/products?page=0&size=5&sortBy=creeLe&direction=desc")
      .then(({ data }) => {
        const p = data?.data ?? data;
        setNewProducts(p?.content ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingNew(false));

    // Populaires (mieux notés)
    api.get("/products?page=0&size=5&sortBy=noteMoyenne&direction=desc")
      .then(({ data }) => {
        const p = data?.data ?? data;
        setPopularProducts(p?.content ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingPop(false));

    // Catégories
    api.get("/categories")
      .then(({ data }) => setCategories(data?.data ?? data ?? []))
      .catch(() => {});

    // Promotions (prix croissant pour changer)
    api.get("/products?page=0&size=4&sortBy=prix&direction=asc")
      .then(({ data }) => {
        const p = data?.data ?? data;
        // Filtrer ceux qui ont un prixPromo
        const items = (p?.content ?? []).filter((x: Product) => x.prixPromo);
        setPromoProducts(items);
      })
      .catch(() => {})
      .finally(() => setLoadingPromo(false));
  }, []);

  /* ── Carrousel témoignages ───────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => {
      setTestimonialIdx(i => (i + 1) % TEMOIGNAGES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  /* ── Recherche ───────────────────────────────────────────────────────── */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogue?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  /* ── Newsletter fictive ──────────────────────────────────────────────── */
  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setNewsletterSent(true);
    toast.success("Inscription confirmée ! Bienvenue dans la communauté LibraMali ✉️");
  };

  return (
    <div className="bg-ivoire overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════
          §1 HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Fond dégradé */}
        <div className="absolute inset-0 bg-gradient-to-br from-encre via-encre-light to-[#2C2420]" />

        {/* Halos décoratifs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-or/8 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-or/5 blur-[100px] pointer-events-none" />

        {/* Grille de points */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.12) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Texte hero */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-or/15 border border-or/30 rounded-full">
                <Sparkles className="w-4 h-4 text-or" />
                <span className="text-or text-xs font-bold uppercase tracking-widest">
                  Librairie Numérique du Mali
                </span>
              </div>

              <h1 className="font-display text-5xl lg:text-7xl font-black text-ivoire leading-[1.05] tracking-tight">
                Libérez votre <br />
                <span className="relative inline-block">
                  <span className="text-or">imagination.</span>
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-or/40 rounded-full" />
                </span>
              </h1>

              <p className="text-ivoire/70 font-body text-lg leading-relaxed max-w-lg">
                Le plus large catalogue de littérature africaine et internationale,
                livré chez vous à Bamako en <strong className="text-ivoire">24h chrono</strong>.
              </p>

              {/* Barre de recherche hero */}
              <form onSubmit={handleSearch}
                className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-1.5 gap-2 max-w-md">
                <Search className="w-5 h-5 text-ivoire/50 ml-2 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Titre, auteur, ISBN…"
                  className="flex-1 bg-transparent text-ivoire placeholder:text-ivoire/40
                             font-body text-sm focus:outline-none"
                />
                <button type="submit"
                  className="px-4 py-2.5 bg-or text-white rounded-xl text-sm font-medium
                             hover:bg-or-dark transition-colors shrink-0">
                  Chercher
                </button>
              </form>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/catalogue"
                  className="btn-gold px-8 py-4 text-base shadow-lg shadow-or/25">
                  Parcourir le catalogue
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login"
                  className="flex items-center gap-2 text-ivoire/70 hover:text-ivoire font-body text-sm transition-colors">
                  Créer un compte gratuit →
                </Link>
              </div>

              {/* Preuve sociale */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {["A","M","F","I","K"].map((l, i) => (
                    <div key={i}
                      className="w-9 h-9 rounded-full border-2 border-encre flex items-center justify-center
                                 text-xs font-bold text-white"
                      style={{ backgroundColor: ["#C9A84C","#2C3E6B","#1E3D2F","#4A2C2A","#3D2C5E"][i] }}>
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 text-or fill-or" />)}
                  </div>
                  <p className="text-ivoire/60 text-xs font-body mt-0.5">
                    +12 000 lecteurs satisfaits au Mali
                  </p>
                </div>
              </div>
            </div>

            {/* Visuel flottant */}
            <div className="relative hidden lg:flex items-center justify-center">
              {/* Livres flottants décoratifs */}
              <div className="relative w-80 h-[480px]">
                {/* Livre principal */}
                <div className="absolute inset-0 bg-gradient-to-br from-or/80 to-or-dark rounded-3xl rotate-3
                                shadow-2xl flex flex-col justify-between p-8 border border-or/30">
                  <div className="space-y-2">
                    <div className="h-px bg-ivoire/30 w-full" />
                    <div className="h-px bg-ivoire/20 w-3/4" />
                  </div>
                  <div className="text-center space-y-3">
                    <BookOpen className="w-16 h-16 text-ivoire/30 mx-auto" />
                    <p className="font-display text-ivoire/90 text-xl font-bold leading-tight">
                      L'Aventure Ambiguë
                    </p>
                    <p className="font-body text-ivoire/60 text-sm">Cheikh Hamidou Kane</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-px bg-ivoire/20 w-3/4" />
                    <div className="h-px bg-ivoire/30 w-full" />
                  </div>
                </div>

                {/* Livre derrière */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E6B] to-[#1C2E5B]
                                rounded-3xl -rotate-6 -z-10 shadow-xl border border-white/10"
                  style={{ transform: "rotate(-6deg) translateX(16px) translateY(8px)" }}>
                  <div className="p-8 flex flex-col h-full justify-between">
                    <div className="space-y-2">
                      <div className="h-px bg-white/20 w-full" />
                      <div className="h-px bg-white/10 w-2/3" />
                    </div>
                  </div>
                </div>

                {/* Badge prix promo */}
                <div className="absolute -right-6 top-16 bg-white rounded-2xl px-4 py-3 shadow-float">
                  <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider">Prix</p>
                  <p className="font-display font-bold text-encre text-lg">4 500 FCFA</p>
                  <p className="text-xs text-success font-medium">Livraison gratuite</p>
                </div>

                {/* Badge note */}
                <div className="absolute -left-6 bottom-24 bg-encre rounded-2xl px-4 py-3 shadow-float">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="w-3.5 h-3.5 text-or fill-or" />
                    <span className="text-ivoire font-bold text-sm">4.9</span>
                  </div>
                  <p className="text-ivoire/60 text-[10px] font-body">218 avis</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vague de transition */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full" preserveAspectRatio="none">
            <path d="M0 64L1440 64L1440 32C1200 0 960 64 720 32C480 0 240 64 0 32L0 64Z" fill="#F7F4EF"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §2 STATISTIQUES
      ══════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-ivoire">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div key={i}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white shadow-card
                           hover:shadow-card-hover transition-all group">
                <div className="w-12 h-12 rounded-xl bg-or/10 text-or flex items-center justify-center mb-4
                                group-hover:bg-or group-hover:text-white transition-all">
                  {stat.icon}
                </div>
                <p className="font-display font-black text-3xl text-encre">{stat.val}</p>
                <p className="text-encre-muted text-xs font-body mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §3 CATÉGORIES
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Nos rayons"
            title={<>Explorez par <span className="text-or">genre</span></>}
            subtitle="Trouvez exactement le type de livre qui vous inspire aujourd'hui."
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {GENRES.map((genre, i) => (
              <Link
                key={i}
                href={`/catalogue${categories[i] ? `?categoryId=${categories[i].id}` : ""}`}
                className="group relative overflow-hidden rounded-2xl p-6 text-white cursor-pointer
                           hover:-translate-y-1 transition-all duration-300 hover:shadow-float"
                style={{ background: `linear-gradient(135deg, ${["#C9A84C,#A8873A","#2C3E6B,#1C2E5B","#1E3D2F,#142B20","#4A2C2A,#331E1A","#C9A84C,#E09940","#C0392B,#9B2D22","#2D2D2D,#1A1A1A","#0E7490,#0C5F75"][i].split(",").join(", ")})` }}
              >
                <span className="text-4xl mb-3 block">{genre.emoji}</span>
                <h3 className="font-display font-bold text-white text-base leading-tight mb-1">
                  {genre.nom}
                </h3>
                {categories[i] && (
                  <p className="text-white/60 text-xs font-body">
                    {categories[i].nbProduits} titres
                  </p>
                )}
                <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-white/40
                                       group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §4 NOUVEAUTÉS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-ivoire">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <SectionHeader
              label="Nouveautés"
              title={<>Dernières <span className="text-or">arrivées</span></>}
              subtitle="Les livres que tout le monde s'arrache cette semaine."
            />
            <Link href="/catalogue?sortBy=creeLe&direction=desc"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-encre-muted
                         hover:text-encre transition-colors mb-12">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingNew ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => <BookSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {newProducts.map((p, i) => (
<div 
  key={p.id}
  className="animate-slide-up"
  style={{ 
    animationDelay: `${i * 60}ms`, 
    animationFillMode: "forwards" 
  }}
>
                  <ProductCard
                    product={p}
                    isFavori={isFavori(p.id)}
                    onToggleFavori={e => toggleFavori(p.id, e)}
                    isToggling={isToggling(p.id)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex sm:hidden justify-center mt-8">
            <Link href="/catalogue?sortBy=creeLe&direction=desc" className="btn-secondary">
              Voir toutes les nouveautés <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §5 BANNIÈRE PROMO PLEINE LARGEUR
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-encre relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-or/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-or/5 blur-2xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-or/20 border border-or/30 rounded-full">
                <Flame className="w-4 h-4 text-or animate-pulse" />
                <span className="text-or text-xs font-bold uppercase tracking-widest">Offre spéciale</span>
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-black text-ivoire leading-tight">
                Jusqu&apos;à <span className="text-or">30% de remise</span> sur
                la littérature africaine
              </h2>
              <p className="text-ivoire/60 font-body text-lg leading-relaxed">
                Célébrons les voix du continent. Une sélection exceptionnelle d&apos;auteurs
                africains en promotion cette semaine seulement.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/catalogue"
                  className="btn-gold px-8 py-4 text-base shadow-lg shadow-or/20">
                  Profiter des offres
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2 text-ivoire/50 text-sm font-body">
                  <Clock className="w-4 h-4" />
                  Offre limitée dans le temps
                </div>
              </div>
            </div>

            {/* Grille livres promo */}
            <div className="grid grid-cols-2 gap-4">
              {loadingPromo
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
                  ))
                : promoProducts.slice(0, 4).map((p, i) => {
                    const imgOk = p.imageUrl && (p.imageUrl.startsWith("http") || p.imageUrl.startsWith("/"));
                    return (
                      <Link key={p.id} href={`/produit/${p.id}`}
                        className="group relative bg-white/5 border border-white/10 rounded-2xl p-3
                                   hover:bg-white/10 hover:-translate-y-1 transition-all overflow-hidden">
                        <div className="aspect-[3/4] bg-white/5 rounded-xl overflow-hidden mb-3 relative">
                          {imgOk ? (
                            <Image src={p.imageUrl!} alt={p.titre} fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <BookOpen className="w-10 h-10 text-white/10" />
                            </div>
                          )}
                          {p.prixPromo && (
                            <div className="absolute top-2 right-2 bg-or text-white text-[10px] font-bold
                                            px-1.5 py-0.5 rounded-full">
                              -{p.promotionPct}%
                            </div>
                          )}
                        </div>
                        <p className="font-display text-ivoire text-xs font-bold line-clamp-1">{p.titre}</p>
                        <p className="text-ivoire/50 text-[10px] font-body line-clamp-1">{p.auteur}</p>
                        <p className="text-or font-bold text-sm mt-1">
                          {formatPrix(p.prixPromo ?? p.prix)}
                        </p>
                      </Link>
                    );
                  })
              }
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §6 LES PLUS POPULAIRES
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <SectionHeader
              label="Mieux notés"
              title={<>Coups de <span className="text-or">cœur</span> des lecteurs</>}
              subtitle="Les livres les mieux notés par notre communauté."
            />
            <Link href="/catalogue?sortBy=noteMoyenne&direction=desc"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-encre-muted
                         hover:text-encre transition-colors mb-12">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingPop ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => <BookSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {popularProducts.map((p, i) => (
                <div key={p.id} className="relative">
                  {i < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-encre
                                    flex items-center justify-center shadow-sm">
                      <span className="text-[10px] font-bold text-or">#{i + 1}</span>
                    </div>
                  )}
                  <ProductCard
                    product={p}
                    isFavori={isFavori(p.id)}
                    onToggleFavori={e => toggleFavori(p.id, e)}
                    isToggling={isToggling(p.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §7 AVANTAGES / RÉASSURANCE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-ivoire">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Pourquoi nous choisir"
            title={<>Votre satisfaction, <span className="text-or">notre priorité</span></>}
            subtitle="Tout est pensé pour vous offrir la meilleure expérience d'achat de livres au Mali."
            center
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AVANTAGES.map((av, i) => (
              <div key={i}
                className="group p-6 bg-white rounded-2xl shadow-card hover:shadow-float
                           hover:-translate-y-1 transition-all duration-300 text-center">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all group-hover:scale-110",
                  av.bg, av.col
                )}>
                  {av.icon}
                </div>
                <h3 className="font-display font-bold text-encre text-base mb-2">{av.titre}</h3>
                <p className="text-encre-muted text-sm font-body leading-relaxed">{av.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §8 TÉMOIGNAGES
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-sable/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Témoignages"
            title={<>Ce que disent nos <span className="text-or">lecteurs</span></>}
            center
          />

          {/* Carrousel */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {TEMOIGNAGES.map((t, i) => (
                <div
                  key={t.id}
                  className={cn(
                    "transition-all duration-500",
                    i === testimonialIdx ? "opacity-100 block" : "opacity-0 hidden"
                  )}
                >
                  <div className="bg-white rounded-3xl p-8 shadow-card text-center">
                    <Quote className="w-10 h-10 text-or/30 mx-auto mb-4" />
                    <p className="font-display text-xl text-encre leading-relaxed mb-6 italic">
                      &ldquo;{t.texte}&rdquo;
                    </p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-encre flex items-center justify-center">
                        <span className="text-ivoire font-bold text-xl">{t.initiale}</span>
                      </div>
                      <div>
                        <p className="font-bold text-encre">{t.nom}</p>
                        <p className="text-encre-muted text-sm font-body flex items-center gap-1 justify-center">
                          <MapPin className="w-3 h-3" /> {t.ville}
                        </p>
                      </div>
                      <StarRow note={t.note} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Contrôles */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setTestimonialIdx(i => (i - 1 + TEMOIGNAGES.length) % TEMOIGNAGES.length)}
                  className="w-8 h-8 rounded-full bg-white shadow-card flex items-center justify-center
                             text-encre-muted hover:text-encre transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {TEMOIGNAGES.map((_, i) => (
                  <button key={i} onClick={() => setTestimonialIdx(i)}
                    className={cn("w-2 h-2 rounded-full transition-all",
                      i === testimonialIdx ? "bg-or w-6" : "bg-sable-dark hover:bg-encre-muted")} />
                ))}
                <button
                  onClick={() => setTestimonialIdx(i => (i + 1) % TEMOIGNAGES.length)}
                  className="w-8 h-8 rounded-full bg-white shadow-card flex items-center justify-center
                             text-encre-muted hover:text-encre transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note globale */}
            <div className="flex items-center justify-center gap-6 mt-10 p-6 bg-white rounded-2xl shadow-card">
              <div className="text-center">
                <p className="font-display font-black text-5xl text-encre">4.9</p>
                <StarRow note={5} />
                <p className="text-xs text-encre-muted font-body mt-1">Note moyenne</p>
              </div>
              <div className="w-px h-16 bg-sable" />
              <div className="space-y-1.5">
                {[5,4,3,2,1].map(n => (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs font-body text-encre-muted w-2">{n}</span>
                    <Star className="w-3 h-3 text-or fill-or" />
                    <div className="flex-1 h-1.5 bg-sable rounded-full overflow-hidden w-24">
                      <div className="h-full bg-or rounded-full"
                        style={{ width: `${[87, 9, 3, 1, 0][5 - n]}%` }} />
                    </div>
                    <span className="text-xs text-encre-muted w-6">{[87,9,3,1,0][5-n]}%</span>
                  </div>
                ))}
              </div>
              <div className="w-px h-16 bg-sable hidden sm:block" />
              <div className="hidden sm:block text-center">
                <p className="font-display font-black text-3xl text-encre">12K+</p>
                <p className="text-xs text-encre-muted font-body mt-1">Avis clients</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §9 FAQ
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Questions fréquentes"
            title={<>Tout ce que vous <span className="text-or">voulez savoir</span></>}
            center
          />

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i}
                className="border border-sable rounded-2xl overflow-hidden transition-all hover:border-sable-dark">
                <button
                  onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left
                             hover:bg-sable/20 transition-colors"
                >
                  <span className="font-display font-semibold text-encre text-base">{item.q}</span>
                  <ChevronRight className={cn(
                    "w-5 h-5 text-encre-muted shrink-0 transition-transform duration-200",
                    openFaqIdx === i && "rotate-90 text-or"
                  )} />
                </button>
                {openFaqIdx === i && (
                  <div className="px-6 pb-5 animate-fade-in">
                    <p className="text-encre-muted font-body text-sm leading-relaxed border-t border-sable pt-4">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-encre-muted font-body mt-8">
            Vous avez d&apos;autres questions ?{" "}
            <a href="mailto:contact@libramali.ml"
              className="text-or hover:underline font-medium">
              Contactez-nous →
            </a>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §10 NEWSLETTER + CONTACT
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-encre relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-or/8 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Newsletter */}
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 text-or text-xs font-bold uppercase tracking-widest">
                  <span className="w-6 h-px bg-or" />
                  Newsletter
                </span>
                <h2 className="font-display text-3xl font-bold text-ivoire">
                  Restez informé des <span className="text-or">nouveautés</span>
                </h2>
                <p className="text-ivoire/60 font-body leading-relaxed">
                  Recevez en avant-première nos nouvelles arrivées, promotions exclusives
                  et conseils de lecture chaque semaine.
                </p>
              </div>

              {newsletterSent ? (
                <div className="flex items-center gap-3 p-4 bg-or/15 border border-or/30 rounded-2xl">
                  <Sparkles className="w-5 h-5 text-or shrink-0" />
                  <div>
                    <p className="text-ivoire font-bold text-sm">Inscription confirmée !</p>
                    <p className="text-ivoire/60 text-xs font-body">Vous recevrez bientôt votre première newsletter.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleNewsletter} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl
                               text-ivoire placeholder:text-ivoire/40 font-body text-sm
                               focus:outline-none focus:border-or transition-colors"
                  />
                  <button type="submit"
                    className="btn-gold px-5 py-3 shrink-0">
                    S&apos;inscrire
                  </button>
                </form>
              )}

              <p className="text-ivoire/30 text-xs font-body">
                Pas de spam. Désabonnement en un clic. Vos données sont protégées.
              </p>
            </div>

            {/* Coordonnées */}
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 text-or text-xs font-bold uppercase tracking-widest">
                  <span className="w-6 h-px bg-or" />
                  Nous contacter
                </span>
                <h2 className="font-display text-3xl font-bold text-ivoire">
                  On est là pour <span className="text-or">vous</span>
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { icon: <Phone className="w-5 h-5" />,  label: "Téléphone", val: "+223 70 00 00 00", sub: "Lun–Sam, 8h–18h" },
                  { icon: <Mail className="w-5 h-5" />,   label: "Email",     val: "contact@libramali.ml", sub: "Réponse sous 24h" },
                  { icon: <MapPin className="w-5 h-5" />, label: "Adresse",   val: "ACI 2000, Bamako", sub: "Mali" },
                  { icon: <Clock className="w-5 h-5" />,  label: "Horaires",  val: "Lun–Sam : 8h–18h", sub: "Livraison 7j/7" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-or shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-ivoire/40 text-[10px] font-body uppercase tracking-wider">{item.label}</p>
                      <p className="text-ivoire font-medium text-sm">{item.val}</p>
                      <p className="text-ivoire/40 text-xs font-body">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
