"use client";
// src/components/catalogue/ProductCard.tsx
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Star, BookOpen, Heart } from "lucide-react";
import { cn, formatPrix, truncate } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";

interface Props {
  product:         Product;
  className?:      string;
  isFavori?:       boolean;
  onToggleFavori?: (e: React.MouseEvent) => void;
  isToggling?:     boolean;
}

const COULEURS = [
  { bg: "#1A1814", text: "#C9A84C" },
  { bg: "#2C3E6B", text: "#EDE8DF" },
  { bg: "#4A2C2A", text: "#DFC278" },
  { bg: "#1E3D2F", text: "#E8E0D0" },
  { bg: "#3D2C5E", text: "#DFC278" },
  { bg: "#5C3317", text: "#F7F4EF" },
  { bg: "#1C3A4A", text: "#C9A84C" },
  { bg: "#2D2D2D", text: "#E8E0D0" },
];

function getCouleur(titre: string) {
  let h = 0;
  for (let i = 0; i < titre.length; i++) h = titre.charCodeAt(i) + ((h << 5) - h);
  return COULEURS[Math.abs(h) % COULEURS.length];
}

function imageOk(url?: string | null): url is string {
  return typeof url === "string" && url.length > 0 &&
    (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"));
}

export default function ProductCard({
  product, className,
  isFavori = false, onToggleFavori, isToggling = false,
}: Props) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const couleur = getCouleur(product.titre);
  const prixAffiche = product.prixPromo ?? product.prix;
  const enPromo = product.prixPromo != null && product.prixPromo < product.prix;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.info("Connectez-vous pour ajouter au panier."); router.push("/login"); return; }
    try { await addItem(product.id, 1); toast.success(`\u00ab ${truncate(product.titre, 28)} \u00bb ajout\u00e9 !`); }
    catch { toast.error("Impossible d'ajouter au panier."); }
  };

  return (
    <Link href={`/produit/${product.id}`}
      className={cn("group block focus:outline-none focus-visible:ring-2 focus-visible:ring-or/60 rounded-2xl", className)}>
      <article className="flex flex-col h-full">

        <div className="relative mb-3">
          {/* Tranche 3D */}
          <div className="absolute left-0 top-1 bottom-1 w-3 rounded-l-sm pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0.12))", transform: "translateX(-2px) skewY(-0.5deg)", zIndex: 0, borderRadius: "2px 0 0 2px" }} />

          {/* Corps livre */}
          <div className="relative rounded-r-lg rounded-l-sm overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-float"
            style={{ aspectRatio: "2/3", boxShadow: "2px 4px 20px rgba(26,24,20,0.18), -2px 0 6px rgba(0,0,0,0.12)" }}>

            {imageOk(product.imageUrl) ? (
              <Image src={product.imageUrl} alt={product.titre} fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
            ) : (
              <div className="absolute inset-0 flex flex-col justify-between p-3 select-none"
                style={{ backgroundColor: couleur.bg }}>
                <div className="space-y-1">
                  <div className="h-px w-full opacity-30" style={{ backgroundColor: couleur.text }} />
                  <div className="h-px w-3/4 opacity-20" style={{ backgroundColor: couleur.text }} />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-1 text-center gap-2">
                  <BookOpen className="w-8 h-8 opacity-30" style={{ color: couleur.text }} />
                  <p className="font-display text-xs font-bold leading-snug line-clamp-4" style={{ color: couleur.text }}>{product.titre}</p>
                  <p className="font-body text-[10px] opacity-60 line-clamp-1" style={{ color: couleur.text }}>{product.auteur}</p>
                </div>
                <div className="space-y-1">
                  <div className="h-px w-3/4 opacity-20" style={{ backgroundColor: couleur.text }} />
                  <div className="h-px w-full opacity-30" style={{ backgroundColor: couleur.text }} />
                </div>
              </div>
            )}

            {/* Reflet tranche */}
            <div className="absolute inset-y-0 left-0 w-3 pointer-events-none"
              style={{ background: "linear-gradient(to right, rgba(255,255,255,0.18), transparent)" }} />

            {/* Badges */}
            {enPromo && (
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 bg-or text-white text-[10px] font-bold rounded-full shadow-sm">-{product.promotionPct}%</span>
              </div>
            )}
            {!product.enStock && (
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 bg-encre/75 text-ivoire text-[10px] font-medium rounded-full">Épuisé</span>
              </div>
            )}

            {/* Indicateur favori permanent (hors hover) */}
            {isFavori && (
              <div className="absolute top-2.5 right-2.5 group-hover:opacity-0 transition-opacity duration-150">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                  <Heart className="w-2.5 h-2.5 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Actions hover */}
            <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">

              {/* Panier */}
              {product.enStock && (
                <button onClick={handleAddToCart} aria-label="Ajouter au panier"
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-white/90 backdrop-blur-sm text-encre hover:bg-encre hover:text-white transition-all duration-150">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Favori */}
              {onToggleFavori && (
                <button onClick={onToggleFavori} disabled={isToggling}
                  aria-label={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-150",
                    isToggling ? "bg-white/70 text-encre-muted cursor-wait"
                      : isFavori ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-white/90 text-encre hover:bg-red-500 hover:text-white"
                  )}>
                  <Heart className={cn("w-3.5 h-3.5 transition-all", isToggling && "animate-pulse", isFavori && "fill-current")} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Infos */}
        <div className="flex-1 flex flex-col px-0.5">
          {product.categoryId && (
            <p className="text-[10px] text-encre-muted font-body uppercase tracking-wider mb-0.5">{product.categoryNom}</p>
          )}
          <h3 className="font-display font-semibold text-encre text-sm leading-tight line-clamp-2 mb-0.5">{product.titre}</h3>
          <p className="text-xs text-encre-muted font-body line-clamp-1 mb-2">{product.auteur}</p>
          {product.nbAvis > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={cn("w-2.5 h-2.5", s <= Math.round(product.noteMoyenne) ? "text-or fill-or" : "text-sable-dark fill-sable-dark")} />
              ))}
              <span className="text-[10px] text-encre-muted font-body ml-0.5">({product.nbAvis})</span>
            </div>
          )}
          <div className="mt-auto flex items-baseline gap-1.5">
            <span className={cn("font-display font-bold", enPromo ? "text-or text-base" : "text-encre text-sm")}>
              {formatPrix(prixAffiche)}
            </span>
            {enPromo && <span className="text-[11px] text-encre-muted line-through font-body">{formatPrix(product.prix)}</span>}
          </div>
        </div>
      </article>
    </Link>
  );
}
