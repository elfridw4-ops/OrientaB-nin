# Guide d'Architecture et d'Onboarding

Bienvenue sur le projet OrientaBénin ! Ce document est conçu pour vous aider à comprendre la structure, le fonctionnement et les choix techniques de l'application.

## Vue d'ensemble de l'architecture
OrientaBénin est une Single Page Application (SPA) développée en React (avec TypeScript) et propulsée par Vite. 
L'application adopte une approche hybride pour la gestion des données :
- **Données statiques/catalogue (Filières) :** Chargées depuis un fichier JSON local (`guide.json`) et mises en cache dans le `localStorage` du navigateur pour des performances optimales et une autonomie totale.
- **Données dynamiques/utilisateurs :** Gérées via Firebase (Authentication pour la connexion Google, Firestore pour les profils et les choix des étudiants).

## Structure des dossiers et fichiers

### `/src` (Dossier principal)
Contient tout le code source de l'application.

- **`App.tsx`**
  - **Rôle :** Composant racine de l'application. Gère le routage interne (vues : home, simulation, explore, admin), l'état global (utilisateur connecté, filières chargées) et affiche l'interface principale.
  - **Contenu :** Logique de navigation, appels aux services d'authentification, rendu conditionnel des vues.
  - **Importance :** Critique. C'est le cœur de l'UI.
  - **Pourquoi il existe :** Point d'entrée de l'interface React.
  - **Ce qui casse s'il disparaît :** L'application entière ne s'affiche plus.
  - **Qui l'utilise :** `main.tsx` (le point de montage React).

- **`Admin.tsx`**
  - **Rôle :** Tableau de bord réservé aux administrateurs.
  - **Contenu :** Gestion des filières (CRUD en local) et gestion des utilisateurs (verrouillage des comptes, vue des choix).
  - **Importance :** Haute (pour la gestion).
  - **Pourquoi il existe :** Permet au MESRS ou aux administrateurs de modérer la plateforme.
  - **Ce qui casse s'il disparaît :** Impossible de gérer les utilisateurs ou de modifier le catalogue sans toucher au code.
  - **Qui l'utilise :** `App.tsx` (rendu conditionnel si l'utilisateur a le rôle admin).

- **`engine.ts`**
  - **Rôle :** Moteur d'intelligence métier.
  - **Contenu :** Algorithmes de calcul des scores de compatibilité, simulation des chances d'obtention de bourses, tri et filtrage des recommandations.
  - **Importance :** Critique. C'est la valeur ajoutée de l'application.
  - **Pourquoi il existe :** Isole la logique mathématique complexe de l'interface utilisateur.
  - **Ce qui casse s'il disparaît :** Les recommandations et simulations ne fonctionnent plus.
  - **Qui l'utilise :** `App.tsx` (lors de la soumission des notes).

- **`types.ts`**
  - **Rôle :** Définition des contrats de données.
  - **Contenu :** Interfaces TypeScript (`Filiere`, `UserProfile`, `GuideData`, etc.).
  - **Importance :** Haute. Garantit la robustesse du code.
  - **Pourquoi il existe :** Profiter du typage fort de TypeScript pour éviter les erreurs.
  - **Ce qui casse s'il disparaît :** Erreurs de compilation massives.
  - **Qui l'utilise :** Presque tous les fichiers du projet.

- **`utils.ts`**
  - **Rôle :** Fonctions utilitaires et gestion du stockage local.
  - **Contenu :** Fonctions `getAppData`, `saveAppData`, `getAllFilieres`, `resetAppData`.
  - **Importance :** Critique pour le fonctionnement hors-ligne/sans base de données du catalogue.
  - **Pourquoi il existe :** Centralise la logique de lecture/écriture du `localStorage` et le fallback vers `guide.json`.
  - **Ce qui casse s'il disparaît :** Impossible de charger les filières.
  - **Qui l'utilise :** `App.tsx`, `Admin.tsx`.

- **`firebase.ts`**
  - **Rôle :** Configuration et initialisation des services Firebase.
  - **Contenu :** Initialisation de l'app Firebase, export de `auth` et `db`, fonctions de login/logout.
  - **Importance :** Critique pour l'authentification.
  - **Pourquoi il existe :** Fait le pont entre l'application et les services cloud de Google.
  - **Ce qui casse s'il disparaît :** Connexion utilisateur impossible, sauvegarde des profils impossible.
  - **Qui l'utilise :** `App.tsx`, `services/firestoreService.ts`.

### `/src/services`
- **`firestoreService.ts`**
  - **Rôle :** Couche d'abstraction pour les requêtes Firestore.
  - **Contenu :** Fonctions CRUD pour les profils utilisateurs (`getUserProfile`, `updateUserProfile`, etc.).
  - **Importance :** Haute.
  - **Pourquoi il existe :** Sépare la logique de base de données des composants UI.
  - **Ce qui casse s'il disparaît :** Impossible de sauvegarder les choix des étudiants.
  - **Qui l'utilise :** `App.tsx`, `Admin.tsx`.

### `/src/data`
- **`guide.json`**
  - **Rôle :** Base de données statique source.
  - **Contenu :** L'intégralité du catalogue des universités, établissements et filières du Bénin avec leurs quotas.
  - **Importance :** Critique. C'est la source de vérité.
  - **Pourquoi il existe :** Fournit les données initiales sans nécessiter de backend.
  - **Ce qui casse s'il disparaît :** L'application est vide.
  - **Qui l'utilise :** `utils.ts`.

## Flux de données
1. **Initialisation :** Au lancement, `App.tsx` appelle `getAllFilieres()` (via `utils.ts`). Si le `localStorage` est vide, les données sont extraites de `guide.json` et mises en cache.
2. **Authentification :** L'utilisateur clique sur "Se connecter". `firebase.ts` gère le popup Google. Au retour, `App.tsx` récupère ou crée le profil via `firestoreService.ts`.
3. **Simulation :** L'utilisateur entre ses notes. `engine.ts` croise ces notes avec les filières en cache pour générer des recommandations.
4. **Sauvegarde :** L'utilisateur valide un choix. L'ID de la filière est envoyé à Firestore via `firestoreService.ts` pour être lié à son profil.

## Conventions
- **Nommage :** camelCase pour les variables et fonctions, PascalCase pour les composants React et les Interfaces.
- **Styling :** Utilisation exclusive de Tailwind CSS via l'attribut `className`. Pas de fichiers CSS externes (sauf `index.css` pour les imports de base).

## Points critiques et améliorations possibles
- **Point critique :** Le fichier `guide.json` est volumineux. S'il grossit trop, cela pourrait impacter le temps de chargement initial.
- **Amélioration :** Mettre en place un système de synchronisation optionnel : permettre à l'admin de pousser ses modifications locales vers un bucket cloud, et aux clients de télécharger la dernière version du JSON au lieu de l'avoir en dur dans le bundle.
- **Amélioration :** Ajouter des tests unitaires pour `engine.ts` afin de garantir que les calculs de probabilité de bourse restent exacts lors des futures mises à jour.
