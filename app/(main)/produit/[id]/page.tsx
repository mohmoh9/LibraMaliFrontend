"use client";
// src/app/(main)/produit/[id]/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, Star, ArrowLeft, Minus, Plus,
  CheckCircle, AlertCircle, Loader2, FileText
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, formatDate, noteEtoiles, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import type { Product, Review, PageResponse } from "@/types";

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
    const fetch = async () => {
      setLoading(true);
      try {
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/reviews?page=0&size=5`),
        ]);
        setProduct(prodRes.data.data);
        const paged: PageResponse<Review> = revRes.data.data;
        setReviews(paged.content ?? []);
      } catch {
        toast.error("Produit introuvable.");
        router.push("/catalogue");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setAdding(true);
    try {
      await addItem(Number(id), qty);
      toast.success("Ajouté au panier !");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const handleDevis = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
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
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12">
        <div className="skeleton rounded-2xl h-[480px]" />
        <div className="space-y-4">
          <div className="skeleton h-5 w-1/4 rounded" />
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="skeleton h-5 w-1/3 rounded" />
          <div className="skeleton h-8 w-1/4 rounded mt-4" />
          <div className="skeleton h-12 w-full rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const prixAffiche = product.prixPromo ?? product.prix;
  const enPromo = product.prixPromo != null && product.prixPromo < product.prix;
  const noteArrondie = Math.round(product.noteMoyenne * 10) / 10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-2 text-sm text-encre-muted font-body mb-8">
        <Link href="/" className="hover:text-encre transition-colors">Accueil</Link>
        <span>/</span>
        <Link href="/catalogue" className="hover:text-encre transition-colors">Catalogue</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/catalogue?categoryId=${product.category.id}`}
              className="hover:text-encre transition-colors">
              {product.category.nom}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-encre truncate max-w-[200px]">{product.titre}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 animate-fade-in">

        {/* ── Image ────────────────────────────────────────────────────── */}
<div className="relative">
  <div className="sticky top-24">
    <div className="relative h-[420px] md:h-[520px] bg-sable rounded-3xl overflow-hidden">
      {product.imageUrl ? (
        <Image 
          // Sécurisation de l'URL pour Next.js Image
          src={
            product.imageUrl.startsWith('http') 
              ? product.imageUrl 
              : product.imageUrl.startsWith('/') 
                ? product.imageUrl 
                : `/${product.imageUrl}`
          } 
          alt={product.titre || "Image du produit"} 
          fill
          className="object-contain p-6" 
          sizes="(max-width: 768px) 100vw, 50vw" 
          priority // Ajouté car c'est l'image principale de la page (LCP)
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-56 bg-encre/10 rounded-xl flex items-center justify-center">
            <span className="font-display text-6xl text-encre/20">
              {product.titre?.charAt(0) || "?"}
            </span>
          </div>
        </div>
      )}
      
      {/* Utilisation de product.promotionPct directement pour la condition */}
      {product.promotionPct && product.promotionPct > 0 && (
        <div className="absolute top-6 right-6 bg-or text-white text-sm font-bold
                        px-4 py-2 rounded-full shadow-lg z-10">
          -{product.promotionPct}%
        </div>
      )}
    </div>
  </div>
</div>

        {/* ── Détails ───────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Catégorie */}
          {product.category && (
            <Link href={`/catalogue?categoryId=${product.category.id}`}
              className="inline-block text-xs font-body uppercase tracking-widest text-or
                         hover:text-or-dark transition-colors">
              {product.category.nom}
            </Link>
          )}

          <div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-encre leading-tight">
              {product.titre}
            </h1>
            <p className="font-body text-lg text-encre-muted mt-1">{product.auteur}</p>
          </div>

          {/* Note */}
          {product.nbAvis > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s}
                    className={cn("w-4 h-4", s <= Math.round(product.noteMoyenne)
                      ? "text-or fill-or" : "text-sable-dark fill-sable-dark")} />
                ))}
              </div>
              <span className="text-sm font-body text-encre">
                {noteArrondie} <span className="text-encre-muted">({product.nbAvis} avis)</span>
              </span>
            </div>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-encre">
              {formatPrix(prixAffiche)}
            </span>
            {enPromo && (
              <span className="text-lg text-encre-muted line-through font-body">
                {formatPrix(product.prix)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.enStock ? (
              <>
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-body text-success">
                  En stock {product.stock <= 5 && `(plus que ${product.stock} exemplaire${product.stock > 1 ? "s" : ""})`}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-error" />
                <span className="text-sm font-body text-error">Épuisé</span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="prose prose-sm max-w-none text-encre-muted font-body leading-relaxed
                            border-t border-sable pt-4">
              <p>{product.description}</p>
            </div>
          )}

          {/* Quantité + Panier */}
          {product.enStock && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="input-label">Quantité</span>
                <div className="flex items-center gap-2 bg-sable rounded-full p-1">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center
                               text-encre shadow-sm hover:bg-ivoire-dark transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-body font-medium text-encre">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center
                               text-encre shadow-sm hover:bg-ivoire-dark transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="flex-1 btn-primary justify-center py-4 text-base"
                >
                  {adding
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ShoppingBag className="w-4 h-4" />}
                  Ajouter au panier
                </button>
                <button
                  onClick={handleDevis}
                  disabled={devisLoading}
                  title="Générer un devis PDF"
                  className="btn-secondary px-4"
                >
                  {devisLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <FileText className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Avis ─────────────────────────────────────────────────────────── */}
      <section className="mt-20 border-t border-sable pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl font-bold text-encre">
            Avis clients
            {reviews.length > 0 && (
              <span className="ml-2 text-lg font-body font-normal text-encre-muted">
                ({product.nbAvis})
              </span>
            )}
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-sable/30 rounded-2xl">
            <Star className="w-10 h-10 text-sable-dark mx-auto mb-3" />
            <p className="font-display text-lg text-encre">Aucun avis pour l&apos;instant</p>
            <p className="text-sm text-encre-muted font-body mt-1">
              Achetez ce livre pour laisser votre avis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-encre rounded-full flex items-center justify-center">
                      <span className="text-ivoire text-sm font-bold">
                        {review.userNom.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-body font-medium text-encre text-sm">{review.userNom}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s}
                              className={cn("w-3 h-3", s <= review.note
                                ? "text-or fill-or" : "text-sable-dark")} />
                          ))}
                        </div>
                        {review.achatVerifie && (
                          <span className="flex items-center gap-0.5 text-[10px] text-success font-body">
                            <CheckCircle className="w-3 h-3" /> Achat vérifié
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-encre-muted font-body">
                    {formatDate(review.creeLe)}
                  </span>
                </div>
                {review.commentaire && (
                  <p className="font-body text-sm text-encre leading-relaxed">{review.commentaire}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Retour */}
      <div className="mt-12">
        <Link href="/catalogue"
          className="inline-flex items-center gap-2 text-sm text-encre-muted hover:text-encre transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>
      </div>
    </div>
  );
}
