"use client";
// src/app/(main)/confidentialite/page.tsx
import { useState } from "react";
import Link from "next/link";
import {
  Shield, Lock, Eye, Database, UserCheck,
  Mail, Globe, AlertCircle, ChevronRight,
  FileText, RefreshCcw, Phone, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Sommaire ────────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "collecte",       label: "Données collectées",          icon: Database },
  { id: "utilisation",    label: "Utilisation des données",     icon: Eye },
  { id: "partage",        label: "Partage des données",         icon: Globe },
  { id: "securite",       label: "Sécurité",                    icon: Lock },
  { id: "droits",         label: "Vos droits",                  icon: UserCheck },
  { id: "cookies",        label: "Cookies",                     icon: FileText },
  { id: "conservation",   label: "Conservation",                icon: RefreshCcw },
  { id: "contact",        label: "Nous contacter",              icon: Mail },
];

/* ── Composant bloc section ──────────────────────────────────────────────── */
function Section({
  id, icon: Icon, title, children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sable">
        <div className="w-10 h-10 rounded-xl bg-or/10 text-or flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="font-display text-2xl font-bold text-encre">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-encre-muted font-body leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/* ── Composant sous-titre ────────────────────────────────────────────────── */
function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-semibold text-encre text-base mt-6 mb-2">
      {children}
    </h3>
  );
}

