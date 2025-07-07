# Guide de Déploiement - AirTableau BI

## 🚀 Déploiement avec GitHub et Netlify

### 1. Préparation du Repository GitHub

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - AirTableau BI"

# Ajouter le repository distant
git remote add origin https://github.com/votre-username/airtableau-bi.git

# Pousser vers GitHub
git push -u origin main
```

### 2. Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# Variables de production
VITE_APP_NAME=AirTableau BI
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://api.airtable.com/v0
VITE_ENVIRONMENT=production

# Configuration de sécurité
VITE_JWT_SECRET=votre-secret-jwt-super-securise
VITE_ENCRYPTION_KEY=cle-de-chiffrement-32-caracteres

# Configuration Airtable (optionnel pour les clés par défaut)
VITE_DEFAULT_AIRTABLE_API_URL=https://api.airtable.com/v0
```

### 3. Déploiement sur Netlify

#### Option A: Via l'interface Netlify
1. Connectez-vous à [Netlify](https://netlify.com)
2. Cliquez sur "New site from Git"
3. Sélectionnez votre repository GitHub
4. Configuration de build :
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** 18 ou plus récent

#### Option B: Via Netlify CLI
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter à Netlify
netlify login

# Déployer
netlify deploy --prod --dir=dist
```

### 4. Configuration des Redirections

Créez un fichier `public/_redirects` :

```
# Redirection pour SPA (Single Page Application)
/*    /index.html   200

# Redirections de sécurité
/admin/*  /login  302
/api/*    https://api.airtable.com/v0/:splat  200
```

### 5. Configuration HTTPS et Domaine

Dans Netlify :
1. Allez dans "Domain settings"
2. Ajoutez votre domaine personnalisé
3. Activez HTTPS automatique
4. Configurez les DNS si nécessaire

## 👥 Gestion des Utilisateurs et Authentification

### 1. Structure des Utilisateurs

Le système supporte plusieurs types d'utilisateurs :

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions?: string[];
  lastLogin?: Date;
  isActive?: boolean;
}
```

### 2. Comptes par Défaut

Le système inclut ces comptes de démonstration :

| Utilisateur | Mot de passe | Rôle | Permissions |
|-------------|--------------|------|-------------|
| `admin` | `admin123` | Administrateur | Accès complet |
| `manager` | `manager123` | Manager | Gestion des rapports |
| `viewer` | `viewer123` | Visualiseur | Lecture seule |
| `demo` | `demo123` | Démo | Accès limité |

### 3. Intégration avec une Base de Données

Pour la production, remplacez le système d'authentification local :

#### Option A: Supabase Auth
```bash
npm install @supabase/supabase-js
```

```typescript
// src/services/authService.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },
  
  async signUp(email: string, password: string, userData: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  }
}
```

#### Option B: Firebase Auth
```bash
npm install firebase
```

#### Option C: Auth0
```bash
npm install @auth0/auth0-react
```

### 4. Sécurisation des Routes

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'viewer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <div>Accès non autorisé</div>;
  }
  
  return <>{children}</>;
};
```

### 5. Gestion des Permissions

```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string) => {
    if (user?.role === 'admin') return true;
    return user?.permissions?.includes(permission) || false;
  };
  
  const canCreateReports = () => hasPermission('create_reports');
  const canDeleteReports = () => hasPermission('delete_reports');
  const canManageConnections = () => hasPermission('manage_connections');
  
  return {
    hasPermission,
    canCreateReports,
    canDeleteReports,
    canManageConnections
  };
};
```

## 🔒 Sécurité en Production

### 1. Variables d'Environnement Sécurisées

```env
# Ne jamais commiter ces valeurs en production
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-publique
SUPABASE_SERVICE_ROLE_KEY=votre-cle-privee-service
```

### 2. Configuration CORS

```typescript
// Pour les appels API Airtable
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://votre-domaine.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
```

### 3. Chiffrement des Clés API

```typescript
// src/utils/encryption.ts
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.VITE_ENCRYPTION_KEY!;

export const encryptApiKey = (apiKey: string): string => {
  return CryptoJS.AES.encrypt(apiKey, SECRET_KEY).toString();
};

export const decryptApiKey = (encryptedKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

## 📊 Monitoring et Analytics

### 1. Intégration Google Analytics

```html
<!-- Dans index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Monitoring des Erreurs avec Sentry

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "VOTRE_SENTRY_DSN",
  environment: process.env.VITE_ENVIRONMENT,
});
```

## 🚀 Commandes de Déploiement

```bash
# Build de production
npm run build

# Preview du build
npm run preview

# Déploiement automatique via GitHub Actions
git push origin main

# Déploiement manuel Netlify
netlify deploy --prod --dir=dist
```

## 📝 Checklist de Déploiement

- [ ] Repository GitHub configuré
- [ ] Variables d'environnement définies
- [ ] Build de production testé
- [ ] Redirections SPA configurées
- [ ] HTTPS activé
- [ ] Domaine personnalisé configuré
- [ ] Monitoring des erreurs activé
- [ ] Analytics configuré
- [ ] Tests de sécurité effectués
- [ ] Documentation utilisateur créée
- [ ] Sauvegarde des données configurée

## 🔧 Maintenance

### Mises à jour automatiques
Configurez GitHub Actions pour les déploiements automatiques :

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```