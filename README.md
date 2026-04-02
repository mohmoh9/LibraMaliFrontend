# LibraMali — Frontend

> Plateforme e-commerce de librairie en ligne pour le Mali.  
> Construite avec **Next.js 14** · **TypeScript** · **Tailwind CSS** · **Zustand** · **Spring Boot** (backend séparé).

---

## Table des matières

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation & lancement](#installation--lancement)
- [Variables d'environnement](#variables-denvironnement)
- [Pages & routes](#pages--routes)
- [Composants](#composants)
- [État global (Stores)](#état-global-stores)
- [Hooks personnalisés](#hooks-personnalisés)
- [Design system](#design-system)
- [Authentification](#authentification)
- [API & communication backend](#api--communication-backend)
- [Build & déploiement](#build--déploiement)

---

## Aperçu

LibraMali est une librairie en ligne destinée au marché malien. Elle permet aux clients de
parcourir un catalogue de milliers de livres, de passer commande, de payer par Mobile Money
ou carte bancaire, et de se faire livrer en 24h à Bamako ou dans toute autre ville du Mali.

**Fonctionnalités principales :**

- Catalogue avec filtres, recherche plein texte et tri
- Fiche produit avec avis clients vérifiés (achat requis), notes étoiles et favoris
- Panier, application de codes promo et devis PDF
- Tunnel d'achat en 2 étapes (adresse → paiement)
- Authentification sans mot de passe par **OTP email**
- Espace client : historique commandes, profil, adresses
- **Back-office admin complet** : produits, commandes, utilisateurs, avis, favoris, promotions, influenceurs, paiements, livraisons
- Pages publiques : accueil, à propos, CGV, confidentialité, mentions légales, retours, livraison

---

## Stack technique

| Couche          | Technologie                                    | Version  |
|-----------------|------------------------------------------------|----------|
| Framework       | Next.js (App Router)                           | 14.2.5   |
| Langage         | TypeScript                                     | ^5       |
| Style           | Tailwind CSS                                   | ^3.4     |
| État global     | Zustand (persist)                              | ^4.5     |
| Formulaires     | react-hook-form + Zod                          | ^7 / ^3  |
| Requêtes HTTP   | Axios (intercepteurs JWT + refresh)            | ^1.7     |
| Notifications   | Sonner (toasts)                                | ^1.5     |
| Icônes          | lucide-react                                   | ^0.400   |
| Utilitaires CSS | clsx + tailwind-merge (`cn()`)                 | —        |
| Dates           | date-fns + date-fns-tz                         | ^3.6     |
| Backend         | Spring Boot 3.2.5 (API REST, port 8080)        | —        |

---

## Structure du projet

```
libramali-frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/                     # Groupe de routes authentification
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx          # Connexion / inscription
│   │   │   └── verify-otp/page.tsx     # Vérification OTP 6 chiffres
│   │   │
│   │   ├── (main)/                     # Groupe de routes principal
│   │   │   ├── layout.tsx              # Navbar + Footer
│   │   │   ├── page.tsx                # Accueil (10 sections)
│   │   │   │
│   │   │   ├── catalogue/page.tsx      # Grille livres, filtres, favoris
│   │   │   ├── produit/[id]/page.tsx   # Fiche produit, avis, favori
│   │   │   ├── panier/page.tsx         # Panier, code promo, devis
│   │   │   ├── checkout/page.tsx       # Tunnel achat (adresse → paiement)
│   │   │   │
│   │   │   ├── mon-compte/
│   │   │   │   ├── commandes/page.tsx  # Historique commandes client
│   │   │   │   └── profil/page.tsx     # Profil & adresses
│   │   │   │
│   │   │   ├── admin/                  # 🔒 Admin uniquement
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── produits/page.tsx
│   │   │   │   ├── commandes/page.tsx
│   │   │   │   ├── utilisateurs/page.tsx
│   │   │   │   ├── avis/page.tsx
│   │   │   │   ├── favoris/page.tsx
│   │   │   │   ├── promotions/page.tsx
│   │   │   │   ├── influenceurs/page.tsx
│   │   │   │   ├── paiements/page.tsx
│   │   │   │   └── livraisons/page.tsx
│   │   │   │
│   │   │   ├── a-propos/page.tsx
│   │   │   ├── cgv/page.tsx
│   │   │   ├── confidentialite/page.tsx
│   │   │   ├── mentions-legales/page.tsx
│   │   │   ├── retours/page.tsx
│   │   │   └── livraison/page.tsx
│   │   │
│   │   ├── layout.tsx                  # Root layout (Sonner Toaster)
│   │   └── globals.css                 # Variables CSS + design system
│   │
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminGuard.tsx          # Protection route ADMIN
│   │   │   ├── AdminLayout.tsx         # Sidebar + navigation admin
│   │   │   └── ImageUploader.tsx       # Upload couverture drag & drop
│   │   ├── catalogue/
│   │   │   └── ProductCard.tsx         # Carte livre (favori + panier)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       └── Modal.tsx               # Modale réutilisable (sm/md/lg/xl)
│   │
│   ├── hooks/
│   │   └── useFavoris.ts               # Gestion favoris (cache Set, optimiste)
│   │
│   ├── lib/
│   │   ├── api.ts                      # Axios + intercepteurs JWT + refresh
│   │   └── utils.ts                    # cn(), formatPrix(), formatDate()…
│   │
│   ├── store/
│   │   ├── auth.store.ts               # JWT, userId, role (Zustand persist)
│   │   └── cart.store.ts               # Panier, promos (Zustand)
│   │
│   └── types/
│       └── index.ts                    # Tous les types TypeScript
│
├── .env.local                          # Variables d'environnement locales
├── next.config.ts                      # Proxy dev + config images
├── tailwind.config.ts                  # Palette LibraMali + animations
├── tsconfig.json
└── package.json
```

---

## Prérequis

- **Node.js** ≥ 18.17 (LTS recommandé)
- **npm** ≥ 9 (ou **pnpm** / **yarn**)
- **Backend LibraMali** en cours d'exécution sur `http://localhost:8080`  
  *(voir `libramali-backend/README.md` pour le lancement du backend Spring Boot)*

---

## Installation & lancement

### 1. Cloner & installer

```bash
git clone https://github.com/votre-org/libramali-frontend.git
cd libramali-frontend
npm install
```

### 2. Configurer l'environnement

```bash
cp .env.local.example .env.local
# Éditez .env.local si besoin (voir section Variables d'environnement)
```

### 3. Lancer en développement

```bash
npm run dev
# → http://localhost:3000
```

> Le proxy Next.js (`next.config.ts`) redirige automatiquement `/api/*` vers `http://localhost:8080/api/*`.  
> Vous n'avez **pas besoin** de configurer CORS côté navigateur en développement.

### 4. Build de production

```bash
npm run build
npm run start
# → http://localhost:3000
```

### 5. Linter

```bash
npm run lint
```

---

## Variables d'environnement

| Variable               | Valeur par défaut                 | Description                         |
|------------------------|-----------------------------------|-------------------------------------|
| `NEXT_PUBLIC_API_URL`  | `http://localhost:8080/api`       | URL de base de l'API Spring Boot    |

Créez un fichier `.env.local` à la racine avec :

```env
# URL de base de l'API Spring Boot
# Modifier si votre backend tourne sur un autre port
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

> En production, remplacez par l'URL de votre backend déployé :  
> `NEXT_PUBLIC_API_URL=https://api.libramali.ml/api`

---

## Pages & routes

### Routes publiques

| Route                 | Description                                          |
|-----------------------|------------------------------------------------------|
| `/`                   | Page d'accueil (hero, stats, catégories, nouveautés, promo, populaires, avantages, témoignages, FAQ, newsletter) |
| `/catalogue`          | Catalogue avec filtres, tri, pagination, favoris     |
| `/produit/[id]`       | Fiche produit, galerie, avis clients, favori, panier |
| `/a-propos`           | Histoire, équipe, valeurs, timeline, partenaires     |
| `/livraison`          | Tarifs, zones, simulateur, processus de livraison    |
| `/retours`            | Procédure retours, formulaire, FAQ remboursements    |
| `/cgv`                | Conditions Générales de Vente (10 articles)          |
| `/confidentialite`    | Politique de confidentialité (8 sections, RGPD Mali) |
| `/mentions-legales`   | Mentions légales (9 sections, droit malien)          |

### Routes auth (non authentifié)

| Route            | Description                                         |
|------------------|-----------------------------------------------------|
| `/login`         | Saisie email → envoi OTP                            |
| `/verify-otp`    | Saisie code OTP 6 chiffres → connexion JWT          |

### Routes client (authentifié)

| Route                        | Description                               |
|------------------------------|-------------------------------------------|
| `/panier`                    | Panier, code promo, devis PDF             |
| `/checkout`                  | Tunnel achat : adresse → paiement         |
| `/mon-compte/commandes`      | Historique et suivi des commandes         |
| `/mon-compte/profil`         | Profil utilisateur, gestion des adresses  |

### Routes admin (`role = ADMIN` requis)

| Route                        | Description                                          |
|------------------------------|------------------------------------------------------|
| `/admin/dashboard`           | KPIs, commandes récentes, raccourcis                 |
| `/admin/produits`            | CRUD produits, upload couverture drag & drop         |
| `/admin/commandes`           | Gestion commandes, machine d'états, devis            |
| `/admin/utilisateurs`        | Gestion utilisateurs, changement de rôle             |
| `/admin/avis`                | Modération avis clients                              |
| `/admin/favoris`             | Vue des favoris, top produits                        |
| `/admin/promotions`          | CRUD codes promo, toggle actif                       |
| `/admin/influenceurs`        | CRUD influenceurs, commission, stats CA              |
| `/admin/paiements`           | Suivi paiements, machine d'états, alerte Mobile Money|
| `/admin/livraisons`          | Suivi livraisons, transitions, numéro de suivi       |

---

## Composants

### `ProductCard`

Carte livre réutilisable avec effet 3D tranche, couverture générée si pas d'image, badge promo, note étoiles, boutons panier et favori au hover.

```tsx
<ProductCard
  product={product}
  isFavori={isFavori(product.id)}
  onToggleFavori={(e) => toggleFavori(product.id, e)}
  isToggling={isToggling(product.id)}
/>
```

### `AdminGuard`

Protège les routes admin. Redirige vers `/login` si non authentifié, affiche une erreur 403 si le rôle est insuffisant.

```tsx
<AdminGuard>
  <AdminLayout>
    {/* contenu admin */}
  </AdminLayout>
</AdminGuard>
```

### `AdminLayout`

Sidebar avec 10 entrées de navigation, indicateur de page active, responsive (drawer mobile).

### `Modal`

Modale réutilisable avec backdrop, fermeture par Échap, scroll lock et 4 tailles.

```tsx
<Modal open={open} onClose={() => setOpen(false)} title="Titre" size="md">
  {/* contenu */}
</Modal>
```

Tailles disponibles : `sm` | `md` | `lg` | `xl`

### `ImageUploader`

Upload de couverture de livre avec drag & drop, prévisualisation locale, `POST /api/products/{id}/image` et `DELETE /api/products/{id}/image`.

---

## État global (Stores)

### `useAuthStore` — `src/store/auth.store.ts`

Persiste en localStorage via Zustand `persist`.

```ts
const { isAuthenticated, userId, nom, email, role, login, logout } = useAuthStore();
```

| Champ              | Type              | Description                          |
|--------------------|-------------------|--------------------------------------|
| `accessToken`      | `string \| null`  | JWT d'accès                          |
| `refreshToken`     | `string \| null`  | JWT de rafraîchissement              |
| `userId`           | `number \| null`  | ID de l'utilisateur connecté         |
| `nom`              | `string \| null`  | Nom affiché                          |
| `email`            | `string \| null`  | Email                                |
| `role`             | `Role \| null`    | `CLIENT` / `ADMIN` / `INFLUENCEUR`   |
| `isAuthenticated`  | `boolean`         | true si token valide en mémoire      |

### `useCartStore` — `src/store/cart.store.ts`

```ts
const { cart, fetchCart, addItem, updateItem, removeItem, clearCart, previewPromo } = useCartStore();
```

Le panier est chargé depuis le backend à chaque montage. Les méthodes appellent l'API REST et mettent à jour l'état local.

---

## Hooks personnalisés

### `useFavoris` — `src/hooks/useFavoris.ts`

Gestion des favoris avec cache en mémoire (`Set<number>`), mise à jour **optimiste** et rollback en cas d'erreur.

```ts
const { isFavori, toggleFavori, isToggling, loading } = useFavoris();

// Vérifier si un produit est en favori
isFavori(productId)   // → boolean

// Ajouter / retirer (avec l'événement mouse pour stopPropagation)
toggleFavori(productId, e)

// Savoir si le toggle est en cours pour un produit donné
isToggling(productId) // → boolean
```

**Endpoints utilisés :**
- `GET /api/favoris?page=0&size=100` — chargement initial
- `POST /api/favoris?productId={id}` — ajout
- `DELETE /api/favoris?productId={id}` — suppression

---

## Design system

### Palette LibraMali

| Token          | Valeur HEX  | Usage                                     |
|----------------|-------------|-------------------------------------------|
| `ivoire`       | `#F7F4EF`   | Fond principal, surfaces claires          |
| `encre`        | `#1A1814`   | Texte principal, boutons primaires        |
| `or`           | `#C9A84C`   | Accents, badges, CTA secondaires          |
| `sable`        | `#E8E0D0`   | Bordures, fonds secondaires, séparateurs  |
| `success`      | `#2D7D5E`   | Statuts positifs, livraison réussie       |
| `error`        | `#C0392B`   | Erreurs, statuts négatifs                 |

### Typographies

- **Display** : `Playfair Display` — titres, prix, nombres clés
- **Body** : `DM Sans` — corps de texte, labels, boutons

### Classes utilitaires principales

```css
.btn-primary    /* fond encre, texte ivoire, arrondi full */
.btn-secondary  /* transparent, bordure sable, arrondi full */
.btn-gold       /* fond or, texte blanc */
.input-field    /* champ de formulaire standard */
.input-label    /* label de formulaire */
.card           /* carte blanche avec ombre douce */
.badge-success  /* badge vert */
.badge-warning  /* badge ambre */
.badge-error    /* badge rouge */
.badge-neutral  /* badge gris */
.skeleton       /* animation shimmer pour chargement */
```

### Animations disponibles

| Classe Tailwind              | Effet                              |
|------------------------------|------------------------------------|
| `animate-fade-in`            | Opacité 0 → 1                      |
| `animate-slide-up`           | Glissement bas → haut + fade       |
| `animate-slide-in`           | Glissement gauche + fade           |
| `animate-shimmer`            | Shimmer de chargement (skeleton)   |
| `animate-shake`              | Secousse pour erreur de formulaire |
| `animate-delay-{100..500}`   | Décalages d'animation staggerés    |

---

## Authentification

LibraMali utilise une authentification **sans mot de passe** basée sur des codes OTP à usage unique envoyés par email.

### Flux de connexion

```
1. L'utilisateur saisit son email sur /login
   → POST /api/auth/send-otp  (envoi code OTP 6 chiffres, valide 5 min)

2. L'utilisateur saisit le code sur /verify-otp
   → POST /api/auth/verify-otp  (retourne accessToken + refreshToken)

3. Le store auth persiste les tokens en localStorage
   → Toutes les requêtes API portent le header Authorization: Bearer <token>
```

### Refresh automatique

L'intercepteur Axios dans `src/lib/api.ts` gère le **refresh transparent** :

- Si une requête retourne `401`, le token est automatiquement rafraîchi via `POST /api/auth/refresh`
- Les requêtes en attente sont rejouées avec le nouveau token
- Si le refresh échoue, l'utilisateur est déconnecté et redirigé vers `/login`

### Protection des routes admin

`AdminGuard` vérifie `role === "ADMIN"` depuis le store. Si la condition n'est pas remplie, il affiche une page 403 ou redirige vers `/login`.

---

## API & communication backend

### Configuration Axios — `src/lib/api.ts`

```ts
import api from "@/lib/api";

// GET
const { data } = await api.get("/products?page=0&size=12");

// POST
const { data } = await api.post("/reviews", { productId, note, commentaire });

// PATCH
await api.patch(`/admin/payments/${id}/statut?statut=CONFIRME`);

// DELETE
await api.delete(`/favoris?productId=${id}`);
```

### Proxy de développement — `next.config.ts`

En `NODE_ENV=development`, toutes les requêtes vers `/api/*` sont redirigées vers `http://localhost:8080/api/*` via les `rewrites` Next.js.  
→ **Pas de problème CORS** en développement local.

### Structure des réponses API

Toutes les réponses du backend suivent l'enveloppe `ApiResponse<T>` :

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Exemple de lecture
const { data } = await api.get("/products/1");
const product: Product = data.data; // data.data car ApiResponse<Product>
```

### Gestion des erreurs

```ts
import api, { getErrorMessage } from "@/lib/api";

try {
  await api.post("/reviews", payload);
} catch (err) {
  toast.error(getErrorMessage(err)); // extrait le message d'erreur de l'API
}
```

---

## Build & déploiement

### Build de production

```bash
npm run build
# Analyse statique TypeScript + lint + compilation Next.js
# Output : .next/
```

### Déploiement sur Vercel (recommandé)

```bash
# Via CLI Vercel
npm install -g vercel
vercel deploy --prod

# Variables d'environnement à configurer sur Vercel :
NEXT_PUBLIC_API_URL=https://api.libramali.ml/api
```

### Déploiement sur un serveur Node.js

```bash
npm run build
npm run start         # Lance le serveur Next.js sur le port 3000
# Ou avec PM2 :
pm2 start npm --name "libramali-frontend" -- start
```

### Déploiement avec Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

### Configuration production

Pour la production, créez un fichier `.env.production` :

```env
NEXT_PUBLIC_API_URL=https://api.libramali.ml/api
```

> **Note :** côté backend Spring Boot, n'oubliez pas d'ajouter le domaine de production dans la configuration CORS (`WebMvcConfig.java`).

---

## Équipe

Développé par l'équipe LibraMali.  
Questions & support : [contact@libramali.ml](mailto:contact@libramali.ml)

---

*LibraMali — La librairie numérique du Mali 🇲🇱*
