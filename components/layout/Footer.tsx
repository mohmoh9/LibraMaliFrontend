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
              <a href="mailto:contact@libramali.com"
                className="flex items-center gap-2 hover:text-or transition-colors">
                <Mail className="w-3.5 h-3.5" />
                contact@libramali.com
              </a>
              <a href="tel:+22300000000"
                className="flex items-center gap-2 hover:text-or transition-colors">
                <Phone className="w-3.5 h-3.5" />
                +223 00 00 00 00
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
        <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{borderColor:"#2D2A26"}}>
          <p className="text-xs" style={{color:"#6B6560"}}>
            © {new Date().getFullYear()} LibraMali. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1 text-xs" style={{color:"#6B6560"}}>
            <span>Fait avec</span>
            <span className="text-or">♥</span>
            <span>au Mali</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
