"use client";
// src/components/catalogue/ProductCard.tsx
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Star } from "lucide-react";
import { cn, formatPrix, truncate } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";

interface Props {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: Props) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Connectez-vous pour ajouter au panier.");
      router.push("/login");
      return;
    }
    try {
      await addItem(product.id, 1);
      toast.success(`"${truncate(product.titre, 30)}" ajouté au panier !`);
    } catch {
      toast.error("Impossible d'ajouter au panier. Réessayez.");
    }
  };

  const prixAffiche = product.prixPromo ?? product.prix;
  const enPromo = product.prixPromo != null && product.prixPromo < product.prix;

  return (
    <Link
      href={`/produit/${product.id}`}
      className={cn(
        "group relative flex flex-col bg-white rounded-2xl shadow-card hover:shadow-card-hover",
        "transition-all duration-300 hover:-translate-y-1 overflow-hidden",
        className
      )}
    >
{/* Image */}
<div className="relative h-52 bg-sable overflow-hidden">
  {product.imageUrl ? (
    <Image
      // On s'assure que l'URL est absolue ou commence par /
      src={
        product.imageUrl.startsWith('http') 
          ? product.imageUrl 
          : product.imageUrl.startsWith('/') 
            ? product.imageUrl 
            : `/${product.imageUrl}` // Ajoute le / si manquant
      }
      alt={product.titre}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      // sizes est correct pour les performances v4
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-20 h-28 bg-encre/10 rounded-lg flex items-center justify-center">
        <span className="font-display text-3xl text-encre/20">
          {product.titre?.charAt(0) || "?"}
        </span>
      </div>
    </div>
  )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {enPromo && (
            <span className="px-2 py-0.5 bg-or text-white text-xs font-bold rounded-full">
              -{product.promotionPct}%
            </span>
          )}
          {!product.enStock && (
            <span className="px-2 py-0.5 bg-encre/70 text-ivoire text-xs font-medium rounded-full">
              Épuisé
            </span>
          )}
        </div>

        {/* Bouton panier au hover */}
        {product.enStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 w-9 h-9 bg-encre text-ivoire rounded-full
                       flex items-center justify-center opacity-0 group-hover:opacity-100
                       translate-y-2 group-hover:translate-y-0
                       transition-all duration-200 hover:bg-or shadow-lg"
            aria-label="Ajouter au panier"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs text-encre-muted font-body mb-1 uppercase tracking-wide">
          {product.category?.nom ?? "Livre"}
        </p>
        <h3 className="font-display font-semibold text-encre text-sm leading-tight mb-0.5 line-clamp-2">
          {product.titre}
        </h3>
        <p className="text-xs text-encre-muted font-body mb-3">{product.auteur}</p>

        {/* Note */}
        {product.nbAvis > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3 h-3 text-or fill-or" />
            <span className="text-xs font-medium text-encre">{product.noteMoyenne.toFixed(1)}</span>
            <span className="text-xs text-encre-muted">({product.nbAvis})</span>
          </div>
        )}

        {/* Prix */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-display font-bold text-encre">
            {formatPrix(prixAffiche)}
          </span>
          {enPromo && (
            <span className="text-xs text-encre-muted line-through font-body">
              {formatPrix(product.prix)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
