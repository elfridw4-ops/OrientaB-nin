# Suivi des Tâches

## Fonctionnalités implémentées
- [x] Création de la structure de données JSON (`src/data/guide.json`)
- [x] Extraction d'un échantillon représentatif des données du guide PDF
- [x] Création des interfaces TypeScript (`src/types.ts`)
- [x] Implémentation de la logique de calcul de la moyenne pondérée (`src/utils.ts`)
- [x] Interface utilisateur principale (`src/App.tsx`)
- [x] Système de filtrage par série BAC, université et recherche textuelle
- [x] Simulateur de classement interactif
- [x] Affichage des quotas (bourses, aides, FPP)
- [x] Fonctionnement offline-first (données statiques)
- [x] Création des fichiers de documentation (historique, chat, cahier des charges, décisions, tâches)
- [x] Intégration des règles d'allocations (Bourse, Secours, FPP) et statistiques 2025-2026 via une modale d'information.
- [x] Mise à jour détaillée du guide d'information avec les montants exacts des allocations et l'alerte sur le "Mythe des Mentions".
- [x] Refonte UI/UX complète (Glassmorphism, animations Framer Motion, navigation multi-étapes mobile-first).
- [x] Moteur de calcul et recommandation (`src/engine.ts`) avec fonctions pures (calcul, filtrage, tri, catégorisation).
- [x] Panneau d'administration (`src/Admin.tsx`) avec gestion CRUD des filières, quotas, année académique, et import/export JSON via LocalStorage.
- [x] Refonte de l'interface en mode "Dashboard" orienté bureau (onglets, barre latérale profil, vue analyse des quotas).
- [x] Retour à l'interface mobile-first avec Landing Page.
- [x] Intégration de Firebase (Auth + Firestore).
- [x] Inscription avec Google Auth et Matricule obligatoire.
- [x] Verrouillage des choix de filières (max 3).
- [x] Déclaration du statut post-sélection (Boursier, Secouru, FPP).
- [x] Suivi en temps réel du nombre de candidats par filière.
- [x] Intégration de la comparaison capacité officielle vs inscriptions plateforme.
- [x] Calcul des chances de réussite et indicateur de saturation visuel.
- [x] Intégration des statistiques consolidées du Guide 2025-2026 dans l'interface.
- [x] Enrichissement massif de la base de données `guide.json` (250 filières représentatives).
- [x] Ajout d'un Tableau de Bord National informatif dans la vue Explorer.
- [x] Mise à jour du panneau d'administration pour gérer les utilisateurs (verrouillage, blocage).

## Bogues corrigés
- Aucun pour le moment.

## Problèmes survenus
- Le PDF original ne contient pas les coefficients exacts pour chaque matière par filière, seulement les matières clés. Une logique de pondération générique a été implémentée en attendant les données complètes.

## Tâches en cours
- [ ] Ajouter les coefficients exacts pour chaque matière dans le JSON si disponibles.
- [ ] Tester l'application en conditions réelles avec plusieurs utilisateurs simultanés pour valider les transactions Firestore.
