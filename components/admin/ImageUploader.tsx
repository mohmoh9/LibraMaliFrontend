"use client";
// src/components/admin/ImageUploader.tsx
import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api, { getErrorMessage } from "@/lib/api";

interface Props {
  productId: number;
  currentImageUrl?: string | null;
  onSuccess: (newImageUrl: string | null) => void;
}

const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAILLE_MAX_MO  = 5;

export default function ImageUploader({ productId, currentImageUrl, onSuccess }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [preview,   setPreview]   = useState<string | null>(null);

  // URL à afficher : preview local en priorité, sinon image actuelle du produit
  const imageUrl = preview ?? currentImageUrl;
  const imageValide = imageUrl &&
    (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/"));

  /* ── Validation côté client ──────────────────────────────────────────── */
  const validerFichier = (file: File): string | null => {
    if (!TYPES_ACCEPTES.includes(file.type)) {
      return `Type non accepté : ${file.type}. Utilisez JPEG, PNG, WebP ou GIF.`;
    }
    if (file.size > TAILLE_MAX_MO * 1024 * 1024) {
      return `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : ${TAILLE_MAX_MO} Mo.`;
    }
    return null;
  };

  /* ── Upload ──────────────────────────────────────────────────────────── */
  const upload = useCallback(async (file: File) => {
    const erreur = validerFichier(file);
    if (erreur) { toast.error(erreur); return; }

    // Preview local immédiat
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const { data } = await api.post(
        `/products/${productId}/image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const newUrl: string = data.data.imageUrl;
      setPreview(null);
      onSuccess(newUrl);
      toast.success("Image mise à jour !");
    } catch (err) {
      setPreview(null);
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [productId, onSuccess]);

  /* ── Suppression ─────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!confirm("Supprimer l'image de ce produit ?")) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${productId}/image`);
      setPreview(null);
      onSuccess(null);
      toast.success("Image supprimée.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  /* ── Drag & Drop ─────────────────────────────────────────────────────── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-encre-muted uppercase tracking-wider">
        Image de couverture
      </label>

      <div className="flex gap-4 items-start">

        {/* ── Zone de drop ─────────────────────────────────────────── */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2",
            "w-36 h-48 rounded-xl border-2 border-dashed cursor-pointer",
            "transition-all duration-200 overflow-hidden",
            dragging
              ? "border-or bg-or/5 scale-[1.02]"
              : "border-sable-dark hover:border-encre hover:bg-sable/20",
            uploading && "pointer-events-none",
            "bg-sable/10"
          )}
          role="button"
          tabIndex={0}
          aria-label="Cliquer ou déposer une image"
          onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
        >
          {/* Aperçu image */}
          {imageValide && (
            <Image
              src={imageUrl!}
              alt="Couverture"
              fill
              className={cn("object-cover transition-opacity", uploading && "opacity-40")}
              sizes="144px"
            />
          )}

          {/* Overlay upload */}
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1.5",
            "transition-opacity",
            imageValide && !uploading ? "opacity-0 hover:opacity-100 bg-encre/50" : "opacity-100"
          )}>
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <span className="text-white text-xs font-body">Envoi…</span>
              </>
            ) : (
              <>
                {imageValide
                  ? <Upload className="w-5 h-5 text-white" />
                  : <ImageIcon className="w-7 h-7 text-encre-muted" />}
                <span className={cn(
                  "text-xs font-body text-center px-2 leading-tight",
                  imageValide ? "text-white" : "text-encre-muted"
                )}>
                  {dragging ? "Déposer ici" : imageValide ? "Remplacer" : "Cliquer ou\ndéposer"}
                </span>
              </>
            )}
          </div>

          {/* Checkmark après upload réussi */}
          {!uploading && imageValide && !preview && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-4 h-4 text-success drop-shadow" />
            </div>
          )}
        </div>

        {/* ── Infos et actions ─────────────────────────────────────── */}
        <div className="flex-1 space-y-3 pt-1">
          <div className="text-xs text-encre-muted font-body space-y-1">
            <p className="font-medium text-encre text-sm">Formats acceptés</p>
            <p>JPEG, PNG, WebP, GIF</p>
            <p>Taille max : {TAILLE_MAX_MO} Mo</p>
            <p>Recommandé : format portrait 2:3</p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-xs py-2 px-3 w-fit disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {imageValide ? "Changer l'image" : "Choisir un fichier"}
            </button>

            {imageValide && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || uploading}
                className="flex items-center gap-1.5 text-xs text-error hover:text-red-700
                           transition-colors font-body disabled:opacity-50 w-fit"
              >
                {deleting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
                {deleting ? "Suppression…" : "Supprimer l'image"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Input file caché */}
      <input
        ref={inputRef}
        type="file"
        accept={TYPES_ACCEPTES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
