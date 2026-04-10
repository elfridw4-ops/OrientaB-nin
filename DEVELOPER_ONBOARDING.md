# 🚀 Guide d'Onboarding Développeur - OrientaBénin

Bienvenue sur le projet **OrientaBénin**. Ce document est conçu pour vous aider à comprendre l'architecture, le fonctionnement et les conventions du projet afin que vous puissiez être opérationnel rapidement.

---

## 🏗️ Vue d'ensemble de l'Architecture

OrientaBénin est une application **Full-Stack Serverless** basée sur :
- **Frontend** : React 18 + TypeScript + Vite.
- **Styling** : Tailwind CSS (Utility-first).
- **Animations** : Framer Motion.
- **Backend/Base de données** : Firebase (Firestore pour les données, Auth pour l'authentification).
- **Logique métier** : Moteur de recommandation personnalisé (Engine) basé sur les coefficients officiels du MESRS.

### Flux de données
1. **Initialisation** : L'application charge les données statiques (`guide.json`) et s'abonne aux changements Firestore.
2. **Authentification** : L'utilisateur se connecte via Google Auth.
3. **Simulation** : L'utilisateur saisit ses notes -> `engine.ts` calcule les scores -> Recommandations affichées.
4. **Persistance** : Les choix de l'utilisateur sont sauvegardés dans Firestore en temps réel.

---

## 📁 Structure des Dossiers et Fichiers

### `/src` (Cœur de l'application)

#### `App.tsx`
- **Rôle** : Composant racine, gestionnaire de navigation (state-based routing) et layout principal.
- **Contenu** : Logique de routage, Header, Footer, et intégration des différentes vues.
- **Importance** : Critique. C'est le point d'entrée de l'interface utilisateur.
- **✔ Pourquoi ?** Centralise l'état global de la vue et la structure visuelle.
- **✔ Ce qui casse ?** L'application ne s'affiche plus, plus de navigation possible.
- **✔ Qui l'utilise ?** Tout le monde (utilisateurs finaux).

#### `main.tsx`
- **Rôle** : Point d'entrée React.
- **Contenu** : Rendu du composant `App` dans le DOM.
- **Importance** : Vital.
- **✔ Pourquoi ?** Initialise React.
- **✔ Ce qui casse ?** L'application ne démarre pas.
- **✔ Qui l'utilise ?** Le navigateur.

#### `engine.ts`
- **Rôle** : Moteur de calcul et de recommandation.
- **Contenu** : Fonctions de calcul de score pondéré, filtrage par série, et logique de recommandation (algorithme).
- **Importance** : Critique (Logique métier).
- **✔ Pourquoi ?** Sépare la logique mathématique complexe de la vue.
- **✔ Ce qui casse ?** Les simulations de score et les recommandations deviennent fausses ou impossibles.
- **✔ Qui l'utilise ?** `App.tsx` lors de la simulation.

#### `firebase.ts`
- **Rôle** : Configuration et initialisation de Firebase.
- **Contenu** : Initialisation de l'app Firebase, export de `auth` et `db`.
- **Importance** : Critique (Infrastructure).
- **✔ Pourquoi ?** Point de connexion unique avec les services Google Cloud.
- **✔ Ce qui casse ?** Plus d'accès à la base de données ni d'authentification.
- **✔ Qui l'utilise ?** `App.tsx` et les services.

#### `types.ts`
- **Rôle** : Définitions de types TypeScript.
- **Contenu** : Interfaces pour `UserProfile`, `Filiere`, `GuideData`, etc.
- **Importance** : Haute (Qualité du code).
- **✔ Pourquoi ?** Assure la cohérence des données à travers tout le projet.
- **✔ Ce qui casse ?** Erreurs de compilation massives, perte de l'auto-complétion.
- **✔ Qui l'utilise ?** Tous les fichiers `.ts` et `.tsx`.

#### `utils.ts`
- **Rôle** : Fonctions utilitaires transversales.
- **Contenu** : Formatage de nombres, helpers de manipulation de données.
- **✔ Pourquoi ?** Évite la duplication de code simple.

#### `Admin.tsx`
- **Rôle** : Dashboard de gestion.
- **Contenu** : Interface pour visualiser les statistiques globales et gérer les données.
- **✔ Pourquoi ?** Permet aux administrateurs de piloter l'application.

#### `/src/services`
- **Rôle** : Couche d'accès aux données (DAL).
- **Contenu** : `firestoreService.ts` gère les appels CRUD vers Firestore.
- **✔ Pourquoi ?** Isole les appels API de la logique de composant.

#### `/src/data`
- **Rôle** : Stockage des données statiques.
- **Contenu** : `guide.json` contient la liste officielle des universités et filières.
- **✔ Pourquoi ?** Source de vérité pour les données qui ne changent pas souvent.

---

## 🛠️ Conventions du Projet

### Nommage
- **Composants** : PascalCase (ex: `GlassCard.tsx`).
- **Fonctions/Variables** : camelCase (ex: `calculerScore`).
- **Fichiers de logique** : camelCase (ex: `engine.ts`).
- **CSS** : Tailwind classes uniquement.

### Organisation
- **Logique vs Vue** : Toujours extraire la logique complexe dans `engine.ts` ou dans des services.
- **Responsivité** : Utiliser les préfixes Tailwind (`sm:`, `md:`, `lg:`) systématiquement.

---

## 📦 Dépendances Clés

| Dépendance | Utilité |
| :--- | :--- |
| `framer-motion` | Animations fluides et transitions de pages. |
| `lucide-react` | Bibliothèque d'icônes moderne et légère. |
| `recharts` | Visualisation des données (graphiques de stats). |
| `firebase` | Authentification et base de données temps réel. |
| `clsx` / `tailwind-merge` | Gestion dynamique des classes Tailwind. |

---

## ⚠️ Points Critiques

1. **`firestore.rules`** : Fichier de sécurité. Une erreur ici peut soit bloquer tous les utilisateurs, soit exposer les données privées.
2. **`engine.ts`** : Toute modification de l'algorithme doit être testée rigoureusement par rapport au guide officiel du MESRS.
3. **`firebase-applet-config.json`** : Contient les clés de connexion. Ne jamais supprimer ou modifier sans précaution.

---

## 🚀 Améliorations Possibles

- **Optimisation** : Implémenter un cache local pour `guide.json` afin d'accélérer le premier chargement.
- **Tests** : Ajouter des tests unitaires pour `engine.ts` (Vitest).
- **SEO** : Continuer l'optimisation des balises meta dynamiques selon la vue active.

---
*Dernière mise à jour : 10 Avril 2026*
