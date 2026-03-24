// src/app/(main)/layout.tsx
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-screen pt-16">
        {children}
      </main>
    </>
  );
}
