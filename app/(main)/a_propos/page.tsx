"use client";
// src/app/(main)/a-propos/page.tsx
import Link from "next/link";
import {
  BookOpen, Heart, Target, Globe, Users, Sparkles,
  ArrowRight, Star, MapPin, CheckCircle, Truck,
  Shield, TrendingUp, ChevronRight, Quote,
  Lightbulb, Handshake, Leaf, Award,
  Mail, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Données ─────────────────────────────────────────────────────────────── */

const EQUIPE = [
  {
    nom:    "Moussa Konaté",
    poste:  "Co-fondateur & PDG",
    bio:    "Passionné de littérature africaine depuis l'enfance, Moussa a travaillé 8 ans dans l'édition à Dakar avant de cofonder LibraMali. Sa vision : rendre chaque livre accessible à chaque malien.",
    initiale: "M",
    couleur:  "#C9A84C",
    linkedin: "#",
  },
  {
    nom:    "Awa Sangaré",
    poste:  "Co-fondatrice & Directrice Opérations",
    bio:    "Ancienne responsable logistique chez un grand distributeur d'Abidjan, Awa a bâti notre réseau de livraison de zéro. Elle garantit que chaque livre arrive en parfait état.",
    initiale: "A",
    couleur:  "#2C3E6B",
    linkedin: "#",
  },
  {
    nom:    "Ibrahim Coulibaly",
    poste:  "Directeur Technique",
    bio:    "Ingénieur diplômé de l'École Polytechnique de Thiès, Ibrahim a conçu l'ensemble de la plateforme LibraMali. Il croit que la technologie peut transformer l'accès au savoir en Afrique.",
    initiale: "I",
    couleur:  "#1E3D2F",
    linkedin: "#",
  },
  {
    nom:    "Fatoumata Diallo",
    poste:  "Responsable Catalogue & Édition",
    bio:    "Libraire de formation avec 10 ans d'expérience à Bamako, Fatoumata sélectionne chaque titre de notre catalogue avec soin. Elle est notre experte en littérature africaine.",
    initiale: "F",
    couleur:  "#4A2C2A",
    linkedin: "#",
  },
  {
    nom:    "Oumar Traoré",
    poste:  "Responsable Partenariats",
    bio:    "Ancien commercial dans l'édition française, Oumar développe nos relations avec les éditeurs africains et internationaux pour enrichir continuellement notre offre.",
    initiale: "O",
    couleur:  "#3D2C5E",
    linkedin: "#",
  },
  {
    nom:    "Aminata Keïta",
    poste:  "Responsable Service Client",
    bio:    "Spécialiste de l'expérience client avec une certification en médiation commerciale, Aminata s'assure que chaque interaction avec LibraMali soit mémorable et positive.",
    initiale: "A",
    couleur:  "#5C3317",
    linkedin: "#",
  },
];

const VALEURS = [
  {
    icon:  <BookOpen className="w-6 h-6" />,
    titre: "Accès au savoir",
    desc:  "Nous croyons que chaque Malien, quelle que soit sa localisation, mérite un accès facile et rapide à tous les livres du monde. C'est notre raison d'être fondamentale.",
    bg:    "bg-blue-50", col: "text-blue-600",
  },
  {
    icon:  <Leaf className="w-6 h-6" />,
    titre: "Enracinement africain",
    desc:  "Fiers de notre héritage, nous valorisons en priorité les auteurs et éditeurs africains. Notre catalogue célèbre la richesse littéraire du continent.",
    bg:    "bg-green-50", col: "text-success",
  },
  {
    icon:  <Handshake className="w-6 h-6" />,
    titre: "Confiance & transparence",
    desc:  "Prix affichés sans surprise, livraisons trackées en temps réel, service client joignable 6 jours sur 7. Nous construisons une relation honnête avec chaque lecteur.",
    bg:    "bg-amber-50", col: "text-amber-600",
  },
  {
    icon:  <Lightbulb className="w-6 h-6" />,
    titre: "Innovation locale",
    desc:  "Paiement Mobile Money, interface en français, livraison dans les quartiers les plus éloignés : nous adaptons les meilleures technologies au contexte malien.",
    bg:    "bg-purple-50", col: "text-purple-600",
  },
  {
    icon:  <Heart className="w-6 h-6" />,
    titre: "Passion des livres",
    desc:  "Chaque membre de notre équipe est un lecteur convaincu. Cette passion se ressent dans la qualité de nos sélections, de notre service et de nos recommandations.",
    bg:    "bg-red-50", col: "text-red-600",
  },
  {
    icon:  <Award className="w-6 h-6" />,
    titre: "Excellence du service",
    desc:  "Nous visons 100% de satisfaction. Chaque commande est préparée avec soin, chaque réclamation traitée en priorité, chaque avis pris en compte pour progresser.",
    bg:    "bg-or/10", col: "text-or",
  },
];

const JALONS = [
  {
    annee: "2020",
    titre: "La genèse",
    desc:  "Moussa Konaté et Awa Sangaré se rencontrent lors d'un forum sur l'entrepreneuriat numérique à Bamako. Ils partagent le même constat : il est impossible de trouver un bon roman africain en ligne au Mali.",
  },
  {
    annee: "2021",
    titre: "Le prototype",
    desc:  "Après 6 mois de développement, Ibrahim Coulibaly rejoint l'équipe. La première version de LibraMali est lancée en beta fermée avec 200 titres et 50 clients testeurs à Bamako.",
  },
  {
    annee: "2022",
    titre: "L'ouverture officielle",
    desc:  "LibraMali ouvre officiellement ses portes. En 6 mois, plus de 1 000 clients sont conquis, le catalogue atteint 1 500 titres et la livraison s'étend à Ségou et Mopti.",
  },
  {
    annee: "2023",
    titre: "L'accélération",
    desc:  "Fatoumata, Oumar et Aminata rejoignent l'équipe. Le paiement Mobile Money est intégré. Nous dépassons les 5 000 clients actifs et signons nos premiers partenariats avec des éditeurs africains.",
  },
  {
    annee: "2024",
    titre: "La maturité",
    desc:  "Plus de 12 000 clients, 5 000 titres au catalogue, une livraison dans 20 villes du Mali. LibraMali devient la référence de la librairie en ligne au Mali.",
  },
  {
    annee: "2025",
    titre: "La vision",
    desc:  "Lancement de nouveaux services (devis institutionnels, abonnements écoles), expansion vers le Sénégal et la Côte d'Ivoire, et objectif d'atteindre 50 000 clients actifs.",
    futur: true,
  },
];

const CHIFFRES = [
  { val: "5 000+",  label: "Titres en catalogue",     icon: <BookOpen className="w-5 h-5" /> },
  { val: "12 000+", label: "Clients satisfaits",       icon: <Users className="w-5 h-5" /> },
  { val: "20",      label: "Villes desservies au Mali",icon: <MapPin className="w-5 h-5" /> },
  { val: "4.9/5",   label: "Note client moyenne",      icon: <Star className="w-5 h-5" /> },
  { val: "98%",     label: "Livraisons réussies",      icon: <Truck className="w-5 h-5" /> },
  { val: "24h",     label: "Délai à Bamako",           icon: <CheckCircle className="w-5 h-5" /> },
];

const PARTENAIRES = [
  "Éditions Gallimard",
  "Éditions du Seuil",
  "Présence Africaine",
  "NEI/CEDA",
  "Éditions Donniya",
  "Le Fennec",
  "Éditions L'Harmattan",
  "Cauris Livres",
];

const TEMOIGNAGES_EQUIPE = [
  {
    texte: "On a voulu créer ce qu'on aurait voulu avoir quand on était étudiants : une librairie complète, rapide, qui comprend nos besoins et parle notre langue.",
    auteur: "Moussa Konaté",
    poste: "Co-fondateur",
  },
  {
    texte: "Chaque livre qu'on livre est une petite victoire. Une victoire pour la lecture, pour la culture, pour le Mali.",
    auteur: "Awa Sangaré",
    poste: "Co-fondatrice",
  },
];

/* ── Composants ─────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-or mb-3">
      <span className="w-6 h-px bg-or inline-block" />
      {children}
      <span className="w-6 h-px bg-or inline-block" />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function AProposPage() {
  return (
    <div className="min-h-screen bg-ivoire overflow-x-hidden">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative bg-encre py-28 overflow-hidden">
        {/* Fond texturé */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-or/8 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-or/5 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Fil d'Ariane */}
          <nav className="flex items-center gap-2 text-xs text-ivoire/50 font-body mb-10">
            <Link href="/" className="hover:text-ivoire transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ivoire/80">À propos</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-or/15 border border-or/30 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5 text-or" />
              <span className="text-or text-xs font-bold uppercase tracking-widest">Notre histoire</span>
            </div>

            <h1 className="font-display text-5xl lg:text-6xl font-black text-ivoire leading-tight mb-6">
              Nous avons rêvé<br />d'une librairie<br />
              <span className="text-or">pour le Mali.</span>
            </h1>

            <p className="text-ivoire/65 font-body text-xl leading-relaxed mb-8 max-w-2xl">
              LibraMali est née d'une conviction simple : chaque Malien mérite de pouvoir
              accéder facilement à tous les livres du monde, payés en Mobile Money,
              livrés chez lui en 24h.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/catalogue" className="btn-gold px-8 py-4 text-base">
                Découvrir le catalogue
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#equipe"
                className="flex items-center gap-2 text-ivoire/60 hover:text-ivoire transition-colors font-body text-sm">
                Rencontrer l&apos;équipe ↓
              </a>
            </div>
          </div>
        </div>

        {/* Vague */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full" preserveAspectRatio="none">
            <path d="M0 64L1440 64L1440 32C1200 0 960 64 720 32C480 0 240 64 0 32L0 64Z" fill="#F7F4EF"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MANIFESTE
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-ivoire">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Citation fondatrice */}
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-or/10 rounded-full" />
              <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-or/15 rounded-full" />
              <div className="relative bg-white rounded-3xl p-10 shadow-float border border-sable/50">
                <Quote className="w-12 h-12 text-or/25 mb-6" />
                <blockquote className="font-display text-2xl font-bold text-encre leading-tight mb-6 italic">
                  &ldquo;Un livre est un jardin que l'on porte dans sa poche. Nous voulons
                  que chaque Malien ait ce jardin à portée de main.&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                    style={{ backgroundColor: "#C9A84C" }}>
                    M
                  </div>
                  <div>
                    <p className="font-bold text-encre text-sm">Moussa Konaté</p>
                    <p className="text-encre-muted text-xs font-body">Co-fondateur & PDG, LibraMali</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notre mission */}
            <div className="space-y-6">
              <div>
                <SectionLabel>Notre mission</SectionLabel>
                <h2 className="font-display text-3xl font-bold text-encre leading-tight mt-2">
                  Démocratiser l&apos;accès aux livres au Mali
                </h2>
              </div>

              <p className="text-encre-muted font-body text-base leading-relaxed">
                En 2020, trouver un bon roman africain en ligne depuis Bamako relevait
                du parcours du combattant. Les librairies physiques proposaient peu de stock,
                les délais d'import depuis l'étranger étaient de plusieurs semaines, et
                aucune plateforme ne permettait le paiement local.
              </p>

              <p className="text-encre-muted font-body text-base leading-relaxed">
                LibraMali a changé cela. Nous avons construit une plateforme pensée
                pour les Maliens : catalogue de plus de 5 000 titres, paiement Mobile Money,
                livraison en 24h à Bamako et dans 20 villes du pays.
              </p>

              <div className="space-y-3">
                {[
                  "Valoriser la littérature africaine et les auteurs du continent",
                  "Rendre le livre accessible partout au Mali, même en région",
                  "Proposer des prix justes et une expérience de confiance",
                  "Soutenir l'éducation en partenariat avec les écoles et universités",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-or shrink-0 mt-0.5" />
                    <span className="text-encre font-body text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CHIFFRES CLÉS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-encre relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-or/8 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <SectionLabel>LibraMali en chiffres</SectionLabel>
            <h2 className="font-display text-4xl font-bold text-ivoire mt-2">
              Quatre ans de passion et de résultats
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {CHIFFRES.map((c, i) => (
              <div key={i}
                className="group p-6 bg-white/5 border border-white/10 rounded-2xl text-center
                           hover:bg-white/10 hover:border-or/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-or/15 text-or flex items-center justify-center
                                mx-auto mb-4 group-hover:bg-or group-hover:text-white transition-all">
                  {c.icon}
                </div>
                <p className="font-display font-black text-4xl text-ivoire mb-1">{c.val}</p>
                <p className="text-ivoire/50 text-xs font-body uppercase tracking-wider">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HISTOIRE / TIMELINE
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-ivoire">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <SectionLabel>Notre parcours</SectionLabel>
            <h2 className="font-display text-4xl font-bold text-encre mt-2">
              De l&apos;idée à la réalité
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-xl mx-auto">
              Cinq ans pour construire la librairie que le Mali méritait.
            </p>
          </div>

          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-sable-dark
                            sm:-translate-x-0.5 hidden sm:block" />

            <div className="space-y-8">
              {JALONS.map((jalon, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div key={i}
                    className={cn(
                      "relative sm:grid sm:grid-cols-2 sm:gap-10 items-center",
                      !isEven && "sm:direction-rtl"
                    )}
                  >
                    {/* Contenu */}
                    <div className={cn(
                      "pl-14 sm:pl-0",
                      isEven ? "sm:text-right sm:pr-12" : "sm:col-start-2 sm:pl-12"
                    )}>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3",
                        jalon.futur
                          ? "bg-or/10 text-or border border-or/30"
                          : "bg-encre text-ivoire"
                      )}>
                        {jalon.futur && <Sparkles className="w-3 h-3" />}
                        {jalon.annee}
                        {jalon.futur && " — Vision"}
                      </div>
                      <h3 className="font-display text-xl font-bold text-encre mb-2">
                        {jalon.titre}
                      </h3>
                      <p className="text-encre-muted font-body text-sm leading-relaxed">
                        {jalon.desc}
                      </p>
                    </div>

                    {/* Point central */}
                    <div className={cn(
                      "absolute left-4 sm:left-auto sm:col-start-1 sm:col-end-3",
                      "sm:absolute sm:left-1/2 sm:-translate-x-1/2",
                      "top-3 sm:top-1/2 sm:-translate-y-1/2",
                      "w-5 h-5 rounded-full border-4 border-ivoire shadow-sm",
                      jalon.futur ? "bg-or" : "bg-encre"
                    )} />

                    {/* Colonne vide (alternance) */}
                    {isEven && <div className="hidden sm:block" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          VALEURS
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <SectionLabel>Ce en quoi nous croyons</SectionLabel>
            <h2 className="font-display text-4xl font-bold text-encre mt-2">
              Nos valeurs fondatrices
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-xl mx-auto">
              Six principes qui guident chaque décision, chaque recrutement, chaque
              développement de LibraMali.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALEURS.map((v, i) => (
              <div key={i}
                className="group p-7 bg-ivoire rounded-2xl border border-transparent
                           hover:border-or/20 hover:shadow-float hover:-translate-y-1
                           transition-all duration-300">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all",
                  "group-hover:scale-110",
                  v.bg, v.col
                )}>
                  {v.icon}
                </div>
                <h3 className="font-display font-bold text-encre text-lg mb-3">{v.titre}</h3>
                <p className="text-encre-muted font-body text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ÉQUIPE
      ══════════════════════════════════════════ */}
      <section id="equipe" className="py-24 bg-ivoire scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <SectionLabel>Les visages de LibraMali</SectionLabel>
            <h2 className="font-display text-4xl font-bold text-encre mt-2">
              Notre équipe
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-xl mx-auto">
              Six passionnés de livres, de technologie et du Mali. Unis par une même conviction :
              la culture est le premier moteur du développement.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EQUIPE.map((membre, i) => (
              <div key={i}
                className="group bg-white rounded-2xl shadow-card hover:shadow-float
                           hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">

                {/* Header coloré */}
                <div className="h-24 relative"
                  style={{ backgroundColor: membre.couleur + "20" }}>
                  <div className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }} />
                </div>

                {/* Avatar */}
                <div className="px-6 pb-6">
                  <div className="relative -mt-10 mb-4">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg
                                    flex items-center justify-center text-white text-2xl font-black"
                      style={{ backgroundColor: membre.couleur }}>
                      {membre.initiale}
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-encre text-lg mb-0.5">{membre.nom}</h3>
                  <p className="text-or text-xs font-bold uppercase tracking-wide mb-3">
                    {membre.poste}
                  </p>
                  <p className="text-encre-muted font-body text-xs leading-relaxed line-clamp-4
                                group-hover:line-clamp-none transition-all">
                    {membre.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA rejoindre */}
          <div className="mt-12 p-8 bg-white rounded-2xl shadow-card border border-sable/50 text-center">
            <div className="w-14 h-14 bg-or/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-or" />
            </div>
            <h3 className="font-display text-2xl font-bold text-encre mb-2">
              Rejoignez l&apos;aventure LibraMali
            </h3>
            <p className="text-encre-muted font-body text-sm max-w-md mx-auto mb-6">
              Nous cherchons régulièrement des talents passionnés pour renforcer notre équipe.
              Si vous aimez les livres et voulez avoir un impact au Mali, on veut vous rencontrer.
            </p>
            <a href="mailto:rh@libramali.ml"
              className="btn-primary px-8">
              Voir les offres d&apos;emploi
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CITATIONS ÉQUIPE
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-sable/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {TEMOIGNAGES_EQUIPE.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-card">
                <Quote className="w-8 h-8 text-or/30 mb-4" />
                <p className="font-display text-lg text-encre leading-relaxed italic mb-6">
                  &ldquo;{t.texte}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-encre flex items-center justify-center">
                    <span className="text-ivoire text-sm font-bold">{t.auteur.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-encre text-sm">{t.auteur}</p>
                    <p className="text-encre-muted text-xs font-body">{t.poste}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PARTENAIRES ÉDITEURS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>Ils nous font confiance</SectionLabel>
            <h2 className="font-display text-4xl font-bold text-encre mt-2">
              Nos partenaires éditeurs
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-xl mx-auto">
              LibraMali distribue les catalogues des plus grandes maisons d&apos;édition
              africaines et internationales, avec des accords directs garantissant
              l&apos;authenticité de chaque ouvrage.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PARTENAIRES.map((editeur, i) => (
              <div key={i}
                className="flex items-center justify-center px-5 py-5 bg-ivoire rounded-xl
                           border border-sable hover:border-or/40 hover:shadow-card
                           transition-all group cursor-default text-center">
                <span className="font-body font-semibold text-encre-muted text-sm
                                 group-hover:text-encre transition-colors leading-tight">
                  {editeur}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-encre-muted font-body text-sm">
              Vous êtes éditeur et souhaitez nous rejoindre ?{" "}
              <a href="mailto:partenariats@libramali.ml"
                className="text-or hover:underline font-medium">
                Contactez notre équipe partenariats →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ENGAGEMENT RSE
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-encre relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-or/8 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <SectionLabel>Notre impact</SectionLabel>
            <h2 className="font-display text-4xl font-bold text-ivoire mt-2">
              Au-delà du commerce
            </h2>
            <p className="text-ivoire/60 font-body mt-3 max-w-xl mx-auto">
              LibraMali s&apos;engage pour une société malienne plus lettrée, plus cultivée et
              plus connectée à son patrimoine littéraire.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon:  <BookOpen className="w-6 h-6" />,
                titre: "Programme Écoles",
                desc:  "Tarifs préférentiels et devis personnalisés pour les établissements scolaires, universités et bibliothèques publiques. Plus de 50 établissements partenaires.",
                stat:  "50+ établissements",
              },
              {
                icon:  <Heart className="w-6 h-6" />,
                titre: "1 livre acheté = 1 livre donné",
                desc:  "Pour chaque commande passée, LibraMali reverse un livre à des bibliothèques communautaires dans les zones défavorisées du Mali.",
                stat:  "2 000+ livres donnés",
              },
              {
                icon:  <Globe className="w-6 h-6" />,
                titre: "Auteurs locaux en avant",
                desc:  "30% de notre catalogue est consacré à des auteurs maliens et ouest-africains. Nous organisons des rencontres littéraires et des dédicaces.",
                stat:  "30% auteurs africains",
              },
            ].map((item, i) => (
              <div key={i}
                className="p-7 bg-white/5 border border-white/10 rounded-2xl
                           hover:bg-white/10 hover:border-or/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-or/15 text-or flex items-center justify-center
                                mb-5 group-hover:bg-or group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-or uppercase tracking-wider mb-2">
                  {item.stat}
                </div>
                <h3 className="font-display font-bold text-ivoire text-lg mb-3">{item.titre}</h3>
                <p className="text-ivoire/50 font-body text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-ivoire">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-or/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <BookOpen className="w-10 h-10 text-or" />
          </div>

          <h2 className="font-display text-4xl lg:text-5xl font-black text-encre mb-6 leading-tight">
            Rejoignez nos <span className="text-or">12 000 lecteurs</span>
          </h2>

          <p className="text-encre-muted font-body text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Que vous cherchiez un roman, un manuel, un livre de développement personnel
            ou la dernière pépite de la littérature africaine, LibraMali est votre librairie.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/catalogue" className="btn-primary px-10 py-4 text-base justify-center">
              Explorer le catalogue
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary px-10 py-4 text-base justify-center">
              Créer un compte gratuit
            </Link>
          </div>

          {/* Contacts rapides */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-14 pt-8 border-t border-sable">
            <a href="mailto:contact@libramali.ml"
              className="flex items-center gap-2 text-encre-muted hover:text-or transition-colors text-sm font-body">
              <Mail className="w-4 h-4" />
              contact@libramali.ml
            </a>
            <span className="text-sable-dark hidden sm:block">·</span>
            <a href="tel:+22370000000"
              className="flex items-center gap-2 text-encre-muted hover:text-or transition-colors text-sm font-body">
              <Phone className="w-4 h-4" />
              +223 70 00 00 00
            </a>
            <span className="text-sable-dark hidden sm:block">·</span>
            <span className="flex items-center gap-2 text-encre-muted text-sm font-body">
              <MapPin className="w-4 h-4" />
              ACI 2000, Bamako
            </span>
          </div>

          {/* Liens légaux */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs font-body">
            <Link href="/confidentialite" className="text-encre-muted hover:text-or transition-colors">
              Confidentialité
            </Link>
            <span className="text-sable-dark">·</span>
            <Link href="/mentions-legales" className="text-encre-muted hover:text-or transition-colors">
              Mentions légales
            </Link>
            <span className="text-sable-dark">·</span>
            <Link href="/cgv" className="text-encre-muted hover:text-or transition-colors">
              CGV
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
