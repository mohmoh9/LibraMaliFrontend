// src/app/(main)/page.tsx
import Link from "next/link";
import { ArrowRight, Star, Truck, Shield, BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-ivoire">
        {/* Motif décoratif */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full
                          bg-gradient-to-br from-or/10 to-sable/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full
                          bg-or/5 blur-2xl" />
          {/* Grille typographique décorative */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block
                          text-[180px] font-display font-bold text-sable/50 leading-none
                          select-none tracking-tighter">
            LIRE
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-or/10 rounded-full">
              <Star className="w-3.5 h-3.5 text-or fill-or" />
              <span className="text-xs font-medium text-or">Nouvelle collection disponible</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-display-xl font-bold text-encre leading-[1.08] tracking-tight">
              La culture à portée de{" "}
              <span className="relative inline-block">
                main
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-or rounded-full" />
              </span>
            </h1>

            <p className="font-body text-lg text-encre-muted leading-relaxed max-w-lg">
              Des milliers de livres soigneusement sélectionnés, livrés directement chez vous au Mali.
              Découvrez la littérature africaine et internationale.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/catalogue" className="btn-primary px-8 py-3.5 text-base">
                Explorer le catalogue
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-8 py-3.5 text-base">
                Se connecter
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              {[
                { val: "5 000+", label: "Titres disponibles" },
                { val: "4.8★", label: "Note moyenne" },
                { val: "48h", label: "Livraison rapide" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-bold text-encre">{s.val}</div>
                  <div className="text-xs text-encre-muted font-body">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration — empilage de "livres" stylisés */}
          <div className="hidden lg:flex items-center justify-center relative h-[480px] animate-slide-up animate-delay-200">
            {[
              { color: "#C9A84C", rotate: "-8deg", top: "60px", left: "40px", z: 10 },
              { color: "#1A1814", rotate: "4deg", top: "30px", left: "120px", z: 20 },
              { color: "#E8E0D0", rotate: "-2deg", top: "80px", left: "200px", z: 15 },
              { color: "#C9A84C", rotate: "6deg", top: "20px", left: "270px", z: 5 },
            ].map((book, i) => (
              <div
                key={i}
                className="absolute w-28 h-72 rounded-lg shadow-float transition-transform hover:-translate-y-2"
                style={{
                  backgroundColor: book.color,
                  transform: `rotate(${book.rotate})`,
                  top: book.top,
                  left: book.left,
                  zIndex: book.z,
                }}
              >
                <div className="absolute bottom-6 left-3 right-3">
                  <div className="w-full h-0.5 bg-white/20 mb-2" />
                  <div className="w-2/3 h-0.5 bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALEURS ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 border-y border-sable">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: <Truck className="w-5 h-5" />,
                titre: "Livraison rapide",
                texte: "Réception en 24 à 48h dans les grandes villes du Mali",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                titre: "Paiement sécurisé",
                texte: "Cash, Mobile Money ou carte bancaire en toute sécurité",
              },
              {
                icon: <BookOpen className="w-5 h-5" />,
                titre: "Catalogue riche",
                texte: "Littérature africaine, scolaire, académique et internationale",
              },
            ].map((item) => (
              <div key={item.titre} className="flex items-start gap-4 p-6 rounded-2xl hover:bg-ivoire transition-colors">
                <div className="w-10 h-10 bg-or/10 rounded-xl flex items-center justify-center text-or shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-encre mb-1">{item.titre}</h3>
                  <p className="text-sm text-encre-muted font-body leading-relaxed">{item.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-encre text-ivoire">
        <div className="max-w-3xl mx-auto text-center px-4 space-y-6">
          <h2 className="font-display text-display-md font-bold leading-tight">
            Prêt à explorer notre bibliothèque ?
          </h2>
          <p className="font-body text-base leading-relaxed" style={{ color: "#9B9590" }}>
            Créez votre compte gratuitement et commencez à commander vos livres en quelques clics.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/catalogue" className="btn-gold px-8 py-3.5">
              Voir le catalogue <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="btn-secondary px-8 py-3.5"
              style={{ borderColor: "#2D2A26", color: "#EDE8DF" }}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
