# Historique du Projet

## Présentation du projet
- **Nom du projet** : OrientaBénin
- **Objectif** : Concevoir une application d'orientation universitaire pour les bacheliers du Bénin basée sur un dataset JSON extrait d'un guide officiel.
- **Utilisateurs cibles** : Bacheliers béninois, parents, professionnels de l'orientation.
- **Fonctionnalités principales** : 
  - Fonctionnement offline-first
  - Filtrage par série BAC, université et recherche textuelle
  - Simulateur de classement basé sur une moyenne pondérée
  - Affichage des quotas (bourses, aides, FPP)
  - Recommandations intelligentes

## Architecture
- **Description de l'architecture globale** : Application Single Page Application (SPA) frontend-only.
- **Technologies utilisées** : React, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Flux de données** : Données statiques chargées depuis un fichier JSON local (`src/data/guide.json`), traitées et filtrées côté client.

## Décisions techniques
- **Liste des principaux choix techniques** :
  - Utilisation de React pour la réactivité de l'interface.
  - Tailwind CSS pour un design rapide et responsive.
  - Fichier JSON local pour garantir le fonctionnement offline-first sans dépendance backend.
- **Justification de chaque décision** :
  - React permet de gérer facilement l'état complexe des filtres et du simulateur.
  - Le JSON local répond à l'exigence de fonctionnement sans backend et offline-first.

## Historique des modifications
- **06/04/2026** : 
  - **Description** : Initialisation du projet, création de la structure de données JSON, implémentation du système de filtrage et du simulateur de score.
  - **Impact** : L'application de base est fonctionnelle avec un jeu de données représentatif.
  - **Description** : Ajout d'une modale d'information détaillant les règles d'allocations (Bourse, Secours, FPP) et les statistiques 2025-2026.
  - **Impact** : Les utilisateurs ont accès aux règles cruciales d'orientation directement dans l'application.
  - **Description** : Intégration de graphiques statistiques avec `recharts` pour visualiser la répartition des quotas par université et le top des filières.
  - **Impact** : Meilleure visualisation et compréhension de la distribution des bourses et aides.
  - **Description** : Refonte totale de l'UI/UX en mode Single Page Application (SPA) mobile-first avec Framer Motion.
  - **Impact** : Expérience utilisateur guidée, design moderne (Glassmorphism), animations fluides et navigation par étapes (Accueil, Profil, Résultats, Explorer).
  - **Description** : Développement d'un moteur de calcul et de recommandation modulaire en pur TypeScript (`src/engine.ts`).
  - **Impact** : Le calcul du score utilise désormais la formule de moyenne pondérée exacte, et les filières sont catégorisées (Fortement recommandée, Possible, Risquée) selon le score. Amélioration de la recherche par métier.
  - **Description** : Création d'un panneau d'administration complet (`src/Admin.tsx`) avec stockage local (LocalStorage).
  - **Impact** : Les administrateurs peuvent désormais ajouter, modifier, supprimer des filières, gérer les quotas et l'année académique, ainsi qu'importer/exporter les données en JSON sans toucher au code. L'application devient totalement dynamique.
  - **Description** : Mise à jour détaillée du guide d'information (Modale Info) avec les règles précises d'allocations (Bourses, Secours, FPP) et une alerte sur le "Mythe des Mentions".
  - **Impact** : Les étudiants disposent d'informations claires, chiffrées et stratégiques pour éviter les erreurs d'orientation liées aux fausses croyances sur les mentions.
  - **Description** : Refonte de l'interface utilisateur pour adopter un format "Dashboard" orienté bureau. Remplacement de la navigation inférieure par des onglets, intégration du profil dans une barre latérale, et ajout d'une vue dédiée à l'analyse des quotas.
  - **Impact** : L'application offre une vue d'ensemble plus professionnelle et adaptée aux écrans larges, facilitant la saisie des notes et la comparaison des filières.
  - **Description** : Retour à l'interface mobile-first (Glassmorphism, navigation inférieure, couleurs indigo/violet) suite à la demande de l'utilisateur, et transformation de la vue d'accueil en une véritable "Landing Page" présentant les fonctionnalités clés.
  - **Impact** : Restauration du design d'origine apprécié tout en offrant une meilleure page d'atterrissage pour présenter l'application aux nouveaux utilisateurs.
  - **Description** : Transition vers Firebase pour la gestion des données et de l'authentification. Création du modèle de données Firestore (`UserProfile`, `FlattenedFiliere` avec `candidatsCount`). Implémentation du système d'authentification et d'inscription avec Firebase (Google Auth + Matricule). Ajout du verrouillage des choix de filières et de la déclaration du statut post-sélection (Boursier, Secouru, etc.). Mise à jour du panneau d'administration pour la gestion des utilisateurs (verrouillage, blocage) et l'importation initiale des données vers Firestore. Ajout des statistiques en temps réel sur les filières les plus demandées.
  - **Impact** : L'application passe d'une solution locale à une plateforme cloud complète, permettant le suivi en temps réel des inscriptions, la gestion sécurisée des choix des étudiants, et l'analyse dynamique des tendances d'orientation.
- **08/04/2026** :
  - **Description** : Intégration de la comparaison entre les capacités officielles (ministère) et les inscriptions sur la plateforme. Ajout d'un indicateur de saturation visuel et d'un calcul de chances de réussite basé sur la formule `% de chances = (1 - inscrits / admis_officiels) * 100`. Mise à jour de l'interface des résultats avec des conseils dynamiques pour orienter les étudiants vers les filières moins saturées.
  - **Impact** : Amélioration de la transparence et de l'aide à la décision stratégique pour les étudiants, leur permettant d'évaluer plus précisément la concurrence pour chaque filière.
  - **Description** : Intégration des statistiques détaillées du Guide d'information universitaire 2025-2026 (250 filières publiques, 12 548 allocations, répartition par université et mode d'admission) dans la modale d'information.
  - **Impact** : Les utilisateurs disposent désormais des chiffres officiels consolidés pour mieux appréhender l'offre de formation nationale.
