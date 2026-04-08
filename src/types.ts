import { MatierePonderee } from './engine';

export interface Quotas {
  bourses: number;
  aides_partiellement_payant: number;
}

export interface Filiere {
  nom_filiere: string;
  quotas: Quotas;
  admisOfficiels?: number; // Total capacity from ministry
  mode_entree: string;
  baccalaureats_recommandes: string[];
  matieres_cles: string[];
  debouches: string[];
}

export interface Etablissement {
  nom_etablissement: string;
  sigle: string;
  localisation: string;
  filieres: Filiere[];
}

export interface Universite {
  nom_universite: string;
  type: string;
  etablissements: Etablissement[];
}

export interface GuideData {
  metadata: {
    titre_document: string;
    annee_academique: string;
    pays: string;
  };
  universites: Universite[];
}

export interface FlattenedFiliere extends Filiere {
  id?: string;
  universite: string;
  etablissement: string;
  sigle: string;
  localisation: string;
  matieres: MatierePonderee[];
  candidatsCount?: number;
  admisOfficiels?: number;
}

export interface UserProfile {
  uid: string;
  matricule: string;
  nomComplet: string;
  email: string;
  role: 'student' | 'admin' | 'super_admin';
  isLocked: boolean;
  isDeleted: boolean;
  serie: string;
  grades: Record<string, number>;
  choices: string[]; // Array of filiere IDs
  allocationStatus: 'boursier' | 'secouru' | 'fpp' | 'none' | 'pending';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
