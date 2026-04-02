"use client";
// src/app/(main)/livraison/page.tsx
import { useState } from "react";
import Link from "next/link";
import {
  Truck, MapPin, Clock, CheckCircle, Package,
  Search, ChevronRight, ArrowRight, Star,
  CreditCard, Shield, AlertCircle, Info,
  Navigation, Phone, Mail, RefreshCcw,
  Zap, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Données ─────────────────────────────────────────────────────────────── */

const ZONES = [
  {
    zone:      "Bamako — Communes I à VI",
    delai:     "24h",
    frais:     "Gratuite dès 10 000 FCFA",
    frauxBase: "1 500 FCFA",
    seuil:     10000,
    badge:     "Express",
    badgeCol:  "bg-green-100 text-success",
    villes:    ["Toutes les communes de Bamako", "ACI 2000", "Hamdallaye", "Badalabougou", "Hippodrome", "Magnambougou"],
    icon:      <Zap className="w-5 h-5" />,
    iconBg:    "bg-green-50 text-success",
  },
  {
    zone:      "Grand Bamako",
    delai:     "24–48h",
    frais:     "2 500 FCFA",
    frauxBase: "Gratuite dès 25 000 FCFA",
    seuil:     25000,
    badge:     "Rapide",
    badgeCol:  "bg-blue-100 text-blue-700",
    villes:    ["Kalaban-Coro", "Kati", "Dialakorodji", "Mountougoula", "Ouéléssébougou"],
    icon:      <Truck className="w-5 h-5" />,
    iconBg:    "bg-blue-50 text-blue-600",
  },
  {
    zone:      "Région de Ségou",
    delai:     "2–3 jours",
    frais:     "3 500 FCFA",
    frauxBase: "Gratuite dès 50 000 FCFA",
    seuil:     50000,
    badge:     "Standard",
    badgeCol:  "bg-amber-100 text-amber-700",
    villes:    ["Ségou", "San", "Bla", "Barouéli", "Niono", "Tominian"],
    icon:      <Package className="w-5 h-5" />,
    iconBg:    "bg-amber-50 text-amber-600",
  },
  {
    zone:      "Régions de Mopti & Sikasso",
    delai:     "2–4 jours",
    frais:     "3 500 FCFA",
    frauxBase: "Gratuite dès 50 000 FCFA",
    seuil:     50000,
    badge:     "Standard",
    badgeCol:  "bg-amber-100 text-amber-700",
    villes:    ["Mopti", "Djenné", "Bandiagara", "Sikasso", "Koutiala", "Bougouni"],
    icon:      <Package className="w-5 h-5" />,
    iconBg:    "bg-amber-50 text-amber-600",
  },
  {
    zone:      "Régions de Kayes & Koulikoro",
    delai:     "3–5 jours",
    frais:     "4 500 FCFA",
    frauxBase: "Gratuite dès 75 000 FCFA",
    seuil:     75000,
    badge:     "National",
    badgeCol:  "bg-purple-100 text-purple-700",
    villes:    ["Kayes", "Kita", "Koulikoro", "Kangaba", "Dioïla"],
    icon:      <Navigation className="w-5 h-5" />,
    iconBg:    "bg-purple-50 text-purple-600",
  },
  {
    zone:      "Régions de Gao, Tombouctou & Kidal",
    delai:     "5–8 jours",
    frais:     "5 500 FCFA",
    frauxBase: "Gratuite dès 100 000 FCFA",
    seuil:     100000,
    badge:     "Grand Nord",
    badgeCol:  "bg-slate-100 text-slate-600",
    villes:    ["Gao", "Tombouctou", "Kidal", "Ménaka", "Taoudéni"],
    icon:      <MapPin className="w-5 h-5" />,
    iconBg:    "bg-slate-50 text-slate-500",
  },
];

const ETAPES_LIVRAISON = [
  {
    num:   "1",
    titre: "Commande validée",
    desc:  "Votre commande est enregistrée et un email de confirmation vous est envoyé avec le récapitulatif complet.",
    icon:  <CheckCircle className="w-5 h-5" />,
    bg:    "bg-blue-50 text-blue-600",
  },
  {
    num:   "2",
    titre: "Paiement confirmé",
    desc:  "Dès confirmation de votre paiement (immédiat pour espèces et carte, 2h pour Mobile Money), la préparation commence.",
    icon:  <CreditCard className="w-5 h-5" />,
    bg:    "bg-or/10 text-or",
  },
  {
    num:   "3",
    titre: "Préparation du colis",
    desc:  "Notre équipe sélectionne votre livre, vérifie son état et l'emballe soigneusement pour le protéger pendant le transport.",
    icon:  <Package className="w-5 h-5" />,
    bg:    "bg-amber-50 text-amber-600",
  },
  {
    num:   "4",
    titre: "Expédition & suivi",
    desc:  "Votre colis est remis au livreur. Vous recevez un email avec votre numéro de suivi pour tracker en temps réel.",
    icon:  <Truck className="w-5 h-5" />,
    bg:    "bg-purple-50 text-purple-600",
  },
  {
    num:   "5",
    titre: "Livraison à domicile",
    desc:  "Le livreur vous contacte avant d'arriver. En cas d'absence, un second passage ou une mise à disposition est proposé.",
    icon:  <MapPin className="w-5 h-5" />,
    bg:    "bg-green-50 text-success",
  },
];

const CONSEILS_RECEPTION = [
  "Vérifiez l'état extérieur du colis avant de signer le bon de livraison",
  "Ouvrez le colis en présence du livreur si vous constatez des dommages visibles",
  "Notez toute anomalie sur le bon de livraison avant de le signer",
  "Contactez-nous dans les 48h si un problème est découvert à l'ouverture",
  "Conservez votre numéro de commande pour tout suivi ou réclamation",
];

const FAQ_LIVRAISON = [
  {
    q: "Puis-je choisir un créneau de livraison précis ?",
    a: "Pour les livraisons à Bamako, notre livreur vous contactera par téléphone avant d'arriver pour convenir d'un moment. Pour les autres régions, la livraison s'effectue en journée sur une plage de 4 heures que vous pouvez indiquer dans les notes de commande.",
  },
  {
    q: "Que se passe-t-il si je suis absent à la livraison ?",
    a: "Notre livreur effectue deux tentatives de livraison. Après deux échecs, votre colis est conservé 5 jours dans notre point de dépôt. Vous êtes notifié par email et SMS pour organiser une nouvelle livraison ou un retrait.",
  },
  {
    q: "Puis-je me faire livrer à mon lieu de travail ?",
    a: "Absolument. Vous pouvez indiquer n'importe quelle adresse dans nos zones de livraison — domicile, bureau, boutique, école. Assurez-vous simplement que quelqu'un est présent pour réceptionner le colis.",
  },
  {
    q: "Les délais sont-ils garantis ?",
    a: "Les délais indiqués sont des estimations fiables basées sur nos performances réelles. En cas de dépassement de plus de 3 jours ouvrés, vous êtes en droit d'annuler la commande et d'être remboursé intégralement.",
  },
  {
    q: "Livrez-vous le week-end et les jours fériés ?",
    a: "Nos livreurs opèrent du lundi au samedi inclus. Les commandes passées le vendredi après 14h sont traitées le lundi suivant. Les jours fériés maliens entraînent un décalage d'un jour ouvré.",
  },
  {
    q: "Comment fonctionne la livraison gratuite ?",
    a: "La livraison gratuite s'applique automatiquement dès que votre panier atteint le seuil applicable à votre zone (10 000 FCFA pour Bamako). Le seuil est affiché dans votre panier et mis à jour en temps réel.",
  },
];

const METHODES_PAIEMENT = [
  { label: "Espèces à la livraison",   note: "Payez au livreur à la réception" },
  { label: "Orange Money",             note: "Avant expédition — réf. obligatoire" },
  { label: "Moov Money",               note: "Avant expédition — réf. obligatoire" },
  { label: "Wave",                     note: "Avant expédition — réf. obligatoire" },
  { label: "Carte bancaire",           note: "Paiement sécurisé avant expédition" },
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

function InfoBox({ type = "info", children }: {
  type?: "info" | "warning" | "success"; children: React.ReactNode;
}) {
  const cfg = {
    info:    { cls: "bg-blue-50 border-blue-200 text-blue-800",    Icon: Info },
    warning: { cls: "bg-amber-50 border-amber-200 text-amber-800", Icon: AlertCircle },
    success: { cls: "bg-green-50 border-green-200 text-green-800", Icon: CheckCircle },
  }[type];
  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border text-sm font-body mt-4", cfg.cls)}>
      <cfg.Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }: {
  q: string; a: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="border border-sable rounded-2xl overflow-hidden hover:border-sable-dark transition-colors">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-sable/20 transition-colors">
        <span className="font-display font-semibold text-encre text-sm pr-6">{q}</span>
        <ChevronRight className={cn(
          "w-5 h-5 text-encre-muted shrink-0 transition-transform duration-200",
          open && "rotate-90 text-or"
        )} />
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-sable animate-fade-in">
          <p className="text-sm text-encre-muted font-body leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ── Simulateur ──────────────────────────────────────────────────────────── */
function SimulateurLivraison() {
  const [ville,    setVille]    = useState("");
  const [montant,  setMontant]  = useState("");
  const [resultat, setResultat] = useState<typeof ZONES[0] | null>(null);
  const [searched, setSearched] = useState(false);

  const chercher = (e: React.FormEvent) => {
    e.preventDefault();
    const v = ville.toLowerCase().trim();
    if (!v) { toast.error("Entrez une ville."); return; }
    const found = ZONES.find(z =>
      z.villes.some(city => city.toLowerCase().includes(v)) ||
      z.zone.toLowerCase().includes(v)
    );
    setResultat(found ?? null);
    setSearched(true);
  };

  const montantNum  = parseFloat(montant.replace(/\s/g, "")) || 0;
  const fraisCalcule = resultat
    ? (montantNum >= resultat.seuil ? "Livraison gratuite 🎉" : resultat.frais)
    : null;
  const gratuitDans = resultat && montantNum > 0 && montantNum < resultat.seuil
    ? resultat.seuil - montantNum
    : null;

  return (
    <form onSubmit={chercher} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-encre-muted uppercase tracking-wider mb-2">
            Votre ville *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
            <input
              value={ville}
              onChange={e => { setVille(e.target.value); setSearched(false); }}
              placeholder="Ex : Ségou, Mopti, Kati…"
              className="input-field pl-10"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-encre-muted uppercase tracking-wider mb-2">
            Montant du panier (FCFA)
          </label>
          <div className="relative">
            <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
            <input
              type="number" min="0" value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="Ex : 15 000"
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full justify-center py-3">
        <Search className="w-4 h-4" />
        Estimer ma livraison
      </button>

      {/* Résultat */}
      {searched && (
        <div className="animate-fade-in">
          {resultat ? (
            <div className="p-5 bg-white rounded-2xl border-2 border-or/30 shadow-card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider mb-0.5">
                    Zone détectée
                  </p>
                  <p className="font-display font-bold text-encre text-base">{resultat.zone}</p>
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full shrink-0", resultat.badgeCol)}>
                  {resultat.badge}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ivoire rounded-xl p-3 text-center">
                  <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider mb-1">Délai estimé</p>
                  <p className="font-display font-black text-2xl text-encre">{resultat.delai}</p>
                  <p className="text-[10px] text-encre-muted font-body">jours ouvrés</p>
                </div>
                <div className="bg-ivoire rounded-xl p-3 text-center">
                  <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider mb-1">
                    {montantNum > 0 ? "Frais calculés" : "Tarif de base"}
                  </p>
                  <p className={cn(
                    "font-display font-black text-xl",
                    fraisCalcule?.includes("gratuite") ? "text-success" : "text-encre"
                  )}>
                    {montantNum > 0 ? fraisCalcule : resultat.frais}
                  </p>
                </div>
              </div>

              {/* Barre de progression vers la gratuité */}
              {gratuitDans && gratuitDans > 0 && (
                <div className="bg-ivoire rounded-xl p-3">
                  <div className="flex justify-between text-xs font-body mb-2">
                    <span className="text-encre-muted">
                      Plus que <strong className="text-encre">
                        {gratuitDans.toLocaleString("fr-FR")} FCFA
                      </strong> pour la livraison gratuite
                    </span>
                    <span className="text-or font-semibold">
                      {Math.round((montantNum / resultat.seuil) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-sable rounded-full overflow-hidden">
                    <div
                      className="h-full bg-or rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((montantNum / resultat.seuil) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-amber-800 text-sm">Ville non reconnue</p>
              <p className="text-xs text-amber-700 font-body mt-1">
                Vérifiez l'orthographe ou{" "}
                <a href="mailto:contact@libramali.ml" className="underline font-medium">
                  contactez-nous
                </a>{" "}
                pour vérifier si votre ville est desservie.
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function LivraisonPage() {
  const [openZone, setOpenZone] = useState<number | null>(null);
  const [openFaq,  setOpenFaq]  = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-ivoire relative overflow-hidden">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <header className="bg-encre text-ivoire py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
<div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-or/8 blur-[80px] md:blur-[100px] pointer-events-none" />        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-or/5 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <nav className="flex items-center gap-2 text-xs text-ivoire/50 font-body mb-8">
            <Link href="/" className="hover:text-ivoire transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ivoire/80">Livraison & délais</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-or/20 border border-or/30 flex items-center justify-center shrink-0 mt-1">
              <Truck className="w-8 h-8 text-or" />
            </div>
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-ivoire mb-3">
                Livraison & délais
              </h1>
              <p className="text-ivoire/60 font-body text-base leading-relaxed max-w-2xl">
                LibraMali livre dans l'ensemble du territoire malien. Découvrez les tarifs,
                délais et conditions de livraison pour votre ville.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  { icon: <Zap className="w-3.5 h-3.5" />,        text: "24h à Bamako" },
                  { icon: <MapPin className="w-3.5 h-3.5" />,     text: "20 villes desservies" },
                  { icon: <Shield className="w-3.5 h-3.5" />,     text: "Colis assuré" },
                  { icon: <Star className="w-3.5 h-3.5" />,       text: "98% livraisons réussies" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs text-ivoire font-body">
                    <span className="text-or">{b.icon}</span>
                    {b.text}
                  </div>
                ))}
              </div>
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
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">

{/* ── §1 Simulateur + carte résumé ─────────────────────────────── */}
<section className="overflow-hidden"> {/* ✅ Ajout de overflow-hidden pour bloquer les débordements */}
  <div className="grid lg:grid-cols-2 gap-8 items-start">
    <div className="w-full"> {/* ✅ Assurance que le simulateur prend toute la largeur disponible */}
      <SectionLabel>Estimez votre livraison</SectionLabel>
      <h2 className="font-display text-3xl font-bold text-encre mb-3 tracking-tighter">
        Calculez vos frais et délais
      </h2>
      <p className="text-encre-muted font-body text-sm leading-relaxed mb-6 max-w-prose">
        Entrez votre ville et le montant de votre panier pour obtenir une
        estimation instantanée, avec la barre de progression vers la livraison gratuite.
      </p>
      <SimulateurLivraison />
    </div>

    {/* Résumé zones */}
    <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6 border border-sable/50 w-full"> {/* ✅ Padding réduit sur mobile (p-4) */}
      <p className="text-[10px] font-black text-encre uppercase tracking-widest mb-6 opacity-70">
        Aperçu de la couverture
      </p>
      <div className="space-y-5"> {/* ✅ Augmentation de l'espace pour éviter l'effet "tassé" */}
        {ZONES.map((z, i) => (
          <div key={i} className="flex items-center gap-3 min-w-0"> {/* ✅ min-w-0 est vital ici pour le truncate */}
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", z.iconBg)}>
              {z.icon}
            </div>
            
            <div className="flex-1 min-w-0"> {/* ✅ min-w-0 permet au texte de se couper plutôt que de pousser le cadre */}
              <p className="text-sm font-bold text-encre truncate leading-none mb-1">
                {z.zone}
              </p>
              <p className="text-[11px] text-encre-muted font-body truncate">
                {z.villes.slice(0, 3).join(", ")}…
              </p>
            </div>

            <div className="text-right shrink-0 ml-2"> {/* ✅ ml-2 pour garantir un petit espace entre le texte et le prix */}
              <p className="font-display font-black text-encre text-sm leading-none mb-1">
                {z.delai}
              </p>
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter", z.badgeCol)}>
                {z.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>

        {/* ── §2 Tableau zones détaillé ────────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <SectionLabel>Zones & tarifs détaillés</SectionLabel>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Tarifs par zone de livraison
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-lg mx-auto">
              Cliquez sur une zone pour révéler les villes desservies et les conditions complètes.
            </p>
          </div>

          <div className="space-y-3">
            {ZONES.map((zone, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card border border-sable/50 overflow-hidden">
                <button
                  onClick={() => setOpenZone(openZone === i ? null : i)}
                  className="w-full flex flex-wrap items-center gap-4 px-6 py-5 text-left hover:bg-sable/20 transition-colors"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", zone.iconBg)}>
                    {zone.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold text-encre">{zone.zone}</p>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", zone.badgeCol)}>
                        {zone.badge}
                      </span>
                    </div>
                    <p className="text-xs text-encre-muted font-body mt-0.5 truncate max-w-xs">
                      {zone.villes.slice(0, 4).join(" · ")}{zone.villes.length > 4 && " …"}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider">Délai</p>
                      <p className="font-display font-black text-encre text-lg">{zone.delai}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider">Tarif</p>
                      <p className="font-display font-semibold text-encre text-sm">{zone.frais}</p>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 text-encre-muted transition-transform duration-200",
                      openZone === i && "rotate-90 text-or"
                    )} />
                  </div>
                </button>

                {/* Détail dépliable */}
                {openZone === i && (
                  <div className="px-6 pb-6 border-t border-sable animate-fade-in">
                    <div className="grid sm:grid-cols-2 gap-6 pt-5">
                      <div>
                        <p className="text-xs font-bold text-encre uppercase tracking-wider mb-3">
                          Villes desservies
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {zone.villes.map((v, vi) => (
                            <span key={vi}
                              className="text-xs px-2.5 py-1 bg-sable/60 text-encre rounded-full font-body">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 bg-ivoire rounded-xl">
                          <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-1">
                            Tarif de livraison
                          </p>
                          <p className="font-display font-bold text-encre">{zone.frais}</p>
                          <p className="text-xs text-success mt-1">{zone.frauxBase}</p>
                        </div>
                        <div className="p-4 bg-ivoire rounded-xl">
                          <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-1">
                            Délai estimé
                          </p>
                          <p className="font-display font-bold text-encre">{zone.delai} ouvrés</p>
                          <p className="text-xs text-encre-muted mt-1">
                            À partir de la confirmation de paiement
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <InfoBox type="info">
            <strong>Votre ville n'est pas listée ?</strong> Contactez-nous à{" "}
            <a href="mailto:contact@libramali.ml" className="underline font-medium">
              contact@libramali.ml
            </a>{" "}
            ou au{" "}
            <a href="tel:+22370000000" className="underline font-medium">+223 70 00 00 00</a>.
            Nous faisons notre maximum pour desservir toutes les communes du Mali.
          </InfoBox>
        </section>

        {/* ── §3 Processus de livraison ────────────────────────────────── */}
        <section>
          <div className="text-center mb-12">
            <SectionLabel>De la commande à votre porte</SectionLabel>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Comment se passe votre livraison ?
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-lg mx-auto">
              Cinq étapes pour que votre livre arrive en parfait état, en temps et en heure.
            </p>
          </div>

          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-sable-dark" />

            <div className="space-y-5">
              {ETAPES_LIVRAISON.map((etape, i) => (
                <div key={i}
                  className="relative flex items-start gap-5 animate-slide-up"
                  style={{ animationDelay: `${i * 70}ms`, animationFillMode: "forwards" }}
                >
                  <div className={cn(
                    "relative z-10 w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 border-4 border-ivoire shadow-sm",
                    etape.bg
                  )}>
                    {etape.icon}
                  </div>
                  <div className="flex-1 bg-white rounded-2xl shadow-card p-5 border border-sable/50 mt-1">
                    <span className="text-[10px] font-black text-encre-muted uppercase tracking-widest">
                      Étape {etape.num}
                    </span>
                    <h3 className="font-display font-bold text-encre text-base mb-1 mt-0.5">
                      {etape.titre}
                    </h3>
                    <p className="text-sm text-encre-muted font-body leading-relaxed">{etape.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── §4 Conseils de réception ─────────────────────────────────── */}
        <section className="bg-white rounded-3xl shadow-card p-8 border border-sable/50">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-or/10 rounded-2xl flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-or" />
            </div>
            <div>
              <SectionLabel>Bonnes pratiques</SectionLabel>
              <h2 className="font-display text-2xl font-bold text-encre mt-1">
                Conseils pour la réception de votre colis
              </h2>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONSEILS_RECEPTION.map((conseil, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-ivoire rounded-xl">
                <div className="w-6 h-6 rounded-full bg-or text-white flex items-center justify-center
                                text-xs font-black shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-encre font-body leading-snug">{conseil}</p>
              </div>
            ))}
          </div>

          <InfoBox type="warning">
            <strong>Important :</strong> une fois le bon de livraison signé sans réserve,
            LibraMali ne peut pas être tenu responsable des dommages constatés ultérieurement
            sur l'emballage. En cas de doute, prenez des photos avant de signer.
          </InfoBox>
        </section>

        {/* ── §5 Modes de paiement acceptés ────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <SectionLabel>Modes de paiement</SectionLabel>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Payez comme vous préférez
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-lg mx-auto">
              Tous nos modes de paiement sont compatibles avec la livraison à domicile.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {METHODES_PAIEMENT.map((m, i) => (
              <div key={i} className="flex items-start gap-3 p-5 bg-white rounded-2xl shadow-card border border-sable/50">
                <div className="w-9 h-9 rounded-xl bg-or/10 text-or flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-encre text-sm">{m.label}</p>
                  <p className="text-xs text-encre-muted font-body mt-0.5">{m.note}</p>
                </div>
              </div>
            ))}
          </div>

          <InfoBox type="success">
            <strong>Livraison gratuite :</strong> bénéficiez de la livraison offerte à Bamako
            dès 10 000 FCFA d'achats. Le simulateur ci-dessus calcule votre seuil en temps réel.
          </InfoBox>
        </section>

        {/* ── §6 Engagements LibraMali ─────────────────────────────────── */}
        <section className="bg-encre rounded-3xl p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-or/10 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="text-center mb-10">
              <SectionLabel>Notre promesse</SectionLabel>
              <h2 className="font-display text-3xl font-bold text-ivoire mt-1">
                Nos engagements livraison
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon:  <Zap className="w-6 h-6" />,
                  titre: "Rapidité",
                  desc:  "Expédition le jour même pour toute commande confirmée avant 14h (jours ouvrés).",
                  bg:    "bg-or/20", col: "text-or",
                },
                {
                  icon:  <Shield className="w-6 h-6" />,
                  titre: "Sécurité",
                  desc:  "Chaque colis est assuré. Perte ou dommage ? Remboursement ou réexpédition garanti.",
                  bg:    "bg-blue-500/15", col: "text-blue-300",
                },
                {
                  icon:  <Navigation className="w-6 h-6" />,
                  titre: "Suivi temps réel",
                  desc:  "Numéro de suivi envoyé par email dès l'expédition, consultable 24h/24.",
                  bg:    "bg-green-500/15", col: "text-green-300",
                },
                {
                  icon:  <RefreshCcw className="w-6 h-6" />,
                  titre: "Satisfaction",
                  desc:  "Délai non respecté ? Nous remboursons vos frais de port sans discussion.",
                  bg:    "bg-purple-500/15", col: "text-purple-300",
                },
              ].map((eng, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto", eng.bg, eng.col)}>
                    {eng.icon}
                  </div>
                  <h3 className="font-display font-bold text-ivoire text-base">{eng.titre}</h3>
                  <p className="text-ivoire/55 text-xs font-body leading-relaxed">{eng.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── §7 FAQ ───────────────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <SectionLabel>Questions fréquentes</SectionLabel>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Tout sur la livraison
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_LIVRAISON.map((item, i) => (
              <FaqItem
                key={i}
                q={item.q}
                a={item.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </section>

        {/* ── §8 Contact & liens ───────────────────────────────────────── */}
        <section>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-card p-7 border border-sable/50">
              <h3 className="font-display font-bold text-encre text-xl mb-2">
                Une question sur votre livraison ?
              </h3>
              <p className="text-sm text-encre-muted font-body leading-relaxed mb-5">
                Notre équipe est disponible du lundi au samedi de 8h à 18h.
              </p>
              <div className="space-y-3">
                <a href="mailto:contact@libramali.ml"
                  className="flex items-center gap-3 p-3 bg-ivoire rounded-xl hover:bg-sable/40 transition-colors group">
                  <div className="w-8 h-8 bg-or/10 text-or rounded-lg flex items-center justify-center shrink-0
                                  group-hover:bg-or group-hover:text-white transition-all">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-encre-muted font-body">Email</p>
                    <p className="text-sm font-medium text-encre">contact@libramali.ml</p>
                  </div>
                </a>
                <a href="tel:+22370000000"
                  className="flex items-center gap-3 p-3 bg-ivoire rounded-xl hover:bg-sable/40 transition-colors group">
                  <div className="w-8 h-8 bg-or/10 text-or rounded-lg flex items-center justify-center shrink-0
                                  group-hover:bg-or group-hover:text-white transition-all">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-encre-muted font-body">Téléphone — Lun–Sam 8h–18h</p>
                    <p className="text-sm font-medium text-encre">+223 70 00 00 00</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-encre rounded-2xl p-7 text-ivoire">
              <div className="w-12 h-12 bg-or/20 rounded-2xl flex items-center justify-center mb-4">
                <Navigation className="w-6 h-6 text-or" />
              </div>
              <h3 className="font-display font-bold text-ivoire text-xl mb-2">
                Suivez votre commande
              </h3>
              <p className="text-ivoire/60 text-sm font-body leading-relaxed mb-6">
                Consultez en temps réel l'état de votre livraison depuis votre espace client.
              </p>
              <div className="space-y-3">
                <Link href="/mon-compte/commandes"
                  className="flex items-center gap-2 text-sm font-medium text-or hover:text-or-light transition-colors">
                  Accéder à mes commandes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/retours"
                  className="flex items-center gap-2 text-sm text-ivoire/50 hover:text-ivoire transition-colors">
                  Retours & remboursements <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8 text-sm font-body">
            <Link href="/cgv" className="text-encre-muted hover:text-or transition-colors">
              Conditions générales de vente
            </Link>
            <span className="text-sable-dark">·</span>
            <Link href="/retours" className="text-encre-muted hover:text-or transition-colors">
              Politique de retours
            </Link>
            <span className="text-sable-dark">·</span>
            <Link href="/catalogue" className="text-encre-muted hover:text-or transition-colors">
              Retour au catalogue
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
