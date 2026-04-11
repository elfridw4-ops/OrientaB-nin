# Cahier des Charges

## Invite initiale
Tu es un ingénieur logiciel senior spécialisé en développement d’applications web éducatives et en architecture de données.
Ta mission est de concevoir une application d’orientation universitaire pour les bacheliers du Bénin basée sur un dataset JSON extrait d’un guide officiel.

## Exigences fonctionnelles
- **Fonctionnalités principales** :
  - Fonctionner offline-first pour le catalogue des filières.
  - Permettre filtrage par série BAC
  - Intégrer un simulateur de classement basé sur une moyenne pondérée
  - Afficher les quotas (bourses, aides, FPP)
  - Proposer des recommandations intelligentes
  - Afficher les règles d'allocations (Bourse, Secours, FPP) et les statistiques globales du guide 2025-2026.
  - Comparer les capacités officielles (ministère) avec les inscriptions sur la plateforme pour estimer les chances de réussite.
  - Espace utilisateur avec authentification Firebase (Google) pour sauvegarder les choix.
  - Espace administration pour gérer les utilisateurs et forcer le rechargement du catalogue local.

## Exigences non fonctionnelles
- **Performances** : Optimisation pour les appareils mobiles, chargement instantané du catalogue via `localStorage`.
- **Sécurité** : Authentification sécurisée via Firebase Auth, règles Firestore pour protéger les données utilisateurs.
- **Évolutivité** : Structure modulaire permettant l'ajout facile de nouvelles données dans le JSON.

## Contraintes
- **Limitations techniques ou commerciales** :
  - Frontend React (Vite)
  - Catalogue des filières 100% autonome (JSON + LocalStorage), pas de dépendance Firestore pour ces données.
  - Données dynamiques via JSON

## Règles Métier (Allocations)
- **Bourses** : 420 000F/an (Écoles) ou 365 000F/an (Facultés).
- **Secours** : 132 000F/an (Facultés uniquement).
- **FPP (Titre Partiellement Payant)** : Remplace le secours dans les écoles, l'étudiant paie 1/3 de la scolarité.
- **Règles strictes** : Interdiction de transfert après classement, perte d'allocation si changement de filière, pas de double allocation.
