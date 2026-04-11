# Stratégie SEO - OrientaBénin

## Optimisations SEO Techniques
- **Balises Meta Dynamiques :** Utiliser React Helmet (à installer) pour modifier dynamiquement les balises `<title>` et `<meta name="description">` en fonction de la vue active (Accueil, Simulation, Explorer).
- **Structure HTML Sémantique :** 
  - Utilisation correcte des balises `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`.
  - Hiérarchie stricte des titres (un seul `<h1>` par page, suivi de `<h2>`, `<h3>`).
- **Performance (Core Web Vitals) :**
  - Les données lourdes (`guide.json`) sont chargées de manière asynchrone ou mises en cache.
  - Utilisation de polices optimisées (Inter) via Google Fonts avec `display=swap`.
- **Accessibilité (A11y) :** Attributs `alt` sur les images (s'il y en a), contrastes de couleurs respectés (Tailwind), navigation au clavier.

## Mots-clés
- **Principaux :** orientation bacheliers Bénin, guide MESRS Bénin, simulation bourse université Bénin, choix filière UAC, orientation universitaire Bénin.
- **Secondaires :** calcul moyenne bac Bénin, liste universités publiques Bénin, quotas bourses secours Bénin, IFRI, ENEAM, FAST.

## Structure de pages optimisée (URL virtuelles pour SPA)
Bien que ce soit une SPA, nous devons penser la structure pour les robots si nous implémentons du Server-Side Rendering (SSR) plus tard.
- `/` (Landing Page) : Présentation de l'outil, proposition de valeur.
- `/simulation` : L'outil de calcul (mot-clé : "Simulateur de bourse Bénin").
- `/explorer` : Le catalogue (mot-clé : "Guide des filières MESRS").

## Exemples de balises
**Page d'accueil :**
- **H1 :** OrientaBénin : Faites le meilleur choix pour votre avenir universitaire
- **Meta Title :** OrientaBénin | Guide d'Orientation et Simulation de Bourse au Bénin
- **Meta Description :** Bacheliers béninois, simulez vos chances d'obtenir une bourse ou un secours du MESRS. Découvrez les filières universitaires et faites des choix stratégiques.

**Page Explorer :**
- **H1 :** Guide Officiel des Filières Universitaires au Bénin (2025-2026)
- **Meta Title :** Liste des Filières et Universités Publiques | OrientaBénin
- **Meta Description :** Explorez plus de 500 filières disponibles dans les universités publiques du Bénin (UAC, UNIPAR, etc.). Consultez les quotas de bourses et les matières clés.

## Bonnes pratiques à long terme
- Mettre à jour l'année dans les titres (ex: "Guide 2025-2026") chaque année.
- Ajouter un blog ou une section "Conseils" pour cibler des requêtes de longue traîne ("Comment réussir son entretien d'entrée à l'IFRI ?").
- Générer un `sitemap.xml` et un `robots.txt` lors du déploiement en production.
