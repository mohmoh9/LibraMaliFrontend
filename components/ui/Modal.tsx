"use client";
// src/components/ui/Modal.tsx
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

const SIZES = {
  sm:  "max-w-sm",
  md:  "max-w-lg",
  lg:  "max-w-2xl",
  xl:  "max-w-3xl",
};

export default function Modal({ open, onClose, title, size = "md", children }: Props) {
  // Fermer avec Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquer le scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fond */}
      <div
        className="absolute inset-0 bg-encre/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panneau */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-float animate-slide-up",
          "flex flex-col max-h-[90vh]",
          SIZES[size]
        )}
        style={{ animationFillMode: "forwards" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sable shrink-0">
          <h2 className="font-display text-lg font-bold text-encre">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Corps scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
