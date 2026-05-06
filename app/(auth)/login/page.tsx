"use client";
// src/app/(auth)/login/page.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    BookOpen, ArrowRight, Loader2, Mail,
    User, Phone, Eye, EyeOff, CheckCircle2,
    Lock, KeyRound, MessageSquare, ChevronRight,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

/* ── Schémas de validation ────────────────────────────────────────────────── */
const loginSchema = z.object({
    email: z.string().email("Adresse email invalide"),
});

const loginPasswordSchema = z.object({
    email:    z.string().email("Adresse email invalide"),
    password: z.string().min(1, "Le mot de passe est obligatoire"),
});

const registerSchema = z.object({
    nom:             z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email:           z.string().email("Adresse email invalide"),
    telephone:       z.string().optional(),
    password:        z.string().min(8, "Minimum 8 caractères").optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
}).refine(
    (d) => !d.password || d.password === d.confirmPassword,
    { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] }
);

type LoginForm         = z.infer<typeof loginSchema>;
type LoginPasswordForm = z.infer<typeof loginPasswordSchema>;
type RegisterForm      = z.infer<typeof registerSchema>;
type Mode             = "login" | "register";
type AuthMethod       = "otp" | "password";

/* ── Livres décoratifs ────────────────────────────────────────────────────── */
const BOOKS = [
    { color: "#C9A84C", h: "h-32", rotate: "-rotate-6", delay: "delay-0"   },
    { color: "#1A1814", h: "h-40", rotate: "rotate-1",  delay: "delay-100" },
    { color: "#E8E0D0", h: "h-28", rotate: "rotate-3",  delay: "delay-200" },
    { color: "#4A7FA5", h: "h-36", rotate: "-rotate-2", delay: "delay-300" },
];

const AVANTAGES = [
    "5 000+ titres disponibles",
    "Livraison en 24–48h",
    "Paiement Mobile Money",
    "Littérature africaine & internationale",
];

