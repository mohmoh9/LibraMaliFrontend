"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, Star, ArrowLeft, Minus, Plus,
  CheckCircle, AlertCircle, Loader2, FileText, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatPrix, formatDate, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import type { Product, Review, PageResponse, ApiResponse } from "@/types";

export default function ProduitPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [devisLoading, setDevisLoading] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Adaptation aux ApiResponse<T>
        const [prodRes, revRes] = await Promise.all([
          api.get<ApiResponse<Product>>(`/products/${id}`),
          api.get<ApiResponse<PageResponse<Review>>>(`/products/${id}/reviews?page=0&size=5`),
        ]);

        if (prodRes.data.success && prodRes.data.data) {
          setProduct(prodRes.data.data);
        }

        if (revRes.data.success && revRes.data.data) {
          setReviews(revRes.data.data.content ?? []);
        }
      } catch (error) {
        console.error("Erreur chargement produit:", error);
        toast.error("Produit introuvable.");
        router.push("/catalogue");
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id, router]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info("Veuillez vous connecter.");
      router.push("/login");
      return;
    }
    if (!product) return;

    setAdding(true);
    try {
      await addItem(product.id, qty);
      toast.success(`${product.titre} ajouté au panier !`);
    } catch (err) {
      toast.error("Erreur lors de l'ajout au panier.");
    } finally {
      setAdding(false);
    }
  };

  const handleDevis = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setDevisLoading(true);
    try {
      const res = await api.post("/devis/panier", {}, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `devis_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Devis téléchargé !");
    } catch {
      toast.error("Impossible de générer le devis.");
    } finally {
      setDevisLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12 animate-pulse">
        <div className="bg-slate-100 rounded-3xl h-[520px]" />
        <div className="space-y-6">
          <div className="h-4 bg-slate-100 w-1/4 rounded" />
          <div className="h-12 bg-slate-100 w-3/4 rounded" />
          <div className="h-4 bg-slate-100 w-1/2 rounded" />
          <div className="h-24 bg-slate-100 w-full rounded-2xl" />
          <div className="h-14 bg-slate-100 w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const prixAffiche = product.prixPromo ?? product.prix;
const sousTotal = prixAffiche * qty; // Nouvelle ligne
  const enPromo = product.prixPromo !== null && product.prixPromo < product.prix;
  const noteArrondie = product.noteMoyenne ? Math.round(product.noteMoyenne * 10) / 10 : 0;
  const imageValide = !!(product.imageUrl && (product.imageUrl.startsWith("http") || product.imageUrl.startsWith("/")));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-slate-900 transition-colors">Accueil</Link>
        <span className="text-slate-300">/</span>
        <Link href="/catalogue" className="hover:text-slate-900 transition-colors">Catalogue</Link>
        {product.categoryNom && (
          <>
            <span className="text-slate-300">/</span>
            <Link href={`/catalogue?categoryId=${product.categoryId}`} className="hover:text-slate-900 transition-colors">
              {product.categoryNom}
            </Link>
          </>
        )}
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 truncate max-w-[150px]">{product.titre}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 animate-in fade-in duration-500">
        {/* Image Section */}
        <div className="relative">
          <div className="sticky top-24">
            <div className="relative aspect-[3/4] bg-slate-50 rounded-3xl overflow-hidden shadow-inner border border-slate-100">
              {imageValide ? (
                <Image
                  src={product.imageUrl!}
                  alt={product.titre}
                  fill
                  priority
                  className="object-contain p-8 transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-300">
                  <BookOpen className="w-20 h-20 mb-4 opacity-20" />
                  <span className="text-sm font-bold uppercase tracking-widest opacity-40">Couverture non disponible</span>
                </div>
              )}
              {enPromo && (
                <div className="absolute top-6 right-6 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-xl">
                  -{product.promotionPct}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-8">
          <div className="space-y-3">
            {product.categoryNom && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                {product.categoryNom}
              </span>
            )}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {product.titre}
            </h1>
            <p className="text-xl text-slate-500 italic">par {product.auteur}</p>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-700">{noteArrondie}</span>
              </div>
              <span className="text-sm text-slate-400 font-medium">{product.nbAvis} avis clients</span>
            </div>
          </div>

          <div className="flex items-baseline gap-4 border-y border-slate-100 py-6">
            <span className="text-4xl font-black text-slate-900">
              {formatPrix(prixAffiche)}
            </span>
            {enPromo && (
              <span className="text-xl text-slate-300 line-through">
                {formatPrix(product.prix)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
{/* Quantité + Panier */}
{product.enStock && (
  <div className="pt-6 space-y-6 border-t border-slate-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-sm font-bold uppercase text-slate-400">Quantité</span>
        <div className="flex items-center border border-slate-200 rounded-full p-1 bg-white shadow-sm">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Minus className="w-4 h-4 text-slate-600" />
          </button>
          <span className="w-12 text-center font-bold text-slate-900">{qty}</span>
          <button
            onClick={() => setQty(Math.min(product.stock, qty + 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Affichage du Sous-total */}
      {qty > 1 && (
        <div className="text-right animate-in fade-in slide-in-from-right-2 duration-300">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sous-total</p>
          <p className="text-xl font-black text-slate-900">{formatPrix(sousTotal)}</p>
        </div>
      )}
    </div>

    <div className="flex gap-4">
      <button
        onClick={handleAddToCart}
        disabled={adding}
        className="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
        Ajouter au panier
      </button>
      
    </div>
  </div>
)}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-24">
        <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
          <h2 className="text-2xl font-bold text-slate-900">Lecteurs & Avis</h2>
          <div className="text-right">
             <p className="text-sm font-bold text-slate-900">{noteArrondie} / 5</p>
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{product.nbAvis} témoignages</p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
            <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Aucun avis n'a encore été publié pour cet ouvrage.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {review.userNom?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{review.userNom}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn("w-3 h-3", s <= review.note ? "text-amber-500 fill-amber-500" : "text-slate-200")} />
                          ))}
                        </div>
                        {review.achatVerifie && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                            <CheckCircle className="w-2.5 h-2.5" /> Vérifié
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <time className="text-xs text-slate-400 font-medium">{formatDate(review.creeLe)}</time>
                </div>
                {review.commentaire && (
                  <p className="text-slate-600 leading-relaxed text-sm">{review.commentaire}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-16 pt-8 border-t border-slate-100">
        <Link href="/catalogue" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Explorer le reste du catalogue
        </Link>
      </div>
    </div>
  );
}