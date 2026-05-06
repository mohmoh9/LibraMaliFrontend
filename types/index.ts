// src/types/index.ts

export type Role = "CLIENT" | "ADMIN" | "INFLUENCEUR";
export type StatutCommande = "EN_ATTENTE" | "CONFIRMEE" | "EXPEDIEE" | "LIVREE" | "ANNULEE";
export type StatutPaiement = "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "REMBOURSE";
export type StatutLivraison = "EN_PREPARATION" | "EXPEDIEE" | "EN_COURS" | "LIVREE";
export type MethodePaiement = "CASH" | "MOBILE_MONEY" | "CARTE";

// ── Réponse API générique ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // Numéro de la page actuelle (0-indexed)
  numberOfElements: number; // Nombre d'éléments sur la page actuelle
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  nom: string;
  email: string;
  role: Role;
  telephone?: string;
  profilComplet: boolean;
  nouveauCompte: boolean;
}

// types/influenceur.ts 
export interface InfluenceurStats {
  id: number;
  userId: number;
  userNom: string;
  userEmail: string;
  codePromo: string;
  commission: number;
  totalVentes: number;
  nbCommandes: number;
  commissionGagnee: number;
  nbPromosActives: number;
}
// ── Utilisateur ───────────────────────────────────────────────────────────────
export interface User {
  id: number;
  nom: string;
  email: string;
  role: Role;
  telephone?: string;
  emailVerifie: boolean;
  creeLe: string;
  misAJourLe?: string;
    aMotDePasse: boolean;
}

// ── Catégorie ─────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  nom: string;
  description?: string;
  nbProduits: number;
  nbProduitsTotaux: number;
}

// ── Produit ───────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  titre: string;
  auteur: string;
  prix: number;
  prixPromo: number | null; 
  stock: number;
  enStock: boolean;
  imageUrl: string | null; 
  description?: string;
  noteMoyenne: number;
  nbAvis: number;
  actif: boolean;
  creeLe: string;
  categoryId: number;
  categoryNom: string;
  promotionCode: string | null;
  promotionPct: number | null; 
}

// ── Panier ────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: number;
  productId: number;
  productTitre: string;
  productAuteur: string;
  productImageUrl?: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
  stockDisponible: number;
  produitActif: boolean;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: number;
  nombreArticles: number;
  codePromoApplique?: string;
  montantReduction?: number;
  totalApresReduction?: number;
  avertissements?: string[];
}

// ── Commande ──────────────────────────────────────────────────────────────────
export interface OrderItem {
  id: number;
  productId: number;
  productTitre: string;
  productAuteur: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface Order {
  id: number;
  dateCommande: string;
  statut: StatutCommande;
  total: number;
  totalAvantReduction?: number;
  montantReduction?: number;
  codePromoUtilise?: string;
  userId: number;
  userEmail: string;
  userNom: string;
  adresseLivraison?: string;
  items: OrderItem[];
  payment?: Payment;
  delivery?: Delivery;
}

export interface OrderStats {
  totalCommandes: number;
  enAttente: number;
  confirmees: number;
  expediees: number;
  livrees: number;
  annulees: number;
  chiffreAffaireTotal: number;
  chiffreAffaireMoisEnCours: number;
}

// ── Paiement ──────────────────────────────────────────────────────────────────
export interface Payment {
  id: number;
  orderId: number;
  montant: number;
  methode: MethodePaiement;
  statut: StatutPaiement;
  referenceTransaction?: string;
  datePaiement: string;
  userNom: string;
  userEmail: string;
}

// ── Livraison ─────────────────────────────────────────────────────────────────
export interface Delivery {
  id: number;
  orderId: number;
  adresse: string;
  ville: string;
  statut: StatutLivraison;
  numeroSuivi?: string;
  dateLivraisonPrevue?: string;
  dateLivraisonReelle?: string;
  notesLivreur?: string;
  userNom: string;
  userEmail: string;
}

// ── Avis ──────────────────────────────────────────────────────────────────────
export interface Review {
  id: number;
  note: number;
  commentaire?: string;
  creeLe: string;
  misAJourLe?: string;
  userId: number;
  userNom: string;
  productId: number;
  productTitre: string;
  achatVerifie: boolean;
}

// ── Adresse ───────────────────────────────────────────────────────────────────
export interface Address {
  id: number;
  rue: string;
  ville: string;
  quartier?: string;
  complement?: string;
  estPrincipale: boolean;
  userId: number;
}

// ── Promotion ─────────────────────────────────────────────────────────────────
export interface Promotion {
  id: number;
  code: string;
  pourcentage: number;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  valide: boolean;
  productId?: number;
  productTitre?: string;
  influenceurId?: number;
  influenceurNom?: string;
}