export default function LoginPage() {
    const router  = useRouter();
    const { login: storeLogin, isAuthenticated } = useAuthStore();

    const [mode,        setMode]        = useState<Mode>("login");
    const [authMethod,  setAuthMethod]  = useState<AuthMethod>("otp");
    const [loading,     setLoading]     = useState(false);
    const [showPwd,     setShowPwd]     = useState(false);
    const [showRegPwd,  setShowRegPwd]  = useState(false);
    const [showRegConf, setShowRegConf] = useState(false);
    const [submitted,   setSubmitted]   = useState(false); // email envoyé (mode OTP)

    /* Formulaire connexion OTP */
    const loginForm = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    /* Formulaire connexion mot de passe */
    const passwordForm = useForm<LoginPasswordForm>({
        resolver: zodResolver(loginPasswordSchema),
    });

    /* Formulaire inscription */
    const registerForm = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    useEffect(() => {
        if (isAuthenticated) router.push("/");
    }, [isAuthenticated, router]);

    /* Reset état interne quand on change de mode */
    const switchMode = (newMode: Mode) => {
        setMode(newMode);
        setSubmitted(false);
        setAuthMethod("otp");
        loginForm.reset();
        passwordForm.reset();
        registerForm.reset();
    };

    /* Reset méthode auth */
    const switchMethod = (m: AuthMethod) => {
        setAuthMethod(m);
        setSubmitted(false);
        loginForm.reset();
        passwordForm.reset();
    };

    /* ── Connexion par OTP (envoi du code) ─────────────────────────────── */
    const handleLoginOtp = async (values: LoginForm) => {
        setLoading(true);
        try {
            await api.post("/auth/login", { email: values.email });
            sessionStorage.setItem("otp_email", values.email);
            toast.success("Code envoyé ! Vérifiez votre email.");
            router.push("/verify-otp");
        } catch (err) {
            const msg = getErrorMessage(err);
            // Si le compte n'existe pas, proposer l'inscription
            if (msg.toLowerCase().includes("aucun compte")) {
                toast.error(msg);
                switchMode("register");
                registerForm.setValue("email", values.email);
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };


    /* ── Connexion par mot de passe (direct JWT) ───────────────────────── */
    const handleLoginPassword = async (values: LoginPasswordForm) => {
        setLoading(true);
        try {
            const { data } = await api.post("/auth/login-password", {
                email:    values.email,
                password: values.password,
            });

            // data.data contient normalement l'objet AuthResponse complet
            const auth = data.data;

            // ✅ Correction : On passe l'objet complet 'auth' au lieu de 6 arguments
            storeLogin(auth);

            toast.success(`Bienvenue, ${auth.nom} !`);
            router.push("/");
        } catch (err) {
            const msg = getErrorMessage(err);
            if (msg.toLowerCase().includes("pas encore défini")) {
                toast.error("Vous n'avez pas de mot de passe. Connectez-vous par code OTP.");
                setAuthMethod("otp");
                loginForm.setValue("email", values.email);
            } else {
                passwordForm.setError("password", { message: msg });
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    /* ── Inscription ────────────────────────────────────────────────────── */
    const handleRegister = async (values: RegisterForm) => {
        setLoading(true);
        try {
            await api.post("/auth/register", {
                nom:       values.nom,
                email:     values.email,
                telephone: values.telephone,
            });
            sessionStorage.setItem("otp_email", values.email);
            sessionStorage.setItem("auth_mode", "register");
            // Stocker le mot de passe en clair temporairement (sessionStorage, durée de vie OTP)
            // Il sera envoyé à POST /api/auth/set-password juste après validation de l'OTP.
            if (values.password) {
                sessionStorage.setItem("pending_password", values.password);
            }
            toast.success("Compte créé ! Vérifiez votre email pour activer votre compte.");
            router.push("/verify-otp");
        } catch (err) {
            const msg = getErrorMessage(err);
            if (msg.toLowerCase().includes("déjà")) {
                toast.error(msg);
                switchMode("login");
                loginForm.setValue("email", values.email);
                passwordForm.setValue("email", values.email);
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-ivoire">

            {/* ── Panneau gauche — éditorial ──────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[45%] bg-encre text-ivoire flex-col
                      justify-between p-12 relative overflow-hidden">
                {/* Fond ponctué */}
                <div className="absolute inset-0 pointer-events-none"
                     style={{
                         backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.08) 1px, transparent 1px)",
                         backgroundSize:  "28px 28px",
                     }} />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-or rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display text-2xl font-bold text-ivoire">LibraMali</span>
                </div>

                {/* Livres décoratifs */}
                <div className="relative z-10 flex items-end justify-center gap-4 my-8">
                    {BOOKS.map((b, i) => (
                        <div key={i}
                             className={cn(
                                 "w-12 rounded-sm shadow-xl transition-transform hover:-translate-y-2",
                                 b.h, b.rotate, b.delay
                             )}
                             style={{ backgroundColor: b.color }}
                        />
                    ))}
                </div>

                {/* Texte éditorial */}
                <div className="relative z-10 space-y-6">
                    <h2 className="font-display text-4xl font-bold text-ivoire leading-tight">
                        La librairie<br />
                        <span className="text-or">numérique</span><br />
                        du Mali.
                    </h2>
                    <ul className="space-y-3">
                        {AVANTAGES.map((a, i) => (
                            <li key={i} className="flex items-center gap-3 text-ivoire/70 text-sm font-body">
                                <CheckCircle2 className="w-4 h-4 text-or shrink-0" />
                                {a}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ── Panneau droit — formulaire ──────────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center items-center
                      px-4 py-10 sm:px-8">
                <div className="w-full max-w-[420px] space-y-6 animate-fade-in">

                    {/* Logo mobile */}
                    <div className="flex lg:hidden items-center gap-2 justify-center mb-2">
                        <div className="w-9 h-9 bg-encre rounded-xl flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-ivoire" />
                        </div>
                        <span className="font-display text-xl font-bold text-encre">LibraMali</span>
                    </div>

                    {/* Titre */}
                    <div>
                        <h1 className="font-display text-3xl font-bold text-encre">
                            {mode === "login" ? "Bon retour 👋" : "Créer un compte"}
                        </h1>
                        <p className="text-sm text-encre-muted font-body mt-1">
                            {mode === "login"
                                ? "Connectez-vous à votre espace LibraMali."
                                : "Rejoignez des milliers de lecteurs au Mali."}
                        </p>
                    </div>

                    {/* ── Sélecteur mode (connexion / inscription) ─────────────── */}
                    <div className="flex bg-sable/60 rounded-xl p-1 gap-1">
                        {(["login", "register"] as Mode[]).map(m => (
                            <button key={m} type="button"
                                    onClick={() => switchMode(m)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all",
                                        mode === m
                                            ? "bg-white text-encre shadow-sm"
                                            : "text-encre-muted hover:text-encre"
                                    )}
                            >
                                {m === "login" ? "Connexion" : "Inscription"}
                            </button>
                        ))}
                    </div>

                    {/* ════════════════════════════════════════
              FORMULAIRE CONNEXION
          ════════════════════════════════════════ */}
                    {mode === "login" && (
                        <div className="space-y-5">

                            {/* Sélecteur de méthode d'authentification */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-encre-muted uppercase tracking-wider">
                                    Méthode de connexion
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {/* OTP */}
                                    <button type="button"
                                            onClick={() => switchMethod("otp")}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                                                authMethod === "otp"
                                                    ? "border-encre bg-encre text-ivoire shadow-md"
                                                    : "border-sable-dark text-encre-muted hover:border-encre hover:text-encre bg-white"
                                            )}
                                    >
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center",
                                            authMethod === "otp" ? "bg-white/15" : "bg-sable/60"
                                        )}>
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold">Code OTP</p>
                                            <p className={cn(
                                                "text-[10px] leading-tight",
                                                authMethod === "otp" ? "text-ivoire/60" : "text-encre-muted"
                                            )}>
                                                Envoyé par email
                                            </p>
                                        </div>
                                    </button>

                                    {/* Mot de passe */}
                                    <button type="button"
                                            onClick={() => switchMethod("password")}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                                                authMethod === "password"
                                                    ? "border-encre bg-encre text-ivoire shadow-md"
                                                    : "border-sable-dark text-encre-muted hover:border-encre hover:text-encre bg-white"
                                            )}
                                    >
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center",
                                            authMethod === "password" ? "bg-white/15" : "bg-sable/60"
                                        )}>
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold">Mot de passe</p>
                                            <p className={cn(
                                                "text-[10px] leading-tight",
                                                authMethod === "password" ? "text-ivoire/60" : "text-encre-muted"
                                            )}>
                                                Connexion directe
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* ── Formulaire OTP ─────────────────────────────────── */}
                            {authMethod === "otp" && (
                                <form onSubmit={loginForm.handleSubmit(handleLoginOtp)}
                                      className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="input-label">Adresse email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                            <input
                                                {...loginForm.register("email")}
                                                type="email"
                                                placeholder="vous@exemple.com"
                                                autoFocus
                                                className="input-field pl-9"
                                            />
                                        </div>
                                        {loginForm.formState.errors.email && (
                                            <p className="text-xs text-error mt-1">
                                                {loginForm.formState.errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                                        {loading
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <><Mail className="w-4 h-4" /> Recevoir un code par email</>}
                                    </button>

                                    <p className="text-xs text-encre-muted font-body text-center">
                                        Un code à 6 chiffres sera envoyé à votre adresse email.
                                    </p>
                                </form>
                            )}

                            {/* ── Formulaire mot de passe ─────────────────────── */}
                            {authMethod === "password" && (
                                <form onSubmit={passwordForm.handleSubmit(handleLoginPassword)}
                                      className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="input-label">Adresse email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                            <input
                                                {...passwordForm.register("email")}
                                                type="email"
                                                placeholder="vous@exemple.com"
                                                autoFocus
                                                className="input-field pl-9"
                                            />
                                        </div>
                                        {passwordForm.formState.errors.email && (
                                            <p className="text-xs text-error mt-1">
                                                {passwordForm.formState.errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="input-label mb-0">Mot de passe</label>
                                            {/*
                       * Lien "Mot de passe oublié" :
                       * Envoie un OTP permettant de réinitialiser le mot de passe
                       * via POST /api/auth/reset-password
                       */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const email = passwordForm.getValues("email");
                                                    if (email) sessionStorage.setItem("otp_email", email);
                                                    sessionStorage.setItem("otp_mode", "reset_password");
                                                    router.push("/verify-otp");
                                                }}
                                                className="text-xs text-or hover:underline font-body font-medium"
                                            >
                                                Mot de passe oublié ?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                            <input
                                                {...passwordForm.register("password")}
                                                type={showPwd ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="input-field pl-9 pr-10"
                                            />
                                            <button type="button"
                                                    onClick={() => setShowPwd(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre transition-colors"
                                                    tabIndex={-1}
                                            >
                                                {showPwd
                                                    ? <EyeOff className="w-4 h-4" />
                                                    : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {passwordForm.formState.errors.password && (
                                            <p className="text-xs text-error mt-1">
                                                {passwordForm.formState.errors.password.message}
                                            </p>
                                        )}
                                    </div>

                                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                                        {loading
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <><Lock className="w-4 h-4" /> Se connecter</>}
                                    </button>
                                </form>
                            )}

                            {/* Info mot de passe */}
                            {authMethod === "password" && (
                                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-body animate-fade-in">
                                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                    <p>
                                        Vous n'avez pas encore de mot de passe ?{" "}
                                        <button type="button" className="underline font-medium"
                                                onClick={() => switchMethod("otp")}>
                                            Connectez-vous par OTP
                                        </button>{" "}
                                        puis définissez-en un dans votre profil.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════════════════════════════════════════
              FORMULAIRE INSCRIPTION
          ════════════════════════════════════════ */}
                    {mode === "register" && (
                        <form onSubmit={registerForm.handleSubmit(handleRegister)}
                              className="space-y-4 animate-fade-in">
                            <div>
                                <label className="input-label">Nom complet</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                    <input
                                        {...registerForm.register("nom")}
                                        placeholder="Votre nom"
                                        autoFocus
                                        className="input-field pl-9"
                                    />
                                </div>
                                {registerForm.formState.errors.nom && (
                                    <p className="text-xs text-error mt-1">
                                        {registerForm.formState.errors.nom.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="input-label">Adresse email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                    <input
                                        {...registerForm.register("email")}
                                        type="email"
                                        placeholder="vous@exemple.com"
                                        className="input-field pl-9"
                                    />
                                </div>
                                {registerForm.formState.errors.email && (
                                    <p className="text-xs text-error mt-1">
                                        {registerForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="input-label">
                                    Téléphone
                                    <span className="ml-1 font-normal normal-case text-encre-muted">(optionnel)</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                    <input
                                        {...registerForm.register("telephone")}
                                        type="tel"
                                        placeholder="+223 XX XX XX XX"
                                        className="input-field pl-9"
                                    />
                                </div>
                            </div>

                            {/* ── Séparateur mot de passe optionnel ─────────────── */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-sable-dark" />
                                </div>
                                <div className="relative flex justify-center">
                  <span className="bg-ivoire px-3 text-[10px] font-bold text-encre-muted uppercase tracking-wider">
                    Mot de passe (optionnel)
                  </span>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-body">
                                Définissez un mot de passe maintenant pour pouvoir vous connecter
                                sans code OTP à l'avenir. Vous pourrez aussi le faire plus tard
                                depuis votre profil.
                            </div>

                            <div>
                                <label className="input-label">
                                    Mot de passe
                                    <span className="ml-1 font-normal normal-case text-encre-muted">(optionnel)</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                    <input
                                        {...registerForm.register("password")}
                                        type={showRegPwd ? "text" : "password"}
                                        placeholder="Minimum 8 caractères"
                                        className="input-field pl-9 pr-10"
                                    />
                                    <button type="button" tabIndex={-1}
                                            onClick={() => setShowRegPwd(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre transition-colors"
                                    >
                                        {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {registerForm.formState.errors.password && (
                                    <p className="text-xs text-error mt-1">
                                        {registerForm.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Confirmation — affichée seulement si un mot de passe est saisi */}
                            {registerForm.watch("password") && (
                                <div className="animate-fade-in">
                                    <label className="input-label">Confirmer le mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted" />
                                        <input
                                            {...registerForm.register("confirmPassword")}
                                            type={showRegConf ? "text" : "password"}
                                            placeholder="Répétez le mot de passe"
                                            className="input-field pl-9 pr-10"
                                        />
                                        <button type="button" tabIndex={-1}
                                                onClick={() => setShowRegConf(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-encre-muted hover:text-encre transition-colors"
                                        >
                                            {showRegConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {registerForm.formState.errors.confirmPassword && (
                                        <p className="text-xs text-error mt-1">
                                            {registerForm.formState.errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                                {loading
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <><ArrowRight className="w-4 h-4" /> Créer mon compte</>}
                            </button>

                            <p className="text-xs text-encre-muted font-body text-center leading-relaxed">
                                Un code de vérification sera envoyé par email pour activer votre compte.
                            </p>
                        </form>
                    )}

                    {/* Lien CGV */}
                    <p className="text-xs text-encre-muted font-body text-center">
                        En continuant, vous acceptez nos{" "}
                        <Link href="/cgv" className="underline hover:text-encre">
                            conditions d'utilisation
                        </Link>{" "}
                        et notre{" "}
                        <Link href="/confidentialite" className="underline hover:text-encre">
                            politique de confidentialité
                        </Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
