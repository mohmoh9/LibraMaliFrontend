"use client";
// src/app/(auth)/login/page.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, ArrowRight, Loader2, Mail,
  User, Phone, Eye, EyeOff, CheckCircle2,
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

const registerSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  telephone: z.string().optional(),
});

type LoginForm    = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type Mode = "login" | "register";

/* ── Livres décoratifs animés ─────────────────────────────────────────────── */
const BOOKS = [
  { color: "#C9A84C", h: "h-32", rotate: "-rotate-6", delay: "delay-0" },
  { color: "#1A1814", h: "h-40", rotate: "rotate-1",  delay: "delay-100" },
  { color: "#E8E0D0", h: "h-28", rotate: "rotate-3",  delay: "delay-200" },
  { color: "#4A7FA5", h: "h-36", rotate: "-rotate-2", delay: "delay-300" },
];

/* ── Avantages affichés sur le panneau gauche ─────────────────────────────── */
const AVANTAGES = [
  "5 000+ titres disponibles",
  "Livraison en 24–48h",
  "Paiement Mobile Money",
  "Littérature africaine & internationale",
];

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) router.replace("/catalogue");
  }, [isAuthenticated, router]);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  /* ── Logique de redirection partagée ────────────────────────────────────── */
  const handleAuthRedirect = (email: string, authMode: Mode) => {
    sessionStorage.setItem("auth_email", email);
    sessionStorage.setItem("auth_mode", authMode);
    router.push("/verify-otp");
  };

  /* ── Gestion Connexion ──────────────────────────────────────────────────── */
  const handleLogin = async (values: LoginForm) => {
    setLoading(true);
    try {
      // Pour LibraMali, on vérifie d'abord l'existence puis on envoie l'OTP
      await api.post("/auth/login", { email: values.email });
      await api.post("/auth/send-otp", { email: values.email });
      
      toast.success("Code envoyé sur " + values.email);
      handleAuthRedirect(values.email, "login");
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.info("Un code est déjà valide. Redirection...");
        handleAuthRedirect(values.email, "login");
        return;
      }
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Gestion Inscription ────────────────────────────────────────────────── */
  const handleRegister = async (values: RegisterForm) => {
    setLoading(true);
    try {
      await api.post("/auth/register", {
        nom: values.nom,
        email: values.email,
        telephone: values.telephone || undefined,
      });
      await api.post("/auth/send-otp", { email: values.email });
      
      sessionStorage.setItem("auth_nom", values.nom);
      toast.success("Compte créé ! Code envoyé.");
      handleAuthRedirect(values.email, "register");
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.info("Un code a déjà été envoyé.");
        handleAuthRedirect(values.email, "register");
        return;
      }
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex bg-ivoire">

      {/* ── Panneau gauche — éditorial ─────────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] bg-encre flex-col justify-between p-14 relative overflow-hidden">

        {/* Halos décoratifs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-or/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-or/5 blur-3xl pointer-events-none" />
        {/* Grain texture subtil */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-or rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-semibold text-ivoire tracking-tight">LibraMali</span>
        </div>

        {/* Corps */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] font-body" style={{ color: "#6B6560" }}>
              Votre librairie en ligne
            </p>
            <h1 className="font-display text-4xl font-bold text-ivoire leading-[1.15]">
              La culture à<br />portée de main.
            </h1>
            <p className="font-body text-sm leading-relaxed max-w-xs" style={{ color: "#9B9590" }}>
              Des milliers de livres soigneusement sélectionnés,<br />livrés directement chez vous au Mali.
            </p>
          </div>

          {/* Avantages */}
          <ul className="space-y-3">
            {AVANTAGES.map((item, i) => (
              <li
                key={item}
                className="flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms`, opacity: 0, animationFillMode: "forwards" }}
              >
                <div className="w-5 h-5 rounded-full bg-or/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-or" />
                </div>
                <span className="font-body text-sm" style={{ color: "#C4BFB9" }}>{item}</span>
              </li>
            ))}
          </ul>

          {/* Livres illustratifs */}
          <div className="flex items-end gap-3 pt-2">
            {BOOKS.map((book, i) => (
              <div
                key={i}
                className={cn(
                  "w-11 rounded-lg shadow-lg transition-transform hover:-translate-y-2",
                  book.h, book.rotate, book.delay,
                  "animate-slide-up"
                )}
                style={{
                  backgroundColor: book.color,
                  opacity: 0,
                  animationFillMode: "forwards",
                  animationDelay: `${300 + i * 60}ms`,
                }}
              >
                {/* Spine details */}
                <div className="p-1.5 space-y-1 mt-3">
                  <div className="h-px bg-white/20 rounded-full" />
                  <div className="h-px bg-white/10 rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pied */}
        <p className="relative z-10 text-xs font-body" style={{ color: "#3D3A36" }}>
          © {new Date().getFullYear()} LibraMali
        </p>
      </div>

      {/* ── Panneau droit — formulaire ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] space-y-8 animate-fade-in">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 bg-encre rounded-xl flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-ivoire" />
            </div>
            <span className="font-display text-xl font-semibold text-encre">LibraMali</span>
          </div>

          {/* Toggle mode */}
          <div className="flex gap-1 bg-sable/60 p-1 rounded-2xl w-fit">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  loginForm.reset();
                  registerForm.reset();
                }}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-200",
                  mode === m
                    ? "bg-white text-encre shadow-sm"
                    : "text-encre-muted hover:text-encre"
                )}
              >
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {/* ── FORMULAIRE CONNEXION ─────────────────────────────────── */}
          {mode === "login" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-display text-3xl font-bold text-encre">Bon retour !</h2>
                <p className="font-body text-sm text-encre-muted mt-1.5">
                  Entrez votre email pour recevoir votre code de connexion.
                </p>
              </div>

              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                <div>
                  <label className="input-label">Adresse email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted pointer-events-none" />
                    <input
                      {...loginForm.register("email")}
                      type="email"
                      placeholder="vous@exemple.com"
                      autoComplete="email"
                      className={cn(
                        "input-field pl-11",
                        loginForm.formState.errors.email && "border-error focus:border-error focus:ring-error/20"
                      )}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-error font-body mt-1.5">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-4 text-base"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Mail className="w-4 h-4" />}
                  {loading ? "Envoi en cours…" : "Recevoir mon code"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-auto" />}
                </button>
              </form>

              <p className="text-center text-sm text-encre-muted font-body">
                Pas encore de compte ?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-or font-medium hover:text-or-dark transition-colors"
                >
                  S&apos;inscrire gratuitement
                </button>
              </p>
            </div>
          )}

          {/* ── FORMULAIRE INSCRIPTION ───────────────────────────────── */}
          {mode === "register" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-display text-3xl font-bold text-encre">Créer un compte</h2>
                <p className="font-body text-sm text-encre-muted mt-1.5">
                  Rejoignez LibraMali en quelques secondes.
                </p>
              </div>

              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="input-label">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted pointer-events-none" />
                    <input
                      {...registerForm.register("nom")}
                      placeholder="Prénom Nom"
                      autoComplete="name"
                      className={cn(
                        "input-field pl-11",
                        registerForm.formState.errors.nom && "border-error focus:border-error focus:ring-error/20"
                      )}
                    />
                  </div>
                  {registerForm.formState.errors.nom && (
                    <p className="text-xs text-error font-body mt-1.5">
                      {registerForm.formState.errors.nom.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="input-label">Adresse email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted pointer-events-none" />
                    <input
                      {...registerForm.register("email")}
                      type="email"
                      placeholder="vous@exemple.com"
                      autoComplete="email"
                      className={cn(
                        "input-field pl-11",
                        registerForm.formState.errors.email && "border-error focus:border-error focus:ring-error/20"
                      )}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-error font-body mt-1.5">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label className="input-label">
                    Téléphone{" "}
                    <span className="normal-case tracking-normal text-encre-muted/70">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-encre-muted pointer-events-none" />
                    <input
                      {...registerForm.register("telephone")}
                      type="tel"
                      placeholder="+223 70 00 00 00"
                      autoComplete="tel"
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-4 text-base mt-2"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />}
                  {loading ? "Création en cours…" : "Créer mon compte"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-auto" />}
                </button>
              </form>

              <p className="text-center text-sm text-encre-muted font-body">
                Déjà un compte ?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-or font-medium hover:text-or-dark transition-colors"
                >
                  Se connecter
                </button>
              </p>
            </div>
          )}

          {/* Retour accueil */}
          <div className="pt-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 text-xs text-encre-muted
                         hover:text-encre transition-colors font-body"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

