import { db, auth } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, onSnapshot, runTransaction, writeBatch
} from 'firebase/firestore';
import { UserProfile, FlattenedFiliere, OperationType, FirestoreErrorInfo } from '../types';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email || undefined,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId || undefined,
      providerInfo: currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const createUserProfile = async (profile: UserProfile): Promise<void> => {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, path), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, path), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const subscribeToFilieres = (callback: (filieres: FlattenedFiliere[]) => void) => {
  const path = 'filieres';
  return onSnapshot(collection(db, path), (snapshot) => {
    const filieres = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlattenedFiliere));
    callback(filieres);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const updateFiliereChoices = async (userId: string, oldChoices: string[], newChoices: string[]) => {
  try {
    const userRef = doc(db, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    
    const userData = userSnap.data() as UserProfile;
    if (userData.isLocked) throw new Error("Account is locked");

    const calculateUserAverage = (grades: Record<string, number> = {}) => {
      const values = Object.values(grades);
      if (values.length === 0) return 0;
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const userAvg = calculateUserAverage(userData.grades);

    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error("Not authenticated");

    const response = await fetch('/api/choices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        newChoices,
        oldChoices,
        newAverage: userAvg
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update choices');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'filieres/transaction');
  }
};

// Admin functions
export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
  const path = 'users';
  return onSnapshot(collection(db, path), (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as UserProfile);
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveFilieresBatch = async (filieres: FlattenedFiliere[]) => {
  const path = 'filieres';
  try {
    // Firestore batch limit is 500
    const chunkSize = 450;
    for (let i = 0; i < filieres.length; i += chunkSize) {
      const chunk = filieres.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(filiere => {
        const docRef = doc(db, path, filiere.id!);
        batch.set(docRef, { 
          ...filiere, 
          candidatsCount: filiere.candidatsCount ?? 0 
        }, { merge: true });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const publishCatalog = async (filieres: FlattenedFiliere[]): Promise<void> => {
  const path = 'system/catalog';
  try {
    const docRef = doc(db, 'system', 'catalog');
    // Firestore ne supporte pas les valeurs 'undefined'. 
    // On utilise JSON.parse(JSON.stringify()) pour nettoyer l'objet de toute valeur undefined.
    const sanitizedFilieres = JSON.parse(JSON.stringify(filieres));
    
    await setDoc(docRef, {
      data: sanitizedFilieres,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchLatestCatalog = async (): Promise<{ data: FlattenedFiliere[], updatedAt: string } | null> => {
  const path = 'system/catalog';
  try {
    const docRef = doc(db, 'system', 'catalog');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as { data: FlattenedFiliere[], updatedAt: string };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};