/* ── Composant liste ─────────────────────────────────────────────────────── */
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-0">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-or shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Composant tableau ───────────────────────────────────────────────────── */
function DataTable({ rows }: { rows: { type: string; exemple: string; base: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sable mt-4">
      <table className="w-full text-sm font-body">
        <thead className="bg-sable/40">
          <tr>
            {["Type de donnée", "Exemple", "Base légale"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-encre uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sable">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-ivoire transition-colors">
              <td className="px-4 py-3 font-medium text-encre">{row.type}</td>
              <td className="px-4 py-3 text-encre-muted">{row.exemple}</td>
              <td className="px-4 py-3">
                <span className="inline-block px-2 py-0.5 bg-or/10 text-or text-xs font-medium rounded-full">
                  {row.base}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Composant encadré info ──────────────────────────────────────────────── */
function InfoBox({ type = "info", children }: { type?: "info" | "warning"; children: React.ReactNode }) {
  return (
    <div className={cn(
      "flex gap-3 p-4 rounded-xl border text-sm font-body mt-4",
      type === "warning"
        ? "bg-amber-50 border-amber-200 text-amber-800"
        : "bg-blue-50 border-blue-200 text-blue-800"
    )}>
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function ConfidentialitePage() {
  const [activeSection, setActiveSection] = useState("collecte");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-ivoire">

      {/* ── En-tête ────────────────────────────────────────────────────── */}
      <header className="bg-encre text-ivoire py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-or/8 blur-3xl" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Fil d'Ariane */}
          <nav className="flex items-center gap-2 text-xs text-ivoire/50 font-body mb-8">
            <Link href="/" className="hover:text-ivoire transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ivoire/80">Politique de confidentialité</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-or/20 border border-or/30 flex items-center justify-center shrink-0 mt-1">
              <Shield className="w-8 h-8 text-or" />
            </div>
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-ivoire mb-3">
                Politique de confidentialité
              </h1>
              <p className="text-ivoire/60 font-body text-base leading-relaxed max-w-2xl">
                Chez LibraMali, la protection de votre vie privée est une priorité absolue.
                Ce document vous explique de façon transparente quelles données nous collectons,
                pourquoi, et comment vous pouvez les contrôler.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-5">
                <span className="flex items-center gap-1.5 text-xs text-ivoire/50 font-body">
                  <FileText className="w-3.5 h-3.5" />
                  Dernière mise à jour : 1er janvier 2025
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ivoire/50 font-body">
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Version 2.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Corps ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-start">

          {/* ── Sommaire fixe ────────────────────────────────────────── */}
          <aside className="hidden lg:block sticky top-24">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-xs font-bold text-encre uppercase tracking-wider mb-4 px-1">
                Sommaire
              </p>
              <nav className="space-y-0.5">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-body transition-all text-left",
                      activeSection === id
                        ? "bg-encre text-ivoire font-medium"
                        : "text-encre-muted hover:bg-sable/60 hover:text-encre"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>

              {/* Contact rapide */}
              <div className="mt-5 pt-5 border-t border-sable">
                <p className="text-xs text-encre-muted font-body mb-3">Des questions ?</p>
                <a href="mailto:dpo@libramali.ml"
                  className="flex items-center gap-2 text-xs text-or hover:text-or-dark font-medium transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  dpo@libramali.ml
                </a>
              </div>
            </div>
          </aside>

          {/* ── Contenu ──────────────────────────────────────────────── */}
          <main className="space-y-14">

            {/* ── §1 Données collectées ─────────────────────────────── */}
            <Section id="collecte" icon={Database} title="Données que nous collectons">
              <p>
                LibraMali collecte uniquement les données strictement nécessaires au bon fonctionnement
                de nos services. Nous appliquons le principe de <strong className="text-encre">minimisation des données</strong> :
                nous ne collectons jamais plus que ce dont nous avons besoin.
              </p>

              <SubTitle>1.1 Données que vous nous fournissez directement</SubTitle>
              <DataTable rows={[
                { type: "Identité",          exemple: "Nom, prénom",                     base: "Contrat" },
                { type: "Contact",           exemple: "Adresse email, téléphone",         base: "Contrat" },
                { type: "Adresse",           exemple: "Adresse de livraison",             base: "Contrat" },
                { type: "Avis clients",      exemple: "Notes et commentaires",            base: "Consentement" },
                { type: "Communications",    exemple: "Messages au service client",       base: "Intérêt légitime" },
              ]} />

              <SubTitle>1.2 Données collectées automatiquement</SubTitle>
              <DataTable rows={[
                { type: "Navigation",        exemple: "Pages visitées, durée de session", base: "Intérêt légitime" },
                { type: "Appareil",          exemple: "Type de navigateur, système OS",   base: "Intérêt légitime" },
                { type: "Réseau",            exemple: "Adresse IP (anonymisée)",          base: "Intérêt légitime" },
                { type: "Transactions",      exemple: "Historique des commandes",         base: "Contrat" },
                { type: "Préférences",       exemple: "Favoris, historique de recherche", base: "Consentement" },
              ]} />

              <SubTitle>1.3 Données que nous ne collectons jamais</SubTitle>
              <BulletList items={[
                "Données bancaires complètes (numéro de carte, CVV — traitement délégué à nos partenaires de paiement)",
                "Données biométriques",
                "Données de santé",
                "Données d'origine ethnique ou d'opinions politiques",
                "Données relatives aux mineurs de moins de 16 ans sans consentement parental",
              ]} />

              <InfoBox>
                <strong>Mineurs :</strong> nos services sont destinés aux personnes âgées de 16 ans et plus.
                Si vous êtes le parent ou tuteur légal d'un mineur ayant créé un compte, contactez-nous
                à <a href="mailto:dpo@libramali.ml" className="underline">dpo@libramali.ml</a> pour
                procéder à la suppression du compte.
              </InfoBox>
            </Section>

            {/* ── §2 Utilisation ────────────────────────────────────── */}
            <Section id="utilisation" icon={Eye} title="Comment nous utilisons vos données">
              <p>
                Chaque donnée que nous collectons a une finalité précise et documentée.
                Nous n'utilisons jamais vos données à des fins incompatibles avec celles
                pour lesquelles elles ont été collectées.
              </p>

              <SubTitle>2.1 Exécution de votre commande</SubTitle>
              <BulletList items={[
                "Traitement et confirmation de vos commandes",
                "Organisation et suivi des livraisons",
                "Émission de factures et devis PDF",
                "Communication sur le statut de votre commande par email",
                "Gestion des retours et remboursements",
              ]} />

              <SubTitle>2.2 Gestion de votre compte</SubTitle>
              <BulletList items={[
                "Création et authentification sécurisée (OTP par email, sans mot de passe)",
                "Personnalisation de votre espace client",
                "Sauvegarde de vos adresses de livraison",
                "Historique de vos commandes et avis",
                "Gestion de votre liste de favoris",
              ]} />

              <SubTitle>2.3 Amélioration de nos services</SubTitle>
              <BulletList items={[
                "Analyse des tendances d'achat pour enrichir notre catalogue",
                "Détection et prévention des fraudes",
                "Amélioration de l'expérience de navigation sur notre site",
                "Tests et améliorations techniques",
              ]} />

              <SubTitle>2.4 Communication marketing (avec votre consentement)</SubTitle>
              <BulletList items={[
                "Newsletter avec nos nouveautés et offres exclusives",
                "Notifications sur les promotions temporaires",
                "Recommandations personnalisées basées sur vos achats",
              ]} />

              <InfoBox type="warning">
                <strong>Automatisation :</strong> nous n'utilisons pas de prise de décision entièrement
                automatisée ayant un effet juridique ou significatif sur vous. Toutes les décisions
                importantes (ex. : résolution de litige) impliquent une intervention humaine.
              </InfoBox>
            </Section>

            {/* ── §3 Partage ────────────────────────────────────────── */}
            <Section id="partage" icon={Globe} title="Partage de vos données">
              <p>
                LibraMali ne vend, ne loue et ne commercialise jamais vos données personnelles à des tiers.
                Nous partageons uniquement les données strictement nécessaires avec les prestataires
                qui nous aident à vous servir.
              </p>

              <SubTitle>3.1 Prestataires de services (sous-traitants)</SubTitle>
              <DataTable rows={[
                { type: "Livraison",           exemple: "Nom + adresse de livraison",    base: "Contrat" },
                { type: "Paiement Mobile",      exemple: "Référence de transaction",     base: "Contrat" },
                { type: "Email transactionnel", exemple: "Adresse email uniquement",     base: "Intérêt légitime" },
                { type: "Hébergement",          exemple: "Données chiffrées côté serveur",base: "Intérêt légitime" },
              ]} />

              <p className="mt-4">
                Tous nos sous-traitants sont contractuellement tenus de respecter la confidentialité
                de vos données et de ne les utiliser qu'aux fins prévues dans nos accords.
              </p>

              <SubTitle>3.2 Autorités légales</SubTitle>
              <p>
                Nous pouvons divulguer des données à des autorités compétentes (judiciaires, fiscales,
                réglementaires) uniquement lorsque la loi malienne ou internationale nous y oblige,
                et dans les limites strictes de cette obligation légale.
              </p>

              <SubTitle>3.3 Transferts d'entreprise</SubTitle>
              <p>
                En cas de fusion, acquisition ou cession d'actifs, vos données pourraient être
                transférées au repreneur. Vous en seriez notifié au préalable et conserveriez
                l'intégralité de vos droits.
              </p>

              <InfoBox>
                <strong>Transferts internationaux :</strong> si certains de nos prestataires sont établis
                hors du Mali, nous veillons à ce que des garanties appropriées protègent vos données
                lors de ces transferts (clauses contractuelles types, certification).
              </InfoBox>
            </Section>

            {/* ── §4 Sécurité ───────────────────────────────────────── */}
            <Section id="securite" icon={Lock} title="Sécurité de vos données">
              <p>
                La sécurité de vos données est une préoccupation technique et organisationnelle majeure
                pour LibraMali. Nous mettons en œuvre des mesures appropriées au regard des risques.
              </p>

              <SubTitle>4.1 Mesures techniques</SubTitle>
              <BulletList items={[
                "Chiffrement TLS 1.3 de toutes les communications entre votre navigateur et nos serveurs",
                "Stockage des mots de passe et tokens OTP avec hachage BCrypt (irréversible)",
                "Authentification sans mot de passe par code OTP à usage unique (valide 5 minutes)",
                "Tokens JWT à durée de vie limitée avec mécanisme de rafraîchissement sécurisé",
                "Blocage automatique après 5 tentatives d'authentification erronées (protection brute-force)",
                "Sauvegardes chiffrées quotidiennes de l'ensemble des données",
                "Accès aux données de production restreint et journalisé",
              ]} />

              <SubTitle>4.2 Mesures organisationnelles</SubTitle>
              <BulletList items={[
                "Accès aux données personnelles limité aux employés qui en ont besoin (principe du moindre privilège)",
                "Formation régulière de notre équipe aux bonnes pratiques de sécurité",
                "Procédure documentée de gestion des incidents de sécurité",
                "Revue périodique des accès et des droits",
              ]} />

              <SubTitle>4.3 En cas de violation de données</SubTitle>
              <p>
                En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits
                et libertés, nous nous engageons à vous en informer dans les meilleurs délais,
                conformément à nos obligations légales. Nous prendrons immédiatement les mesures
                correctives nécessaires.
              </p>

              <InfoBox type="warning">
                <strong>Vigilance :</strong> LibraMali ne vous demandera jamais votre code OTP, votre
                mot de passe ou vos informations de paiement par téléphone ou email. En cas de
                sollicitation suspecte, contactez-nous immédiatement.
              </InfoBox>
            </Section>

            {/* ── §5 Droits ─────────────────────────────────────────── */}
            <Section id="droits" icon={UserCheck} title="Vos droits sur vos données">
              <p>
                Vous disposez de droits étendus sur vos données personnelles. LibraMali s'engage
                à les respecter et à traiter toute demande dans un délai de <strong className="text-encre">30 jours</strong>.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                {[
                  {
                    titre:  "Droit d'accès",
                    desc:   "Obtenir une copie de toutes les données que nous détenons sur vous.",
                    action: "Mon compte → Télécharger mes données",
                  },
                  {
                    titre:  "Droit de rectification",
                    desc:   "Corriger vos données inexactes ou incomplètes à tout moment.",
                    action: "Mon compte → Mon profil",
                  },
                  {
                    titre:  "Droit à l'effacement",
                    desc:   "Demander la suppression de votre compte et de vos données.",
                    action: "Email à dpo@libramali.ml",
                  },
                  {
                    titre:  "Droit à la portabilité",
                    desc:   "Recevoir vos données dans un format structuré et réutilisable.",
                    action: "Email à dpo@libramali.ml",
                  },
                  {
                    titre:  "Droit d'opposition",
                    desc:   "Vous opposer au traitement à des fins de marketing ou de profilage.",
                    action: "Paramètres de notification",
                  },
                  {
                    titre:  "Droit de limitation",
                    desc:   "Suspendre temporairement le traitement de vos données.",
                    action: "Email à dpo@libramali.ml",
                  },
                ].map((droit, i) => (
                  <div key={i} className="p-5 bg-white rounded-2xl shadow-card border border-sable/50">
                    <h4 className="font-display font-semibold text-encre text-sm mb-2">{droit.titre}</h4>
                    <p className="text-xs text-encre-muted font-body leading-relaxed mb-3">{droit.desc}</p>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-or">
                      <span className="w-4 h-px bg-or" />
                      {droit.action}
                    </div>
                  </div>
                ))}
              </div>

              <SubTitle>5.1 Comment exercer vos droits</SubTitle>
              <p>
                Pour exercer l'un de ces droits, vous pouvez :
              </p>
              <BulletList items={[
                "Vous connecter à votre espace client (Mon compte) pour les droits accessibles en libre-service",
                "Envoyer un email à notre Délégué à la Protection des Données (DPO) : dpo@libramali.ml",
                "Envoyer un courrier à : LibraMali — DPO, ACI 2000, Bamako, Mali",
              ]} />
              <p className="mt-4">
                Nous pourrons vous demander de prouver votre identité avant de traiter votre demande.
                En cas de réponse insatisfaisante, vous avez le droit de saisir l'autorité compétente.
              </p>
            </Section>

            {/* ── §6 Cookies ────────────────────────────────────────── */}
            <Section id="cookies" icon={FileText} title="Cookies et traceurs">
              <p>
                Un cookie est un petit fichier texte déposé sur votre terminal lors de votre visite.
                LibraMali utilise des cookies dans un but fonctionnel et, avec votre accord, analytique.
              </p>

              <SubTitle>6.1 Cookies strictement nécessaires (toujours actifs)</SubTitle>
              <DataTable rows={[
                { type: "Session d'authentification", exemple: "libramali-auth",      base: "Nécessaire" },
                { type: "Panier d'achat",             exemple: "cart-store",          base: "Nécessaire" },
                { type: "Préférences de langue",      exemple: "locale",              base: "Nécessaire" },
                { type: "Sécurité CSRF",              exemple: "csrf-token",          base: "Nécessaire" },
              ]} />

              <SubTitle>6.2 Cookies analytiques (avec votre consentement)</SubTitle>
              <DataTable rows={[
                { type: "Pages visitées",      exemple: "Pages produit, catalogue",  base: "Consentement" },
                { type: "Source de trafic",    exemple: "Accès direct, lien externe",base: "Consentement" },
                { type: "Durée de session",    exemple: "Temps passé sur le site",   base: "Consentement" },
              ]} />
              <p className="mt-4">
                Nous n'utilisons <strong className="text-encre">aucun cookie publicitaire</strong> tiers
                (Google Ads, Facebook Pixel, etc.). Les outils d'analyse que nous utilisons
                sont configurés en mode respect de la vie privée (anonymisation de l'IP, pas de
                partage avec des tiers publicitaires).
              </p>

              <SubTitle>6.3 Gestion de vos préférences</SubTitle>
              <p>
                Vous pouvez gérer les cookies à tout moment :
              </p>
              <BulletList items={[
                "Via la bannière de consentement accessible en bas de chaque page",
                "Dans les paramètres de votre navigateur (suppression, blocage)",
                "Via notre centre de préférences cookies (lien en pied de page)",
              ]} />

              <InfoBox>
                Le refus des cookies analytiques n'affecte pas votre accès aux services LibraMali
                ni votre expérience d'achat.
              </InfoBox>
            </Section>

            {/* ── §7 Conservation ───────────────────────────────────── */}
            <Section id="conservation" icon={RefreshCcw} title="Durée de conservation">
              <p>
                Nous ne conservons vos données que le temps strictement nécessaire aux finalités
                pour lesquelles elles ont été collectées, en tenant compte de nos obligations légales.
              </p>

              <DataTable rows={[
                { type: "Données de compte",         exemple: "Profil, adresses",          base: "Durée du compte + 3 ans" },
                { type: "Commandes & factures",      exemple: "Historique complet",         base: "10 ans (obligation légale)" },
                { type: "Données de paiement",       exemple: "Référence de transaction",  base: "5 ans" },
                { type: "Logs de connexion",         exemple: "Horodatage, IP",            base: "12 mois" },
                { type: "Avis et commentaires",      exemple: "Notes, textes",             base: "Durée du compte" },
                { type: "Favoris",                   exemple: "IDs produits",              base: "Durée du compte" },
                { type: "Cookies analytiques",       exemple: "Données agrégées",          base: "13 mois maximum" },
                { type: "Données de newsletter",     exemple: "Email, préférences",        base: "Jusqu'au désabonnement" },
              ]} />

              <p className="mt-4">
                À l'issue de ces délais, vos données sont soit supprimées de manière irréversible,
                soit anonymisées pour des finalités statistiques. Les données anonymisées ne
                permettent plus de vous identifier.
              </p>

              <SubTitle>7.1 Suppression de compte</SubTitle>
              <p>
                Lorsque vous demandez la suppression de votre compte, nous procédons à la suppression
                de vos données dans un délai de <strong className="text-encre">30 jours</strong>,
                sous réserve de nos obligations de conservation légale (notamment pour les factures).
                Les données de transactions sont conservées 10 ans à des fins comptables et fiscales.
              </p>
            </Section>

            {/* ── §8 Contact ────────────────────────────────────────── */}
            <Section id="contact" icon={Mail} title="Nous contacter">
              <p>
                Pour toute question relative à la présente politique ou à l'exercice de vos droits,
                vous pouvez contacter notre équipe par les moyens suivants.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                {[
                  {
                    icon:    <Mail className="w-5 h-5" />,
                    titre:   "Email (DPO)",
                    val:     "dpo@libramali.ml",
                    desc:    "Pour toute demande relative à vos données. Réponse sous 30 jours.",
                    href:    "mailto:dpo@libramali.ml",
                  },
                  {
                    icon:    <Phone className="w-5 h-5" />,
                    titre:   "Téléphone",
                    val:     "+223 70 00 00 00",
                    desc:    "Service client disponible Lun–Sam, 8h–18h.",
                    href:    "tel:+22370000000",
                  },
                  {
                    icon:    <MapPin className="w-5 h-5" />,
                    titre:   "Courrier",
                    val:     "ACI 2000, Bamako, Mali",
                    desc:    "LibraMali — À l'attention du DPO.",
                    href:    undefined,
                  },
                  {
                    icon:    <Globe className="w-5 h-5" />,
                    titre:   "Formulaire en ligne",
                    val:     "Contact →",
                    desc:    "Via notre page de contact pour une prise en charge rapide.",
                    href:    "/contact",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl shadow-card border border-sable/50">
                    <div className="w-10 h-10 rounded-xl bg-or/10 text-or flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider mb-0.5">
                        {item.titre}
                      </p>
                      {item.href ? (
                        <a href={item.href}
                          className="font-medium text-encre hover:text-or transition-colors text-sm">
                          {item.val}
                        </a>
                      ) : (
                        <p className="font-medium text-encre text-sm">{item.val}</p>
                      )}
                      <p className="text-xs text-encre-muted font-body mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Pied de page document ──────────────────────────────── */}
            <div className="pt-10 border-t border-sable">
              <div className="p-6 bg-sable/40 rounded-2xl space-y-3">
                <h3 className="font-display font-semibold text-encre text-base">
                  À propos de ce document
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 text-xs font-body text-encre-muted">
                  <div>
                    <p className="font-semibold text-encre mb-1">Responsable du traitement</p>
                    <p>LibraMali SARL<br />ACI 2000, Bamako, Mali<br />contact@libramali.ml</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Délégué à la protection des données</p>
                    <p>dpo@libramali.ml<br />+223 70 00 00 00</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Droit applicable</p>
                    <p>Loi n°2013-015 du 21 mai 2013<br />portant protection des données<br />à caractère personnel au Mali</p>
                  </div>
                </div>
                <p className="text-xs text-encre-muted font-body pt-2 border-t border-sable">
                  LibraMali se réserve le droit de modifier la présente politique à tout moment.
                  En cas de modification substantielle, vous serez notifié par email au moins
                  15 jours avant l'entrée en vigueur des nouvelles dispositions.
                  La poursuite de l'utilisation de nos services après cette notification vaut acceptation.
                </p>
              </div>

              {/* Liens annexes */}
              <div className="flex flex-wrap gap-4 mt-6 text-sm font-body">
                <Link href="/mentions-legales"
                  className="text-encre-muted hover:text-or transition-colors">
                  Mentions légales
                </Link>
                <span className="text-sable-dark">·</span>
                <Link href="/cgv"
                  className="text-encre-muted hover:text-or transition-colors">
                  Conditions générales de vente
                </Link>
                <span className="text-sable-dark">·</span>
                <Link href="/catalogue"
                  className="text-encre-muted hover:text-or transition-colors">
                  Retour au catalogue
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
