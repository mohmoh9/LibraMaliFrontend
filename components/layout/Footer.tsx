"use client";
// src/components/layout/Footer.tsx
import Link from "next/link";
import { BookOpen, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-encre text-ivoire mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-or rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-xl font-semibold">LibraMali</span>
            </div>
            <p className="text-encre-muted text-sm leading-relaxed max-w-xs" style={{color:"#9B9590"}}>
              Votre librairie en ligne au Mali. Des milliers de titres livrés directement chez vous.
            </p>
            <div className="flex flex-col gap-2 text-sm" style={{color:"#9B9590"}}>
              <a href="mailto:libramali16@gmail.com"
                className="flex items-center gap-2 hover:text-or transition-colors">
                <Mail className="w-3.5 h-3.5" />
                libramali16@gmail.com
              </a>
              <a href="tel:+22370717273"
                className="flex items-center gap-2 hover:text-or transition-colors">
                <Phone className="w-3.5 h-3.5" />
                +223 70 71 72 73
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-body text-xs uppercase tracking-widest text-encre-muted mb-4"
              style={{color:"#9B9590"}}>
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/catalogue", label: "Catalogue" },
                { href: "/catalogue?nouveautes=true", label: "Nouveautés" },
                { href: "/panier", label: "Mon panier" },
                { href: "/mon-compte/commandes", label: "Mes commandes" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm transition-colors hover:text-or"
                    style={{color:"#C4BFB9"}}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h3 className="font-body text-xs uppercase tracking-widest mb-4"
              style={{color:"#9B9590"}}>
              Informations
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/livraison", label: "Livraison & délais" },
                { href: "/retours", label: "Retours & remboursements" },
                { href: "/cgv", label: "Conditions générales" },
                { href: "/confidentialite", label: "Confidentialité" },
                { href: "/mentions", label: "Mentions Légales" },

              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-sm transition-colors hover:text-or"
                    style={{color:"#C4BFB9"}}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
<div className="mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6"
     style={{ borderColor: "rgba(107, 101, 96, 0.3)" }}>
  
  {/* Section Copyright */}
  <div className="flex items-center gap-2">
    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#D4AF37", opacity: 0.6 }}></span>
    <p className="text-xs font-medium tracking-wide uppercase italic" style={{ color: "#6B6560" }}>
      © {new Date().getFullYear()} <span style={{ color: "#D4AF37", opacity: 0.8 }}>LibraMali</span>.
    </p>
  </div>

  {/* Section Signature */}
  <div className="flex items-center gap-2 text-xs" style={{ color: "#6B6560" }}>
    <span>Propulsé par</span>
    <a 
      href="https://tamboura-moh.vercel.app"
      target="_blank" 
      rel="noopener noreferrer"
      className="group relative flex items-center gap-1 font-mono text-[11px] transition-all duration-300"
    >
      <span className="font-bold text-white/90 group-hover:text-white transition-colors">
        mohamed
      </span>
      
      {/* CORRECTION : Un seul className et un seul style */}
      <span 
        className="px-2 py-0.5 rounded shadow-inner transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:text-[#2D2A26] group-hover:shadow-md"
        style={{ 
          backgroundColor: "rgba(212, 175, 55, 0.1)", 
          color: "#D4AF37", 
          border: "1px solid rgba(212, 175, 55, 0.2)" 
        }}
      >
        .dev
      </span>

      {/* Trait de surbrillance Or */}
      <span className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
            style={{ backgroundColor: "#D4AF37" }}>
      </span>
    </a>
  </div>
  </div>
      </div>
    </footer>
  );
}
