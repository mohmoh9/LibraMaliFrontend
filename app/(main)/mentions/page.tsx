"use client";
// src/app/(main)/mentions-legales/page.tsx
import { useState } from "react";
import Link from "next/link";
import {
  Scale, Building2, Globe, Mail, Phone,
  MapPin, ChevronRight, FileText, Server,
  Shield, AlertCircle, BookOpen, ExternalLink,
  Landmark, Printer, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Sommaire ────────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "editeur",         label: "Éditeur du site",              icon: Building2 },
  { id: "directeur",       label: "Direction de publication",     icon: BookOpen },
  { id: "hebergement",     label: "Hébergement",                  icon: Server },
  { id: "propriete",       label: "Propriété intellectuelle",     icon: Scale },
  { id: "responsabilite",  label: "Limitation de responsabilité", icon: Shield },
  { id: "donnees",         label: "Données personnelles",         icon: FileText },
  { id: "cookies",         label: "Cookies",                      icon: Globe },
  { id: "droit",           label: "Droit applicable",             icon: Landmark },
  { id: "contact",         label: "Contact",                      icon: Mail },
];

/* ── Composants réutilisables ────────────────────────────────────────────── */
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

function InfoRow({ label, value, href, mono = false }: {
  label: string; value: string; href?: string; mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-sable/50 last:border-0">
      <span className="text-[11px] font-bold text-encre uppercase tracking-wider shrink-0 sm:w-44">
        {label}
      </span>
      {href ? (
        <a href={href}
          className={cn("hover:text-or transition-colors flex items-center gap-1 group", mono && "font-mono")}>
          {value}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ) : (
        <span className={cn("text-encre", mono && "font-mono")}>{value}</span>
      )}
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-semibold text-encre text-base mt-6 mb-2">
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-or shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoBox({ type = "info", children }: {
  type?: "info" | "warning"; children: React.ReactNode;
}) {
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
export default function MentionsLegalesPage() {
  const [activeSection, setActiveSection] = useState("editeur");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-ivoire">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <header className="bg-encre text-ivoire py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-or/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-or/5 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Fil d'Ariane */}
          <nav className="flex items-center gap-2 text-xs text-ivoire/50 font-body mb-8">
            <Link href="/" className="hover:text-ivoire transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ivoire/80">Mentions légales</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-or/20 border border-or/30 flex items-center justify-center shrink-0 mt-1">
              <Scale className="w-8 h-8 text-or" />
            </div>
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-ivoire mb-3">
                Mentions légales
              </h1>
              <p className="text-ivoire/60 font-body text-base leading-relaxed max-w-2xl">
                Conformément aux dispositions de la loi n°2013-015 du 21 mai 2013 portant
                protection des données à caractère personnel en République du Mali, et aux
                textes applicables en matière de commerce électronique, nous vous présentons
                les informations légales relatives au site <strong className="text-ivoire">libramali.ml</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-5">
                <span className="flex items-center gap-1.5 text-xs text-ivoire/50 font-body">
                  <FileText className="w-3.5 h-3.5" />
                  Mis à jour le 1er janvier 2025
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ivoire/50 font-body">
                  <Printer className="w-3.5 h-3.5" />
                  <button
                    onClick={() => window.print()}
                    className="hover:text-ivoire transition-colors cursor-pointer"
                  >
                    Imprimer cette page
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Corps ───────────────────────────────────────────────────────── */}
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

              {/* Lien impression */}
              <div className="mt-5 pt-5 border-t border-sable">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 text-xs text-encre-muted hover:text-or font-medium transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer / PDF
                </button>
              </div>
            </div>

            {/* Note légale rapide */}
            <div className="mt-4 p-4 bg-or/10 border border-or/20 rounded-2xl">
              <p className="text-xs font-bold text-or mb-2">Référence légale</p>
              <p className="text-xs text-encre-muted font-body leading-relaxed">
                Loi n°2013-015 du 21 mai 2013 — Protection des données à caractère personnel, Mali.
              </p>
            </div>
          </aside>

          {/* ── Contenu ──────────────────────────────────────────────── */}
          <main className="space-y-14">

            {/* ── §1 Éditeur ────────────────────────────────────────── */}
            <Section id="editeur" icon={Building2} title="Éditeur du site">
              <p>
                Le présent site internet accessible à l'adresse{" "}
                <a href="https://libramali.ml" className="text-or hover:underline font-medium">
                  https://libramali.ml
                </a>{" "}
                est édité par la société <strong className="text-encre">LibraMali SARL</strong>,
                société à responsabilité limitée de droit malien.
              </p>

              <div className="bg-white rounded-2xl shadow-card border border-sable/50 p-6 mt-4">
                <InfoRow label="Raison sociale"    value="LibraMali SARL" />
                <InfoRow label="Forme juridique"   value="Société à Responsabilité Limitée (SARL)" />
                <InfoRow label="Capital social"    value="10 000 000 FCFA" />
                <InfoRow label="RCCM"              value="BKO-2023-B-1234" mono />
                <InfoRow label="Numéro fiscal"     value="123456789ML" mono />
                <InfoRow label="N° INPS"           value="0123456789" mono />
                <InfoRow label="Siège social"      value="ACI 2000, Hamdallaye, Bamako — Mali" />
                <InfoRow label="Téléphone"         value="+223 70 00 00 00" href="tel:+22370000000" />
                <InfoRow label="Email"             value="contact@libramali.ml" href="mailto:contact@libramali.ml" />
                <InfoRow label="Site web"          value="https://libramali.ml" href="https://libramali.ml" />
              </div>

              <p className="mt-4">
                LibraMali est une plateforme de commerce électronique spécialisée dans la vente
                de livres neufs, opérant principalement au Mali avec une livraison couvrant
                l'ensemble du territoire national.
              </p>
            </Section>

            {/* ── §2 Directeur de publication ───────────────────────── */}
            <Section id="directeur" icon={BookOpen} title="Direction de publication">
              <p>
                Le directeur de la publication du site <strong className="text-encre">libramali.ml</strong> est
                responsable de l'ensemble du contenu éditorial publié sur la plateforme.
              </p>

              <div className="bg-white rounded-2xl shadow-card border border-sable/50 p-6 mt-4">
                <InfoRow label="Directeur de publication" value="Moussa Konaté" />
                <InfoRow label="Qualité"                  value="Gérant — LibraMali SARL" />
                <InfoRow label="Email de contact"         value="direction@libramali.ml" href="mailto:direction@libramali.ml" />
              </div>

              <SubTitle>Responsabilité éditoriale</SubTitle>
              <p>
                Le directeur de publication est responsable au sens de la loi des contenus
                mis en ligne sur le site. Il veille à la conformité des informations publiées
                avec la législation malienne en vigueur et les droits des tiers.
              </p>

              <SubTitle>Contenus générés par les utilisateurs</SubTitle>
              <p>
                Les avis, commentaires et évaluations publiés par les utilisateurs relèvent
                de leur propre responsabilité. LibraMali se réserve le droit de modérer,
                modifier ou supprimer tout contenu contraire aux présentes mentions légales,
                aux conditions générales d'utilisation ou à la législation en vigueur.
              </p>

              <InfoBox>
                Pour signaler un contenu illicite ou inapproprié, contactez-nous à{" "}
                <a href="mailto:moderation@libramali.ml" className="underline font-medium">
                  moderation@libramali.ml
                </a>
              </InfoBox>
            </Section>

            {/* ── §3 Hébergement ────────────────────────────────────── */}
            <Section id="hebergement" icon={Server} title="Hébergement">
              <p>
                Le site et ses données sont hébergés sur une infrastructure sécurisée.
                Les informations relatives à l'hébergeur sont les suivantes.
              </p>

              <SubTitle>Serveurs applicatifs (Frontend)</SubTitle>
              <div className="bg-white rounded-2xl shadow-card border border-sable/50 p-6">
                <InfoRow label="Société"       value="Vercel Inc." />
                <InfoRow label="Adresse"       value="340 S Lemon Ave #4133, Walnut, CA 91789 — États-Unis" />
                <InfoRow label="Site web"      value="https://vercel.com" href="https://vercel.com" />
                <InfoRow label="Technologie"   value="Next.js / Edge Network" />
              </div>

              <SubTitle>Serveurs backend & bases de données</SubTitle>
              <div className="bg-white rounded-2xl shadow-card border border-sable/50 p-6 mt-4">
                <InfoRow label="Société"       value="Amazon Web Services EMEA SARL" />
                <InfoRow label="Région"        value="Europe (Paris) — eu-west-3" />
                <InfoRow label="Adresse"       value="38 Avenue John F. Kennedy, L-1855 Luxembourg" />
                <InfoRow label="Site web"      value="https://aws.amazon.com" href="https://aws.amazon.com" />
                <InfoRow label="Services"      value="EC2, RDS PostgreSQL, S3" />
              </div>

              <InfoBox>
                Conformément à nos engagements en matière de protection des données, les données
                hébergées hors du Mali bénéficient de garanties contractuelles adéquates
                (clauses contractuelles types, DPA). Consultez notre{" "}
                <Link href="/confidentialite" className="underline font-medium">
                  politique de confidentialité
                </Link>{" "}
                pour plus de détails.
              </InfoBox>

              <SubTitle>Disponibilité du service</SubTitle>
              <p>
                LibraMali s'efforce de maintenir une disponibilité maximale du service.
                Toutefois, des interruptions peuvent survenir pour des raisons de maintenance,
                de mise à jour ou d'incidents techniques. Nous nous engageons à en informer
                les utilisateurs dans la mesure du possible via nos canaux de communication.
              </p>
            </Section>

            {/* ── §4 Propriété intellectuelle ───────────────────────── */}
            <Section id="propriete" icon={Scale} title="Propriété intellectuelle">
              <p>
                L'ensemble des éléments constituant le site{" "}
                <strong className="text-encre">libramali.ml</strong> — sans que cette liste
                soit exhaustive — est la propriété exclusive de LibraMali SARL ou fait l'objet
                d'une autorisation d'utilisation accordée à LibraMali SARL par les titulaires
                des droits concernés.
              </p>

              <SubTitle>4.1 Éléments protégés</SubTitle>
              <BulletList items={[
                "La marque « LibraMali » et son logotype déposés auprès des autorités compétentes",
                "La charte graphique, les couleurs, typographies et l'identité visuelle de la plateforme",
                "Le code source du site internet (frontend et backend)",
                "Les textes éditoriaux, descriptions de produits et contenus rédigés par nos équipes",
                "Les photographies et illustrations originales produites pour LibraMali",
                "La structure, l'organisation et l'architecture du site",
                "Les bases de données constituées par LibraMali",
              ]} />

              <SubTitle>4.2 Droits des éditeurs tiers</SubTitle>
              <p>
                Les couvertures de livres, titres d'ouvrages, noms d'auteurs et extraits
                présentés sur la plateforme sont la propriété de leurs éditeurs et auteurs
                respectifs. LibraMali dispose des droits nécessaires pour les reproduire
                dans le cadre de son activité commerciale de revente.
              </p>

              <SubTitle>4.3 Utilisations autorisées</SubTitle>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation
                de tout ou partie des éléments du site, quel que soit le moyen ou le procédé
                utilisé, est interdite, sauf autorisation écrite préalable de LibraMali SARL.
              </p>
              <p className="mt-2">
                Est autorisée, sans demande préalable, la citation courte d'extraits du site
                à des fins d'information ou d'illustration, à condition de mentionner la source
                avec un lien vers le site original.
              </p>

              <SubTitle>4.4 Signalement de violation</SubTitle>
              <p>
                Si vous estimez que votre propriété intellectuelle est reproduite sans droit
                sur notre site, merci de nous contacter à{" "}
                <a href="mailto:legal@libramali.ml" className="text-or hover:underline">
                  legal@libramali.ml
                </a>{" "}
                avec les éléments permettant d'identifier le contenu litigieux. Nous traiterons
                votre demande dans les meilleurs délais.
              </p>

              <InfoBox type="warning">
                <strong>Contrefaçon :</strong> toute reproduction non autorisée d'éléments protégés
                peut constituer une contrefaçon sanctionnée par la législation malienne et internationale.
                LibraMali se réserve le droit d'engager les poursuites judiciaires appropriées.
              </InfoBox>
            </Section>

            {/* ── §5 Limitation de responsabilité ───────────────────── */}
            <Section id="responsabilite" icon={Shield} title="Limitation de responsabilité">
              <SubTitle>5.1 Exactitude des informations</SubTitle>
              <p>
                LibraMali s'efforce de fournir des informations exactes et à jour sur son site.
                Toutefois, nous ne pouvons garantir l'exactitude, la complétude ou l'actualité
                de toutes les informations publiées, notamment les prix, disponibilités et
                caractéristiques des produits tiers.
              </p>
              <p className="mt-2">
                En cas d'erreur manifeste affectant une commande (prix erroné, mauvaise
                description), LibraMali se réserve le droit d'annuler la commande et d'en
                informer l'acheteur dans les meilleurs délais.
              </p>

              <SubTitle>5.2 Disponibilité du service</SubTitle>
              <p>
                LibraMali ne peut être tenu responsable de toute interruption du service,
                qu'elle soit due à une maintenance programmée, à un incident technique, à
                une défaillance du réseau internet ou à tout événement hors de notre contrôle.
              </p>

              <SubTitle>5.3 Liens hypertextes</SubTitle>
              <p>
                Le site libramali.ml peut contenir des liens vers des sites tiers. Ces liens
                sont fournis à titre informatif. LibraMali n'exerce aucun contrôle sur ces
                sites et ne peut être tenu responsable de leur contenu, de leur politique
                de confidentialité ou de leurs pratiques.
              </p>
              <p className="mt-2">
                La mise en place d'un lien hypertexte vers le site libramali.ml est soumise
                à notre autorisation préalable. Contactez-nous à{" "}
                <a href="mailto:partenariats@libramali.ml" className="text-or hover:underline">
                  partenariats@libramali.ml
                </a>.
              </p>

              <SubTitle>5.4 Force majeure</SubTitle>
              <p>
                LibraMali ne pourra être tenu responsable des dommages résultant d'un cas
                de force majeure tel que défini par le droit malien : événements imprévisibles,
                irrésistibles et extérieurs à notre volonté (catastrophes naturelles, pandémies,
                troubles civils, coupures d'infrastructures, etc.).
              </p>

              <SubTitle>5.5 Utilisation frauduleuse</SubTitle>
              <p>
                L'utilisateur est seul responsable de l'utilisation qu'il fait du site et
                des informations qu'il y communique. Toute utilisation frauduleuse, abusive
                ou contraire à l'ordre public engage la seule responsabilité de l'utilisateur
                concerné.
              </p>

              <InfoBox type="warning">
                Les présentes limitations s'appliquent dans la mesure permise par le droit
                malien applicable. Elles ne remettent pas en cause les droits légaux des
                consommateurs tels que prévus par la réglementation en vigueur.
              </InfoBox>
            </Section>

            {/* ── §6 Données personnelles ───────────────────────────── */}
            <Section id="donnees" icon={FileText} title="Données personnelles">
              <p>
                La collecte et le traitement de données à caractère personnel effectués dans
                le cadre de l'utilisation du site <strong className="text-encre">libramali.ml</strong>{" "}
                sont conformes à la loi n°2013-015 du 21 mai 2013 portant protection des données
                à caractère personnel en République du Mali.
              </p>

              <SubTitle>Responsable du traitement</SubTitle>
              <div className="bg-white rounded-2xl shadow-card border border-sable/50 p-6 mt-2">
                <InfoRow label="Responsable"   value="LibraMali SARL" />
                <InfoRow label="DPO"           value="dpo@libramali.ml" href="mailto:dpo@libramali.ml" />
                <InfoRow label="Téléphone"     value="+223 70 00 00 00" href="tel:+22370000000" />
                <InfoRow label="Adresse"       value="ACI 2000, Hamdallaye, Bamako — Mali" />
              </div>

              <SubTitle>Vos droits</SubTitle>
              <p>
                Conformément à la législation applicable, vous disposez d'un droit d'accès,
                de rectification, d'effacement, de portabilité, d'opposition et de limitation
                du traitement de vos données personnelles.
              </p>

              <p className="mt-3">
                Pour exercer ces droits ou pour toute question relative à vos données,
                consultez notre{" "}
                <Link href="/confidentialite" className="text-or hover:underline font-medium inline-flex items-center gap-1">
                  politique de confidentialité complète
                  <ExternalLink className="w-3 h-3" />
                </Link>
                {" "}ou contactez directement notre DPO.
              </p>

              <InfoBox>
                La présente section constitue un résumé. Pour une information complète sur
                nos pratiques en matière de données personnelles, référez-vous à notre
                politique de confidentialité dédiée.
              </InfoBox>
            </Section>

            {/* ── §7 Cookies ────────────────────────────────────────── */}
            <Section id="cookies" icon={Globe} title="Cookies">
              <p>
                Lors de votre navigation sur le site <strong className="text-encre">libramali.ml</strong>,
                des cookies et autres traceurs sont susceptibles d'être déposés sur votre terminal.
              </p>

              <SubTitle>Définition</SubTitle>
              <p>
                Un cookie est un petit fichier texte déposé sur le disque dur de votre terminal
                (ordinateur, tablette, smartphone) par le serveur du site visité. Il contient
                plusieurs données : le nom du serveur qui l'a déposé, un identifiant sous forme
                de numéro unique et éventuellement une date d'expiration.
              </p>

              <SubTitle>Types de cookies utilisés</SubTitle>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                {[
                  {
                    titre: "Cookies strictement nécessaires",
                    desc:  "Indispensables au fonctionnement du site (authentification, panier, sécurité). Ne nécessitent pas votre consentement.",
                    color: "border-l-green-500",
                  },
                  {
                    titre: "Cookies analytiques",
                    desc:  "Mesure d'audience anonymisée pour améliorer nos services. Soumis à votre consentement préalable.",
                    color: "border-l-blue-500",
                  },
                  {
                    titre: "Cookies de préférences",
                    desc:  "Mémorisation de vos préférences de navigation (langue, filtres). Améliorent votre expérience.",
                    color: "border-l-amber-500",
                  },
                  {
                    titre: "Cookies publicitaires",
                    desc:  "Non utilisés. LibraMali n'emploie aucun traceur publicitaire tiers ni outil de reciblage.",
                    color: "border-l-sable-dark",
                  },
                ].map((c, i) => (
                  <div key={i} className={cn("p-4 bg-white rounded-xl shadow-card border-l-4", c.color)}>
                    <p className="font-display font-semibold text-encre text-sm mb-1">{c.titre}</p>
                    <p className="text-xs text-encre-muted font-body leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>

              <SubTitle>Gestion de vos cookies</SubTitle>
              <BulletList items={[
                "Via la bannière de consentement affichée lors de votre première visite",
                "Dans les paramètres de confidentialité accessibles en bas de page",
                "Directement dans les paramètres de votre navigateur internet",
                "Via les outils de blocage de traceurs (Privacy Badger, uBlock Origin, etc.)",
              ]} />

              <p className="mt-3">
                Pour une information détaillée sur nos pratiques en matière de cookies,
                consultez notre{" "}
                <Link href="/confidentialite#cookies" className="text-or hover:underline font-medium">
                  politique de cookies
                </Link>.
              </p>
            </Section>

            {/* ── §8 Droit applicable ───────────────────────────────── */}
            <Section id="droit" icon={Landmark} title="Droit applicable et juridiction">
              <SubTitle>8.1 Droit applicable</SubTitle>
              <p>
                Les présentes mentions légales sont régies par le droit de la République du Mali.
                Tout litige relatif à l'interprétation, l'exécution ou la résiliation des présentes
                sera soumis au droit malien.
              </p>

              <SubTitle>8.2 Textes de référence</SubTitle>
              <div className="bg-white rounded-2xl shadow-card border border-sable/50 p-6 mt-2 space-y-0">
                <InfoRow
                  label="Protection des données"
                  value="Loi n°2013-015 du 21 mai 2013 — Mali"
                />
                <InfoRow
                  label="Commerce électronique"
                  value="Loi n°2019-056 du 05 décembre 2019 — Mali"
                />
                <InfoRow
                  label="Propriété intellectuelle"
                  value="Accord de Bangui révisé (OAPI) — 1999"
                />
                <InfoRow
                  label="Protection du consommateur"
                  value="Loi n°2018-016 du 20 juin 2018 — Mali"
                />
                <InfoRow
                  label="Registre du commerce"
                  value="Acte Uniforme OHADA relatif au droit commercial général"
                />
              </div>

              <SubTitle>8.3 Résolution des litiges</SubTitle>
              <p>
                En cas de litige entre un utilisateur et LibraMali, une solution amiable
                sera recherchée en priorité. Pour cela, l'utilisateur est invité à contacter
                notre service client à{" "}
                <a href="mailto:contact@libramali.ml" className="text-or hover:underline">
                  contact@libramali.ml
                </a>.
              </p>
              <p className="mt-3">
                À défaut de résolution amiable dans un délai de 30 jours, les tribunaux
                compétents de <strong className="text-encre">Bamako (Mali)</strong> seront
                seuls compétents pour connaître du litige, nonobstant pluralité de défendeurs
                ou appel en garantie.
              </p>

              <SubTitle>8.4 Médiation</SubTitle>
              <p>
                Conformément à la réglementation en vigueur, tout consommateur dispose du droit
                de recourir gratuitement à un médiateur de la consommation en vue de la résolution
                amiable du litige qui l'oppose à un professionnel. LibraMali s'engage à y
                participer de bonne foi.
              </p>

              <InfoBox>
                <strong>Utilisateurs hors Mali :</strong> bien que notre activité principale
                soit au Mali, si vous résidez dans un pays disposant de réglementations
                protégeant les consommateurs dans le domaine du commerce en ligne, vous
                pouvez également bénéficier de ces protections légales locales.
              </InfoBox>
            </Section>

            {/* ── §9 Contact ────────────────────────────────────────── */}
            <Section id="contact" icon={Mail} title="Contact">
              <p>
                Pour toute question juridique, tout signalement de contenu illicite ou
                toute demande relative aux présentes mentions légales, vous pouvez nous joindre.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                {[
                  {
                    icon:  <Mail className="w-5 h-5" />,
                    titre: "Email général",
                    val:   "contact@libramali.ml",
                    desc:  "Questions commerciales et service client. Réponse sous 24h.",
                    href:  "mailto:contact@libramali.ml",
                  },
                  {
                    icon:  <Scale className="w-5 h-5" />,
                    titre: "Email juridique",
                    val:   "legal@libramali.ml",
                    desc:  "Propriété intellectuelle, signalements légaux, demandes DMCA.",
                    href:  "mailto:legal@libramali.ml",
                  },
                  {
                    icon:  <Phone className="w-5 h-5" />,
                    titre: "Téléphone",
                    val:   "+223 70 00 00 00",
                    desc:  "Service client Lun–Sam de 8h à 18h (heure de Bamako).",
                    href:  "tel:+22370000000",
                  },
                  {
                    icon:  <MapPin className="w-5 h-5" />,
                    titre: "Courrier",
                    val:   "ACI 2000, Hamdallaye",
                    desc:  "LibraMali SARL — Service Juridique, Bamako, Mali.",
                    href:  undefined,
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
              <div className="p-6 bg-sable/40 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-encre-muted" />
                  <h3 className="font-display font-semibold text-encre text-base">
                    Récapitulatif des informations légales
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-xs font-body text-encre-muted">
                  <div>
                    <p className="font-semibold text-encre mb-1">Société</p>
                    <p>LibraMali SARL<br />Capital : 10 000 000 FCFA<br />RCCM : BKO-2023-B-1234</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Siège social</p>
                    <p>ACI 2000, Hamdallaye<br />Bamako, République du Mali</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Direction de publication</p>
                    <p>Moussa Konaté, Gérant<br />direction@libramali.ml</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Hébergement principal</p>
                    <p>Vercel Inc. — États-Unis<br />AWS EMEA SARL — Luxembourg</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">DPO (Protection des données)</p>
                    <p>dpo@libramali.ml<br />+223 70 00 00 00</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Droit applicable</p>
                    <p>Droit malien<br />Juridiction : Bamako</p>
                  </div>
                </div>

                <p className="text-xs text-encre-muted font-body pt-3 border-t border-sable leading-relaxed">
                  LibraMali SARL se réserve le droit de modifier les présentes mentions légales
                  à tout moment pour les mettre en conformité avec les évolutions législatives
                  et réglementaires. Les modifications entrent en vigueur dès leur publication
                  sur le site. Il appartient à l'utilisateur de les consulter régulièrement.
                </p>
              </div>

              {/* Liens annexes */}
              <div className="flex flex-wrap gap-4 mt-6 text-sm font-body">
                <Link href="/confidentialite"
                  className="text-encre-muted hover:text-or transition-colors">
                  Politique de confidentialité
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
                <span className="text-sable-dark">·</span>
                <button
                  onClick={() => window.print()}
                  className="text-encre-muted hover:text-or transition-colors flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
