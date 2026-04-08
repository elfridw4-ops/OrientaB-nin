# Journal des Décisions

## Titre de la décision : Choix du Framework Frontend
- **Date** : 06/04/2026
- **Contexte** : L'application doit être développée en frontend uniquement, être performante sur mobile et facile à maintenir.
- **Décision** : Utilisation de React avec Vite et Tailwind CSS.
- **Alternatives envisagées** : Vanilla JS/HTML/CSS.
- **Conséquences** : React permet une gestion d'état complexe (filtres, simulateur) de manière déclarative et plus maintenable que Vanilla JS. Tailwind CSS accélère le développement UI.

## Titre de la décision : Stockage des Données
- **Date** : 06/04/2026
- **Contexte** : L'application doit fonctionner offline-first et sans backend.
- **Décision** : Les données du guide d'orientation sont stockées dans un fichier statique `src/data/guide.json`.
- **Alternatives envisagées** : Base de données locale (IndexedDB), API distante.
- **Conséquences** : Le fichier JSON est embarqué dans le bundle final, garantissant un accès immédiat et hors-ligne aux données.

## Titre de la décision : Logique de Calcul du Simulateur
- **Date** : 06/04/2026
- **Contexte** : Le simulateur doit calculer une moyenne pondérée basée sur les notes du bachelier et les matières clés de chaque filière.
- **Décision** : Implémentation d'un algorithme générique dans `utils.ts` qui attribue un coefficient supérieur (3) aux matières clés et un coefficient standard (1) aux autres matières saisies, en l'absence des coefficients exacts par filière dans le JSON.
- **Alternatives envisagées** : Demander à l'utilisateur de saisir les coefficients manuellement.
- **Conséquences** : Simplifie l'UX tout en fournissant une estimation pertinente du score de classement.

## Titre de la décision : Visualisation des Statistiques
- **Date** : 06/04/2026
- **Contexte** : Visualiser la distribution des bourses et aides/FPP à travers les différentes universités et filières.
- **Décision** : Utilisation de la bibliothèque `recharts` pour générer des graphiques interactifs (BarChart).
- **Alternatives envisagées** : `d3.js` ou `chart.js`.
- **Conséquences** : `recharts` s'intègre parfaitement avec React, offrant des composants déclaratifs et facilement personnalisables, ce qui accélère l'implémentation par rapport à `d3.js` brut.

## Titre de la décision : Panneau d'administration et stockage local
- **Date** : 06/04/2026
- **Contexte** : Permettre à un administrateur non technique de mettre à jour les données (filières, quotas, année académique) sans avoir à modifier le code source ou redéployer l'application.
- **Décision** : Création d'une vue d'administration (`Admin.tsx`) couplée à une persistance des données via le `LocalStorage` du navigateur. Les données sont aplaties (`FlattenedFiliere`) pour faciliter la manipulation CRUD. Des fonctions d'import/export JSON ont été ajoutées pour la sauvegarde et le partage.
- **Alternatives envisagées** : Utilisation d'un backend complet (Node.js + Base de données) ou Firebase.
- **Conséquences** : L'application reste 100% frontend et offline-first, respectant les contraintes initiales. Le gestionnaire peut exporter le JSON mis à jour et le réimporter sur un autre appareil ou le fournir aux développeurs pour une mise à jour de la base de données statique par défaut.

## Titre de la décision : Intégration de la Comparaison Capacité vs Inscriptions
- **Date** : 08/04/2026
- **Contexte** : Les étudiants ont besoin de visibilité sur la concurrence réelle pour chaque filière afin d'optimiser leurs choix.
- **Décision** : Ajout d'un champ `admisOfficiels` dans le modèle de données Firestore et calcul d'un taux de saturation et d'un pourcentage de chances estimées (`% de chances = (1 - inscrits / admis_officiels) * 100`). Affichage visuel via une barre de saturation colorée.
- **Alternatives envisagées** : Afficher uniquement le nombre de candidats sans comparaison.
- **Conséquences** : Offre une aide à la décision stratégique beaucoup plus puissante. Les étudiants peuvent identifier les filières "peu saturées" où ils ont statistiquement plus de chances d'être admis, même avec un score moyen.
