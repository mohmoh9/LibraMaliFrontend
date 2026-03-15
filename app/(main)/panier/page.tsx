"use client";
// src/app/(main)/panier/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Tag, Loader2, ShoppingBag, ArrowRight, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { formatPrix } from "@/lib/utils";
import api from "@/lib/api";
import type { Cart } from "@/types";

export default function PanierPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { cart, loading, fetchCart, updateItem, removeItem, clearCart, previewPromo } = useCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [promoPreview, setPromoPreview] = useState<Cart | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [devisLoading, setDevisLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchCart();
  }, [isAuthenticated]);

  const handleQtyChange = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      await updateItem(itemId, newQty);
      setPromoPreview(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erreur lors de la mise à jour.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    setUpdatingId(itemId);
    try {
      await removeItem(itemId);
      setPromoPreview(null);
      toast.success("Article retiré du panier.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const result = await previewPromo(promoCode);
      setPromoPreview(result);
      toast.success(`Code "${result.codePromoApplique}" appliqué !`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Code promo invalide.");
    } finally {
      setPromoLoading(false);
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
      const a = document.createElement("a"); a.href = url;
      a.download = `devis_panier_${Date.now()}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Devis généré !");
    } catch {
      toast.error("Impossible de générer le devis.");
    } finally {
      setDevisLoading(false);
    }
  };

  const displayCart = promoPreview ?? cart;
  const totalFinal = displayCart?.totalApresReduction ?? displayCart?.total ?? 0;

  if (!isAuthenticated) return null;

  if (loading && !cart) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-5">
        <div className="w-20 h-20 bg-sable rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-9 h-9 text-encre-muted" />
        </div>
        <h1 className="font-display text-3xl font-bold text-encre">Votre panier est vide</h1>
        <p className="font-body text-encre-muted">
          Découvrez notre catalogue et ajoutez vos livres préférés.
        </p>
        <Link href="/catalogue" className="btn-primary inline-flex mt-4">
          Explorer le catalogue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md font-bold text-encre">
          Mon panier
          <span className="ml-2 font-body text-lg font-normal text-encre-muted">
            ({cart.nombreArticles} article{cart.nombreArticles > 1 ? "s" : ""})
          </span>
        </h1>
        <button onClick={() => { clearCart(); setPromoPreview(null); }}
          className="text-xs text-encre-muted hover:text-error transition-colors font-body">
          Vider le panier
        </button>
      </div>

      {/* Avertissements */}
      {cart.avertissements?.map((msg, i) => (
        <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 font-body">{msg}</p>
        </div>
      ))}

      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── Liste articles ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id}
              className="card p-4 flex gap-4 transition-opacity"
              style={{ opacity: updatingId === item.id ? 0.5 : 1 }}>

              {/* Image */}
              <Link href={`/produit/${item.productId}`}
                className="w-16 h-20 bg-sable rounded-xl overflow-hidden shrink-0 relative">
                {item.productImageUrl ? (
                  <Image src={item.productImageUrl} alt={item.productTitre}
                    fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-2xl text-encre/20">
                      {item.productTitre.charAt(0)}
                    </span>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/produit/${item.productId}`}
                  className="font-display font-semibold text-encre text-sm hover:text-or transition-colors line-clamp-1">
                  {item.productTitre}
                </Link>
                <p className="text-xs text-encre-muted font-body mb-2">{item.productAuteur}</p>

                <div className="flex items-center justify-between">
                  {/* Quantité */}
                  <div className="flex items-center gap-2 bg-sable rounded-full p-0.5">
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantite - 1)}
                      disabled={updatingId === item.id || item.quantite <= 1}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center
                                 text-encre hover:bg-ivoire-dark transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-body font-medium">{item.quantite}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantite + 1)}
                      disabled={updatingId === item.id || item.quantite >= item.stockDisponible}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center
                                 text-encre hover:bg-ivoire-dark transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-encre">
                      {formatPrix(item.sousTotal)}
                    </span>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={updatingId === item.id}
                      className="p-1.5 text-encre-muted hover:text-error transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stock bas */}
                {item.stockDisponible <= 5 && item.stockDisponible > 0 && (
                  <p className="text-[10px] text-warning font-body mt-1">
                    Plus que {item.stockDisponible} en stock
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Récapitulatif ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="card p-6 space-y-5">
            <h2 className="font-display text-xl font-bold text-encre">Récapitulatif</h2>

            {/* Code promo */}
            <div className="space-y-2">
              <label className="input-label">Code promo</label>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoPreview(null); }}
                  placeholder="EX: LIRE20"
                  className="input-field flex-1 py-2"
                />
                <button onClick={handlePromo} disabled={promoLoading || !promoCode.trim()}
                  className="btn-secondary px-3 py-2 disabled:opacity-40">
                  {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Totaux */}
            <div className="space-y-2 text-sm font-body border-t border-sable pt-4">
              <div className="flex justify-between text-encre-muted">
                <span>Sous-total</span>
                <span>{formatPrix(cart.total)}</span>
              </div>
              {promoPreview?.montantReduction && promoPreview.montantReduction > 0 && (
                <div className="flex justify-between text-success font-medium">
                  <span>Réduction ({promoPreview.codePromoApplique})</span>
                  <span>-{formatPrix(promoPreview.montantReduction)}</span>
                </div>
              )}
              <div className="flex justify-between text-encre-muted">
                <span>Livraison</span>
                <span className="text-success">Gratuite</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline border-t border-sable pt-4">
              <span className="font-display font-bold text-encre text-lg">Total</span>
              <span className="font-display font-bold text-2xl text-encre">{formatPrix(totalFinal)}</span>
            </div>

            <Link href="/checkout"
              className="btn-primary w-full justify-center py-4 text-base">
              Commander <ArrowRight className="w-4 h-4" />
            </Link>

            <button onClick={handleDevis} disabled={devisLoading}
              className="btn-secondary w-full justify-center py-2.5 text-sm">
              {devisLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <FileText className="w-4 h-4" />}
              Télécharger le devis PDF
            </button>
          </div>

          {/* Continuer */}
          <Link href="/catalogue"
            className="block text-center text-sm text-encre-muted hover:text-encre transition-colors font-body">
            ← Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
