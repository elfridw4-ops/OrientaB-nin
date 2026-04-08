# Charte Graphique - OrientaBénin

Ce document définit l'identité visuelle et les principes de design de l'application OrientaBénin.

## 1. Couleurs Principales (Brand Colors)
L'application utilise un dégradé dynamique et moderne pour inspirer la confiance, l'intelligence et l'avenir.

- **Couleur Primaire (Indigo)** : `indigo-600` (#4f46e5) - Utilisée pour les boutons principaux, les liens actifs et les éléments de mise en avant.
- **Couleur Secondaire (Violet)** : `violet-600` (#7c3aed) - Utilisée en combinaison avec l'indigo pour les dégradés (ex: `bg-gradient-to-r from-indigo-600 to-violet-600`).
- **Couleur de Fond (Background)** : `slate-50` (#f8fafc) - Un gris très clair, presque blanc, pour faire ressortir les cartes en glassmorphism.
- **Couleur du Texte Principal** : `slate-900` (#0f172a) pour les titres, `slate-600` (#475569) pour le texte courant.

## 2. Couleurs Sémantiques (Feedback & Status)
- **Succès / Bourses** : `emerald-500` (#10b981) à `emerald-600` (#059669).
- **Avertissement / Attention** : `amber-500` (#f59e0b) - Utilisé pour les alertes modérées (ex: Mythe des mentions).
- **Erreur / Danger** : `rose-500` (#f43f5e) à `rose-600` (#e11d48) - Utilisé pour les blocages ou les actions irréversibles (ex: déconnexion, compte bloqué).
- **Information / Aides (FPP)** : `blue-500` (#3b82f6) à `blue-600` (#2563eb).

## 3. Typographie
- **Police Principale (Corps de texte)** : Sans-serif système (Inter, Roboto, San Francisco). Classe Tailwind : `font-sans`.
- **Police de Titre (Display)** : Utilisée pour les gros titres (H1, H2) pour donner du caractère. Classe Tailwind : `font-display font-black` ou `font-bold`.

## 4. Style UI (Glassmorphism & Formes)
L'interface repose fortement sur le **Glassmorphism** (effet de verre dépoli) pour un rendu moderne et léger.

- **Cartes (GlassCard)** : Fond blanc semi-transparent (`bg-white/60` ou `bg-white/80`), flou d'arrière-plan (`backdrop-blur-xl`), et bordure subtile (`border-white/50`).
- **Ombres (Shadows)** : Ombres douces et diffuses (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`). Les boutons principaux utilisent des ombres colorées (`shadow-indigo-200/50`).
- **Arrondis (Border Radius)** : Très prononcés pour un aspect convivial. `rounded-2xl` (16px) pour les petites cartes, `rounded-3xl` (24px) ou `rounded-[2rem]` (32px) pour les conteneurs principaux.

## 5. Iconographie
- Bibliothèque : **Lucide React**.
- Style : Icônes au trait (stroke), épaisseur moyenne (2px), généralement de taille `w-5 h-5` ou `w-6 h-6`.
- Utilisation : Toujours accompagnées d'un fond coloré léger (ex: `bg-indigo-100 text-indigo-600`) lorsqu'elles servent d'illustration principale pour une carte.

## 6. Composants Spécifiques
- **Bannière d'Avertissement** : Doit utiliser les couleurs de la marque (Indigo/Violet) plutôt que des couleurs d'alerte génériques (Jaune/Rouge) pour s'intégrer harmonieusement tout en restant visible.
- **Navigation Inférieure (Mobile)** : Flottante, en glassmorphism, avec l'icône active mise en évidence par un fond `indigo-50` et un texte `indigo-600`.
