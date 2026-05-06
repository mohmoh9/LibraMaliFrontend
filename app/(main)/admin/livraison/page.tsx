"use client";
// src/app/(main)/admin/livraisons/page.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
    Truck, Search, X, ChevronLeft, ChevronRight,
    Loader2, Package, Send, MapPin, CheckCircle,
    ArrowRight, Copy, Eye, Calendar, StickyNote,
    AlertTriangle, Navigation,RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { getErrorMessage } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import Modal from "@/components/ui/Modal";
import type { Delivery, StatutLivraison, PageResponse } from "@/types";

/* ── Config statuts ──────────────────────────────────────────────────────── */
type StatutKey = "EN_PREPARATION" | "EXPEDIEE" | "EN_COURS" | "LIVREE";

const STATUT_CONFIG: Record<StatutKey, {
    label: string;
    labelCourt: string;
    icon: React.ReactNode;
    bg: string;
    text: string;
    border: string;
    step: number;
}> = {
    EN_PREPARATION: {
        label:      "En préparation",
        labelCourt: "Préparation",
        icon:       <Package className="w-3.5 h-3.5" />,
        bg:         "bg-slate-50",
        text:       "text-slate-600",
        border:     "border-slate-200",
        step:       1,
    },
    EXPEDIEE: {
        label:      "Expédiée",
        labelCourt: "Expédiée",
        icon:       <Send className="w-3.5 h-3.5" />,
        bg:         "bg-blue-50",
        text:       "text-blue-700",
        border:     "border-blue-200",
        step:       2,
    },
    EN_COURS: {
        label:      "En cours",
        labelCourt: "En cours",
        icon:       <Truck className="w-3.5 h-3.5" />,
        bg:         "bg-amber-50",
        text:       "text-amber-700",
        border:     "border-amber-200",
        step:       3,
    },
    LIVREE: {
        label:      "Livrée",
        labelCourt: "Livrée",
        icon:       <CheckCircle className="w-3.5 h-3.5" />,
        bg:         "bg-green-50",
        text:       "text-success",
        border:     "border-green-200",
        step:       4,
    },
};

/* ── Transitions autorisées ──────────────────────────────────────────────── */
const TRANSITIONS: Record<StatutKey, StatutKey | null> = {
    EN_PREPARATION: "EXPEDIEE",
    EXPEDIEE:       "EN_COURS",
    EN_COURS:       "LIVREE",
    LIVREE:         null,
};

/* ── Labels de progression ────────────────────────────────────────────────── */
const TRANSITION_LABELS: Record<StatutKey, string> = {
    EN_PREPARATION: "Marquer comme expédiée",
    EXPEDIEE:       "Marquer en cours de livraison",
    EN_COURS:       "Marquer comme livrée",
    LIVREE:         "",
};

/* ── Schéma formulaire transition ────────────────────────────────────────── */
const transitionSchema = z.object({
    statut:              z.string(),
    numeroSuivi:         z.string().max(100).optional(),
    dateLivraisonPrevue: z.string().optional(),
    notesLivreur:        z.string().max(500).optional(),
}).superRefine((val, ctx) => {
    // Numéro de suivi obligatoire pour passer à EXPEDIEE
    if (val.statut === "EXPEDIEE" && (!val.numeroSuivi || !val.numeroSuivi.trim())) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["numeroSuivi"],
            message: "Le numéro de suivi est obligatoire pour expédier.",
        });
    }
});
type TransitionForm = z.infer<typeof transitionSchema>;

/* ── Composants UI ───────────────────────────────────────────────────────── */
function StatutBadge({ statut }: { statut: string }) {
    const cfg = STATUT_CONFIG[statut as StatutKey];
    if (!cfg) return null;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            cfg.bg, cfg.text, cfg.border
        )}>
      {cfg.icon}
            {cfg.label}
    </span>
    );
}

