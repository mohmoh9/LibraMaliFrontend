// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrix(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + " FCFA";
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateCourte(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function statutCommandeLabel(statut: string): string {
  const labels: Record<string, string> = {
    EN_ATTENTE: "En attente",
    CONFIRMEE: "Confirmée",
    EXPEDIEE: "Expédiée",
    LIVREE: "Livrée",
    ANNULEE: "Annulée",
  };
  return labels[statut] ?? statut;
}

export function statutCommandeColor(statut: string): string {
  const colors: Record<string, string> = {
    EN_ATTENTE: "badge-warning",
    CONFIRMEE: "badge-neutral",
    EXPEDIEE: "badge-neutral",
    LIVREE: "badge-success",
    ANNULEE: "badge-error",
  };
  return colors[statut] ?? "badge-neutral";
}

export function statutLivraisonLabel(statut: string): string {
  const labels: Record<string, string> = {
    EN_PREPARATION: "En préparation",
    EXPEDIEE: "Expédiée",
    EN_COURS: "En cours de livraison",
    LIVREE: "Livrée",
  };
  return labels[statut] ?? statut;
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

export function noteEtoiles(note: number): string {
  return "★".repeat(Math.round(note)) + "☆".repeat(5 - Math.round(note));
}