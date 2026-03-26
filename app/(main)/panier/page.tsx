"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Minus, Plus, Trash2, Tag, Loader2, ShoppingBag, 
  ArrowRight, AlertCircle, FileText, BookOpen 
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { formatPrix, cn } from "@/lib/utils";
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
  if (isAuthenticated) {
    fetchCart();
  } else {
    router.push("/login");
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isAuthenticated]);

  const handleQtyChange = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      await updateItem(itemId, newQty);
      setPromoPreview(null); // Reset la preview si le panier change
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
    setPromoPreview(null); // <--- INDISPENSABLE : On force l'UI à revenir sur 'cart'
    toast.success("Article retiré.");
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



  const displayCart = promoPreview ?? cart;
  const totalFinal = displayCart?.totalApresReduction ?? displayCart?.total ?? 0;

  if (!isAuthenticated) return null;

  if (loading && !cart) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 w-48 rounded" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl" />)}
          </div>
          <div className="h-64 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Votre panier est vide</h1>
          <p className="text-slate-500 max-w-xs mx-auto">
            Il semble que vous n&apos;ayez pas encore trouvé votre prochain coup de cœur littéraire.
          </p>
        </div>
        <Link href="/catalogue" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200">
          Explorer le catalogue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Mon panier
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {cart.nombreArticles} article{cart.nombreArticles > 1 ? "s" : ""} sélectionnés
          </p>
        </div>
        <button 
          onClick={() => { clearCart(); setPromoPreview(null); }}
          className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" /> Vider le panier
        </button>
      </div>

      {/* Avertissements de stock ou prix */}
      {cart.avertissements?.map((msg, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-6 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-semibold">{msg}</p>
        </div>
      ))}
    
      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* ── Liste des articles ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} 
              className={cn(
                "group relative bg-white border border-slate-100 p-4 sm:p-5 rounded-3xl flex gap-5 transition-all",
                updatingId === item.id ? "opacity-50 pointer-events-none scale-[0.98]" : "hover:shadow-xl hover:shadow-slate-100 hover:border-slate-200"
              )}
            >
              {/* Image Produit */}
              <Link href={`/produit/${item.productId}`} className="relative w-20 h-28 sm:w-24 sm:h-32 bg-slate-50 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                {item.productImageUrl ? (
                  <Image 
                    src={item.productImageUrl} 
                    alt={item.productTitre} 
                    fill 
                    className="object-contain p-2" 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                )}
              </Link>

              {/* Détails de l'article */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="space-y-1">
                  <Link href={`/produit/${item.productId}`} className="font-bold text-slate-900 hover:text-amber-600 transition-colors line-clamp-1 pr-8">
                    {item.productTitre}
                  </Link>
                  <p className="text-xs font-medium text-slate-400 italic">par {item.productAuteur}</p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {/* Sélecteur de Quantité */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-full p-1">
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantite - 1)}
                      disabled={item.quantite <= 1}
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm font-black text-slate-900">{item.quantite}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantite + 1)}
                      disabled={item.quantite >= item.stockDisponible}
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Prix unitaire et Sous-total */}
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">{formatPrix(item.sousTotal)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {formatPrix(item.prixUnitaire)} / unité
                    </p>
                  </div>
                </div>
              </div>

              {/* Bouton Supprimer */}
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Alerte stock critique */}
              {item.stockDisponible <= 5 && (
                <div className="absolute -bottom-2 left-6 bg-white border border-amber-100 px-2 py-0.5 rounded-md shadow-sm">
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                    Plus que {item.stockDisponible} restants
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Récapitulatif de la commande ─────────────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 space-y-8 relative overflow-hidden">
    <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full" /> 
              Récapitulatif
            </h2>
          

            {/* Détails des prix */}
            <div className="space-y-4 pt-4 border-t border-white/10 relative z-10">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400">Sous-total</span>
                <span>{formatPrix(cart.total)}</span>
              </div>
              
              {promoPreview?.montantReduction && promoPreview.montantReduction > 0 && (
                <div className="flex justify-between items-center text-sm font-bold text-amber-400 animate-in zoom-in-95">
                  <span>Réduction ({promoPreview.codePromoApplique})</span>
                  <span>-{formatPrix(promoPreview.montantReduction)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400">Livraison</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest">Offerte</span>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-white/10">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-black text-amber-500">{formatPrix(totalFinal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 relative z-10">
              <Link href="/checkout" className="flex items-center justify-center gap-3 w-full bg-white text-slate-900 h-14 rounded-2xl font-black hover:bg-slate-100 transition-all active:scale-[0.98]">
                Passer la commande <ArrowRight className="w-5 h-5" />
              </Link>
              
            </div>

            {/* Décoration d'arrière-plan */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <Link href="/catalogue" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors group">
            <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110" />
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}