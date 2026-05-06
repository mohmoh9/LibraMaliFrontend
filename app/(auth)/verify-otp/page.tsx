"use client";
// src/app/(auth)/verify-otp/page.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    BookOpen, ArrowLeft, Loader2,
    RotateCcw, ShieldCheck, CheckCircle,
    Lock, Eye, EyeOff, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import type { AuthResponse } from "@/types";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 20; // secondes
const MAX_RESENDS = 3;

export default function VerifyOtpPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuthStore();

    /* ── Données de session ───────────────────────────────────────────────── */
    const [email, setEmail] = useState<string>("");
    const [nom, setNom] = useState<string>("");
    const [mode, setMode] = useState<"login" | "register">("login");
    const [mounted, setMounted] = useState(false);

    /* ── État OTP ─────────────────────────────────────────────────────────── */
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [verifying, setVerifying] = useState(false);
    const [verified,    setVerified]    = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    /*
     * otpMode :
     *  "login"          → connexion / inscription standard
     *  "reset_password" → réinitialisation de mot de passe
     */
    const [otpMode,     setOtpMode]     = useState<"login" | "reset_password">("login");
    // États spécifiques au mode reset_password
    const [pwdStep,     setPwdStep]     = useState(false);   // true après OTP validé
    const [validatedCode, setValidatedCode] = useState("");  // code OTP vérifié
    const [newPassword, setNewPassword] = useState("");
    const [confirmPwd,  setConfirmPwd]  = useState("");
    const [showPwd,     setShowPwd]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savingPwd,   setSavingPwd]   = useState(false);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    /* ── Renvoi ───────────────────────────────────────────────────────────── */
    const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
    const [resendCount, setResendCount] = useState(0);
    const [resending, setResending] = useState(false);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ── Init ─────────────────────────────────────────────────────────────── */
    useEffect(() => {
        setMounted(true);
        if (isAuthenticated) { router.replace("/catalogue"); return; }

        const storedEmail   = sessionStorage.getItem("auth_email") ?? sessionStorage.getItem("otp_email");
        const storedMode    = sessionStorage.getItem("auth_mode") as "login" | "register" | null;
        const storedNom     = sessionStorage.getItem("auth_nom");
        const storedOtpMode = sessionStorage.getItem("otp_mode") as "login" | "reset_password" | null;
        if (storedOtpMode) {
            setOtpMode(storedOtpMode);
            sessionStorage.removeItem("otp_mode");
        }

        if (!storedEmail) {
            router.replace("/login");
            return;
        }

        setEmail(storedEmail);
        setMode(storedMode ?? "login");
        setNom(storedNom ?? "");
        startCountdown();
        // Focus premier input
        setTimeout(() => inputsRef.current[0]?.focus(), 100);

        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, []);

    const startCountdown = useCallback(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(RESEND_COOLDOWN);
        countdownRef.current = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(countdownRef.current!);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    }, []);

    /* ── Gestion saisie ───────────────────────────────────────────────────── */
    const handleChange = (idx: number, raw: string) => {
        // Accepter uniquement les chiffres
        const val = raw.replace(/\D/g, "").slice(-1);
        const next = [...digits];
        next[idx] = val;
        setDigits(next);
        setError(null);

        // Avancer au prochain champ
        if (val && idx < OTP_LENGTH - 1) {
            inputsRef.current[idx + 1]?.focus();
        }

        // Auto-submit quand tous les chiffres sont saisis
        if (val && next.filter(Boolean).length === OTP_LENGTH) {
            verifyCode(next.join(""));
        }
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (digits[idx]) {
                // Effacer le chiffre courant
                const next = [...digits];
                next[idx] = "";
                setDigits(next);
                setError(null);
            } else if (idx > 0) {
                // Revenir en arrière
                inputsRef.current[idx - 1]?.focus();
            }
        }
        if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
        if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!paste) return;
        const next = [...digits];
        paste.split("").forEach((d, i) => { if (i < OTP_LENGTH) next[i] = d; });
        setDigits(next);
        setError(null);
        // Focus sur le dernier champ rempli
        const lastIdx = Math.min(paste.length, OTP_LENGTH - 1);
        inputsRef.current[lastIdx]?.focus();
        // Auto-submit si complet
        if (paste.length === OTP_LENGTH) verifyCode(paste);
    };

    /* ── Vérification ─────────────────────────────────────────────────────── */
    const verifyCode = useCallback(async (code: string) => {
        if (verifying || verified) return;
        setVerifying(true);
        setError(null);
        try {
            if (otpMode === "reset_password") {
                /*
                 * En mode réinitialisation : on ne connecte pas l'utilisateur.
                 * On vérifie juste que le code est valide (appel verify-otp),
                 * puis on affiche le formulaire de nouveau mot de passe.
                 * Le code est conservé pour POST /api/auth/reset-password.
                 */
                await api.post("/auth/verify-otp", { email, code });
                setValidatedCode(code);
                setPwdStep(true);
                toast.success("Code vérifié ! Définissez votre nouveau mot de passe.");
            } else {
                // Mode login / inscription standard
                const { data } = await api.post("/auth/verify-otp", { email, code });
                const auth: AuthResponse = data.data;

                // Connecter l'utilisateur immédiatement (tokens disponibles)
                login(auth);

                // Vérifier si un mot de passe a été défini lors de l'inscription
                const pendingPassword = sessionStorage.getItem("pending_password");

                if (pendingPassword && auth.accessToken) {
                    /*
                     * Nouveau compte + mot de passe pré-rempli lors de l'inscription :
                     * on l'envoie directement à l'API avec le token fraîchement obtenu.
                     * Pas besoin d'afficher un formulaire supplémentaire.
                     */
                    try {
                        await api.post(
                            "/auth/set-password",
                            { password: pendingPassword, confirmPassword: pendingPassword },
                            { headers: { Authorization: `Bearer ${auth.accessToken}` } }
                        );
                        toast.success(`Bienvenue, ${auth.nom} ! 🎉 Votre mot de passe a été enregistré.`);
                    } catch {
                        // Le mot de passe n'a pas pu être enregistré — pas bloquant
                        toast.success(`Bienvenue, ${auth.nom} ! 🎉`);
                        toast.error("Votre compte est activé mais le mot de passe n'a pas pu être enregistré. Définissez-le depuis votre profil.");
                    } finally {
                        sessionStorage.removeItem("pending_password");
                    }
                } else {
                    const welcome = auth.nouveauCompte
                        ? `Bienvenue, ${auth.nom} ! 🎉`
                        : `Ravi de vous revoir, ${auth.nom} !`;
                    toast.success(welcome);
                }

                sessionStorage.removeItem("auth_email");
                sessionStorage.removeItem("auth_mode");
                sessionStorage.removeItem("auth_nom");
                sessionStorage.removeItem("otp_email");

                setVerified(true);
                setTimeout(() => {
                    router.push(auth.role === "ADMIN" ? "/admin/dashboard" : "/catalogue");
                }, 900);
            }
        } catch (err) {
            const msg = getErrorMessage(err);
            setError(msg);
            setDigits(Array(OTP_LENGTH).fill(""));
            setTimeout(() => inputsRef.current[0]?.focus(), 50);
        } finally {
            setVerifying(false);
        }
    }, [email, login, router, verifying, verified, otpMode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = digits.join("");
        if (code.length < OTP_LENGTH) {
            setError("Entrez les 6 chiffres de votre code.");
            return;
        }
        verifyCode(code);
    };

    /* ── Renvoi OTP ───────────────────────────────────────────────────────── */
    const handleResend = async () => {
        if (countdown > 0 || resendCount >= MAX_RESENDS) return;
        setResending(true);
        try {
            await api.post("/auth/send-otp", { email });
            setResendCount((c) => c + 1);
            setDigits(Array(OTP_LENGTH).fill(""));
            setError(null);
            startCountdown();
            toast.success("Nouveau code envoyé !");
            setTimeout(() => inputsRef.current[0]?.focus(), 50);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setResending(false);
        }
    };

    /* ── Rendu ────────────────────────────────────────────────────────────── */
    if (!mounted) return null;

    const avatarLetter = (nom || email).charAt(0).toUpperCase();
    const codeComplete = digits.filter(Boolean).length === OTP_LENGTH;

    return (
        <div className="min-h-screen flex bg-ivoire">

            {/* ── Panneau gauche ─────────────────────────────────────────────── */}
            <div className="hidden lg:flex w-[45%] bg-encre flex-col justify-between p-14 relative overflow-hidden">
                {/* Halos */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-or/8 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-or/5 blur-3xl pointer-events-none" />
                {/* Grain */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-or rounded-xl flex items-center justify-center shadow-lg">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display text-2xl font-semibold text-ivoire tracking-tight">LibraMali</span>
                </div>

                {/* Contenu central */}
                <div className="relative z-10 space-y-8">
                    {/* Icône sécurité */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                         style={{ background: "rgba(201,168,76,0.15)" }}>
                        <ShieldCheck className="w-8 h-8 text-or" />
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-display text-3xl font-bold text-ivoire leading-tight">
                            Vérification<br />sécurisée
                        </h2>
                        <p className="font-body text-sm leading-relaxed" style={{ color: "#9B9590" }}>
                            Nous utilisons une authentification sans mot de passe.
                            Un code unique vous est envoyé par email à chaque connexion.
                        </p>
                    </div>

                    {/* Étapes */}
                    <div className="space-y-4">
                        {[
                            { n: 1, label: "Email soumis", done: true },
                            { n: 2, label: "Code envoyé", done: true },
                            { n: 3, label: "Vérification du code", done: verified },
                        ].map((step) => (
                            <div key={step.n} className="flex items-center gap-3">
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-body shrink-0 transition-all",
                                    step.done ? "bg-or text-white" : "bg-white/10 text-encre-muted"
                                )}>
                                    {step.done ? <CheckCircle className="w-4 h-4" /> : step.n}
                                </div>
                                <span className={cn(
                                    "font-body text-sm transition-colors",
                                    step.done ? "text-ivoire" : "text-encre-muted"
                                )}>
                  {step.label}
                </span>
                            </div>
                        ))}
                    </div>

                    {/* Info boîte */}
                    <div className="p-4 rounded-xl border text-sm font-body"
                         style={{ borderColor: "rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.05)", color: "#9B9590" }}>
                        <strong style={{ color: "#C4BFB9" }}>Conseil :</strong> Vérifiez aussi vos spams si vous ne
                        voyez pas l&apos;email dans votre boîte principale.
                    </div>
                </div>

                <p className="relative z-10 text-xs font-body" style={{ color: "#3D3A36" }}>
                    © {new Date().getFullYear()} LibraMali
                </p>
            </div>

            {/* ── Panneau droit — formulaire OTP ────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:px-8 sm:py-12">
                <div className="w-full max-w-[400px] animate-fade-in">

                    {/* Retour */}
                    <Link href="/login"
                          className="inline-flex items-center gap-1.5 text-sm text-encre-muted
                       hover:text-encre transition-colors font-body mb-10">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Retour à la connexion
                    </Link>

                    {/* Avatar email */}
                    <div className="mb-8 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-encre flex items-center justify-center shadow-card shrink-0">
                                <span className="font-display text-2xl font-bold text-ivoire">{avatarLetter}</span>
                            </div>
                            <div>
                                <h1 className="font-display text-2xl font-bold text-encre">Vérification</h1>
                                <p className="font-body text-sm text-encre-muted mt-0.5">
                                    {mode === "register" ? "Bienvenue, " : "Ravi de vous revoir, "}
                                    <span className="font-medium text-encre">{nom || email.split("@")[0]}</span>
                                </p>
                            </div>
                        </div>

                        <div className="pl-0 space-y-1">
                            <p className="font-body text-sm text-encre-muted">
                                Un code à 6 chiffres a été envoyé à
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-or animate-pulse" />
                                <span className="font-body font-semibold text-encre text-sm">{email}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Formulaire OTP ──────────────────────────────────────── */}
                    {pwdStep ? (
                        /* ── Étape 2 (reset) : saisie du nouveau mot de passe ── */
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-success shrink-0" />
                                <p className="text-sm text-green-800 font-body font-medium">
                                    Code vérifié — définissez votre nouveau mot de passe
                                </p>
                            </div>

                            <div>
                                <label className="input-label">Nouveau mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                    <input
                                        type={showPwd ? "text" : "password"}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Minimum 8 caractères"
                                        autoFocus
                                        className="input-field pl-9 pr-10"
                                    />
                                    <button type="button"
                                            onClick={() => setShowPwd(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre transition-colors"
                                            tabIndex={-1}
                                    >
                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {newPassword.length > 0 && newPassword.length < 8 && (
                                    <p className="text-xs text-error mt-1">Au moins 8 caractères requis.</p>
                                )}
                            </div>

                            <div>
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
                                    <button type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre transition-colors"
                                            tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPwd && confirmPwd !== newPassword && (
                                    <p className="text-xs text-error mt-1">Les mots de passe ne correspondent pas.</p>
                                )}
                            </div>

                            <button
                                type="button"
                                disabled={savingPwd || newPassword.length < 8 || newPassword !== confirmPwd}
                                onClick={async () => {
                                    setSavingPwd(true);
                                    try {
                                        await api.post("/auth/reset-password", {
                                            email,
                                            code: validatedCode,
                                            newPassword,
                                            confirmPassword: confirmPwd,
                                        });
                                        toast.success("Mot de passe réinitialisé ! Vous pouvez vous connecter.");
                                        router.push("/login");
                                    } catch (err) {
                                        toast.error(getErrorMessage(err));
                                    } finally {
                                        setSavingPwd(false);
                                    }
                                }}
                                className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingPwd
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <><KeyRound className="w-4 h-4" /> Enregistrer le nouveau mot de passe</>}
                            </button>
                        </div>
                    ) : verified ? (
                        /* État succès connexion */
                        <div className="py-8 flex flex-col items-center gap-4 animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-success" />
                            </div>
                            <p className="font-display text-xl font-bold text-encre">Code vérifié !</p>
                            <p className="text-sm text-encre-muted font-body flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Redirection en cours…
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Cases OTP */}
                            <div className="space-y-3">
                                {/*
                 * grid-cols-6 : 6 colonnes égales — chaque case prend
                 * exactement (100% - 5*gap) / 6, sans jamais déborder.
                 * aspect-square maintient les cases carrées à toute taille.
                 */}
                                <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full" onPaste={handlePaste}>
                                    {digits.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { inputsRef.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            disabled={verifying}
                                            aria-label={`Chiffre ${i + 1}`}
                                            className={cn(
                                                "w-full aspect-square min-w-0",
                                                "text-center text-base sm:text-xl font-bold font-mono",
                                                "rounded-xl border-2 bg-white text-encre",
                                                "transition-all duration-150",
                                                "focus:outline-none focus:ring-4",
                                                error
                                                    ? "border-error focus:border-error focus:ring-error/15 animate-shake"
                                                    : digit
                                                        ? "border-encre focus:border-or focus:ring-or/20 bg-encre/[0.02]"
                                                        : "border-sable-dark focus:border-or focus:ring-or/20",
                                                verifying && "opacity-60 cursor-not-allowed",
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Message d'erreur */}
                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
                                        <div className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                                        <p className="text-xs text-error font-body">{error}</p>
                                    </div>
                                )}

                                {/* Aide paste */}
                                <p className="text-center text-xs text-encre-muted font-body">
                                    Vous pouvez coller le code directement depuis votre email.
                                </p>
                            </div>

                            {/* Bouton Confirmer */}
                            <button
                                type="submit"
                                disabled={verifying || !codeComplete}
                                className={cn(
                                    "w-full justify-center py-4 text-base transition-all",
                                    codeComplete
                                        ? "btn-primary"
                                        : "btn-secondary opacity-60 cursor-not-allowed"
                                )}
                            >
                                {verifying
                                    ? <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Vérification…
                                    </>
                                    : <>
                                        <ShieldCheck className="w-4 h-4" />
                                        Confirmer le code
                                    </>}
                            </button>

                            {/* Renvoi */}
                            <div className="text-center space-y-2">
                                {resendCount >= MAX_RESENDS ? (
                                    <p className="text-sm text-encre-muted font-body">
                                        Nombre maximum de renvois atteint.{" "}
                                        <Link href="/login" className="text-or hover:underline font-medium">
                                            Recommencer
                                        </Link>
                                    </p>
                                ) : countdown > 0 ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-sm text-encre-muted font-body">
                                            Renvoyer le code dans{" "}
                                            <span className="font-mono font-medium text-encre tabular-nums">
                        {String(countdown).padStart(2, "0")}s
                      </span>
                                        </p>
                                        {/* Barre de progression */}
                                        <div className="w-32 h-0.5 bg-sable rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-or rounded-full transition-all duration-1000"
                                                style={{ width: `${(countdown / RESEND_COOLDOWN) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resending}
                                        className="inline-flex items-center gap-1.5 text-sm font-body
                               text-or hover:text-or-dark transition-colors font-medium"
                                    >
                                        {resending
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <RotateCcw className="w-3.5 h-3.5" />}
                                        {resending ? "Envoi…" : "Renvoyer le code"}
                                        {resendCount > 0 && (
                                            <span className="text-encre-muted font-normal">
                        ({resendCount}/{MAX_RESENDS})
                      </span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Logo mobile */}
                    <div className="lg:hidden mt-12 flex items-center justify-center gap-2">
                        <div className="w-7 h-7 bg-encre rounded-lg flex items-center justify-center">
                            <BookOpen className="w-3.5 h-3.5 text-ivoire" />
                        </div>
                        <span className="font-display font-semibold text-encre">LibraMali</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
