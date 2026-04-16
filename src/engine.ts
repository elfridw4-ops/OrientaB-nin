/**
 * Moteur de calcul et de recommandation pour l'orientation universitaire.
 * Ce module contient les fonctions pures pour calculer les scores, filtrer,
 * trier et recommander des filières selon les notes et la série du bachelier.
 */

// --- TYPES ---

export interface MatierePonderee {
  nom: string;
  coeff: number;
}

export interface FiliereBase {
  id?: string;
  nom_filiere: string;
  baccalaureats_recommandes: string[];
  matieres: MatierePonderee[];
  debouches: string[];
  [key: string]: any; // Permet d'inclure d'autres propriétés (université, quotas, etc.)
}

export interface NotesUtilisateur {
  [matiere: string]: number;
}

export type NiveauRecommandation = 'Fortement recommandée' | 'Possible' | 'Risquée';

export interface ResultatRecommandation<T> {
  filiere: T;
  score: number;
  niveau: NiveauRecommandation;
  isLessCrowded?: boolean;
  chances?: number;
  saturation?: number;
  formule?: string;
}

// --- 1. CALCUL DU SCORE ---

/**
 * Récupère la meilleure note possible pour une matière donnée, en gérant
 * les équivalences (PCT = SPCT) et les choix multiples (ex: "PCT/RDM").
 */
export function getNoteForMatiere(notes: NotesUtilisateur, matiereNom: string): number {
  // Correspondance directe
  if (notes[matiereNom] !== undefined) return notes[matiereNom];
  
  // Équivalence PCT / SPCT
  if (matiereNom === 'SPCT' && notes['PCT'] !== undefined) return notes['PCT'];
  if (matiereNom === 'PCT' && notes['SPCT'] !== undefined) return notes['SPCT'];
  
  // Gestion des matières composées (ex: "PCT/RDM" ou "Maths/Economie")
  // On prend la meilleure note parmi les options disponibles
  if (matiereNom.includes('/')) {
    const parts = matiereNom.split('/');
    let bestNote = 0;
    for (let part of parts) {
      part = part.trim();
      let note = notes[part] || 0;
      if (part === 'SPCT' && notes['PCT'] !== undefined) note = notes['PCT'];
      if (part === 'PCT' && notes['SPCT'] !== undefined) note = notes['SPCT'];
      if (note > bestNote) bestNote = note;
    }
    return bestNote;
  }

  // Gestion des noms partiels (ex: "Enseignement des PCT")
  if (matiereNom.includes('PCT') && notes['PCT'] !== undefined) return notes['PCT'];
  if (matiereNom.includes('SPCT') && notes['PCT'] !== undefined) return notes['PCT'];

  return 0;
}

/**
 * Calcule la moyenne pondérée pour une filière donnée.
 * Formule : M = (m1*x + m2*y + m3*z) / (x+y+z)
 * 
 * @param notes Les notes saisies par l'utilisateur (ex: { Maths: 15, SVT: 12 })
 * @param matieres Les matières exigées par la filière avec leurs coefficients
 * @returns Le score calculé (moyenne pondérée) arrondi à 2 décimales
 */
export function calculerScore(notes: NotesUtilisateur, matieres: MatierePonderee[]): number {
  let totalPoints = 0;
  let totalCoefficients = 0;

  for (const matiere of matieres) {
    const note = getNoteForMatiere(notes, matiere.nom);
    totalPoints += note * matiere.coeff;
    totalCoefficients += matiere.coeff;
  }

  if (totalCoefficients === 0) return 0;
  
  const moyenne = totalPoints / totalCoefficients;
  return Number(moyenne.toFixed(2));
}

/**
 * Génère la chaîne de caractères représentant la formule de calcul.
 */
export function genererFormule(notes: NotesUtilisateur, matieres: MatierePonderee[]): string {
  if (!matieres || matieres.length === 0) return '';
  
  const parts = matieres.map(m => `${m.nom}×${m.coeff}`);
  const values = matieres.map(m => `${getNoteForMatiere(notes, m.nom)}×${m.coeff}`);
  const totalCoeff = matieres.reduce((sum, m) => sum + m.coeff, 0);
  
  return `(${parts.join(' + ')})/${totalCoeff} = (${values.join(' + ')})/${totalCoeff}`;
}

// --- 2. FILTRAGE INTELLIGENT ---

/**
 * Filtre les filières pour ne garder que celles compatibles avec la série du BAC.
 * 
 * @param filieres La liste complète des filières
 * @param serieBac La série du BAC de l'utilisateur (ex: "C", "D", "G2")
 * @returns Un tableau contenant uniquement les filières compatibles
 */
export function filtrerParSerie<T extends FiliereBase>(filieres: T[], serieBac: string): T[] {
  if (!serieBac || serieBac.trim() === '') return filieres;
  
  return filieres.filter(filiere => 
    filiere.baccalaureats_recommandes.includes(serieBac)
  );
}

// --- 3. CLASSEMENT ---

/**
 * Trie une liste de filières (déjà évaluées) par score décroissant.
 * 
 * @param filieresEvaluees Liste d'objets contenant la filière et son score
 * @returns La liste triée du meilleur score au moins bon
 */
