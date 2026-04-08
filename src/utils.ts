import { GuideData, FlattenedFiliere } from './types';
import guideDataRaw from './data/guide.json';
import { MatierePonderee } from './engine';

const STORAGE_KEY = 'orientabenin_data';

export interface AppData {
  metadata: {
    titre_document: string;
    annee_academique: string;
    pays: string;
  };
  filieres: FlattenedFiliere[];
}

export const getAppData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Erreur lecture LocalStorage", e);
    }
  }

  // Fallback to JSON
  const guideData = guideDataRaw as GuideData;
  const filieres: FlattenedFiliere[] = [];
  
  guideData.universites.forEach((uni) => {
    uni.etablissements.forEach((etab) => {
      etab.filieres.forEach((fil) => {
        const matieres: MatierePonderee[] = fil.matieres_cles.map(m => ({ nom: m, coeff: 3 }));
        const matieresCommunes = ['Français', 'Anglais'];
        matieresCommunes.forEach(mc => {
          if (!matieres.find(m => m.nom === mc)) {
            matieres.push({ nom: mc, coeff: 1 });
          }
        });

        filieres.push({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          ...fil,
          universite: uni.nom_universite,
          etablissement: etab.nom_etablissement,
          sigle: etab.sigle,
          localisation: etab.localisation,
          matieres
        });
      });
    });
  });

  const appData = { metadata: guideData.metadata, filieres };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  return appData;
};

export const saveAppData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getAllFilieres = (): FlattenedFiliere[] => {
  return getAppData().filieres;
};