function ProgressBar({ statut }: { statut: string }) {
    const step   = STATUT_CONFIG[statut as StatutKey]?.step ?? 0;
    const steps: StatutKey[] = ["EN_PREPARATION", "EXPEDIEE", "EN_COURS", "LIVREE"];
    return (
        <div className="flex items-center gap-1">
            {steps.map((s, i) => {
                const cfg   = STATUT_CONFIG[s];
                const done  = cfg.step <= step;
                const active = s === statut;
                return (
                    <div key={s} className="flex items-center gap-1">
                        <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                            active ? cn(cfg.bg, cfg.text, "ring-2 ring-offset-1", cfg.border)
                                : done ? "bg-encre text-ivoire"
                                    : "bg-sable text-encre-muted"
                        )}>
                            {done && !active ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        {i < steps.length - 1 && (
                            <div className={cn(
                                "h-0.5 w-6 rounded-full transition-all",
                                cfg.step <= step ? "bg-encre" : "bg-sable-dark"
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr>
            {[60, 160, 100, 120, 110, 130, 100].map((w, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="skeleton h-4 rounded" style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

function KpiCard({ label, value, icon, bg, col, sub }: {
    label: string; value: React.ReactNode; icon: React.ReactNode;
    bg: string; col: string; sub?: string;
}) {
    return (
        <div className="card p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg, col)}>
                {icon}
            </div>
            <div>
                <p className="font-display font-bold text-2xl text-encre leading-tight">{value}</p>
                <p className="text-xs text-encre-muted font-body">{label}</p>
                {sub && <p className="text-[10px] text-encre-muted/70 font-body mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

/* ── Page principale ─────────────────────────────────────────────────────── */
/* ── Génération d'un numéro de suivi aléatoire ────────────────────────────
 * Format : LM + 8 chiffres aléatoires + ML
 * Ex : LM48273651ML
 * Ce format est lisible, court, et facile à partager avec le client.
 */
function generateTrackingNumber(): string {
    const digits = Math.floor(10_000_000 + Math.random() * 90_000_000);
    return `LM${digits}ML`;
}

export default function AdminLivraisonsPage() {
    const [deliveries,   setDeliveries]   = useState<Delivery[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [search,       setSearch]       = useState("");
    const [filterStatut, setFilterStatut] = useState<StatutKey | "">("");
    const [page,         setPage]         = useState(0);
    const [totalPages,   setTotalPages]   = useState(1);
    const [totalEls,     setTotalEls]     = useState(0);

    // Modale détail / transition
    const [modalOpen,    setModalOpen]    = useState(false);
    const [modalDel,     setModalDel]     = useState<Delivery | null>(null);
    const [transitioning,setTransitioning]= useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    const form = useForm<TransitionForm>({ resolver: zodResolver(transitionSchema) });
    const watchStatut = form.watch("statut");

    /* ── KPIs ────────────────────────────────────────────────────────────── */
    const nbPrep    = deliveries.filter(d => d.statut === "EN_PREPARATION").length;
    const nbExp     = deliveries.filter(d => d.statut === "EXPEDIEE").length;
    const nbCours   = deliveries.filter(d => d.statut === "EN_COURS").length;
    const nbLivrees = deliveries.filter(d => d.statut === "LIVREE").length;

    /* ── Chargement ─────────────────────────────────────────────────────── */
    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), size: "15" });
            if (filterStatut) params.set("statut", filterStatut);

            const { data } = await api.get(`/admin/deliveries?${params}`);
            const payload  = data?.data ?? data;
            let content: Delivery[] = payload?.content ?? [];

            if (search.trim()) {
                const q = search.toLowerCase();
                content = content.filter(d =>
                    String(d.id).includes(q)                  ||
                    String(d.orderId).includes(q)              ||
                    d.userNom?.toLowerCase().includes(q)       ||
                    d.userEmail?.toLowerCase().includes(q)     ||
                    d.ville?.toLowerCase().includes(q)         ||
                    d.numeroSuivi?.toLowerCase().includes(q)
                );
            }

            setDeliveries(content);
            setTotalPages(payload?.totalPages ?? 1);
            setTotalEls(payload?.totalElements ?? content.length);
        } catch {
            toast.error("Impossible de charger les livraisons.");
        } finally {
            setLoading(false);
        }
    }, [page, filterStatut, search]);

    useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

    /* ── Ouvrir modale ───────────────────────────────────────────────────── */
    const openModal = async (delivery: Delivery) => {
        // Charger le détail complet
        try {
            const { data } = await api.get(`/admin/deliveries/${delivery.id}`);
            setModalDel(data?.data ?? data);
        } catch {
            setModalDel(delivery);
        }
        const nextStatut = TRANSITIONS[delivery.statut as StatutKey];
        form.reset({
            statut:              nextStatut ?? "",
            // Pré-générer automatiquement si la prochaine transition est EXPEDIEE
            numeroSuivi:         nextStatut === "EXPEDIEE" ? generateTrackingNumber() : "",
            dateLivraisonPrevue: "",
            notesLivreur:        delivery.notesLivreur ?? "",
        });
        setModalOpen(true);
    };

    /* ── Soumettre la transition ─────────────────────────────────────────── */
    const handleTransition = async (values: TransitionForm) => {
        if (!modalDel) return;
        setTransitioning(true);
        try {
            const payload: Record<string, any> = { statut: values.statut };
            if (values.numeroSuivi?.trim())         payload.numeroSuivi         = values.numeroSuivi.trim();
            if (values.dateLivraisonPrevue?.trim()) payload.dateLivraisonPrevue = new Date(values.dateLivraisonPrevue).toISOString();
            if (values.notesLivreur?.trim())        payload.notesLivreur        = values.notesLivreur.trim();

            const { data } = await api.patch(`/admin/deliveries/${modalDel.id}/statut`, payload);
            const updated: Delivery = data?.data ?? data;

            // Mise à jour locale
            setDeliveries(ds => ds.map(d => d.id === modalDel.id ? { ...d, ...updated } : d));
            setModalDel(prev => prev ? { ...prev, ...updated } : null);

            const cfg = STATUT_CONFIG[values.statut as StatutKey];
            toast.success(`Livraison #${modalDel.id} → ${cfg?.label ?? values.statut}`);
            setModalOpen(false);
            fetchDeliveries();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setTransitioning(false);
        }
    };

    /* ── Copier numéro de suivi ──────────────────────────────────────────── */
    const copyNumero = (num: string) => {
        navigator.clipboard.writeText(num).then(() => toast.success("Numéro copié !"));
    };

    const nextStatutDuModal = modalDel ? TRANSITIONS[modalDel.statut as StatutKey] : null;

    return (
        <AdminGuard>
            <AdminLayout>
                <div className="p-6 lg:p-10 space-y-7">

                    {/* ── En-tête ──────────────────────────────────────────────── */}
                    <div>
                        <h1 className="font-display text-display-md font-bold text-encre">Livraisons</h1>
                        <p className="text-sm text-encre-muted font-body mt-0.5">
                            {totalEls} livraison{totalEls > 1 ? "s" : ""} enregistrée{totalEls > 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* ── KPIs ─────────────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <KpiCard label="En préparation" value={nbPrep}
                                 icon={<Package className="w-5 h-5" />}
                                 bg="bg-slate-50" col="text-slate-600"
                                 sub={nbPrep > 0 ? "À expédier" : undefined} />
                        <KpiCard label="Expédiées" value={nbExp}
                                 icon={<Send className="w-5 h-5" />}
                                 bg="bg-blue-50" col="text-blue-600" />
                        <KpiCard label="En cours" value={nbCours}
                                 icon={<Truck className="w-5 h-5" />}
                                 bg="bg-amber-50" col="text-amber-600" />
                        <KpiCard label="Livrées" value={nbLivrees}
                                 icon={<CheckCircle className="w-5 h-5" />}
                                 bg="bg-green-50" col="text-success" />
                    </div>

                    {/* Alerte livraisons en préparation */}
                    {nbPrep > 0 && (
                        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in">
                            <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0" />
                            <p className="text-sm text-slate-700 font-body">
                                <strong>{nbPrep} commande{nbPrep > 1 ? "s" : ""}</strong> en attente d&apos;expédition.
                            </p>
                            <button
                                onClick={() => { setFilterStatut("EN_PREPARATION"); setPage(0); }}
                                className="ml-auto text-xs font-semibold text-slate-600 hover:text-slate-900 underline whitespace-nowrap"
                            >
                                Voir →
                            </button>
                        </div>
                    )}

                    {/* ── Filtres ──────────────────────────────────────────────── */}
                    <div className="flex flex-wrap gap-3">
                        {/* Recherche */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                            <input
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(0); }}
                                placeholder="ID, client, ville, numéro suivi…"
                                className="pl-9 pr-9 py-2 text-sm font-body bg-white border border-sable-dark rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-or/30 focus:border-or w-64"
                            />
                            {search && (
                                <button onClick={() => { setSearch(""); setPage(0); }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Filtre statut */}
                        <div className="flex bg-sable/60 rounded-xl p-1 gap-0.5">
                            <button
                                onClick={() => { setFilterStatut(""); setPage(0); }}
                                className={cn("px-3 py-1.5 rounded-lg text-xs font-body transition-all",
                                    !filterStatut ? "bg-white text-encre shadow-sm font-medium" : "text-encre-muted hover:text-encre")}>
                                Toutes
                            </button>
                            {(Object.keys(STATUT_CONFIG) as StatutKey[]).map(s => (
                                <button key={s}
                                        onClick={() => { setFilterStatut(s); setPage(0); }}
                                        className={cn(
                                            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body transition-all whitespace-nowrap",
                                            filterStatut === s
                                                ? "bg-white text-encre shadow-sm font-medium"
                                                : "text-encre-muted hover:text-encre"
                                        )}>
                                    {STATUT_CONFIG[s].labelCourt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Tableau ──────────────────────────────────────────────── */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm font-body">
                                <thead className="border-b border-sable">
                                <tr>
                                    {["#", "Client", "Destination", "Progression", "N° Suivi", "Dates", "Actions"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-encre-muted whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-sable">
                                {loading
                                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                    : deliveries.length === 0
                                        ? (
                                            <tr>
                                                <td colSpan={7} className="py-16 text-center">
                                                    <Truck className="w-10 h-10 text-sable-dark mx-auto mb-3" />
                                                    <p className="font-display text-lg text-encre">Aucune livraison trouvée</p>
                                                    <p className="text-sm text-encre-muted font-body mt-1">
                                                        Modifiez les filtres ou revenez plus tard.
                                                    </p>
                                                </td>
                                            </tr>
                                        )
                                        : deliveries.map(del => {
                                            const statut       = del.statut as StatutKey;
                                            const nextStatut   = TRANSITIONS[statut];
                                            const isTerminal   = nextStatut === null;

                                            return (
                                                <tr
                                                    key={del.id}
                                                    onClick={() => openModal(del)}
                                                    className="hover:bg-ivoire transition-colors group cursor-pointer"
                                                >
                                                    {/* ID */}
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs text-encre-muted">#{del.id}</span>
                                                    </td>

                                                    {/* Client */}
                                                    <td className="px-4 py-3">
                                                        {del.userNom ? (
                                                            <div>
                                                                <p className="font-medium text-encre text-sm">{del.userNom}</p>
                                                                <p className="text-xs text-encre-muted">
                                                                    Cmd{" "}
                                                                    <Link href="/admin/commandes"
                                                                          onClick={e => e.stopPropagation()}
                                                                          className="text-or hover:underline font-mono">
                                                                        #{del.orderId}
                                                                    </Link>
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <Link href="/admin/commandes"
                                                                  onClick={e => e.stopPropagation()}
                                                                  className="text-xs text-or hover:underline font-mono">
                                                                Cmd #{del.orderId}
                                                            </Link>
                                                        )}
                                                    </td>

                                                    {/* Destination */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-start gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5 text-encre-muted mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-sm text-encre font-medium">{del.ville}</p>
                                                                {del.adresse && (
                                                                    <p className="text-xs text-encre-muted truncate max-w-[140px]">
                                                                        {del.adresse}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Progression */}
                                                    <td className="px-4 py-3">
                                                        <ProgressBar statut={del.statut} />
                                                    </td>

                                                    {/* N° Suivi */}
                                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                        {del.numeroSuivi ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <code className="font-mono text-xs text-encre bg-sable px-2 py-0.5 rounded">
                                                                    {del.numeroSuivi}
                                                                </code>
                                                                <button
                                                                    onClick={() => copyNumero(del.numeroSuivi!)}
                                                                    className="p-1 text-encre-muted hover:text-or transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Copier">
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-encre-muted/50 italic">Non attribué</span>
                                                        )}
                                                    </td>

                                                    {/* Dates */}
                                                    <td className="px-4 py-3">
                                                        <div className="space-y-0.5">
                                                            {del.dateLivraisonPrevue && (
                                                                <p className="text-xs text-encre-muted flex items-center gap-1">
                                                                    <Calendar className="w-2.5 h-2.5" />
                                                                    Prévue : {formatDate(del.dateLivraisonPrevue)}
                                                                </p>
                                                            )}
                                                            {del.dateLivraisonReelle && (
                                                                <p className="text-xs text-success flex items-center gap-1">
                                                                    <CheckCircle className="w-2.5 h-2.5" />
                                                                    Livrée : {formatDate(del.dateLivraisonReelle)}
                                                                </p>
                                                            )}
                                                            {!del.dateLivraisonPrevue && !del.dateLivraisonReelle && (
                                                                <span className="text-xs text-encre-muted/50 italic">—</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openModal(del)}
                                                                className="p-1.5 rounded-lg text-encre-muted hover:text-encre hover:bg-sable/60 transition-colors"
                                                                title="Voir le détail">
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </button>
                                                            {!isTerminal && (
                                                                <button
                                                                    onClick={() => openModal(del)}
                                                                    className={cn(
                                                                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium transition-colors",
                                                                        STATUT_CONFIG[nextStatut!].bg,
                                                                        STATUT_CONFIG[nextStatut!].text,
                                                                        "border",
                                                                        STATUT_CONFIG[nextStatut!].border,
                                                                        "hover:shadow-sm"
                                                                    )}
                                                                    title={TRANSITION_LABELS[statut]}
                                                                >
                                                                    <ArrowRight className="w-3 h-3" />
                                                                    {STATUT_CONFIG[nextStatut!].labelCourt}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                }
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Pagination ───────────────────────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                                    className="p-2 rounded-full border border-sable-dark text-encre-muted
                           hover:border-encre hover:text-encre disabled:opacity-40 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-encre-muted font-body px-3">
                Page {page + 1} sur {totalPages}
              </span>
                            <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
                                    className="p-2 rounded-full border border-sable-dark text-encre-muted
                           hover:border-encre hover:text-encre disabled:opacity-40 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Modale détail + transition ────────────────────────────── */}
                <Modal
                    open={modalOpen}
                    onClose={() => { setModalOpen(false); setModalDel(null); }}
                    title={modalDel ? `Livraison #${modalDel.id}` : "Livraison"}
                    size="lg"
                >
                    {modalDel && (
                        <div className="space-y-6">

                            {/* Progression visuelle */}
                            <div className="p-5 bg-sable/30 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <ProgressBar statut={modalDel.statut} />
                                    <StatutBadge statut={modalDel.statut} />
                                </div>

                                {/* Étapes texte */}
                                <div className="grid grid-cols-4 gap-1 text-center">
                                    {(Object.entries(STATUT_CONFIG) as [StatutKey, typeof STATUT_CONFIG[StatutKey]][]).map(([key, cfg]) => {
                                        const done   = cfg.step <= (STATUT_CONFIG[modalDel.statut as StatutKey]?.step ?? 0);
                                        const active = key === modalDel.statut;
                                        return (
                                            <div key={key}
                                                 className={cn("text-[10px] font-body leading-tight transition-colors",
                                                     active ? cn(cfg.text, "font-bold")
                                                         : done ? "text-encre font-medium"
                                                             : "text-encre-muted")}>
                                                {cfg.labelCourt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Infos en grille */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "ID livraison", value: `#${modalDel.id}`, mono: true },
                                    { label: "Commande",     value: `#${modalDel.orderId}`, mono: true, link: "/admin/commandes" },
                                    { label: "Ville",        value: modalDel.ville || "—" },
                                    { label: "Adresse",      value: modalDel.adresse || "—", full: true },
                                ].map(item => (
                                    <div key={item.label}
                                         className={cn("bg-sable/30 rounded-xl p-3", item.full && "col-span-2")}>
                                        <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-1">
                                            {item.label}
                                        </p>
                                        {item.link ? (
                                            <Link href={item.link}
                                                  className="font-mono font-bold text-or text-sm hover:underline">
                                                {item.value}
                                            </Link>
                                        ) : (
                                            <p className={cn("font-semibold text-encre text-sm", item.mono && "font-mono")}>
                                                {item.value}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Numéro de suivi */}
                            {modalDel.numeroSuivi && (
                                <div className="p-4 bg-sable/30 rounded-xl">
                                    <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-2">
                                        Numéro de suivi
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-sm text-encre bg-white px-3 py-1.5 rounded-lg border border-sable-dark flex-1">
                                            {modalDel.numeroSuivi}
                                        </code>
                                        <button
                                            onClick={() => copyNumero(modalDel.numeroSuivi!)}
                                            className="p-2 rounded-lg text-encre-muted hover:text-encre hover:bg-sable transition-colors"
                                            title="Copier">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-sable/30 rounded-xl p-3">
                                    <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-1">
                                        Date prévue
                                    </p>
                                    <p className="text-sm font-semibold text-encre">
                                        {modalDel.dateLivraisonPrevue ? formatDate(modalDel.dateLivraisonPrevue) : "—"}
                                    </p>
                                </div>
                                <div className="bg-sable/30 rounded-xl p-3">
                                    <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-1">
                                        Date réelle
                                    </p>
                                    <p className={cn("text-sm font-semibold",
                                        modalDel.dateLivraisonReelle ? "text-success" : "text-encre-muted")}>
                                        {modalDel.dateLivraisonReelle ? formatDate(modalDel.dateLivraisonReelle) : "—"}
                                    </p>
                                </div>
                            </div>

                            {/* Notes livreur */}
                            {modalDel.notesLivreur && (
                                <div className="p-4 bg-sable/30 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <StickyNote className="w-3.5 h-3.5 text-encre-muted" />
                                        <p className="text-xs text-encre-muted font-body uppercase tracking-wider">Notes livreur</p>
                                    </div>
                                    <p className="text-sm text-encre font-body leading-relaxed">{modalDel.notesLivreur}</p>
                                </div>
                            )}

                            {/* Client */}
                            {modalDel.userNom && (
                                <div className="p-4 bg-sable/30 rounded-xl">
                                    <p className="text-xs text-encre-muted font-body uppercase tracking-wider mb-2">Client</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-encre rounded-full flex items-center justify-center shrink-0">
                      <span className="text-ivoire text-sm font-bold">
                        {modalDel.userNom.charAt(0).toUpperCase()}
                      </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-encre text-sm">{modalDel.userNom}</p>
                                            <p className="text-xs text-encre-muted">{modalDel.userEmail}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Formulaire de transition ────────────────────────── */}
                            {nextStatutDuModal && (
                                <div ref={formRef} className="border-t border-sable pt-5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-encre-muted" />
                                        <h3 className="font-display font-bold text-encre">
                                            {TRANSITION_LABELS[modalDel.statut as StatutKey]}
                                        </h3>
                                    </div>

                                    <form onSubmit={form.handleSubmit(handleTransition)} className="space-y-4">
                                        {/* Champ caché statut */}
                                        <input type="hidden" {...form.register("statut")} value={nextStatutDuModal} />

                                        {/* Numéro de suivi — obligatoire pour EXPEDIEE, généré automatiquement */}
                                        {nextStatutDuModal === "EXPEDIEE" && (
                                            <div>
                                                <label className="input-label">Numéro de suivi *</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        {...form.register("numeroSuivi")}
                                                        placeholder="LM00000000ML"
                                                        className="input-field font-mono flex-1"
                                                        readOnly
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => form.setValue("numeroSuivi", generateTrackingNumber(), { shouldValidate: true })}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-encre text-ivoire
                                       rounded-xl text-xs font-body font-medium hover:opacity-90
                                       transition-opacity whitespace-nowrap shrink-0"
                                                    >
                                                        <RefreshCcw className="w-3.5 h-3.5" />
                                                        Générer
                                                    </button>
                                                </div>
                                                {form.formState.errors.numeroSuivi && (
                                                    <p className="text-xs text-error mt-1">
                                                        {form.formState.errors.numeroSuivi.message}
                                                    </p>
                                                )}
                                                <p className="text-xs text-encre-muted font-body mt-1">
                                                    Numéro généré automatiquement — modifiable si besoin.
                                                </p>
                                            </div>
                                        )}

                                        {/* Date prévue — optionnelle pour EXPEDIEE */}
                                        {nextStatutDuModal === "EXPEDIEE" && (
                                            <div>
                                                <label className="input-label">
                                                    Date de livraison prévue
                                                    <span className="ml-1 normal-case font-normal text-encre-muted/70">(optionnelle)</span>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    {...form.register("dateLivraisonPrevue")}
                                                    className="input-field"
                                                />
                                            </div>
                                        )}

                                        {/* Message automatique LIVREE */}
                                        {nextStatutDuModal === "LIVREE" && (
                                            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                                                <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                                <p className="text-xs text-green-800 font-body">
                                                    La date de livraison réelle sera enregistrée automatiquement à l&apos;instant présent.
                                                    Un email de confirmation sera envoyé au client.
                                                </p>
                                            </div>
                                        )}

                                        {/* Notes livreur */}
                                        <div>
                                            <label className="input-label">
                                                Notes livreur
                                                <span className="ml-1 normal-case font-normal text-encre-muted/70">(optionnelles)</span>
                                            </label>
                                            <textarea
                                                {...form.register("notesLivreur")}
                                                rows={2}
                                                placeholder="Instructions, incidents, informations utiles…"
                                                className="input-field resize-none"
                                            />
                                        </div>

                                        {/* Boutons */}
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={transitioning}
                                                className={cn(
                                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all",
                                                    "disabled:opacity-50",
                                                    STATUT_CONFIG[nextStatutDuModal].bg,
                                                    STATUT_CONFIG[nextStatutDuModal].text,
                                                    STATUT_CONFIG[nextStatutDuModal].border,
                                                    "hover:shadow-sm"
                                                )}
                                            >
                                                {transitioning
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : STATUT_CONFIG[nextStatutDuModal].icon}
                                                {transitioning ? "Mise à jour…" : TRANSITION_LABELS[modalDel.statut as StatutKey]}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setModalOpen(false); setModalDel(null); }}
                                                className="btn-secondary text-sm"
                                            >
                                                Fermer
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* État terminal */}
                            {modalDel.statut === "LIVREE" && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-body text-green-800">
                                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                                    Livraison terminée le {formatDate(modalDel.dateLivraisonReelle!)}. Aucune action requise.
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </AdminLayout>
        </AdminGuard>
    );
}
