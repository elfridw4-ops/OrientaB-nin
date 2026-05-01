import { GuideData, FlattenedFiliere } from './types';
import guideDataRaw from './data/guide.json';
import { MatierePonderee } from './engine';

export interface AppData {
  metadata: {
    titre_document: string;
    annee_academique: string;
    pays: string;
    stats_globales?: {
      total_filieres: number;
      total_allocations: number;
      bourses: number;
      aides_fpp: number;
      admis_bac: number;
      repartition_universites: Record<string, number>;
      repartition_mode: {
        classement: number;
        concours: number;
      };
    };
  };
  filieres: FlattenedFiliere[];
}

export const getFallbackAppData = (): AppData => {
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
          type_universite: uni.type,
          etablissement: etab.nom_etablissement,
          sigle: etab.sigle,
          localisation: etab.localisation,
          bourses: fil.quotas?.bourses || 0,
          aides: fil.quotas?.aides_fpp || 0,
          admisOfficiels: (fil.quotas?.bourses || 0) + (fil.quotas?.aides_fpp || 0),
          candidatsCount: 0,
          matieres
        });
      });
    });
  });

  return { metadata: guideData.metadata, filieres };
};

export const getAppData = (): AppData => getFallbackAppData();
export const resetAppData = (): AppData => getFallbackAppData();
export const saveAppData = (data: AppData) => {};
export const getAllFilieres = (): FlattenedFiliere[] => getFallbackAppData().filieres;

