"use client";
// src/app/(main)/cgv/page.tsx
import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Truck, CreditCard, RefreshCcw,
  Shield, AlertCircle, Scale, FileText,
  ChevronRight, Printer, Mail, Phone,
  MapPin, Package, Clock, CheckCircle,
  XCircle, Info, Star, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Sommaire ─────────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "objet",          label: "Objet & champ d'application", icon: FileText },
  { id: "parties",        label: "Identification des parties",  icon: Info },
  { id: "produits",       label: "Produits & catalogue",        icon: ShoppingBag },
  { id: "commande",       label: "Commande & contrat",          icon: CheckCircle },
  { id: "prix",           label: "Prix & paiement",             icon: CreditCard },
  { id: "livraison",      label: "Livraison",                   icon: Truck },
  { id: "retractation",   label: "Rétractation & retours",     icon: RefreshCcw },
  { id: "garanties",      label: "Garanties légales",           icon: Shield },
  { id: "responsabilite", label: "Responsabilité",              icon: Scale },
  { id: "litiges",        label: "Litiges & droit applicable",  icon: Scale },
];

/* ── Composants partagés ─────────────────────────────────────────────────── */
function Section({
  id, icon: Icon, title, article, children,
}: {
  id: string; icon: React.ElementType; title: string; article: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sable">
        <div className="w-10 h-10 rounded-xl bg-or/10 text-or flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider">{article}</p>
          <h2 className="font-display text-xl font-bold text-encre leading-tight">{title}</h2>
        </div>
      </div>
      <div className="space-y-4 text-sm text-encre-muted font-body leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-semibold text-encre text-base mt-6 mb-3">
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-or shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoBox({ type = "info", children }: { type?: "info" | "warning" | "success"; children: React.ReactNode }) {
  const styles = {
    info:    "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-green-50 border-green-200 text-green-800",
  }[type];
  const Icon = { info: Info, warning: AlertCircle, success: CheckCircle }[type];
  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border text-sm font-body mt-4", styles)}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function DataRow({ label, value, bold = false }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3
                    border-b border-sable/50 last:border-0">
      <span className="text-[11px] font-bold text-encre uppercase tracking-wider shrink-0 sm:w-48">
        {label}
      </span>
      <span className={cn("text-encre-muted", bold && "font-semibold text-encre")}>{value}</span>
    </div>
  );
}

function MethodeBadge({ methode, delai, note }: { methode: string; delai: string; note?: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-sable shadow-sm">
      <CreditCard className="w-5 h-5 text-or shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-encre text-sm">{methode}</p>
        <p className="text-xs text-encre-muted mt-0.5">{delai}</p>
        {note && <p className="text-xs text-or mt-1 font-medium">{note}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function CGVPage() {
  const [activeSection, setActiveSection] = useState("objet");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-ivoire relative overflow-hidden">

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
            <span className="text-ivoire/80">Conditions Générales de Vente</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-or/20 border border-or/30 flex items-center justify-center shrink-0 mt-1">
              <ShoppingBag className="w-8 h-8 text-or" />
            </div>
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-ivoire mb-3">
                Conditions Générales de Vente
              </h1>
              <p className="text-ivoire/60 font-body text-base leading-relaxed max-w-2xl">
                Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des relations
                commerciales entre <strong className="text-ivoire">LibraMali SARL</strong> et ses clients
                dans le cadre des achats effectués sur la plateforme{" "}
                <strong className="text-ivoire">libramali.ml</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-5 mt-5">
                <span className="flex items-center gap-1.5 text-xs text-ivoire/50 font-body">
                  <FileText className="w-3.5 h-3.5" />
                  Version en vigueur au 1er janvier 2025
                </span>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs text-ivoire/50 font-body
                             hover:text-ivoire transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Bannière acceptation ──────────────────────────────────────────── */}
      <div className="bg-or/10 border-b border-or/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-or shrink-0" />
          <p className="text-sm font-body text-encre">
            <strong>Acceptation :</strong> en passant commande sur LibraMali, vous déclarez avoir lu,
            compris et accepté sans réserve les présentes CGV dans leur intégralité.
            Ces CGV prévalent sur tout autre document du client.
          </p>
        </div>
      </div>

      {/* ── Corps ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-start">

          {/* Sommaire sticky */}
          <aside className="hidden lg:block sticky top-24">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-xs font-bold text-encre uppercase tracking-wider mb-4 px-1">
                Sommaire
              </p>
              <nav className="space-y-0.5">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => scrollTo(id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-body transition-all text-left",
                      activeSection === id
                        ? "bg-encre text-ivoire font-medium"
                        : "text-encre-muted hover:bg-sable/60 hover:text-encre"
                    )}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
              <div className="mt-5 pt-5 border-t border-sable space-y-3">
                <button onClick={() => window.print()}
                  className="flex items-center gap-2 text-xs text-encre-muted hover:text-or font-medium transition-colors">
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer / PDF
                </button>
                <a href="mailto:contact@libramali.ml"
                  className="flex items-center gap-2 text-xs text-encre-muted hover:text-or font-medium transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  Une question ?
                </a>
              </div>
            </div>
          </aside>

          {/* Contenu */}
          <main className="space-y-14">

            {/* ── Art. 1 — Objet ──────────────────────────────────────── */}
            <Section id="objet" icon={FileText} title="Objet & champ d'application" article="Article 1">
              <p>
                Les présentes Conditions Générales de Vente ont pour objet de définir les droits
                et obligations des parties dans le cadre de la vente à distance de livres et autres
                produits culturels proposés par <strong className="text-encre">LibraMali SARL</strong>{" "}
                sur sa plateforme de commerce électronique accessible à l'adresse{" "}
                <a href="https://libramali.ml" className="text-or hover:underline">libramali.ml</a>.
              </p>

              <SubTitle>1.1 Champ d'application</SubTitle>
              <p>
                Les présentes CGV s'appliquent à toute commande passée par un client
                (personne physique ou morale, ci-après le « Client ») auprès de LibraMali SARL
                (ci-après « LibraMali » ou le « Vendeur »), que la commande soit passée :
              </p>
              <BulletList items={[
                "Via le site internet libramali.ml",
                "Via l'application mobile LibraMali (si disponible)",
                "Via tout autre canal de vente officiel de LibraMali",
              ]} />

              <SubTitle>1.2 Primauté des CGV</SubTitle>
              <p>
                Ces CGV prévalent sur tout autre document émanant du Client, notamment ses propres
                conditions générales d'achat. Le fait de passer commande implique l'acceptation
                pleine et entière des présentes CGV.
              </p>

              <SubTitle>1.3 Modifications</SubTitle>
              <p>
                LibraMali se réserve le droit de modifier les présentes CGV à tout moment.
                Les CGV applicables sont celles en vigueur au jour de la passation de la commande.
                Toute modification substantielle sera notifiée aux Clients inscrits par email
                avec un préavis de 15 jours.
              </p>

              <InfoBox type="info">
                Les présentes CGV sont rédigées en langue française. En cas de traduction dans
                une autre langue, la version française fait foi en cas de contradiction.
              </InfoBox>
            </Section>

            {/* ── Art. 2 — Parties ────────────────────────────────────── */}
            <Section id="parties" icon={Info} title="Identification des parties" article="Article 2">
              <SubTitle>2.1 Le Vendeur</SubTitle>
              <div className="bg-white rounded-2xl shadow-card border border-sable/50 p-6">
                <DataRow label="Dénomination"     value="LibraMali SARL" bold />
                <DataRow label="Forme juridique"  value="Société à Responsabilité Limitée (SARL)" />
                <DataRow label="Capital social"   value="10 000 000 FCFA" />
                <DataRow label="RCCM"             value="BKO-2023-B-1234" />
                <DataRow label="N° fiscal"        value="123456789ML" />
                <DataRow label="Siège social"     value="ACI 2000, Hamdallaye, Bamako, Mali" />
                <DataRow label="Téléphone"        value="+223 70 00 00 00" />
                <DataRow label="Email"            value="contact@libramali.ml" />
                <DataRow label="Site"             value="https://libramali.ml" />
              </div>

              <SubTitle>2.2 Le Client</SubTitle>
              <p>
                Est considérée comme Client toute personne physique majeure (18 ans révolus ou
                16 ans avec consentement parental) ou personne morale ayant créé un compte sur
                la plateforme LibraMali et passé au moins une commande.
              </p>
              <p className="mt-2">
                Le Client reconnaît avoir la capacité juridique de contracter. En cas de commande
                passée pour le compte d'une entreprise, la personne agissant garantit disposer
                des pouvoirs nécessaires pour engager ladite entreprise.
              </p>

              <InfoBox type="warning">
                <strong>Mineurs :</strong> la plateforme LibraMali est réservée aux personnes âgées
                d'au moins 16 ans. L'inscription d'un mineur de moins de 16 ans nécessite
                le consentement exprès du titulaire de l'autorité parentale.
              </InfoBox>
            </Section>

            {/* ── Art. 3 — Produits ───────────────────────────────────── */}
            <Section id="produits" icon={ShoppingBag} title="Produits & catalogue" article="Article 3">
              <SubTitle>3.1 Nature des produits</SubTitle>
              <p>
                LibraMali commercialise exclusivement des <strong className="text-encre">livres neufs et originaux</strong>,
                incluant notamment :
              </p>
              <BulletList items={[
                "Livres de littérature générale (romans, nouvelles, poésie, théâtre)",
                "Manuels scolaires et ouvrages académiques",
                "Livres de développement personnel et professionnels",
                "Ouvrages de sciences, techniques et spécialités",
                "Livres pour enfants et jeunesse",
                "Livres religieux et de spiritualité",
                "Livres d'art, de photographie et de cuisine",
              ]} />

              <SubTitle>3.2 Authenticité garantie</SubTitle>
              <p>
                LibraMali garantit que tous les ouvrages vendus sur sa plateforme sont
                <strong className="text-encre"> neufs, authentiques et conformes</strong> à leur description.
                Aucun livre contrefait ou d'occasion n'est commercialisé. LibraMali travaille
                directement avec des éditeurs reconnus et des distributeurs agréés.
              </p>

              <SubTitle>3.3 Disponibilité</SubTitle>
              <p>
                Les offres de produits et les prix présentés sur libramali.ml sont valables
                dans la limite des stocks disponibles. LibraMali s'efforce de maintenir
                son catalogue à jour en temps réel. En cas d'indisponibilité d'un produit
                après validation de la commande, le Client en est informé par email dans
                les 24 heures et peut :
              </p>
              <BulletList items={[
                "Être remboursé intégralement sous 48h",
                "Choisir un produit de substitution de valeur équivalente ou supérieure",
                "Accepter un délai d'attente si le réassort est prévisible à court terme",
              ]} />

              <SubTitle>3.4 Descriptions et photos</SubTitle>
              <p>
                Les photographies de couvertures et les descriptions des ouvrages sont fournies
                à titre indicatif. LibraMali ne peut être tenu responsable des différences
                mineures entre la représentation du produit et le produit livré,
                inhérentes aux contraintes de la photographie et de l'édition numérique.
              </p>

              <InfoBox type="success">
                <strong>Demande spéciale :</strong> vous ne trouvez pas un titre dans notre catalogue ?
                Contactez-nous à{" "}
                <a href="mailto:catalogue@libramali.ml" className="underline font-medium">
                  catalogue@libramali.ml
                </a>. Notre équipe fait son maximum pour sourcer des ouvrages à la demande.
              </InfoBox>
            </Section>

            {/* ── Art. 4 — Commande ───────────────────────────────────── */}
            <Section id="commande" icon={CheckCircle} title="Commande & formation du contrat" article="Article 4">
              <SubTitle>4.1 Processus de commande</SubTitle>
              <p>
                La passation d'une commande sur libramali.ml s'effectue selon le processus suivant :
              </p>
              <div className="space-y-3 mt-4">
                {[
                  { num: "1", titre: "Sélection",    desc: "Ajout des produits souhaités au panier" },
                  { num: "2", titre: "Panier",        desc: "Vérification du contenu et application d'un code promo éventuel" },
                  { num: "3", titre: "Adresse",       desc: "Saisie ou sélection de l'adresse de livraison" },
                  { num: "4", titre: "Paiement",      desc: "Choix et validation du mode de paiement" },
                  { num: "5", titre: "Confirmation",  desc: "Réception d'un email de confirmation de commande" },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-sable shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-encre text-ivoire flex items-center justify-center
                                    text-sm font-bold shrink-0">
                      {step.num}
                    </div>
                    <div>
                      <p className="font-semibold text-encre text-sm">{step.titre}</p>
                      <p className="text-xs text-encre-muted mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <SubTitle>4.2 Formation du contrat</SubTitle>
              <p>
                Le contrat de vente est formé au moment de la confirmation de commande par LibraMali,
                matérialisée par l'envoi d'un email de confirmation récapitulant le détail
                de la commande, le montant total et les délais de livraison estimés.
              </p>
              <p className="mt-2">
                La validation de la commande par le Client vaut acceptation des présentes CGV
                et constitue une obligation de paiement.
              </p>

              <SubTitle>4.3 Modification & annulation de commande</SubTitle>
              <p>
                Une commande peut être modifiée ou annulée par le Client sans frais uniquement
                si elle est encore au statut <strong className="text-encre">« En attente »</strong>.
                Une fois la commande confirmée et en préparation, toute annulation relève
                du droit de rétractation (voir Article 7).
              </p>

              <SubTitle>4.4 Refus de commande</SubTitle>
              <p>
                LibraMali se réserve le droit de refuser ou d'annuler une commande en cas de :
              </p>
              <BulletList items={[
                "Suspicion de fraude ou d'utilisation abusive de la plateforme",
                "Rupture de stock constatée après validation",
                "Erreur manifeste de prix affichée sur le site",
                "Adresse de livraison non couverte par notre service",
                "Défaut de paiement constaté lors d'une commande précédente",
              ]} />

              <InfoBox type="warning">
                En cas d'annulation par LibraMali, le Client est remboursé intégralement
                dans un délai de 5 jours ouvrés.
              </InfoBox>
            </Section>

            {/* ── Art. 5 — Prix & paiement ────────────────────────────── */}
            <Section id="prix" icon={CreditCard} title="Prix & modalités de paiement" article="Article 5">
              <SubTitle>5.1 Prix</SubTitle>
              <p>
                Les prix sont indiqués en <strong className="text-encre">Francs CFA (FCFA)</strong>,
                toutes taxes comprises (TTC). LibraMali est assujettie à la TVA applicable au Mali.
                Les prix s'entendent hors frais de livraison, lesquels sont calculés et affichés
                lors du processus de commande.
              </p>
              <p className="mt-3">
                LibraMali se réserve le droit de modifier ses prix à tout moment.
                Toutefois, les produits sont facturés sur la base des tarifs en vigueur
                au moment de la validation de la commande.
              </p>

              <SubTitle>5.2 Promotions & codes promo</SubTitle>
              <BulletList items={[
                "Les promotions sont valables dans la limite des stocks disponibles et pendant la période indiquée",
                "Un code promo est à usage unique sauf mention contraire",
                "Les réductions ne sont pas cumulables sauf indication explicite",
                "Aucun remboursement n'est accordé sur des achats effectués avant l'annonce d'une promotion",
                "Les codes promotionnels ne s'appliquent pas aux livres déjà en réduction sauf mention contraire",
              ]} />

              <SubTitle>5.3 Modes de paiement acceptés</SubTitle>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <MethodeBadge
                  methode="Paiement à la livraison (espèces)"
                  delai="Paiement au livreur à la réception"
                  note="Disponible partout au Mali"
                />
                <MethodeBadge
                  methode="Orange Money"
                  delai="Confirmation sous 2h ouvrées"
                  note="Fournissez la référence de transaction"
                />
                <MethodeBadge
                  methode="Moov Money"
                  delai="Confirmation sous 2h ouvrées"
                  note="Fournissez la référence de transaction"
                />
                <MethodeBadge
                  methode="Wave"
                  delai="Confirmation sous 2h ouvrées"
                  note="Fournissez la référence de transaction"
                />
                <MethodeBadge
                  methode="Carte bancaire (Visa / Mastercard)"
                  delai="Débit immédiat et sécurisé"
                  note="Chiffrement TLS 1.3"
                />
                <MethodeBadge
                  methode="Virement bancaire"
                  delai="Pour commandes institutionnelles"
                  note="Sur devis uniquement — contact@libramali.ml"
                />
              </div>

              <SubTitle>5.4 Sécurité des paiements</SubTitle>
              <p>
                LibraMali ne conserve jamais les données bancaires complètes de ses clients.
                Les transactions par carte bancaire sont traitées par nos partenaires de paiement
                certifiés, dans un environnement sécurisé par chiffrement TLS 1.3.
              </p>

              <SubTitle>5.5 Facture</SubTitle>
              <p>
                Une facture au format PDF est automatiquement générée et disponible dans
                l'espace client après confirmation du paiement. Elle peut également être
                téléchargée à tout moment depuis l'historique des commandes.
              </p>

              <InfoBox type="info">
                <strong>Devis institutionnels :</strong> les établissements scolaires, universités,
                bibliothèques et entreprises peuvent obtenir un devis personnalisé et des
                conditions tarifaires préférentielles en contactant{" "}
                <a href="mailto:devis@libramali.ml" className="underline font-medium">
                  devis@libramali.ml
                </a>.
              </InfoBox>
            </Section>

            {/* ── Art. 6 — Livraison ──────────────────────────────────── */}
            <Section id="livraison" icon={Truck} title="Livraison" article="Article 6">
              <SubTitle>6.1 Zone de livraison</SubTitle>
              <p>
                LibraMali assure la livraison sur l'ensemble du territoire malien.
                Les délais et tarifs varient selon la zone de destination :
              </p>

              <div className="overflow-x-auto rounded-xl border border-sable mt-4">
                <table className="w-full text-sm font-body">
                  <thead className="bg-sable/40">
                    <tr>
                      {["Zone", "Délai", "Tarif", "Conditions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-encre uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sable">
                    {[
                      { zone: "Bamako (intramuros)",   delai: "24h",      tarif: "Gratuite dès 10 000 FCFA",  cond: "< 10 000 FCFA : 1 500 FCFA" },
                      { zone: "Grand Bamako",          delai: "24–48h",   tarif: "2 500 FCFA",                cond: "Gratuite dès 25 000 FCFA" },
                      { zone: "Ségou / Mopti / Sikasso",delai: "2–4j",   tarif: "3 500 FCFA",                cond: "Gratuite dès 50 000 FCFA" },
                      { zone: "Autres régions Mali",   delai: "3–6j",     tarif: "5 000 FCFA",                cond: "Gratuite dès 75 000 FCFA" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-ivoire transition-colors">
                        <td className="px-4 py-3 font-medium text-encre">{row.zone}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-encre-muted">
                            <Clock className="w-3.5 h-3.5" />{row.delai}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-success font-semibold">{row.tarif}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-encre-muted">{row.cond}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <SubTitle>6.2 Délais de livraison</SubTitle>
              <p>
                Les délais indiqués sont des délais estimatifs en jours ouvrés, courant à partir
                de la confirmation de paiement. Ils ne constituent pas un engagement contractuel
                ferme, sauf mention explicite lors de la commande.
              </p>
              <p className="mt-2">
                En cas de dépassement significatif du délai (supérieur à 3 jours ouvrés
                au-delà du délai estimé), le Client est en droit d'annuler sa commande
                et d'en obtenir le remboursement intégral.
              </p>

              <SubTitle>6.3 Suivi de livraison</SubTitle>
              <p>
                Dès l'expédition, le Client reçoit un email contenant un numéro de suivi.
                Ce numéro permet de suivre l'état de la livraison en temps réel depuis
                son espace client (rubrique « Mes commandes »).
              </p>

              <SubTitle>6.4 Réception et vérification</SubTitle>
              <p>
                À la réception du colis, le Client est invité à vérifier en présence du livreur :
              </p>
              <BulletList items={[
                "L'état extérieur du colis (absence de dommages visibles)",
                "La conformité du contenu avec le bon de livraison",
                "L'état des livres (absence de défauts visibles)",
              ]} />
              <p className="mt-3">
                En cas d'anomalie constatée, le Client doit <strong className="text-encre">refuser
                le colis ou émettre des réserves précises</strong> sur le bon de livraison,
                et contacter LibraMali dans les 48 heures suivant la réception.
              </p>

              <SubTitle>6.5 Transfert de propriété et des risques</SubTitle>
              <p>
                La propriété des produits et les risques liés aux produits sont transférés
                au Client dès la livraison effective et la signature du bon de réception.
                Avant ce transfert, LibraMali reste responsable de tout dommage ou perte.
              </p>

              <InfoBox type="warning">
                <strong>Adresse incorrecte :</strong> en cas de non-livraison due à une adresse
                incorrecte fournie par le Client, les frais de nouvelle expédition sont à la
                charge du Client. Vérifiez soigneusement votre adresse avant de valider.
              </InfoBox>
            </Section>

            {/* ── Art. 7 — Rétractation & retours ────────────────────── */}
            <Section id="retractation" icon={RefreshCcw} title="Droit de rétractation & retours" article="Article 7">
              <SubTitle>7.1 Délai de rétractation</SubTitle>
              <p>
                Conformément à la réglementation applicable au commerce électronique au Mali,
                le Client dispose d'un délai de <strong className="text-encre">7 jours calendaires</strong>{" "}
                à compter de la réception du colis pour exercer son droit de rétractation,
                sans avoir à justifier de motif ni à payer de pénalité.
              </p>

              <SubTitle>7.2 Exercice du droit de rétractation</SubTitle>
              <p>Pour exercer ce droit, le Client doit :</p>
              <BulletList items={[
                <>Notifier sa décision par email à <a href="mailto:retours@libramali.ml" className="text-or hover:underline">retours@libramali.ml</a> en indiquant son numéro de commande</>,
                "Ou depuis son espace client (Mes commandes → Demander un retour)",
                "Retourner le ou les produits dans leur état d'origine, non lus et en parfait état, dans leur emballage d'origine",
                "Expédier le colis dans les 7 jours suivant la notification de rétractation",
              ]} />

              <SubTitle>7.3 Remboursement</SubTitle>
              <p>
                Après réception et vérification du retour, LibraMali procède au remboursement
                intégral du montant de la commande (hors frais de retour) dans un délai de
                <strong className="text-encre"> 5 jours ouvrés</strong>, par le même moyen
                de paiement que celui utilisé lors de la commande.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="font-semibold text-success text-sm">Retours acceptés</span>
                  </div>
                  <BulletList items={[
                    "Livre non lu, en parfait état",
                    "Emballage d'origine intact",
                    "Retour demandé dans les 7 jours",
                    "Livre non téléchargeable (version numérique)",
                  ]} />
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-error" />
                    <span className="font-semibold text-error text-sm">Retours refusés</span>
                  </div>
                  <BulletList items={[
                    "Livre manifestement lu ou annoté",
                    "Livre endommagé par le Client",
                    "Demande après 7 jours de réception",
                    "Livre sur commande spéciale",
                  ]} />
                </div>
              </div>

              <SubTitle>7.4 Frais de retour</SubTitle>
              <p>
                Les frais de retour sont à la charge du Client, sauf si le retour est dû à
                une erreur de LibraMali (produit incorrect, défectueux ou non conforme à
                la description). Dans ce cas, LibraMali prend en charge les frais de retour
                et procède à l'échange ou au remboursement intégral.
              </p>

              <InfoBox type="info">
                <strong>Produit défectueux ou incorrect ?</strong> Contactez-nous dans les 48h
                suivant la réception. Nous prenons en charge les frais de retour et vous
                renvoyons un exemplaire conforme ou procédons au remboursement immédiat.
              </InfoBox>
            </Section>

            {/* ── Art. 8 — Garanties ──────────────────────────────────── */}
            <Section id="garanties" icon={Shield} title="Garanties légales" article="Article 8">
              <SubTitle>8.1 Garantie de conformité</SubTitle>
              <p>
                LibraMali est tenu de livrer un produit conforme à la commande et répond
                des défauts de conformité existant lors de la délivrance. Le défaut de
                conformité comprend notamment :
              </p>
              <BulletList items={[
                "Un produit ne correspondant pas à la description, au type, à la quantité et à la qualité spécifiés lors de la commande",
                "Un produit impropre à tout usage spécial recherché par le Client dont LibraMali avait connaissance",
                "Un produit ne présentant pas les qualités habituelles d'un bien de même type",
                "Un produit livré endommagé par LibraMali pendant le transport",
              ]} />

              <SubTitle>8.2 Garantie contre les vices cachés</SubTitle>
              <p>
                LibraMali garantit également le Client contre les vices cachés des produits vendus,
                c'est-à-dire les défauts qui rendent le produit impropre à l'usage auquel
                il est destiné ou qui diminuent tellement cet usage que le Client ne l'aurait
                pas acquis ou en aurait donné un moindre prix s'il les avait connus.
              </p>

              <SubTitle>8.3 Exercice des garanties</SubTitle>
              <p>
                Pour faire valoir ses droits au titre de ces garanties, le Client doit contacter
                LibraMali dans les meilleurs délais après la découverte du vice ou du défaut,
                en adressant un email à{" "}
                <a href="mailto:garanties@libramali.ml" className="text-or hover:underline">
                  garanties@libramali.ml
                </a>{" "}
                avec les éléments justificatifs (photos, description du problème, numéro de commande).
              </p>

              <InfoBox type="success">
                <strong>Notre engagement :</strong> LibraMali s'engage à traiter toute réclamation
                dans un délai de 48h ouvrées et à proposer une solution (échange, remboursement
                ou avoir) dans un délai de 5 jours ouvrés maximum.
              </InfoBox>
            </Section>

            {/* ── Art. 9 — Responsabilité ─────────────────────────────── */}
            <Section id="responsabilite" icon={Scale} title="Responsabilité" article="Article 9">
              <SubTitle>9.1 Responsabilité de LibraMali</SubTitle>
              <p>
                La responsabilité de LibraMali est limitée aux dommages directs et prévisibles
                résultant de l'inexécution ou de la mauvaise exécution de ses obligations contractuelles.
                LibraMali ne saurait être tenu responsable de dommages indirects tels que
                le manque à gagner, le préjudice commercial ou l'atteinte à l'image.
              </p>

              <SubTitle>9.2 Force majeure</SubTitle>
              <p>
                LibraMali est exonéré de toute responsabilité en cas d'inexécution ou
                de retard dans l'exécution de ses obligations résultant d'un cas de force
                majeure au sens du droit malien : catastrophe naturelle, pandémie, grève
                générale des transports, coupure prolongée des communications, troubles civils,
                décision gouvernementale ou tout autre événement imprévisible, irrésistible
                et extérieur à la volonté de LibraMali.
              </p>

              <SubTitle>9.3 Responsabilité du Client</SubTitle>
              <p>
                Le Client est seul responsable de l'utilisation qu'il fait des produits acquis.
                Il s'engage à ne pas utiliser les produits à des fins illicites ou contraires
                à l'ordre public. Le Client est responsable de la confidentialité de ses
                identifiants de connexion.
              </p>

              <SubTitle>9.4 Propriété intellectuelle des ouvrages</SubTitle>
              <p>
                L'achat d'un ouvrage sur LibraMali confère au Client un droit d'usage personnel
                et non exclusif sur le contenu de l'ouvrage. Toute reproduction, diffusion,
                représentation ou exploitation commerciale non autorisée d'un ouvrage
                acquis est strictement interdite et susceptible de constituer une contrefaçon.
              </p>
            </Section>

            {/* ── Art. 10 — Litiges ───────────────────────────────────── */}
            <Section id="litiges" icon={Scale} title="Litiges & droit applicable" article="Article 10">
              <SubTitle>10.1 Résolution amiable</SubTitle>
              <p>
                En cas de litige ou de réclamation, le Client est invité à contacter en priorité
                le service client de LibraMali par les moyens suivants :
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                {[
                  { icon: <Mail className="w-4 h-4" />,   label: "Email", val: "contact@libramali.ml" },
                  { icon: <Phone className="w-4 h-4" />,  label: "Tél",   val: "+223 70 00 00 00" },
                  { icon: <MapPin className="w-4 h-4" />, label: "Courrier", val: "ACI 2000, Bamako" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-sable shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-or/10 text-or flex items-center justify-center shrink-0">
                      {c.icon}
                    </div>
                    <div>
                      <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider">{c.label}</p>
                      <p className="text-sm font-medium text-encre">{c.val}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4">
                LibraMali s'engage à traiter toute réclamation dans un délai de
                <strong className="text-encre"> 5 jours ouvrés</strong>. En l'absence de réponse
                satisfaisante dans ce délai, le Client peut saisir un médiateur.
              </p>

              <SubTitle>10.2 Médiation</SubTitle>
              <p>
                En cas d'échec de la résolution amiable, le Client peut recourir à une médiation
                de la consommation. LibraMali s'engage à participer de bonne foi à tout
                processus de médiation initié dans le cadre d'un litige de consommation.
              </p>

              <SubTitle>10.3 Droit applicable</SubTitle>
              <p>
                Les présentes CGV sont soumises au <strong className="text-encre">droit de la République
                du Mali</strong>, notamment :
              </p>
              <BulletList items={[
                "La loi n°2019-056 du 05 décembre 2019 portant sur le commerce électronique au Mali",
                "La loi n°2018-016 du 20 juin 2018 relative à la protection du consommateur",
                "L'Acte Uniforme de l'OHADA relatif au droit commercial général",
                "Le Code civil malien pour les aspects non spécifiquement couverts",
              ]} />

              <SubTitle>10.4 Juridiction compétente</SubTitle>
              <p>
                À défaut de résolution amiable, tout litige relatif à l'interprétation,
                l'application ou l'inexécution des présentes CGV sera soumis à la compétence
                exclusive des <strong className="text-encre">Tribunaux de Bamako (Mali)</strong>,
                nonobstant pluralité de défendeurs ou appel en garantie.
              </p>

              <InfoBox type="info">
                <strong>Protection du consommateur :</strong> les présentes CGV ne sauraient
                priver le Client des droits dont il bénéficie au titre de la législation
                malienne de protection des consommateurs, qui s'appliquent en tout état de cause.
              </InfoBox>
            </Section>

            {/* ── Pied de page document ──────────────────────────────── */}
            <div className="pt-10 border-t border-sable">
              <div className="p-6 bg-sable/40 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-encre-muted" />
                  <h3 className="font-display font-semibold text-encre text-base">
                    Informations complémentaires
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-xs font-body text-encre-muted">
                  <div>
                    <p className="font-semibold text-encre mb-1">Vendeur</p>
                    <p>LibraMali SARL — RCCM BKO-2023-B-1234<br />ACI 2000, Bamako, République du Mali</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Service client</p>
                    <p>contact@libramali.ml<br />+223 70 00 00 00 — Lun–Sam 8h–18h</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Retours & garanties</p>
                    <p>retours@libramali.ml<br />garanties@libramali.ml</p>
                  </div>
                  <div>
                    <p className="font-semibold text-encre mb-1">Devis institutionnels</p>
                    <p>devis@libramali.ml<br />Réponse sous 24h ouvrées</p>
                  </div>
                </div>
                <p className="text-xs text-encre-muted font-body pt-3 border-t border-sable leading-relaxed">
                  Les présentes Conditions Générales de Vente entrent en vigueur au 1er janvier 2025
                  et restent valables jusqu'à leur modification ou remplacement par une version
                  postérieure. La version applicable est celle en vigueur au jour de la commande.
                </p>
              </div>

              {/* Liens annexes */}
              <div className="flex flex-wrap gap-4 mt-6 text-sm font-body">
                <Link href="/confidentialite"
                  className="text-encre-muted hover:text-or transition-colors">
                  Politique de confidentialité
                </Link>
                <span className="text-sable-dark">·</span>
                <Link href="/mentions-legales"
                  className="text-encre-muted hover:text-or transition-colors">
                  Mentions légales
                </Link>
                <span className="text-sable-dark">·</span>
                <Link href="/a_propos"
                  className="text-encre-muted hover:text-or transition-colors">
                  À propos
                </Link>
                <span className="text-sable-dark">·</span>
                <Link href="/catalogue"
                  className="text-encre-muted hover:text-or transition-colors">
                  Retour au catalogue
                </Link>
                <span className="text-sable-dark">·</span>
                <button onClick={() => window.print()}
                  className="text-encre-muted hover:text-or transition-colors flex items-center gap-1">
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
