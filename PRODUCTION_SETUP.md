# 🚀 Guide de Déploiement en Production

## 📋 Prérequis

### 1. Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **URL du projet** et votre **clé publique (anon key)**

### 2. Configurer l'authentification Supabase
Dans votre dashboard Supabase :
1. Allez dans **Authentication > Settings**
2. Configurez les **Site URL** :
   - Site URL : `https://votre-site.netlify.app`
   - Redirect URLs : `https://votre-site.netlify.app/**`
3. **Désactivez** "Confirm email" si vous voulez permettre la connexion immédiate
4. Configurez les **Email Templates** si nécessaire

## 🔧 Configuration Netlify

### 1. Variables d'environnement
Dans Netlify, allez dans **Site settings > Environment variables** et ajoutez :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-publique-supabase
VITE_APP_NAME=AirTableau BI
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
VITE_APP_URL=https://votre-site.netlify.app
```

### 2. Configuration de build
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18 ou plus récent

### 3. Domaine personnalisé (optionnel)
1. Dans Netlify : **Domain settings > Custom domains**
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions

## 👥 Gestion des Utilisateurs

### Créer des comptes utilisateurs
1. **Option 1 - Auto-inscription :**
   - Les utilisateurs peuvent s'inscrire directement sur le site
   - Ils recevront un email de confirmation (si activé)

2. **Option 2 - Invitation par admin :**
   - Dans Supabase Dashboard > Authentication > Users
   - Cliquez "Invite user"
   - Entrez l'email de l'utilisateur
   - Il recevra un email d'invitation

### Rôles utilisateurs
Les rôles sont définis dans les métadonnées utilisateur :
- `admin` : Accès complet
- `user` : Utilisateur standard
- `viewer` : Lecture seule

## 🔗 Partage de l'Application

### URL de l'application
Une fois déployée, votre application sera accessible à :
```
https://votre-site.netlify.app
```

### Partager avec d'autres utilisateurs
1. **Envoyez le lien** : `https://votre-site.netlify.app`
2. **Les utilisateurs peuvent :**
   - S'inscrire directement
   - Se connecter avec leurs identifiants
   - Demander une réinitialisation de mot de passe

### Sécurité
- ✅ HTTPS automatique
- ✅ Authentification sécurisée via Supabase
- ✅ Sessions persistantes
- ✅ Protection CSRF
- ✅ Headers de sécurité configurés

## 🛠️ Commandes de Déploiement

### Déploiement initial
```bash
# 1. Build du projet
npm run build

# 2. Déploiement via Netlify CLI (optionnel)
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Déploiement automatique
- Connectez votre repository GitHub à Netlify
- Chaque push sur la branche `main` déclenchera un déploiement automatique

## 🔍 Vérification du Déploiement

### Checklist post-déploiement
- [ ] L'application se charge correctement
- [ ] L'inscription fonctionne
- [ ] La connexion fonctionne
- [ ] Les redirections SPA fonctionnent
- [ ] Les variables d'environnement sont correctes
- [ ] Les emails d'authentification sont envoyés (si activés)

### Tests à effectuer
1. **Inscription d'un nouvel utilisateur**
2. **Connexion/déconnexion**
3. **Navigation entre les pages**
4. **Création de connexions Airtable**
5. **Création de rapports**

## 🆘 Résolution de Problèmes

### Problème : "Variables d'environnement manquantes"
- Vérifiez que toutes les variables sont définies dans Netlify
- Redéployez après avoir ajouté les variables

### Problème : "Page non trouvée" sur les routes
- Vérifiez que le fichier `_redirects` est présent
- Vérifiez la configuration dans `netlify.toml`

### Problème : Erreurs d'authentification
- Vérifiez les URL de redirection dans Supabase
- Vérifiez que les clés Supabase sont correctes

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs dans Netlify
2. Vérifiez les logs dans Supabase
3. Consultez la documentation Supabase Auth