export function classerParScore<T extends FiliereBase>(
  filieresEvaluees: { filiere: T; score: number }[]
): { filiere: T; score: number }[] {
  // On trie par score décroissant. Si les scores sont proches (différence < 0.5), on privilégie celle avec le moins de candidats.
  return [...filieresEvaluees].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) < 0.5) {
      const candidatsA = a.filiere.candidatsCount || 0;
      const candidatsB = b.filiere.candidatsCount || 0;
      return candidatsA - candidatsB; // Moins de candidats en premier
    }
    return scoreDiff;
  });
}

// --- 4. RECOMMANDATION ---

/**
 * Évalue, classe et catégorise les filières selon les notes de l'utilisateur.
 * - Fortement recommandée : score >= 14
 * - Possible : 12 <= score < 14
 * - Risquée : score < 12
 * 
 * @param filieres Liste des filières (idéalement déjà filtrées par série)
 * @param notes Notes de l'utilisateur
 * @returns Liste des recommandations triées et catégorisées
 */
export function genererRecommandations<T extends FiliereBase>(
  filieres: T[], 
  notes: NotesUtilisateur
): ResultatRecommandation<T>[] {
  
  // Calculer la moyenne des candidats pour déterminer ce qui est "peu choisi"
  const totalCandidats = filieres.reduce((sum, f) => sum + (f.candidatsCount || 0), 0);
  const moyenneCandidats = filieres.length > 0 ? totalCandidats / filieres.length : 0;

  const resultats = filieres.map(filiere => {
    const score = calculerScore(notes, filiere.matieres);
    const formule = genererFormule(notes, filiere.matieres);
    let niveau: NiveauRecommandation = 'Risquée';
    
    if (score >= 14) {
      niveau = 'Fortement recommandée';
    } else if (score >= 12) {
      niveau = 'Possible';
    }

    const candidats = filiere.candidatsCount || 0;
    const admisOfficiels = filiere.admisOfficiels || (filiere.quotas?.bourses + filiere.quotas?.aides_fpp) || 50; // Fallback
    
    const chances = calculerChances(candidats, admisOfficiels);
    const saturation = calculerSaturation(candidats, admisOfficiels);
    const isLessCrowded = saturation < 50 && score >= 12;

    return { filiere, score, niveau, isLessCrowded, chances, saturation, formule };
  }).filter(r => r.score >= 10);

  // Utilisation de la fonction de classement
  return classerParScore(resultats) as ResultatRecommandation<T>[];
}

// --- 5. CALCUL DES CHANCES ET SATURATION ---

/**
 * Calcule le pourcentage de chances estimé selon le nombre d'inscrits et la capacité officielle.
 * Formule demandée : % de chances = (1 - inscrits / admis_officiel) * 100
 * 
 * @param inscrits Nombre de candidats sur la plateforme
 * @param admisOfficiels Capacité officielle du ministère
 * @returns Pourcentage de chances (0-100)
 */
export function calculerChances(inscrits: number, admisOfficiels: number): number {
  if (!admisOfficiels || admisOfficiels === 0) return 0;
  const ratio = inscrits / admisOfficiels;
  const chances = (1 - ratio) * 100;
  return Math.max(0, Math.min(100, Number(chances.toFixed(1))));
}

/**
 * Calcule le taux de saturation d'une filière.
 * 
 * @param inscrits Nombre de candidats sur la plateforme
 * @param admisOfficiels Capacité officielle du ministère
 * @returns Taux de saturation (0-100+)
 */
export function calculerSaturation(inscrits: number, admisOfficiels: number): number {
  if (!admisOfficiels || admisOfficiels === 0) return 100;
  return Number(((inscrits / admisOfficiels) * 100).toFixed(1));
}

// --- 6. RECHERCHE ---

/**
 * Recherche des filières par nom ou par métier (débouchés).
 * La recherche est insensible à la casse.
 * 
 * @param filieres Liste des filières dans lesquelles chercher
 * @param requete Le texte recherché par l'utilisateur
 * @returns Les filières correspondant à la recherche
 */
export function rechercherFilieres<T extends FiliereBase>(filieres: T[], requete: string): T[] {
  if (!requete || requete.trim() === '') return filieres;
  
  const requeteMinuscule = requete.toLowerCase().trim();
  
  return filieres.filter(filiere => {
    // Vérifie si le nom de la filière contient la requête
    const correspondNom = filiere.nom_filiere?.toLowerCase().includes(requeteMinuscule);
    
    // Vérifie si au moins un des débouchés contient la requête
    const correspondMetier = filiere.debouches?.some(debouche => 
      debouche.toLowerCase().includes(requeteMinuscule)
    );

    // Nouveaux champs de recherche (établissement, sigle, université, localisation)
    const correspondEtablissement = filiere.etablissement?.toLowerCase().includes(requeteMinuscule);
    const correspondSigle = filiere.sigle?.toLowerCase().includes(requeteMinuscule);
    const correspondUniversite = filiere.universite?.toLowerCase().includes(requeteMinuscule);
    const correspondLocalisation = filiere.localisation?.toLowerCase().includes(requeteMinuscule);
    
    return correspondNom || correspondMetier || correspondEtablissement || correspondSigle || correspondUniversite || correspondLocalisation;
  });
}
