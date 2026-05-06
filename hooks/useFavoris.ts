// src/hooks/useFavoris.ts
"use client";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

/**
 * Hook de gestion des favoris.
 *
 * Fonctionnement :
 * - Charge les IDs des produits en favori au montage (si connecté)
 * - Expose `isFavori(id)` pour savoir si un produit est en favori
 * - Expose `toggleFavori(id)` pour ajouter/retirer un favori
 * - Mise à jour optimiste : l'UI réagit immédiatement, rollback si erreur
 * - Les IDs sont stockés en mémoire (Set) — pas de persistance locale
 *
 * Usage :
 *   const { isFavori, toggleFavori, loading } = useFavoris();
 */
export function useFavoris() {
  const { isAuthenticated } = useAuthStore();
  const [favorisIds, setFavorisIds]   = useState<Set<number>>(new Set());
  const [loading,    setLoading]      = useState(false);
  const [toggling,   setToggling]     = useState<Set<number>>(new Set());

  /* ── Chargement initial ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) {
      setFavorisIds(new Set());
      return;
    }

    const charger = async () => {
      setLoading(true);
      try {
        // Charge la première page des favoris pour récupérer les IDs
        const { data } = await api.get("/favoris?page=0&size=100");
        const payload  = data?.data ?? data;
        const items    = payload?.content ?? [];
        const ids      = new Set<number>(items.map((f: any) => Number(f.productId)));
        setFavorisIds(ids);
      } catch {
        // Silencieux : les boutons favoris seront juste désactivés
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, [isAuthenticated]);

  /* ── Vérification ────────────────────────────────────────────────────── */
  const isFavori = useCallback(
    (productId: number) => favorisIds.has(productId),
    [favorisIds]
  );

  /* ── Toggle favori ───────────────────────────────────────────────────── */
  const toggleFavori = useCallback(async (
    productId: number,
    e?: React.MouseEvent
  ) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Connectez-vous pour ajouter aux favoris.");
      return;
    }

    // Éviter les double-clics
    if (toggling.has(productId)) return;

    const estFavori = favorisIds.has(productId);

    // Mise à jour optimiste
    setFavorisIds(prev => {
      const next = new Set(prev);
      if (estFavori) next.delete(productId);
      else next.add(productId);
      return next;
    });
    setToggling(prev => new Set(prev).add(productId));

    try {
      if (estFavori) {
        await api.delete(`/favoris?productId=${productId}`);
        toast.success("Retiré des favoris.");
      } else {
        await api.post(`/favoris?productId=${productId}`);
        toast.success("Ajouté aux favoris.");
      }
    } catch {
      // Rollback si erreur
      setFavorisIds(prev => {
        const next = new Set(prev);
        if (estFavori) next.add(productId);
        else next.delete(productId);
        return next;
      });
      toast.error("Une erreur est survenue.");
    } finally {
      setToggling(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }, [isAuthenticated, favorisIds, toggling]);

  return {
    isFavori,
    toggleFavori,
    loading,
    isToggling: (id: number) => toggling.has(id),
  };
}