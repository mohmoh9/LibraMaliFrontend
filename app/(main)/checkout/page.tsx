"use client";
// src/app/(main)/checkout/page.tsx
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, MapPin, CreditCard, Loader2, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import type { Address } from "@/types";
import type { Cart } from "@/types";


type MethodePaiement = "CASH" | "MOBILE_MONEY" | "CARTE";

const METHODES: { val: MethodePaiement; label: string; desc: string }[] = [
  { val: "CASH", label: "Paiement à la livraison", desc: "Payez en espèces à la réception" },
  { val: "MOBILE_MONEY", label: "Mobile Money", desc: "Orange Money, Moov Money, Wave…" },
  { val: "CARTE", label: "Carte bancaire", desc: "Visa, Mastercard" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { cart, fetchCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [methode, setMethode] = useState<MethodePaiement>("CASH");
  const [reference, setReference] = useState("");
  const [codePromo, setCodePromo] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"adresse" | "paiement" | "confirmation">("adresse");
  const [orderId, setOrderId] = useState<number | null>(null);

// On utilise l'interface Promotion ou un type partiel pour autoriser productId
const [promoInfo, setPromoInfo] = useState<{ 
  code: string; 
  pourcentage: number; 
  productId?: number; 
} | null>(null);const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoPreview, setPromoPreview] = useState<Cart | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [devisLoading, setDevisLoading] = useState(false);

// État pour stocker les infos de la promo (incluant l'ID du produit cible)

// ── CALCUL CIBLÉ PAR PRODUIT ────────────────────────────────────────
const { reduction, totalFinal, lignesAvecRemise } = useMemo(() => {
  if (!cart) return { reduction: 0, totalFinal: 0, lignesAvecRemise: new Set<number>() };
  if (!promoInfo) return { reduction: 0, totalFinal: cart.total, lignesAvecRemise: new Set<number>() };

  let totalReduction = 0;
  // Ensemble des productId qui bénéficient effectivement de la remise
  const eligibles = new Set<number>();

  cart.items.forEach((item) => {
    /*
     * Règle d'éligibilité :
     *   - promoInfo.productId === undefined  → promo globale : s'applique à tous les articles
     *   - promoInfo.productId === item.productId → promo ciblée : s'applique uniquement à ce produit
     *   - promoInfo.productId !== item.productId → NON éligible : le produit n'est pas concerné
     */
    const estEligible =
      promoInfo.productId === undefined ||
      promoInfo.productId === null ||
      promoInfo.productId === item.productId;

    if (estEligible) {
      totalReduction += (item.sousTotal * promoInfo.pourcentage) / 100;
      eligibles.add(item.productId);
    }
  });

  return {
    reduction: totalReduction,
    totalFinal: cart.total - totalReduction,
    lignesAvecRemise: eligibles,
  };
}, [cart, promoInfo]);

/*
 * Indique si la promo est ciblée sur un seul produit
 * (et non globale sur tout le panier)
 */
const estPromoCiblee =
  promoInfo !== null &&
  promoInfo.productId !== undefined &&
  promoInfo.productId !== null;

const handleApplyPromo = async () => {
  if (!codePromo.trim()) return;
  setApplyingPromo(true);
  try {
    const { data } = await api.get(`/promotions/valider`, { 
      params: { code: codePromo.trim() } 
    });

    // Extraction sécurisée : on prend l'id du produit s'il existe
    setPromoInfo({
      code: data.data.code,
      pourcentage: data.data.pourcentage,
      productId: data.data.product?.id // Utilise le chaînage optionnel ici
    });
    
    toast.success(`Code promo appliqué !`);
  } catch (err) {
    setPromoInfo(null);
    toast.error("Code promo invalide ou expiré.");
  } finally {
    setApplyingPromo(false);
  }
};



  const handleDevis = async () => {
    setDevisLoading(true);
    try {
      const res = await api.post("/devis/panier",
        { codePromo: promoPreview?.codePromoApplique },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a"); 
      a.href = url;
      a.download = `devis_panier_${Date.now()}.pdf`; 
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Devis généré !");
    } catch {
      toast.error("Impossible de générer le devis.");
    } finally {
      setDevisLoading(false);
    }
  };

  

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchCart();
    api.get("/users/me").then(({ data }) => {
      return api.get(`/users/${data.data.id}/addresses`);
    }).then(({ data }) => {
      setAddresses(data.data);
      const principale = data.data.find((a: Address) => a.estPrincipale);
      if (principale) setSelectedAddressId(principale.id);
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleOrder = async () => {
    if (!selectedAddressId) { toast.error("Choisissez une adresse de livraison."); return; }
    if (methode !== "CASH" && !reference.trim()) {
      toast.error("La référence de transaction est obligatoire."); return;
    }
    setLoading(true);
    try {
      /*
       * Envoi du code promo au backend.
       *
       * Le backend (OrderService) recalcule la réduction de son côté —
       * le total côté client (totalFinal) sert uniquement à l'affichage.
       * C'est le backend qui fait autorité sur le montant final.
       *
       * Pour une promo ciblée (productId non null), le backend applique
       * également la remise uniquement sur le produit éligible grâce
       * au champ promotionCode/productId stocké sur la Promotion.
       */
      const { data: orderData } = await api.post("/orders", {
        adresseLivraisonId: selectedAddressId,
        codePromo: codePromo.trim() || undefined,
      });
      const order = orderData.data;
      setOrderId(order.id);

      // 2. Enregistrer le paiement
      await api.post("/payments", {
        orderId: order.id,
        methode,
        referenceTransaction: reference.trim() || undefined,
      });

      toast.success("Commande passée avec succès !");
      fetchCart();
      setStep("confirmation");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !cart) return null;

  // ── Confirmation ─────────────────────────────────────────────────────────
  if (step === "confirmation") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h1 className="font-display text-3xl font-bold text-encre">Commande confirmée !</h1>
        <p className="font-body text-encre-muted leading-relaxed">
          Votre commande <strong className="text-encre">#{orderId}</strong> a été passée avec succès.
          Vous recevrez un email de confirmation.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/mon-compte/commandes" className="btn-primary">
            Suivre ma commande
          </Link>
          <Link href="/catalogue" className="btn-secondary">
            Continuer mes achats
          </Link>
        </div>
      </div>
    );
  }

  // ── Steps ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-display-md font-bold text-encre mb-8">Commander</h1>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2 mb-10">
        {[
          { key: "adresse", label: "Livraison", icon: <MapPin className="w-4 h-4" /> },
          { key: "paiement", label: "Paiement", icon: <CreditCard className="w-4 h-4" /> },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="w-12 h-px bg-sable-dark" />}
            <button
              onClick={() => step === "paiement" && s.key === "adresse" && setStep("adresse")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body font-medium
                transition-colors ${step === s.key
                  ? "bg-encre text-ivoire"
                  : s.key === "adresse" && step === "paiement"
                    ? "bg-sable text-encre cursor-pointer hover:bg-sable-dark"
                    : "bg-sable text-encre-muted"}`}
            >
              {s.icon}{s.label}
            </button>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {/* ── Étape 1 : Adresse ─────────────────────────────────────── */}
          {step === "adresse" && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display text-xl font-bold text-encre">Adresse de livraison</h2>

              {addresses.length === 0 ? (
                <div className="card p-8 text-center space-y-3">
                  <MapPin className="w-8 h-8 text-encre-muted mx-auto" />
                  <p className="font-body text-encre-muted">Aucune adresse enregistrée.</p>
                  <Link href="/mon-compte/profil" className="btn-secondary text-sm">
                    <Plus className="w-4 h-4" /> Ajouter une adresse
                  </Link>
                </div>
              ) : (
                addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`w-full text-left card p-4 transition-all ${
                      selectedAddressId === addr.id
                        ? "ring-2 ring-encre"
                        : "hover:shadow-card-hover"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${
                        selectedAddressId === addr.id
                          ? "bg-encre border-encre"
                          : "border-sable-dark"
                      }`} />
                      <div>
                        <p className="font-body font-medium text-encre text-sm">
                          {addr.rue}
                          {addr.estPrincipale && (
                            <span className="ml-2 text-[10px] bg-sable text-encre-muted px-1.5 py-0.5 rounded-full">
                              Principale
                            </span>
                          )}
                        </p>
                        {addr.quartier && (
                          <p className="text-xs text-encre-muted font-body">{addr.quartier}</p>
                        )}
                        <p className="text-xs text-encre-muted font-body">{addr.ville}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}

{/* ── Section Code Promo dans l'étape Adresse ── */}
<div className="mt-6 p-4 bg-sable/30 rounded-xl border border-sable">
  <label className="input-label">Un code promo ?</label>
  <div className="flex gap-2 mt-1">
    <input
      value={codePromo}
      onChange={(e) => setCodePromo(e.target.value.toUpperCase())}
      placeholder="EX: LIRE20"
      className="input-field max-w-[200px]"
    />
    <button 
      type="button"
      onClick={handleApplyPromo}
      disabled={applyingPromo || !codePromo}
      className="btn-secondary text-sm py-2"
    >
      {applyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Appliquer"}
    </button>
  </div>

  {/* Confirmation promo appliquée */}
  {promoInfo && (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs text-success font-medium flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Code <strong>{promoInfo.code}</strong> appliqué — -{promoInfo.pourcentage}%
      </p>
      {/*
       * Avertissement ciblage produit :
       * Si la promo ne concerne qu'un produit spécifique, on prévient
       * l'utilisateur que la remise ne s'applique pas à tout le panier.
       */}
      {estPromoCiblee && (
        <p className="text-xs text-amber-600 font-medium flex items-start gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
          <span className="shrink-0 mt-px">⚠️</span>
          Cette promotion s'applique uniquement sur le produit éligible
          dans votre panier. Les autres articles ne sont pas concernés.
        </p>
      )}
      {/* Cas où la promo est valide mais aucun article du panier n'est éligible */}
      {estPromoCiblee && lignesAvecRemise.size === 0 && (
        <p className="text-xs text-error font-medium flex items-start gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200">
          <span className="shrink-0">❌</span>
          Aucun article de votre panier n'est éligible à cette promotion.
          La réduction ne sera pas appliquée.
        </p>
      )}
    </div>
  )}
</div>

              <button
                onClick={() => setStep("paiement")}
                disabled={!selectedAddressId}
                className="btn-primary mt-2 disabled:opacity-50"
              >
                Continuer vers le paiement
              </button>
            </div>
          )}

          {/* ── Étape 2 : Paiement ────────────────────────────────────── */}
          {step === "paiement" && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display text-xl font-bold text-encre">Mode de paiement</h2>

              {METHODES.map((m) => (
                <button
                  key={m.val}
                  onClick={() => setMethode(m.val)}
                  className={`w-full text-left card p-4 transition-all ${
                    methode === m.val ? "ring-2 ring-encre" : "hover:shadow-card-hover"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      methode === m.val ? "bg-encre border-encre" : "border-sable-dark"
                    }`} />
                    <div>
                      <p className="font-body font-medium text-encre text-sm">{m.label}</p>
                      <p className="text-xs text-encre-muted font-body">{m.desc}</p>
                    </div>
                  </div>
                </button>
              ))}

              {methode !== "CASH" && (
                <div className="animate-fade-in">
                  <label className="input-label">Référence de transaction *</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder={methode === "MOBILE_MONEY" ? "Ex: TX-123456789" : "Ex: 4111-xxxx-xxxx-1111"}
                    className="input-field"
                  />
                  <p className="text-xs text-encre-muted font-body mt-1">
                    {methode === "MOBILE_MONEY"
                      ? "Effectuez d'abord le paiement, puis entrez la référence reçue par SMS."
                      : "Entrez les 4 derniers chiffres de votre carte."}
                  </p>
                </div>
              )}

              <button
                onClick={handleOrder}
                disabled={loading}
                className="btn-primary w-full justify-center py-4 text-base"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmer la commande
              </button>
            </div>
          )}
        </div>

{/* ── Résumé de commande (Style Slate/Amber) ── */}
  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/10 space-y-6 relative overflow-hidden border border-white/5">
    <h3 className="text-xl font-bold flex items-center gap-2 relative z-10">
      <span className="w-1.5 h-6 bg-amber-500 rounded-full" /> 
      Votre commande
    </h3>

    <div className="mt-6 space-y-4 max-h-80 overflow-y-auto pr-3 relative z-10 custom-scrollbar">
      {cart.items.map((item) => {
        /*
         * Calcul de la remise ligne par ligne :
         *   - Si la ligne est éligible (son productId est dans lignesAvecRemise),
         *     on affiche le montant réduit et le prix barré.
         *   - Sinon, on affiche le sousTotal normal sans modification.
         *
         * Cela permet à l'utilisateur de voir visuellement quels articles
         * bénéficient de la promotion et lesquels ne sont pas concernés.
         */
        const estEnPromo = lignesAvecRemise.has(item.productId);
        const remiseLigne = estEnPromo
          ? (item.sousTotal * (promoInfo?.pourcentage ?? 0)) / 100
          : 0;
        const sousTotalReduit = item.sousTotal - remiseLigne;

        return (
          <div key={item.id} className="group flex justify-between items-start gap-4 p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{item.productTitre}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Qté : {item.quantite}</p>
                {estEnPromo && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black border border-amber-500/20 animate-pulse">
                    PROMO -{promoInfo?.pourcentage}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              {estEnPromo ? (
                /* Produit éligible : prix barré + prix réduit */
                <div>
                  <p className="text-xs text-slate-500 line-through leading-none">
                    {formatPrix(item.sousTotal)}
                  </p>
                  <p className="text-sm font-bold text-amber-400">
                    {formatPrix(sousTotalReduit)}
                  </p>
                </div>
              ) : (
                /* Produit non éligible : prix normal sans modification */
                <p className="text-sm font-bold text-slate-200">
                  {formatPrix(item.sousTotal)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>

    {/* Section Calculs */}
    <div className="space-y-3 pt-6 border-t border-white/10 relative z-10 text-sm">
      <div className="flex justify-between text-slate-400">
        <span>Sous-total</span>
        <span>{formatPrix(cart.total)}</span>
      </div>
      
      {reduction > 0 && (
        <>
          <div className="flex justify-between font-bold text-amber-400">
            <span>
              Réduction ({promoInfo?.code})
              {/*
               * Si la promo est ciblée, on précise le nombre de produits concernés
               * pour éviter toute ambiguïté sur le montant réduit.
               */}
              {estPromoCiblee && lignesAvecRemise.size > 0 && (
                <span className="ml-1 text-[10px] font-normal text-amber-500/70">
                  · {lignesAvecRemise.size} article{lignesAvecRemise.size > 1 ? "s" : ""} éligible{lignesAvecRemise.size > 1 ? "s" : ""}
                </span>
              )}
            </span>
            <span>-{formatPrix(reduction)}</span>
          </div>
          {/* Détail visuel de ce qui n'est PAS remisé (promo ciblée uniquement) */}
          {estPromoCiblee && cart.items.some(i => !lignesAvecRemise.has(i.productId)) && (
            <p className="text-[10px] text-slate-500 italic">
              Les autres articles du panier ne bénéficient pas de cette promotion.
            </p>
          )}
        </>
      )}

      <div className="flex justify-between items-end pt-4 border-t border-white/10">
        <span className="text-lg font-bold">Total à payer</span>
        <div className="text-right">
          <span className="text-3xl font-black text-amber-500 block leading-none">
            {formatPrix(totalFinal)}
          </span>
        </div>
      </div>
    </div>

    {/* Effets de fond */}
    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />

  {/* Effets Visuels (Glow & Gradient) */}
  <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
</div>
      </div>
    </div>
  );
}
