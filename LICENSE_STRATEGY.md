# ⚖️ Stratégie de Licence - OrientaBénin

## 1. Recommandation de Stratégie : **Propriétaire / Commerciale**

Pour un projet de type SaaS avec une intention "Startup/Commerciale" et des parties sensibles (algorithme de calcul et base de données officielle), la stratégie la plus appropriée est une **Licence Propriétaire**.

**Justification :**
- **Protection de l'IP** : Le fichier `engine.ts` contient la logique métier spécifique au MESRS. Une licence open-source (MIT/GPL) permettrait à un concurrent de copier l'intégralité du service en quelques minutes.
- **Valeur de la donnée** : Le fichier `guide.json` est le résultat d'un travail d'extraction et de structuration qui constitue votre avantage concurrentiel.
- **Contrôle Commercial** : Vous conservez le droit exclusif de monétiser l'outil ou de le vendre à une institution.

---

## 2. Fichier de Licence (LICENSE.md)

```text
CONTRAT DE LICENCE LOGICIELLE PROPRIÉTAIRE - ORIENTABÉNIN

Copyright (c) 2026 OrientaBénin. Tous droits réservés.

1. DÉFINITION DU LOGICIEL
Le terme "Logiciel" désigne l'application OrientaBénin, incluant son code source, son moteur de calcul (engine.ts), ses bases de données (guide.json), ses interfaces graphiques et sa documentation.

2. OCTROI DE LICENCE
Ce logiciel est la propriété exclusive de OrientaBénin. Aucune licence d'utilisation, de copie, de modification ou de distribution n'est accordée par le présent document, sauf autorisation écrite expresse du détenteur du copyright.

3. RESTRICTIONS
Il est strictement interdit de :
- Copier, modifier ou distribuer le code source ou les données du Logiciel.
- Utiliser le moteur de calcul à des fins commerciales tierces.
- Pratiquer l'ingénierie inverse sur le Logiciel.
- Héberger une instance publique du Logiciel sans accord préalable.

4. PROPRIÉTÉ INTELLECTUELLE
Tous les titres, droits de propriété et droits de propriété intellectuelle relatifs au Logiciel (y compris, mais sans s'y limiter, les images, photographies, animations, vidéos, musique, texte et "applets" incorporés dans le Logiciel) sont la propriété de OrientaBénin.

5. ABSENCE DE GARANTIE
LE LOGICIEL EST FOURNI "EN L'ÉTAT", SANS GARANTIE D'AUCUNE SORTE, EXPRESSE OU IMPLICITE. EN AUCUN CAS LES AUTEURS OU TITULAIRES DU DROIT D'AUTEUR NE SERONT RESPONSABLES DE TOUTE RÉCLAMATION, DOMMAGE OU AUTRE RESPONSABILITÉ.

Contact : elfridw4@gmail.com
```

---

## 3. Section Licence du README.md

```markdown
## ⚖️ Licence

Ce projet est sous **Licence Propriétaire**. Tous droits réservés à **OrientaBénin**.

- **Code Source** : Usage privé uniquement. La reproduction ou distribution non autorisée est strictement interdite.
- **Données** : Les données contenues dans `guide.json` sont protégées et ne peuvent être extraites pour un usage tiers.
- **Algorithme** : Le moteur de recommandation est la propriété intellectuelle exclusive du projet.

Pour toute demande de partenariat ou d'utilisation commerciale, veuillez contacter : [elfridw4@gmail.com](mailto:elfridw4@gmail.com).
```

---

## 4. Conseils d'Architecture Hybride (Optionnel)

Si vous souhaitez adopter une approche plus ouverte pour attirer des contributeurs tout en protégeant votre business, voici la structure recommandée :

**Ce qui peut être "Open" (Licence MIT) :**
- Les composants UI (`GlassCard.tsx`, `Logo.tsx`).
- Les utilitaires de formatage (`utils.ts`).
- La structure CSS/Tailwind.

**Ce qui DOIT rester "Closed" (Propriétaire) :**
- **`src/engine.ts`** : C'est votre "sauce secrète".
- **`src/data/guide.json`** : C'est votre actif principal.
- **`firestore.rules`** : Contient la logique de sécurité de votre infrastructure.
- **`src/Admin.tsx`** : Les outils de gestion interne.

**Action pratique** : Si vous rendez le dépôt public, déplacez l'algorithme de calcul dans une fonction backend (Firebase Function) pour qu'il ne soit pas visible dans le code client.
