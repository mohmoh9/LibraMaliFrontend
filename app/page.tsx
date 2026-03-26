"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, Star, Truck, Shield, BookOpen, 
  ShoppingBag, Sparkles, Flame, ChevronRight 
} from "lucide-react";
import api from "@/lib/api";
import type { Product, Category } from "@/types";
import { toast } from "sonner";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get("/products?limit=4"), // On récupère les 4 derniers
          api.get("/categories")
        ]);
        setFeaturedProducts(prodRes.data.data.content || []);
        setCategories(catRes.data.data || []);
      } catch (err) {
        console.error("Erreur chargement accueil", err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="bg-ivoire min-h-screen">
      
      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-or/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-encre text-ivoire rounded-full text-xs font-bold tracking-widest uppercase">
                <Sparkles className="w-3 h-3 text-or" />
                Librairie Numérique du Mali
              </div>
              
              <h1 className="font-display text-6xl lg:text-8xl font-black text-encre leading-none tracking-tighter">
                Libérez votre <br />
                <span className="text-or">imagination.</span>
              </h1>
              
              <p className="text-xl text-encre-muted font-body max-w-md leading-relaxed">
                Le plus large catalogue de littérature africaine et internationale, livré chez vous à Bamako en 24h.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/catalogue" className="btn-primary group h-14 px-8 text-lg">
                  Acheter maintenant
                  <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </Link>
                <div className="flex -space-x-3 items-center ml-2">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-ivoire bg-sable flex items-center justify-center text-[10px] font-bold">
                       {i}k+
                     </div>
                   ))}
                   <p className="ml-6 text-xs font-bold text-encre-muted uppercase tracking-widest">Lecteurs actifs au Mali</p>
                </div>
              </div>
            </div>

            {/* Visuel Impactant */}
            <div className="relative group">
              <div className="absolute inset-0 bg-or rounded-[3rem] rotate-3 scale-95 opacity-20 blur-xl group-hover:rotate-6 transition-transform" />
              <div className="relative aspect-[4/5] bg-sable rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80" 
                  alt="Reading" 
                  className="object-cover w-full h-full grayscale-[20%] group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg">
                  <p className="font-display font-bold text-encre text-lg italic">"Un livre est un jardin que l'on porte dans sa poche."</p>
                  <p className="text-or text-sm font-bold mt-2">— Proverbe Africain</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARCOURIR PAR CATÉGORIES ────────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-sable/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-encre tracking-tight">Nos Rayons</h2>
              <p className="text-encre-muted font-medium">Trouvez votre prochain coup de cœur par genre</p>
            </div>
            <Link href="/catalogue" className="text-or font-bold flex items-center gap-1 hover:underline">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link 
                key={cat.id} 
                href={`/catalogue?category=${cat.id}`}
                className="group p-6 bg-ivoire rounded-3xl border border-transparent hover:border-or/30 hover:shadow-xl hover:shadow-or/5 transition-all text-center"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-or" />
                </div>
                <span className="font-bold text-encre group-hover:text-or transition-colors">{cat.nom}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUITS VEDETTES ───────────────────────────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-or rounded-2xl flex items-center justify-center text-white shadow-lg shadow-or/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-4xl font-black text-encre tracking-tight">Les Incontournables</h2>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-sable/30 rounded-full text-xs font-black uppercase tracking-widest text-encre-muted">Populaires cette semaine</div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] bg-sable/20 animate-pulse rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group bg-white p-4 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-sable/20 relative">
                {/* Badge Promotion ou Nouveau */}
                <div className="absolute top-6 left-6 z-10 bg-or text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                  Best-Seller
                </div>
                
                <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 bg-sable/10">
                  <img 
                    src={product.imageUrl || "/placeholder-book.jpg"} 
                    alt={product.titre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                
                <div className="space-y-2 px-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-or">{product.categoryNom}</p>
                  <h3 className="font-display font-bold text-encre text-lg leading-tight line-clamp-1 group-hover:text-or transition-colors">
                    {product.titre}
                  </h3>
                  <p className="text-sm text-encre-muted italic">{product.auteur}</p>
                  
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-2xl font-black text-encre">{product.prix} FCFA</span>
                    <button className="w-12 h-12 bg-encre text-white rounded-2xl flex items-center justify-center hover:bg-or transition-all active:scale-90 shadow-lg">
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── REASSURANCE (CONFIANCE) ──────────────────────────────────────── */}
      <section className="bg-encre py-20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-12 relative z-10">
          <div className="flex gap-6 items-center">
             <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Truck className="w-8 h-8 text-or" />
             </div>
             <div>
               <h4 className="text-ivoire font-bold text-lg">Livraison Bamako</h4>
               <p className="text-ivoire/40 text-sm">Chez vous en moins de 24h chrono.</p>
             </div>
          </div>
          <div className="flex gap-6 items-center">
             <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Shield className="w-8 h-8 text-or" />
             </div>
             <div>
               <h4 className="text-ivoire font-bold text-lg">Paiement Local</h4>
               <p className="text-ivoire/40 text-sm">Orange Money, Moov ou Espèces.</p>
             </div>
          </div>
          <div className="flex gap-6 items-center">
             <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Star className="w-8 h-8 text-or" />
             </div>
             <div>
               <h4 className="text-ivoire font-bold text-lg">Qualité Garantie</h4>
               <p className="text-ivoire/40 text-sm">Des livres neufs et originaux uniquement.</p>
             </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}