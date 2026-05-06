"use client";
// src/app/(main)/mon-compte/profil/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2, Star, Lock, Eye, EyeOff, ShieldCheck, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type { Address, User } from "@/types";

export default function ProfilPage() {
    const router = useRouter();
    const { isAuthenticated, updateNom } = useAuthStore();
    const [user, setUser] = useState<User | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [nom, setNom] = useState("");
    const [telephone, setTelephone] = useState("");
    const [saving, setSaving] = useState(false);
    const [newAddr, setNewAddr] = useState({ rue: "", quartier: "", ville: "", complement: "" });

    // États gestion du mot de passe
    const [currentPwd,    setCurrentPwd]    = useState("");
    const [newPwd,        setNewPwd]        = useState("");
    const [confirmPwd,    setConfirmPwd]    = useState("");
    const [showCurrent,   setShowCurrent]   = useState(false);
    const [showNew,       setShowNew]       = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [savingPwd,     setSavingPwd]     = useState(false);
    const [aMotDePasse,   setAMotDePasse]   = useState(false); // true si l'user a un MDP défini
    const [addingAddr, setAddingAddr] = useState(false);
    const [showAddrForm, setShowAddrForm] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) { router.push("/login"); return; }
        api.get("/users/me").then(({ data }) => {
            const u: User = data.data;
            setUser(u);
            setNom(u.nom);
            setTelephone(u.telephone ?? "");
            setAMotDePasse(u.aMotDePasse ?? false);
            return api.get(`/users/${u.id}/addresses`);
        }).then(({ data }) => {
            setAddresses(data.data);
        }).catch(() => {});
    }, [isAuthenticated]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await api.put(`/users/${user.id}`, { nom, telephone });
            updateNom(nom);
            toast.success("Profil mis à jour !");
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingAddr(true);
        try {
            await api.post("/users/me/addresses", newAddr);
            const { data } = await api.get(`/users/${user!.id}/addresses`);
            setAddresses(data.data);
            setNewAddr({ rue: "", quartier: "", ville: "", complement: "" });
            setShowAddrForm(false);
            toast.success("Adresse ajoutée !");
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setAddingAddr(false);
        }
    };

    const handleDeleteAddr = async (addrId: number) => {
        if (!confirm("Supprimer cette adresse ?")) return;
        try {
            await api.delete(`/addresses/${addrId}`);
            setAddresses(a => a.filter(x => x.id !== addrId));
            toast.success("Adresse supprimée.");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleSetPrincipal = async (addrId: number) => {
        try {
            await api.patch(`/addresses/${addrId}/principale`);
            const { data } = await api.get(`/users/${user!.id}/addresses`);
            setAddresses(data.data);
            toast.success("Adresse principale mise à jour.");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    /* ── Enregistrer le mot de passe ──────────────────────────────────── */
    const handleSavePassword = async () => {
        if (newPwd.length < 8) { toast.error("Minimum 8 caractères."); return; }
        if (newPwd !== confirmPwd) { toast.error("Les mots de passe ne correspondent pas."); return; }
        setSavingPwd(true);
        try {
            await api.post("/auth/set-password", { password: newPwd, confirmPassword: confirmPwd });
            setAMotDePasse(true);
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
            toast.success("Mot de passe enregistré !");
        } catch (err) { toast.error(getErrorMessage(err)); }
        finally { setSavingPwd(false); }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* Tabs */}
            <div className="flex gap-6 mb-10 border-b border-sable pb-6">
                <Link href="/mon-compte/commandes"
                      className="font-body text-sm text-encre-muted hover:text-encre transition-colors">
                    Mes commandes
                </Link>
                <Link href="/mon-compte/profil"
                      className="font-body text-sm font-medium text-encre border-b-2 border-encre pb-1 -mb-[25px]">
                    Mon profil
                </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-8">

                {/* ── Infos personnelles ──────────────────────────────────────── */}
                <div className="card p-6 space-y-5">
                    <h2 className="font-display text-xl font-bold text-encre">Informations personnelles</h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="input-label">Nom complet</label>
                            <input value={nom} onChange={e => setNom(e.target.value)}
                                   className="input-field" required />
                        </div>
                        <div>
                            <label className="input-label">Email</label>
                            <input value={user?.email ?? ""} readOnly
                                   className="input-field opacity-60 cursor-not-allowed" />
                            <p className="text-xs text-encre-muted font-body mt-1">L&apos;email ne peut pas être modifié.</p>
                        </div>
                        <div>
                            <label className="input-label">Téléphone</label>
                            <input value={telephone} onChange={e => setTelephone(e.target.value)}
                                   placeholder="+223 70 00 00 00" className="input-field" />
                        </div>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Enregistrer
                        </button>
                    </form>
                </div>

                {/* ── Adresses ───────────────────────────────────────────────── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-xl font-bold text-encre">Adresses</h2>
                        {!showAddrForm && addresses.length < 5 && (
                            <button onClick={() => setShowAddrForm(true)}
                                    className="flex items-center gap-1 text-sm text-or hover:text-or-dark transition-colors font-body">
                                <Plus className="w-4 h-4" /> Ajouter
                            </button>
                        )}
                    </div>

                    {/* Formulaire nouvelle adresse */}
                    {showAddrForm && (
                        <form onSubmit={handleAddAddress} className="card p-4 space-y-3 animate-fade-in">
                            <h3 className="font-body font-medium text-encre text-sm">Nouvelle adresse</h3>
                            <input required value={newAddr.rue}
                                   onChange={e => setNewAddr(a => ({ ...a, rue: e.target.value }))}
                                   placeholder="Rue *" className="input-field py-2.5" />
                            <input value={newAddr.quartier}
                                   onChange={e => setNewAddr(a => ({ ...a, quartier: e.target.value }))}
                                   placeholder="Quartier" className="input-field py-2.5" />
                            <input required value={newAddr.ville}
                                   onChange={e => setNewAddr(a => ({ ...a, ville: e.target.value }))}
                                   placeholder="Ville *" className="input-field py-2.5" />
                            <input value={newAddr.complement}
                                   onChange={e => setNewAddr(a => ({ ...a, complement: e.target.value }))}
                                   placeholder="Complément (optionnel)" className="input-field py-2.5" />
                            <div className="flex gap-2">
                                <button type="submit" disabled={addingAddr} className="btn-primary text-sm py-2">
                                    {addingAddr && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Ajouter
                                </button>
                                <button type="button" onClick={() => setShowAddrForm(false)}
                                        className="btn-secondary text-sm py-2">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Liste adresses */}
                    <div className="space-y-2">
                        {addresses.map((addr) => (
                            <div key={addr.id} className="card p-4 flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-body font-medium text-encre text-sm truncate">{addr.rue}</p>
                                        {addr.estPrincipale && (
                                            <span className="shrink-0 text-[10px] bg-or/10 text-or px-1.5 py-0.5 rounded-full font-body">
                        Principale
                      </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-encre-muted font-body">
                                        {[addr.quartier, addr.ville].filter(Boolean).join(", ")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {!addr.estPrincipale && (
                                        <button onClick={() => handleSetPrincipal(addr.id)}
                                                title="Définir comme principale"
                                                className="p-1.5 text-encre-muted hover:text-or transition-colors">
                                            <Star className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteAddr(addr.id)}
                                            className="p-1.5 text-encre-muted hover:text-error transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {addresses.length === 0 && !showAddrForm && (
                            <p className="text-sm text-encre-muted font-body text-center py-6 bg-sable/20 rounded-xl">
                                Aucune adresse enregistrée.
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Sécurité — Mot de passe ─────────────────────────────────── */}
                <div className="card p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-encre/5 rounded-xl flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-encre" />
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-bold text-encre">Sécurité</h2>
                            <p className="text-xs text-encre-muted font-body mt-0.5">
                                {aMotDePasse
                                    ? "Un mot de passe est défini sur votre compte."
                                    : "Aucun mot de passe défini — connexion par code OTP uniquement."}
                            </p>
                        </div>
                        {aMotDePasse && (
                            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-success bg-green-50 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Actif
              </span>
                        )}
                    </div>

                    {!aMotDePasse && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-body">
                            Définissez un mot de passe pour vous connecter sans code OTP.
                            Votre compte restera aussi accessible par code OTP.
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="input-label">
                                {aMotDePasse ? "Nouveau mot de passe" : "Définir un mot de passe"}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={newPwd}
                                    onChange={e => setNewPwd(e.target.value)}
                                    placeholder="Minimum 8 caractères"
                                    className="input-field pl-9 pr-10"
                                />
                                <button type="button" tabIndex={-1}
                                        onClick={() => setShowNew(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre transition-colors">
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {newPwd.length > 0 && newPwd.length < 8 && (
                                <p className="text-xs text-error mt-1">Au moins 8 caractères requis.</p>
                            )}
                        </div>

                        {newPwd.length >= 8 && (
                            <div className="animate-fade-in">
                                <label className="input-label">Confirmer le mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPwd}
                                        onChange={e => setConfirmPwd(e.target.value)}
                                        placeholder="Répétez le mot de passe"
                                        className="input-field pl-9 pr-10"
                                    />
                                    <button type="button" tabIndex={-1}
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre transition-colors">
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPwd && confirmPwd !== newPwd && (
                                    <p className="text-xs text-error mt-1">Les mots de passe ne correspondent pas.</p>
                                )}
                                {confirmPwd && confirmPwd === newPwd && (
                                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Les mots de passe correspondent.
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSavePassword}
                            disabled={savingPwd || newPwd.length < 8 || newPwd !== confirmPwd}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {savingPwd
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><Lock className="w-4 h-4" /> {aMotDePasse ? "Modifier le mot de passe" : "Enregistrer le mot de passe"}</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
