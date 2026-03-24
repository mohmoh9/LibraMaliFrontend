"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Star, BookOpen } from "lucide-react";
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

const COULEURS_COUVERTURE = [
  { bg: "#1A1814", text: "#C9A84C" },
  { bg: "#2C3E6B", text: "#EDE8DF" },
  { bg: "#4A2C2A", text: "#DFC278" },
  { bg: "#1E3D2F", text: "#E8E0D0" },
  { bg: "#3D2C5E", text: "#DFC278" },
  { bg: "#5C3317", text: "#F7F4EF" },
  { bg: "#1C3A4A", text: "#C9A84C" },
  { bg: "#2D2D2D", text: "#E8E0D0" },
];

function getCouleurCouverture(titre: string) {
  let hash = 0;
  if (!titre) return COULEURS_COUVERTURE[0];
  for (let i = 0; i < titre.length; i++) hash = titre.charCodeAt(i) + ((hash << 5) - hash);
  return COULEURS_COUVERTURE[Math.abs(hash) % COULEURS_COUVERTURE.length];
}

export default function ProductCard({ product, className }: Props) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  
  const couleur = getCouleurCouverture(product.titre);
  
  // Utilisation des champs exacts du DTO Java (ProductResponse)
  const prixAffiche = product.prixPromo ?? product.prix;
  const enPromo = product.prixPromo !== null && product.prixPromo < product.prix;

  /**
   * VALIDATION DE L'IMAGE
   * Correction : On vérifie si l'URL est complète ou si elle commence par "/"
   */
  const imageValide = (() => {
    if (!product.imageUrl || typeof product.imageUrl !== "string" || product.imageUrl === "") return false;
    if (product.imageUrl.startsWith("http")) return true;
    if (product.imageUrl.startsWith("/")) return true;
    return false;
  })();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info("Connectez-vous pour ajouter au panier.");
      router.push("/login");
      return;
    }
    
    try {
      await addItem(product.id, 1);
      toast.success(`« ${truncate(product.titre, 28)} » ajouté !`);
    } catch (error) {
      toast.error("Impossible d'ajouter au panier.");
    }
  };

  return (
    <Link
      href={`/produit/${product.id}`} // Correction du chemin vers /catalogue/
      className={cn("group block focus:outline-none focus-visible:ring-2 focus-visible:ring-or/60 rounded-2xl", className)}
    >
      <article className="flex flex-col h-full">
        <div className="relative mb-3">
          {/* Ombre de tranche */}
          <div
            className="absolute left-0 top-1 bottom-1 w-3 rounded-l-sm"
            style={{
              background: `linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0.12))`,
              transform: "translateX(-2px) skewY(-0.5deg)",
              zIndex: 0,
              borderRadius: "2px 0 0 2px",
            }}
          />

          {/* Livre principal */}
          <div
            className="relative rounded-r-lg rounded-l-sm overflow-hidden transition-all duration-300
                       group-hover:-translate-y-1.5 group-hover:shadow-float bg-sable/20"
            style={{
              aspectRatio: "2/3",
              boxShadow: "2px 4px 20px rgba(26,24,20,0.18), -2px 0 6px rgba(0,0,0,0.12)",
            }}
          >
            {imageValide ? (
              <Image
                src={product.imageUrl!}
                alt={product.titre}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              /* Couverture de secours */
              <div
                className="absolute inset-0 flex flex-col justify-between p-3 select-none"
                style={{ backgroundColor: couleur.bg }}
              >
                <div className="space-y-1">
                  <div className="h-px w-full opacity-30" style={{ backgroundColor: couleur.text }} />
                  <div className="h-px w-3/4 opacity-20" style={{ backgroundColor: couleur.text }} />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-1 text-center gap-2">
                  <BookOpen className="w-8 h-8 opacity-30" style={{ color: couleur.text }} />
                  <p className="font-display text-[10px] sm:text-xs font-bold leading-snug line-clamp-4" style={{ color: couleur.text }}>
                    {product.titre}
                  </p>
                  <p className="font-body text-[9px] sm:text-[10px] opacity-60 line-clamp-1" style={{ color: couleur.text }}>
                    {product.auteur}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="h-px w-3/4 opacity-20" style={{ backgroundColor: couleur.text }} />
                  <div className="h-px w-full opacity-30" style={{ backgroundColor: couleur.text }} />
                </div>
              </div>
            )}

            {/* Reflet de tranche */}
            <div
              className="absolute inset-y-0 left-0 w-3 pointer-events-none"
              style={{ background: "linear-gradient(to right, rgba(255,255,255,0.15), transparent)" }}
            />

            {/* Badges */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              {enPromo && product.promotionPct && (
                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded-full shadow-sm">
                  -{product.promotionPct}%
                </span>
              )}
              {!product.enStock && (
                <span className="px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-medium rounded-full backdrop-blur-sm">
                  Épuisé
                </span>
              )}
            </div>

            {/* Panier au Hover */}
            {product.enStock && (
              <button
                onClick={handleAddToCart}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full
                           flex items-center justify-center shadow-lg
                           bg-white/95 backdrop-blur-sm text-slate-900
                           opacity-0 translate-y-1.5
                           group-hover:opacity-100 group-hover:translate-y-0
                           hover:bg-primary hover:text-white transition-all duration-200 z-10"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="flex-1 flex flex-col px-0.5">
          {/* Correction : On utilise categoryNom directement */}
          {product.categoryNom && (
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mb-0.5">
              {product.categoryNom}
            </p>
          )}
          
          <h3 className="font-semibold text-slate-900 text-xs sm:text-sm leading-tight line-clamp-2 mb-0.5">
            {product.titre}
          </h3>
          
          <p className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
            par {product.auteur}
          </p>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className={cn("font-bold", enPromo ? "text-red-600 text-sm" : "text-slate-900 text-xs")}>
                {formatPrix(prixAffiche)}
              </span>
              {enPromo && (
                <span className="text-[10px] text-slate-400 line-through">
                  {formatPrix(product.prix)}
                </span>
              )}
            </div>
            
            {(product.nbAvis ?? 0) > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-medium text-slate-700">
                  {product.noteMoyenne.toFixed(1) || "0.0"}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}