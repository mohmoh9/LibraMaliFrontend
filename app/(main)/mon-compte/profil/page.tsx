"use client";
// src/app/(main)/mon-compte/profil/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2, Star } from "lucide-react";
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
  const [addingAddr, setAddingAddr] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    api.get("/users/me").then(({ data }) => {
      const u: User = data.data;
      setUser(u);
      setNom(u.nom);
      setTelephone(u.telephone ?? "");
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
    // MODIFICATION ICI : On utilise /addresses au lieu de /users/me/addresses
    await api.post("/addresses", newAddr); 
    
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
      </div>
    </div>
  );
}
