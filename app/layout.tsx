// src/app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: { default: "LibraMali", template: "%s | LibraMali" },
  description: "Votre librairie en ligne au Mali — livres neufs livrés chez vous.",
  keywords: ["librairie", "livres", "Mali", "e-commerce", "culture"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        {/* ✅ La Navbar doit être à l'intérieur du body */}
        <Navbar />
        
        {/* On peut envelopper children dans un <main> pour un meilleur SEO/Accessibilité */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* ✅ Le Toaster et le Footer aussi à l'intérieur du body */}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "DM Sans, sans-serif",
              borderRadius: "12px",
            },
          }}
        />
        <Footer />
      </body>
    </html>
  );
}