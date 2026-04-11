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
  - **Description** : Transparence et anonymisation des données utilisateurs. Ajout d'un système d'information clair sur l'utilisation des données (calcul des scores, recommandations, statistiques globales). Les données sont anonymisées et agrégées pour afficher le profil des candidats (moyenne estimée, répartition des mentions) sur chaque filière.
  - **Impact** : Renforce la confiance des utilisateurs et encourage la participation en montrant le bénéfice collectif ("Plus vous êtes nombreux, plus les recommandations sont précises").
  - **Description** : Intégration de la comparaison entre les capacités officielles (ministère) et les inscriptions sur la plateforme. Ajout d'un indicateur de saturation visuel et d'un calcul de chances de réussite basé sur la formule `% de chances = (1 - inscrits / admis_officiels) * 100`. Mise à jour de l'interface des résultats avec des conseils dynamiques pour orienter les étudiants vers les filières moins saturées.
  - **Impact** : Amélioration de la transparence et de l'aide à la décision stratégique pour les étudiants, leur permettant d'évaluer plus précisément la concurrence pour chaque filière.
  - **Description** : Automatisation de la création du profil administrateur. L'administrateur désigné (`elfridw4@gmail.com`) n'a plus besoin de passer par l'étape d'inscription (matricule) ; son profil est créé automatiquement lors de sa première connexion.
  - **Impact** : Expérience utilisateur plus fluide pour l'administrateur et sécurité renforcée par la reconnaissance directe de l'email privilégié.
  - **Description** : Enrichissement massif de la base de données locale (`guide.json`) avec la liste complète des filières pour toutes les universités publiques du Bénin (UAC, Parakou, UNSTIM, UNA, Écoles Inter-États) et une sélection d'établissements privés.
  - **Impact** : L'application propose désormais un catalogue de formations beaucoup plus complet et réaliste, permettant des simulations plus précises.
  - **Description** : Mise à jour exhaustive des statistiques nationales du Guide d'Orientation 2025-2026. Intégration du nombre total de filières (545) avec une répartition détaillée par secteur : Public (250), Privé Agréé (185) et Privé en Régime Ouverture (110). Ajout d'exemples concrets pour les secteurs privés et des références aux pages du guide officiel (Pages 16-85). Mise à jour du Tableau de Bord National et de la modale d'information pour afficher ces nouvelles catégories et sources.
  - **Impact** : Offre une vision globale, précise et sourcée de l'ensemble du paysage universitaire béninois (public et privé), renforçant le rôle de l'application comme outil d'information de référence et de transparence.
  - **Description** : Améliorations UX inspirées de la concurrence (apresbac.bj). Ajout d'une bannière d'avertissement (Disclaimer) en haut de l'application, de badges de réassurance (Instantané, Officiel, Gratuit) sur la page d'accueil, et transformation de la modale d'information en une véritable vue "Guide" structurée avec un sommaire.
  - **Impact** : Améliore la crédibilité de l'application, rassure les utilisateurs sur l'origine des données et facilite la navigation dans les informations d'orientation.
- **10/04/2026** :
  - **Description** : Optimisation UI/UX, Logo personnalisé et SEO. Création d'un logo SVG unique pour OrientaBénin. Mise en œuvre d'un référencement SEO complet (balises meta, Open Graph, Twitter Cards). Correction des problèmes de responsivité du footer (passage en `overflow-x: hidden` et refonte de la structure du layout). Retour aux couleurs Indigo/Violet pour l'identité visuelle.
  - **Impact** : Identité visuelle plus forte, meilleure visibilité sur les moteurs de recherche et expérience utilisateur fluide sur tous les appareils.
  - **Description** : Création d'une documentation technique complète (`DEVELOPER_ONBOARDING.md`).
  - **Impact** : Facilite l'accueil de nouveaux développeurs sur le projet en documentant l'architecture, les flux et les conventions.
  - **Description** : Mise en place de la stratégie de licence propriétaire et création des fichiers `LICENSE` et `README.md`.
  - **Impact** : Sécurise la propriété intellectuelle du projet (algorithme et données) dans une perspective commerciale/startup.
  - **Description** : Découplage de la gestion des filières de Firestore. Les filières sont désormais gérées exclusivement via `localStorage` et initialisées depuis `guide.json`. Ajout d'un bouton de réinitialisation dans l'administration pour forcer le rechargement depuis le fichier JSON.
  - **Impact** : L'application est 100% autonome pour la gestion de son catalogue, éliminant les erreurs de connexion Firestore et les problèmes de quotas, tout en permettant des mises à jour faciles via le code source.
