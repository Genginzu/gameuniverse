# Configuration Resend pour Game Universe

Ce document explique comment configurer et utiliser Resend pour les emails
transactionnels dans Game Universe.

## 📋 Vue d'ensemble

Resend est intégré avec Supabase Auth pour envoyer automatiquement :

- ✉️ Emails de vérification lors de l'inscription
- 🔐 Emails de réinitialisation de mot de passe
- 📧 Notifications personnalisées (futures fonctionnalités)

## 🚀 Configuration initiale

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit (3000 emails/mois inclus)
3. Vérifiez votre adresse email

### 2. Obtenir la clé API

1. Dans le dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Nommez la clé (ex: "Game Universe Dev")
4. Copiez la clé générée

### 3. Configurer les variables d'environnement

Ajoutez dans votre fichier `.env.local` :

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Configuration Supabase

La configuration Supabase est déjà mise à jour dans `supabase/config.toml` :

```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "noreply@gamesuniverse.com"
sender_name = "Game Universe"
```

## 🧪 Tests

### Test de connexion

Exécutez le script de test :

```bash
bun run test-resend.js
```

### Test via API

En mode développement, vous pouvez tester les emails via :

```bash
# Test email de vérification (français)
curl "http://localhost:3000/api/test-email?type=verification&email=test@example.com&locale=fr"

# Test email de réinitialisation (anglais)
curl "http://localhost:3000/api/test-email?type=reset&email=test@example.com&locale=en"
```

### Test d'inscription

1. Démarrez l'application : `bun run dev`
2. Allez sur `/auth`
3. Créez un nouveau compte
4. Vérifiez que l'email de vérification est envoyé

## 📧 Templates d'email

### Email de vérification

- **Français** : Sujet "Vérifiez votre adresse email - Game Universe"
- **Anglais** : Sujet "Verify your email address - Game Universe"
- Design responsive avec bouton CTA
- Lien de fallback si le bouton ne fonctionne pas
- Expiration : 24 heures

### Email de réinitialisation

- **Français** : Sujet "Réinitialisation de votre mot de passe - Game Universe"
- **Anglais** : Sujet "Reset your password - Game Universe"
- Design cohérent avec l'email de vérification
- Expiration : 1 heure

## 🔧 Personnalisation

### Modifier les templates

Les templates sont dans `src/lib/resend.ts`. Vous pouvez :

- Modifier le design HTML/CSS
- Ajouter de nouvelles langues
- Personnaliser les sujets
- Ajouter de nouveaux types d'emails

### Ajouter un domaine personnalisé

1. Dans Resend, allez dans **Domains**
2. Cliquez **Add Domain**
3. Entrez votre domaine (ex: `gamesuniverse.com`)
4. Configurez les enregistrements DNS
5. Mettez à jour `EMAIL_CONFIG.from` dans `src/lib/resend.ts`

## 🚨 Dépannage

### Erreur "RESEND_API_KEY is not set"

- Vérifiez que la variable est dans `.env.local`
- Redémarrez le serveur de développement
- Vérifiez que la clé commence par `re_`

### Emails non reçus

1. Vérifiez les spams
2. Vérifiez les logs Resend dans le dashboard
3. Testez avec une autre adresse email
4. Vérifiez la configuration SMTP dans Supabase

### Erreur 401 Unauthorized

- Vérifiez que la clé API est correcte
- Vérifiez que la clé n'a pas expiré
- Régénérez une nouvelle clé si nécessaire

## 📊 Monitoring

### Dashboard Resend

- **Emails envoyés** : Nombre total d'emails
- **Taux de délivrance** : Pourcentage d'emails délivrés
- **Bounces** : Emails rejetés
- **Complaints** : Signalements de spam

### Logs application

Les logs sont visibles dans :

- Console du serveur Next.js
- Dashboard Supabase (Auth logs)
- Dashboard Resend (Email logs)

## 🔒 Sécurité

### Bonnes pratiques

- ✅ Ne jamais commiter la clé API
- ✅ Utiliser des variables d'environnement
- ✅ Régénérer les clés régulièrement
- ✅ Monitorer l'usage pour détecter les abus
- ✅ Configurer SPF/DKIM pour votre domaine

### Limites de taux

- **Gratuit** : 3000 emails/mois, 100 emails/jour
- **Pro** : 50000 emails/mois, pas de limite quotidienne
- Les limites sont automatiquement appliquées par Resend

## 🚀 Déploiement

### Variables de production

Configurez dans Vercel/votre hébergeur :

```bash
RESEND_API_KEY=re_your_production_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Configuration Supabase production

Mettez à jour les URLs de redirection dans votre projet Supabase :

```
https://yourdomain.com/auth/confirm
https://yourdomain.com/auth/reset-password
https://yourdomain.com/api/auth/callback
```

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [Intégration Supabase](https://resend.com/docs/send-with-supabase)
- [Templates HTML](https://resend.com/docs/send-with-html)
- [Gestion des domaines](https://resend.com/docs/dashboard/domains/introduction)

## 🆘 Support

En cas de problème :

1. Consultez les logs dans le dashboard Resend
2. Vérifiez la configuration dans `supabase/config.toml`
3. Testez avec l'API de test : `/api/test-email`
4. Contactez le support Resend si nécessaire
