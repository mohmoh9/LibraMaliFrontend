import type { Metadata } from "next";
import { Toaster } from "sonner";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: { 
    default: "LibraMali - Vente de Livres au Mali", 
    template: "%s | LibraMali" 
  },
  description: "Livres neufs livrés chez vous à Bamako et partout au Mali.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={dmSans.variable}>
      <body className="antialiased bg-white text-slate-900 flex flex-col min-h-screen">
        
        {/* Navbar fixe en haut */}
        <Navbar />
        
        {/* LE FIX : 
            On ajoute 'pt-20' (Padding Top) qui correspond à la hauteur 
            de ta Navbar (h-20 = 80px). 
            Cela empêche tes pages d'être masquées au démarrage.
        */}
        <main className="flex-grow pt-20">
          {children}
        </main>

        <Footer />

        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-dm-sans)",
              borderRadius: "16px",
            },
          }}
        />
      </body>
    </html>
  );
}