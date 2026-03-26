"use client";
// src/app/(main)/checkout/page.tsx
import { useEffect, useState } from "react";
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

  const [promoInfo, setPromoInfo] = useState<{ code: string; pourcentage: number } | null>(null);
const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoPreview, setPromoPreview] = useState<Cart | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [devisLoading, setDevisLoading] = useState(false);

// Calcul du montant de la réduction et du total final
// Utilise l'optional chaining (?.) et une valeur par défaut (0)
const totalCart = cart?.total || 0;
const reduction = promoInfo ? (totalCart * promoInfo.pourcentage) / 100 : 0;
const totalFinal = totalCart - reduction;
const handleApplyPromo = async () => {
  if (!codePromo.trim()) return;
  setApplyingPromo(true);
  try {
    // Supposons que ton backend ait un endpoint GET /promotions/valider?code=...
    const { data } = await api.get(`/promotions/valider`, { params: { code: codePromo.trim() } });
    setPromoInfo({
      code: data.data.code,
      pourcentage: data.data.pourcentage
    });
    toast.success(`Code promo appliqué : -${data.data.pourcentage}%`);
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
      // 1. Créer la commande
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
  {promoInfo && (
    <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
      <CheckCircle className="w-3 h-3" /> Promotion {promoInfo.code} appliquée (-{promoInfo.pourcentage}%)
    </p>
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

{/* ── Résumé de commande mis à jour ── */}
<div className="card p-5 space-y-4 h-fit sticky top-24 bg-encre/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
  <h3 className="font-display font-bold text-white border-b border-white/10 pb-2">Votre commande</h3>
  
  <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
    {cart.items.map((item) => (
      <div key={item.id} className="flex justify-between text-sm font-body">
        <span className="text-white/70 truncate flex-1 mr-2">
          {item.productTitre} <span className="text-[10px] opacity-50">×{item.quantite}</span>
        </span>
        <span className="text-white font-medium">{formatPrix(item.sousTotal)}</span>
      </div>
    ))}
  </div>

  <div className="space-y-2 pt-3 border-t border-white/10">
    <div className="flex justify-between text-sm font-body text-white/60">
      <span>Sous-total</span>
      <span>{formatPrix(cart.total)}</span>
    </div>
    
    {promoInfo && (
      <div className="flex justify-between text-sm font-body text-orange-400">
        <span>Réduction ({promoInfo.code})</span>
        <span>-{formatPrix(reduction)}</span>
      </div>
    )}

    <div className="flex justify-between pt-2">
      <span className="font-display font-bold text-white">Total à payer</span>
      <div className="text-right">
        <span className="font-display font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 block">
          {formatPrix(totalFinal)}
        </span>
        {promoInfo && (
          <span className="text-[10px] text-white/40 line-through">
            {formatPrix(cart.total)}
          </span>
        )}
      </div>
    </div>
  </div>
  </div>
      </div>
    </div>
  );
}
