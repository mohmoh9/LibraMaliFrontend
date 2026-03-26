"use client";
// src/app/(main)/produit/[id]/page.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, Star, ArrowLeft, Minus, Plus,
  CheckCircle, AlertCircle, Loader2, FileText,
  BookOpen, Heart, Pencil, Trash2, Send, X,
  ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { formatPrix, formatDate, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { useFavoris } from "@/hooks/useFavoris";
import type { Product, Review, PageResponse, ApiResponse } from "@/types";

/* ── Sélecteur d'étoiles interactif ─────────────────────────────────────── */
function StarPicker({
  value, onChange, size = "md", readonly = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const cls = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" }[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn("transition-transform", !readonly && "hover:scale-110 cursor-pointer")}
          aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              cls, "transition-colors",
              s <= (hover || value) ? "text-amber-500 fill-amber-500" : "text-slate-200 fill-slate-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/* ── Labels de note ──────────────────────────────────────────────────────── */
const NOTE_LABELS: Record<number, string> = {
  1: "Très décevant",
  2: "Décevant",
  3: "Correct",
  4: "Bon",
  5: "Excellent !",
};

/* ── Page principale ─────────────────────────────────────────────────────── */
export default function ProduitPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const productId = Number(id);

  const { isAuthenticated, userId } = useAuthStore();
  const { addItem }                 = useCartStore();
  const { isFavori, toggleFavori, isToggling } = useFavoris();

  /* ── États ── */
  const [product,      setProduct]      = useState<Product | null>(null);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewPage,   setReviewPage]   = useState(0);
  const [totalRvwPages,setTotalRvwPages]= useState(1);
  const [loading,      setLoading]      = useState(true);
  const [qty,          setQty]          = useState(1);
  const [adding,       setAdding]       = useState(false);
  const [devisLoading, setDevisLoading] = useState(false);

  // Mon avis existant
  const [monAvis,      setMonAvis]      = useState<Review | null>(null);
  const [aAchete,      setAAchete]      = useState<boolean | null>(null);

  // Formulaire avis
  const [showForm,     setShowForm]     = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [formNote,     setFormNote]     = useState(5);
  const [formComment,  setFormComment]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [deletingAvis, setDeletingAvis] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  /* ── Chargement produit ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [prodRes, revRes] = await Promise.all([
          api.get<ApiResponse<Product>>(`/products/${productId}`),
          api.get<ApiResponse<PageResponse<Review>>>(`/products/${productId}/reviews?page=0&size=5`),
        ]);
        if (prodRes.data.success) setProduct(prodRes.data.data);
        if (revRes.data.success) {
          setReviews(revRes.data.data.content ?? []);
          setTotalReviews(revRes.data.data.totalElements ?? 0);
          setTotalRvwPages(revRes.data.data.totalPages ?? 1);
        }
      } catch {
        toast.error("Produit introuvable.");
        router.push("/catalogue");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Charger mon avis + vérif achat ─────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated || !productId) return;

    // Chercher si j'ai déjà un avis sur ce produit
    api.get<ApiResponse<PageResponse<Review>>>("/reviews/my?page=0&size=50")
      .then(({ data }) => {
        if (data.success) {
          const found = data.data.content.find(r => r.productId === productId) ?? null;
          setMonAvis(found);
        }
      })
      .catch(() => {});

    // Vérifier si l'utilisateur a acheté le produit (via ses commandes)
    api.get("/orders/my?page=0&size=50")
      .then(({ data }) => {
        const payload  = data?.data ?? data;
        const orders   = payload?.content ?? [];
        const achete   = orders.some((o: any) =>
          o.statut === "LIVREE" &&
          o.items?.some((item: any) => item.productId === productId)
        );
        setAAchete(achete);
      })
      .catch(() => setAAchete(false));
  }, [isAuthenticated, productId]);

  /* ── Pagination avis ─────────────────────────────────────────────────── */
  const loadReviews = useCallback(async (page: number) => {
    try {
      const { data } = await api.get<ApiResponse<PageResponse<Review>>>(
        `/products/${productId}/reviews?page=${page}&size=5`
      );
      if (data.success) {
        setReviews(data.data.content ?? []);
        setTotalReviews(data.data.totalElements ?? 0);
        setTotalRvwPages(data.data.totalPages ?? 1);
        setReviewPage(page);
      }
    } catch { /* silencieux */ }
  }, [productId]);

  /* ── Panier ─────────────────────────────────────────────────────────── */
  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.info("Connectez-vous d'abord."); router.push("/login"); return; }
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.id, qty);
      toast.success(`« ${product.titre} » ajouté au panier !`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  /* ── Devis PDF ───────────────────────────────────────────────────────── */
  const handleDevis = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setDevisLoading(true);
    try {
      const res = await api.post("/devis/panier", {}, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href = url; a.download = `devis_${Date.now()}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Devis téléchargé !");
    } catch {
      toast.error("Impossible de générer le devis.");
    } finally {
      setDevisLoading(false);
    }
  };

  /* ── Ouvrir formulaire avis ──────────────────────────────────────────── */
  const openForm = (edit = false) => {
    if (edit && monAvis) {
      setFormNote(monAvis.note);
      setFormComment(monAvis.commentaire ?? "");
      setEditMode(true);
    } else {
      setFormNote(5);
      setFormComment("");
      setEditMode(false);
    }
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  /* ── Soumettre / modifier avis ───────────────────────────────────────── */
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formNote < 1) { toast.error("Choisissez une note."); return; }
    setSubmitting(true);
    try {
      let saved: Review;
      if (editMode && monAvis) {
        const { data } = await api.put<ApiResponse<Review>>(
          `/reviews/${monAvis.id}`,
          { note: formNote, commentaire: formComment.trim() || undefined }
        );
        saved = data.data;
        toast.success("Avis mis à jour !");
      } else {
        const { data } = await api.post<ApiResponse<Review>>(
          "/reviews",
          { productId, note: formNote, commentaire: formComment.trim() || undefined }
        );
        saved = data.data;
        toast.success("Avis publié !");
      }
      setMonAvis(saved);
      setShowForm(false);
      // Recalculer la note affichée
      if (product) {
        const n = product.nbAvis;
        const newNb   = editMode ? n : n + 1;
        const oldNote = editMode ? (monAvis?.note ?? formNote) : 0;
        const sum     = product.noteMoyenne * n;
        const newMoy  = editMode
          ? (sum - oldNote + formNote) / n
          : (sum + formNote) / newNb;
        setProduct({ ...product, noteMoyenne: Math.round(newMoy * 10) / 10, nbAvis: newNb });
      }
      // Recharger les avis
      await loadReviews(0);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes("achat") || msg.includes("LIVREE")) {
        toast.error("Vous devez avoir reçu ce produit pour laisser un avis.");
      } else if (msg.includes("déjà")) {
        toast.error("Vous avez déjà un avis sur ce produit.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Supprimer son avis ──────────────────────────────────────────────── */
  const handleDeleteReview = async () => {
    if (!monAvis || !confirm("Supprimer votre avis ?")) return;
    setDeletingAvis(true);
    try {
      await api.delete(`/reviews/${monAvis.id}`);
      setMonAvis(null);
      toast.success("Avis supprimé.");
      if (product) {
        const newNb  = Math.max(0, product.nbAvis - 1);
        const newMoy = newNb === 0 ? 0 : (product.noteMoyenne * product.nbAvis - monAvis.note) / newNb;
        setProduct({ ...product, nbAvis: newNb, noteMoyenne: Math.round(newMoy * 10) / 10 });
      }
      await loadReviews(0);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingAvis(false);
    }
  };

  /* ── Skeleton ────────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-slate-100 rounded-3xl h-[520px]" />
        <div className="space-y-6">
          <div className="h-4 bg-slate-100 w-1/4 rounded" />
          <div className="h-12 bg-slate-100 w-3/4 rounded" />
          <div className="h-4 bg-slate-100 w-1/2 rounded" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-14 bg-slate-100 rounded-full" />
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const prixAffiche = product.prixPromo ?? product.prix;
  const sousTotal   = prixAffiche * qty;
  const enPromo     = product.prixPromo != null && product.prixPromo < product.prix;
  const noteAff     = product.noteMoyenne ? Math.round(product.noteMoyenne * 10) / 10 : 0;
  const imgOk       = product.imageUrl &&
    (product.imageUrl.startsWith("http") || product.imageUrl.startsWith("/"));
  const favori      = isFavori(product.id);
  const toggling    = isToggling(product.id);

  /* ── Peut poster un avis ? ── */
  const peutAvis = isAuthenticated && aAchete && !monAvis;
  const peutEditer = isAuthenticated && !!monAvis;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-slate-900 transition-colors">Accueil</Link>
        <span className="text-slate-300">/</span>
        <Link href="/catalogue" className="hover:text-slate-900 transition-colors">Catalogue</Link>
        {product.categoryNom && (
          <>
            <span className="text-slate-300">/</span>
            <Link href={`/catalogue?categoryId=${product.categoryId}`}
              className="hover:text-slate-900 transition-colors">
              {product.categoryNom}
            </Link>
          </>
        )}
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 truncate max-w-[150px]">{product.titre}</span>
      </nav>

      {/* ── Grille principale ──────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 animate-in fade-in duration-500">

        {/* Colonne image */}
        <div className="relative">
          <div className="sticky top-24">
            <div className="relative aspect-[3/4] bg-slate-50 rounded-3xl overflow-hidden shadow-inner border border-slate-100">
              {imgOk ? (
                <Image src={product.imageUrl!} alt={product.titre} fill priority
                  className="object-contain p-8 transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-300">
                  <BookOpen className="w-20 h-20 mb-4 opacity-20" />
                  <span className="text-sm font-bold uppercase tracking-widest opacity-40">
                    Couverture non disponible
                  </span>
                </div>
              )}
              {enPromo && (
                <div className="absolute top-6 right-6 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-xl">
                  -{product.promotionPct}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne infos */}
        <div className="space-y-6">

          {/* Catégorie + titre + auteur */}
          <div className="space-y-3">
            {product.categoryNom && (
              <Link href={`/catalogue?categoryId=${product.categoryId}`}
                className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors">
                {product.categoryNom}
              </Link>
            )}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {product.titre}
            </h1>
            <p className="text-xl text-slate-500 italic">par {product.auteur}</p>

            {/* Note */}
            {product.nbAvis > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{noteAff}</span>
                </div>
                <button
                  onClick={() => document.getElementById("avis-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-sm text-slate-400 font-medium hover:text-slate-700 transition-colors underline-offset-2 hover:underline"
                >
                  {product.nbAvis} avis clients
                </button>
              </div>
            )}
          </div>

          {/* Prix */}
          <div className="flex items-baseline gap-4 border-y border-slate-100 py-6">
            <span className="text-4xl font-black text-slate-900">{formatPrix(prixAffiche)}</span>
            {enPromo && (
              <span className="text-xl text-slate-300 line-through">{formatPrix(product.prix)}</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-slate-600 leading-relaxed text-sm border-b border-slate-100 pb-6">
              {product.description}
            </p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.enStock ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-700 font-medium">
                  En stock
                  {product.stock <= 5 && ` — plus que ${product.stock} exemplaire${product.stock > 1 ? "s" : ""}`}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-500 font-medium">Rupture de stock</span>
              </>
            )}
          </div>

          {/* Quantité + panier */}
          {product.enStock && (
            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Qté</span>
                  <div className="flex items-center border border-slate-200 rounded-full p-1 bg-white shadow-sm">
                    <button onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="w-10 text-center font-bold text-slate-900">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
                {qty > 1 && (
                  <div className="text-right animate-in fade-in slide-in-from-right-2 duration-300">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sous-total</p>
                    <p className="text-xl font-black text-slate-900">{formatPrix(sousTotal)}</p>
                  </div>
                )}
              </div>

              {/* Boutons action */}
              <div className="flex gap-3">
                {/* Panier */}
                <button onClick={handleAddToCart} disabled={adding}
                  className="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50">
                  {adding
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <ShoppingBag className="w-5 h-5" />}
                  Ajouter au panier
                </button>

                {/* Favori */}
                <button
                  onClick={(e) => toggleFavori(product.id, e)}
                  disabled={toggling}
                  aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-[0.95]",
                    toggling
                      ? "bg-slate-100 text-slate-400 cursor-wait"
                      : favori
                        ? "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200"
                        : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500"
                  )}>
                  <Heart className={cn("w-5 h-5 transition-all", toggling && "animate-pulse", favori && "fill-current")} />
                </button>

              </div>
            </div>
          )}

          {/* Bandeau "non connecté" ou "pas acheté" */}
          {!product.enStock && !isAuthenticated && (
            <Link href="/login"
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 border border-slate-200 px-4 py-3 rounded-xl transition-colors">
              <Heart className="w-4 h-4" />
              Connectez-vous pour ajouter aux favoris
            </Link>
          )}
        </div>
      </div>

      {/* ── Section Avis ───────────────────────────────────────────────── */}
      <section id="avis-section" className="mt-24 scroll-mt-10">

        {/* En-tête section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Avis clients</h2>
            <p className="text-sm text-slate-400 mt-1">
              {totalReviews} avis — note moyenne{" "}
              <strong className="text-slate-700">{noteAff > 0 ? noteAff : "—"}/5</strong>
            </p>
          </div>

          {/* CTA laisser un avis */}
          {isAuthenticated && (
            <div>
              {peutAvis && !showForm && (
                <button onClick={() => openForm(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors">
                  <Star className="w-4 h-4" />
                  Laisser un avis
                </button>
              )}
              {!aAchete && !monAvis && aAchete !== null && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Achetez ce livre pour pouvoir laisser un avis.
                </div>
              )}
            </div>
          )}
          {!isAuthenticated && (
            <Link href="/login"
              className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              Connectez-vous pour laisser un avis
            </Link>
          )}
        </div>

        {/* Mon avis existant */}
        {monAvis && !showForm && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-800">Mon avis</span>
                <StarPicker value={monAvis.note} readonly size="sm" />
                <span className="text-xs text-amber-600 font-medium">{NOTE_LABELS[monAvis.note]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openForm(true)}
                  className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                  title="Modifier mon avis">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={handleDeleteReview} disabled={deletingAvis}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                  title="Supprimer mon avis">
                  {deletingAvis
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {monAvis.commentaire && (
              <p className="text-sm text-amber-900 leading-relaxed">{monAvis.commentaire}</p>
            )}
            <p className="text-xs text-amber-600 mt-2">{formatDate(monAvis.creeLe)}</p>
          </div>
        )}

        {/* Formulaire avis */}
        {showForm && (
          <div ref={formRef}
            className="mb-10 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">

            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-lg">
                {editMode ? "Modifier mon avis" : "Laisser un avis"}
              </h3>
              <button onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Votre note *
                </label>
                <div className="flex items-center gap-4">
                  <StarPicker value={formNote} onChange={setFormNote} size="lg" />
                  {formNote > 0 && (
                    <span className="text-sm font-semibold text-amber-600 animate-in fade-in duration-200">
                      {NOTE_LABELS[formNote]}
                    </span>
                  )}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Votre commentaire
                  <span className="ml-1 normal-case font-normal text-slate-300">(optionnel)</span>
                </label>
                <textarea
                  value={formComment}
                  onChange={e => setFormComment(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Partagez votre expérience de lecture…"
                  className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all placeholder-slate-300"
                />
                <div className="flex justify-end mt-1">
                  <span className={cn(
                    "text-xs font-mono",
                    formComment.length > 900 ? "text-red-400" : "text-slate-300"
                  )}>
                    {formComment.length}/1000
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button type="submit" disabled={submitting || formNote === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-[0.98]">
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                  {submitting
                    ? (editMode ? "Mise à jour…" : "Publication…")
                    : (editMode ? "Enregistrer les modifications" : "Publier l'avis")}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des avis */}
        {reviews.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
            <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              {monAvis
                ? "Votre avis est le seul pour le moment."
                : "Aucun avis n'a encore été publié pour cet ouvrage."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => {
              const isMine = review.userId === userId;
              return (
                <div key={review.id}
                  className={cn(
                    "bg-white border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all",
                    isMine ? "border-amber-200" : "border-slate-100"
                  )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0",
                        isMine ? "bg-amber-500" : "bg-slate-900"
                      )}>
                        {review.userNom?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm">{review.userNom}</p>
                          {isMine && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Mon avis
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarPicker value={review.note} readonly size="sm" />
                          {review.achatVerifie && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                              <CheckCircle className="w-2.5 h-2.5" /> Achat vérifié
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <time className="text-xs text-slate-400 font-medium">
                        {formatDate(review.creeLe)}
                        {review.misAJourLe && (
                          <span className="block text-slate-300 text-[10px]">modifié</span>
                        )}
                      </time>
                      {/* Actions sur mon avis */}
                      {isMine && (
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => openForm(true)}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                            title="Modifier">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={handleDeleteReview} disabled={deletingAvis}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Supprimer">
                            {deletingAvis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {review.commentaire && (
                    <p className="text-slate-600 leading-relaxed text-sm">{review.commentaire}</p>
                  )}
                </div>
              );
            })}

            {/* Pagination des avis */}
            {totalRvwPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6">
                <button disabled={reviewPage === 0} onClick={() => loadReviews(reviewPage - 1)}
                  className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-slate-500">
                  Page {reviewPage + 1} / {totalRvwPages}
                </span>
                <button disabled={reviewPage >= totalRvwPages - 1} onClick={() => loadReviews(reviewPage + 1)}
                  className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Retour catalogue */}
      <div className="mt-16 pt-8 border-t border-slate-100">
        <Link href="/catalogue"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Explorer le reste du catalogue
        </Link>
      </div>
    </div>
  );
}
