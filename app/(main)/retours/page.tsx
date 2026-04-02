"use client";
// src/app/(main)/retours/page.tsx
import { useState } from "react";
import Link from "next/link";
import {
  RefreshCcw, CheckCircle, XCircle, Clock, Package,
  Mail, Phone, ChevronRight, ArrowRight, AlertCircle,
  Truck, CreditCard, ShieldCheck, MessageSquare,
  Info, BookOpen, ThumbsUp, ThumbsDown, Loader2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Données ─────────────────────────────────────────────────────────────── */

const ETAPES_RETOUR = [
  {
    num:   "01",
    titre: "Contactez-nous",
    desc:  "Envoyez un email à retours@libramali.ml ou ouvrez une demande depuis votre espace client. Indiquez votre numéro de commande et la raison du retour.",
    icon:  <Mail className="w-6 h-6" />,
    color: "bg-blue-50 text-blue-600",
    delay: "0ms",
  },
  {
    num:   "02",
    titre: "Validation sous 24h",
    desc:  "Notre équipe valide votre demande et vous envoie une étiquette de retour (si retour à notre charge) ou les instructions d'expédition.",
    icon:  <CheckCircle className="w-6 h-6" />,
    color: "bg-amber-50 text-amber-600",
    delay: "80ms",
  },
  {
    num:   "03",
    titre: "Renvoyez le colis",
    desc:  "Emballez soigneusement le(s) livre(s) dans leur emballage d'origine. Expédiez le colis dans les 7 jours suivant la validation.",
    icon:  <Package className="w-6 h-6" />,
    color: "bg-purple-50 text-purple-600",
    delay: "160ms",
  },
  {
    num:   "04",
    titre: "Remboursement",
    desc:  "Dès réception et vérification du colis, votre remboursement est déclenché dans les 5 jours ouvrés par le même moyen de paiement.",
    icon:  <CreditCard className="w-6 h-6" />,
    color: "bg-green-50 text-success",
    delay: "240ms",
  },
];

const MOTIFS_ACCEPTES = [
  "Livre reçu endommagé pendant le transport",
  "Livre non conforme à la description (édition, langue, version)",
  "Mauvais livre reçu (erreur de préparation de commande)",
  "Livre manquant dans le colis (commande incomplète)",
  "Livre reçu avec des défauts d'impression (pages manquantes, illisibles)",
  "Exercice du droit de rétractation dans les 7 jours (sans motif requis)",
];

const MOTIFS_REFUSES = [
  "Livre manifestement lu, annoté ou mis en évidence",
  "Livre endommagé par le Client après réception",
  "Demande formulée plus de 7 jours après la réception",
  "Livre commandé spécialement sur demande du Client",
  "Livre dont l'emballage d'origine a été détruit ou perdu",
  "Livre numérique téléchargé (non retournable par nature)",
];

const FAQ_RETOURS = [
  {
    q: "Mon remboursement prend combien de temps à apparaître ?",
    a: "Le remboursement est déclenché dans les 5 jours ouvrés après réception et vérification du colis. L'apparition sur votre compte dépend ensuite de votre moyen de paiement : immédiate pour Mobile Money, 2–5 jours pour carte bancaire.",
  },
  {
    q: "Je n'ai plus l'emballage d'origine, puis-je quand même retourner ?",
    a: "L'emballage d'origine est requis pour les retours sans motif. En revanche, pour un retour suite à une erreur de notre part ou un produit défectueux, un autre emballage protecteur est accepté. Contactez-nous pour évaluer au cas par cas.",
  },
  {
    q: "Puis-je échanger un livre plutôt que d'être remboursé ?",
    a: "Oui ! Si vous souhaitez un échange contre un autre titre de valeur équivalente, c'est possible. Mentionnez-le dans votre demande de retour et notre équipe vous aidera à choisir un livre de substitution.",
  },
  {
    q: "J'ai reçu le mauvais livre, qui prend en charge les frais de retour ?",
    a: "LibraMali prend entièrement en charge les frais de retour si l'erreur provient de notre équipe (mauvais livre, article manquant, livre défectueux). Une étiquette prépayée vous sera envoyée.",
  },
  {
    q: "Que se passe-t-il si mon colis n'arrive jamais ?",
    a: "Si votre colis n'est pas livré dans le délai prévu et que le tracking ne montre aucune activité depuis 48h, contactez-nous immédiatement. Nous ouvrons une enquête et vous remboursons ou réexpédions dans les 5 jours si le colis est déclaré perdu.",
  },
  {
    q: "Puis-je annuler ma commande avant la livraison ?",
    a: "Oui, tant que votre commande est au statut « En attente » dans votre espace client. Une fois en préparation ou expédiée, vous devrez attendre la réception et effectuer une demande de retour.",
  },
];

const DELAIS_REMBOURSEMENT = [
  { methode: "Espèces (paiement à la livraison)", delai: "Non applicable — colis refusé à la livraison", icon: <CreditCard className="w-4 h-4" /> },
  { methode: "Orange Money / Moov Money / Wave",  delai: "Sous 2–3 jours ouvrés",                       icon: <CreditCard className="w-4 h-4" /> },
  { methode: "Carte bancaire Visa / Mastercard",  delai: "Sous 5–7 jours ouvrés (délai bancaire)",     icon: <CreditCard className="w-4 h-4" /> },
  { methode: "Avoir LibraMali (crédit compte)",   delai: "Immédiat — disponible dès validation",        icon: <Star className="w-4 h-4" /> },
];

/* ── Composants ─────────────────────────────────────────────────────────── */

function InfoBox({ type = "info", children }: { type?: "info" | "warning" | "success"; children: React.ReactNode }) {
  const cfg = {
    info:    { bg: "bg-blue-50 border-blue-200 text-blue-800",   icon: <Info className="w-5 h-5 shrink-0 mt-0.5" /> },
    warning: { bg: "bg-amber-50 border-amber-200 text-amber-800", icon: <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> },
    success: { bg: "bg-green-50 border-green-200 text-green-800", icon: <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> },
  }[type];
  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border text-sm font-body", cfg.bg)}>
      {cfg.icon}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }: {
  q: string; a: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="border border-sable rounded-2xl overflow-hidden transition-all hover:border-sable-dark">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-sable/20 transition-colors">
        <span className="font-display font-semibold text-encre text-sm pr-6">{q}</span>
        <ChevronRight className={cn(
          "w-5 h-5 text-encre-muted shrink-0 transition-transform duration-200",
          open && "rotate-90 text-or"
        )} />
      </button>
      {open && (
        <div className="px-6 pb-5 animate-fade-in border-t border-sable">
          <p className="text-sm text-encre-muted font-body leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ── Formulaire de demande ────────────────────────────────────────────────── */
function FormulaireRetour() {
  const [form, setForm] = useState({
    numeroCde:  "",
    email:      "",
    motif:      "",
    description: "",
    souhait:    "remboursement",
  });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numeroCde || !form.email || !form.motif) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSending(true);
    // Simulation d'envoi (remplacer par un vrai appel API)
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    toast.success("Demande envoyée ! Vous recevrez une réponse sous 24h.");
  };

  if (sent) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h3 className="font-display text-xl font-bold text-encre">Demande envoyée !</h3>
        <p className="text-sm text-encre-muted font-body max-w-sm mx-auto">
          Notre équipe traite votre demande et vous répondra sous <strong>24h ouvrées</strong>.
          Un récapitulatif a été envoyé à <strong>{form.email}</strong>.
        </p>
        <button
          onClick={() => { setSent(false); setForm({ numeroCde:"", email:"", motif:"", description:"", souhait:"remboursement" }); }}
          className="text-sm text-or hover:underline font-body">
          Faire une autre demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-encre-muted uppercase tracking-wider mb-2">
            N° de commande *
          </label>
          <input
            value={form.numeroCde}
            onChange={e => setForm(f => ({ ...f, numeroCde: e.target.value }))}
            placeholder="Ex : 1042"
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-encre-muted uppercase tracking-wider mb-2">
            Adresse email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="vous@exemple.com"
            className="input-field"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-encre-muted uppercase tracking-wider mb-2">
          Motif du retour *
        </label>
        <select
          value={form.motif}
          onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
          className="input-field"
          required
        >
          <option value="">— Sélectionnez un motif —</option>
          <optgroup label="Problème produit">
            <option value="endommage">Livre reçu endommagé</option>
            <option value="non-conforme">Livre non conforme à la description</option>
            <option value="mauvais-livre">Mauvais livre reçu (erreur de commande)</option>
            <option value="manquant">Article manquant dans le colis</option>
            <option value="defaut-impression">Défaut d'impression (pages manquantes, illisibles)</option>
          </optgroup>
          <optgroup label="Droit de rétractation">
            <option value="retractation">Rétractation (7 jours, sans motif)</option>
          </optgroup>
          <optgroup label="Autre">
            <option value="autre">Autre raison</option>
          </optgroup>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-encre-muted uppercase tracking-wider mb-2">
          Je souhaite
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: "remboursement", label: "Remboursement",  icon: <CreditCard className="w-4 h-4" /> },
            { val: "echange",       label: "Échange",         icon: <RefreshCcw className="w-4 h-4" /> },
            { val: "avoir",         label: "Avoir LibraMali", icon: <Star className="w-4 h-4" /> },
          ].map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setForm(f => ({ ...f, souhait: opt.val }))}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-body font-medium transition-all",
                form.souhait === opt.val
                  ? "border-encre bg-encre text-ivoire"
                  : "border-sable-dark text-encre-muted hover:border-encre hover:text-encre"
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-encre-muted uppercase tracking-wider mb-2">
          Description (optionnelle)
        </label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="Décrivez le problème rencontré, joignez si possible des photos par email..."
          className="input-field resize-none"
          maxLength={500}
        />
        <div className="flex justify-end mt-1">
          <span className={cn("text-xs font-mono", form.description.length > 450 ? "text-error" : "text-encre-muted")}>
            {form.description.length}/500
          </span>
        </div>
      </div>

      <InfoBox type="info">
        Si votre retour concerne un livre <strong>endommagé ou non conforme</strong>, joignez
        des photos du produit en réponse à l'email de confirmation que vous recevrez.
        Cela accélèrera considérablement le traitement de votre demande.
      </InfoBox>

      <button
        type="submit"
        disabled={sending}
        className="btn-primary w-full justify-center py-4 text-base"
      >
        {sending
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours…</>
          : <><MessageSquare className="w-5 h-5" /> Envoyer la demande de retour</>}
      </button>

      <p className="text-center text-xs text-encre-muted font-body">
        Réponse garantie sous 24h ouvrées · Traitement prioritaire pour les livres défectueux
      </p>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function RetoursPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-ivoire">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <header className="bg-encre text-ivoire py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-or/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-or/5 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <nav className="flex items-center gap-2 text-xs text-ivoire/50 font-body mb-8">
            <Link href="/" className="hover:text-ivoire transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ivoire/80">Retours & Remboursements</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-or/20 border border-or/30 flex items-center justify-center shrink-0 mt-1">
              <RefreshCcw className="w-8 h-8 text-or" />
            </div>
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-ivoire mb-3">
                Retours & Remboursements
              </h1>
              <p className="text-ivoire/60 font-body text-base leading-relaxed max-w-2xl">
                Votre satisfaction est notre priorité absolue. Si quelque chose ne va pas
                avec votre commande, nous sommes là pour arranger ça rapidement et sans
                complications.
              </p>
              <div className="flex flex-wrap items-center gap-6 mt-6">
                {[
                  { icon: <Clock className="w-4 h-4" />,       text: "7 jours pour retourner" },
                  { icon: <CheckCircle className="w-4 h-4" />,  text: "Remboursement sous 5j" },
                  { icon: <ShieldCheck className="w-4 h-4" />,  text: "Retour gratuit si erreur LibraMali" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-ivoire/70 font-body">
                    <span className="text-or">{item.icon}</span>
                    {item.text}
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

        {/* ── §1 Garantie rapide ──────────────────────────────────────── */}
        <section>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon:  <Clock className="w-7 h-7" />,
                titre: "7 jours",
                desc:  "pour demander un retour à compter de la réception de votre commande",
                bg:    "bg-blue-50", col: "text-blue-600",
              },
              {
                icon:  <Package className="w-7 h-7" />,
                titre: "Retour gratuit",
                desc:  "si le retour est dû à une erreur de LibraMali ou un produit défectueux",
                bg:    "bg-green-50", col: "text-success",
              },
              {
                icon:  <CreditCard className="w-7 h-7" />,
                titre: "5 jours ouvrés",
                desc:  "pour recevoir votre remboursement après réception et vérification du retour",
                bg:    "bg-or/10", col: "text-or",
              },
            ].map((g, i) => (
              <div key={i} className="card p-6 text-center">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4", g.bg, g.col)}>
                  {g.icon}
                </div>
                <p className="font-display font-black text-3xl text-encre mb-2">{g.titre}</p>
                <p className="text-sm text-encre-muted font-body leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── §2 Comment ça marche ────────────────────────────────────── */}
        <section>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-or mb-3">
              <span className="w-6 h-px bg-or inline-block" />
              Procédure simplifiée
              <span className="w-6 h-px bg-or inline-block" />
            </span>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Retourner un livre en 4 étapes
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-lg mx-auto">
              Une procédure simple, rapide et sans paperasse inutile.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connecteurs desktop */}
            <div className="hidden lg:block absolute top-14 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-sable-dark" style={{ zIndex: 0 }} />

            {ETAPES_RETOUR.map((etape, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl shadow-card p-6 text-center
                           animate-slide-up hover:shadow-card-hover hover:-translate-y-1 transition-all"
                style={{ animationDelay: etape.delay, animationFillMode: "forwards" }}
              >
                {/* Numéro */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full
                                bg-encre text-ivoire flex items-center justify-center text-xs font-black z-10">
                  {etape.num.slice(1)}
                </div>

                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mt-3 mb-4", etape.color)}>
                  {etape.icon}
                </div>
                <h3 className="font-display font-bold text-encre text-base mb-2">{etape.titre}</h3>
                <p className="text-xs text-encre-muted font-body leading-relaxed">{etape.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── §3 Ce qu'on accepte / refuse ────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-or mb-3">
              <span className="w-6 h-px bg-or inline-block" />
              Conditions d'éligibilité
              <span className="w-6 h-px bg-or inline-block" />
            </span>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Quels retours acceptons-nous ?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Acceptés */}
            <div className="bg-white rounded-2xl shadow-card border border-green-200/50 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-green-50 border-b border-green-200/50">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-success" />
                </div>
                <h3 className="font-display font-bold text-success">Retours acceptés</h3>
              </div>
              <div className="p-6 space-y-3">
                {MOTIFS_ACCEPTES.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="text-sm text-encre font-body leading-snug">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Refusés */}
            <div className="bg-white rounded-2xl shadow-card border border-red-200/50 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-200/50">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <ThumbsDown className="w-4 h-4 text-error" />
                </div>
                <h3 className="font-display font-bold text-error">Retours refusés</h3>
              </div>
              <div className="p-6 space-y-3">
                {MOTIFS_REFUSES.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                    <span className="text-sm text-encre font-body leading-snug">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <InfoBox type="info">
            <strong>Doute sur l'éligibilité de votre retour ?</strong> Contactez-nous avant
            d'expédier votre colis. Notre équipe étudie chaque situation au cas par cas
            et vous répondra dans les 24h.
          </InfoBox>
        </section>

        {/* ── §4 Délais de remboursement par méthode ──────────────────── */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-or mb-3">
              <span className="w-6 h-px bg-or inline-block" />
              Délais selon votre paiement
              <span className="w-6 h-px bg-or inline-block" />
            </span>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Quand serez-vous remboursé ?
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-lg mx-auto">
              Les délais varient selon le mode de paiement utilisé lors de votre commande.
            </p>
          </div>

          <div className="space-y-3">
            {DELAIS_REMBOURSEMENT.map((row, i) => (
              <div key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                           p-5 bg-white rounded-2xl shadow-card border border-sable/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-or/10 text-or flex items-center justify-center shrink-0">
                    {row.icon}
                  </div>
                  <span className="font-medium text-encre text-sm">{row.methode}</span>
                </div>
                <div className="flex items-center gap-2 sm:text-right pl-12 sm:pl-0">
                  <Clock className="w-4 h-4 text-encre-muted shrink-0" />
                  <span className="text-sm text-encre-muted font-body">{row.delai}</span>
                </div>
              </div>
            ))}
          </div>

          <InfoBox type="success">
            <strong>Astuce :</strong> choisissez le <strong>remboursement en avoir LibraMali</strong>{" "}
            pour recevoir votre crédit immédiatement après validation du retour, sans attendre
            le traitement bancaire. L'avoir est utilisable sur toute commande ultérieure.
          </InfoBox>
        </section>

        {/* ── §5 Cas particuliers ──────────────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-or mb-3">
              <span className="w-6 h-px bg-or inline-block" />
              Situations spécifiques
              <span className="w-6 h-px bg-or inline-block" />
            </span>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Cas particuliers
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon:  <Truck className="w-5 h-5" />,
                titre: "Colis perdu ou non livré",
                desc:  "Si votre colis n'arrive pas sous 72h après la date estimée, ouvrez une réclamation depuis votre espace client. Après enquête (48h max), nous vous remboursons ou réexpédions sans frais.",
                bg:    "bg-blue-50", col: "text-blue-600",
                action: "Ouvrir une réclamation",
                href:   "/mon-compte/commandes",
              },
              {
                icon:  <Package className="w-5 h-5" />,
                titre: "Colis endommagé à la livraison",
                desc:  "Refusez le colis ou émettez des réserves écrites sur le bon de livraison. Contactez-nous dans les 48h avec des photos. Nous réexpédions immédiatement sans attendre le retour.",
                bg:    "bg-amber-50", col: "text-amber-600",
                action: "Contacter le support",
                href:   "mailto:retours@libramali.ml",
              },
              {
                icon:  <BookOpen className="w-5 h-5" />,
                titre: "Commande institutionnelle",
                desc:  "Pour les retours concernant des commandes passées par des établissements scolaires ou entreprises, contactez directement notre service B2B pour une procédure adaptée.",
                bg:    "bg-purple-50", col: "text-purple-600",
                action: "Contacter le B2B",
                href:   "mailto:devis@libramali.ml",
              },
              {
                icon:  <RefreshCcw className="w-5 h-5" />,
                titre: "Échange plutôt que remboursement",
                desc:  "Vous préférez un autre titre ? Mentionnez-le lors de votre demande. Si le livre souhaité est de valeur supérieure, vous réglez la différence. Si inférieur, nous créditons la différence sur votre compte.",
                bg:    "bg-green-50", col: "text-success",
                action: "Demander un échange",
                href:   "#formulaire",
              },
            ].map((cas, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-6 border border-sable/50">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4", cas.bg, cas.col)}>
                  {cas.icon}
                </div>
                <h3 className="font-display font-bold text-encre text-base mb-2">{cas.titre}</h3>
                <p className="text-sm text-encre-muted font-body leading-relaxed mb-4">{cas.desc}</p>
                <a href={cas.href}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-or hover:text-or-dark transition-colors">
                  {cas.action} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── §6 Formulaire de retour ──────────────────────────────────── */}
        <section id="formulaire" className="scroll-mt-24">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-or mb-3">
              <span className="w-6 h-px bg-or inline-block" />
              Demande en ligne
              <span className="w-6 h-px bg-or inline-block" />
            </span>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Faire une demande de retour
            </h2>
            <p className="text-encre-muted font-body mt-3 max-w-lg mx-auto">
              Remplissez ce formulaire ou connectez-vous à votre espace client pour
              ouvrir une demande directement depuis votre historique de commandes.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-card p-8">
              <FormulaireRetour />
            </div>

            {/* Alternatives */}
            <div className="lg:col-span-2 space-y-5">
              {/* Espace client */}
              <div className="bg-encre rounded-2xl p-6 text-ivoire">
                <div className="w-12 h-12 bg-or/20 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-or" />
                </div>
                <h3 className="font-display font-bold text-ivoire text-lg mb-2">
                  Depuis votre espace client
                </h3>
                <p className="text-ivoire/60 text-sm font-body leading-relaxed mb-4">
                  La méthode la plus rapide. Ouvrez directement une demande de retour
                  depuis votre historique de commandes.
                </p>
                <Link href="/mon-compte/commandes"
                  className="flex items-center gap-2 text-sm font-medium text-or hover:text-or-light transition-colors">
                  Accéder à mes commandes <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Contact direct */}
              <div className="bg-white rounded-2xl shadow-card p-6 border border-sable/50">
                <h3 className="font-display font-semibold text-encre text-base mb-4">
                  Contact direct
                </h3>
                <div className="space-y-4">
                  <a href="mailto:retours@libramali.ml"
                    className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl bg-or/10 text-or flex items-center justify-center shrink-0
                                    group-hover:bg-or group-hover:text-white transition-all">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-encre-muted font-body uppercase tracking-wider">Email retours</p>
                      <p className="text-sm font-medium text-encre group-hover:text-or transition-colors">
                        retours@libramali.ml
                      </p>
                    </div>
                  </a>
                  <a href="tel:+22370000000"
                    className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl bg-or/10 text-or flex items-center justify-center shrink-0
                                    group-hover:bg-or group-hover:text-white transition-all">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-encre-muted font-body uppercase tracking-wider">Téléphone</p>
                      <p className="text-sm font-medium text-encre group-hover:text-or transition-colors">
                        +223 70 00 00 00
                      </p>
                    </div>
                  </a>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sable text-encre-muted flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-encre-muted font-body uppercase tracking-wider">Horaires</p>
                      <p className="text-sm text-encre">Lun–Sam, 8h–18h</p>
                    </div>
                  </div>
                </div>
              </div>

              <InfoBox type="warning">
                Conservez la <strong>preuve d'expédition</strong> de votre retour jusqu'à
                réception du remboursement. En cas de perte du colis en transit,
                ce document sera indispensable.
              </InfoBox>
            </div>
          </div>
        </section>

        {/* ── §7 FAQ ──────────────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-or mb-3">
              <span className="w-6 h-px bg-or inline-block" />
              Questions fréquentes
              <span className="w-6 h-px bg-or inline-block" />
            </span>
            <h2 className="font-display text-3xl font-bold text-encre mt-1">
              Tout ce que vous devez savoir
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_RETOURS.map((item, i) => (
              <FaqItem
                key={i}
                q={item.q}
                a={item.a}
                open={faqOpen === i}
                onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
              />
            ))}
          </div>
        </section>

        {/* ── §8 CTA final ────────────────────────────────────────────── */}
        <section className="bg-encre rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-or/8 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="w-14 h-14 bg-or/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="w-7 h-7 text-or" />
            </div>
            <h2 className="font-display text-3xl font-bold text-ivoire mb-3">
              Pas encore convaincu ?
            </h2>
            <p className="text-ivoire/60 font-body text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Chez LibraMali, chaque client compte. Si vous n'êtes pas 100% satisfait,
              nous faisons tout pour arranger la situation. C'est notre promesse.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/catalogue" className="btn-gold px-8 py-3">
                Parcourir le catalogue
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="mailto:contact@libramali.ml"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 border border-white/20
                           rounded-full text-ivoire text-sm font-medium hover:bg-white/20 transition-colors">
                <Mail className="w-4 h-4" />
                Nous écrire
              </a>
            </div>

            {/* Liens légaux */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs font-body">
              <Link href="/cgv" className="text-ivoire/40 hover:text-ivoire/70 transition-colors">
                Conditions générales de vente
              </Link>
              <span className="text-ivoire/20">·</span>
              <Link href="/confidentialite" className="text-ivoire/40 hover:text-ivoire/70 transition-colors">
                Confidentialité
              </Link>
              <span className="text-ivoire/20">·</span>
              <Link href="/mentions-legales" className="text-ivoire/40 hover:text-ivoire/70 transition-colors">
                Mentions légales
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
