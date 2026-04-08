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
    await runTransaction(db, async (transaction) => {
      // 1. Read user profile to ensure they are not locked
      const userRef = doc(db, `users/${userId}`);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      
      const userData = userSnap.data() as UserProfile;
      if (userData.isLocked) throw new Error("Account is locked");

      // 2. Calculate added and removed choices
      const added = newChoices.filter(c => !oldChoices.includes(c));
      const removed = oldChoices.filter(c => !newChoices.includes(c));

      // 3. Update filieres candidatsCount
      for (const filiereId of added) {
        const filiereRef = doc(db, `filieres/${filiereId}`);
        const filiereSnap = await transaction.get(filiereRef);
        if (filiereSnap.exists()) {
          const currentCount = filiereSnap.data().candidatsCount || 0;
          transaction.update(filiereRef, { candidatsCount: currentCount + 1 });
        }
      }

      for (const filiereId of removed) {
        const filiereRef = doc(db, `filieres/${filiereId}`);
        const filiereSnap = await transaction.get(filiereRef);
        if (filiereSnap.exists()) {
          const currentCount = filiereSnap.data().candidatsCount || 0;
          transaction.update(filiereRef, { candidatsCount: Math.max(0, currentCount - 1) });
        }
      }

      // 4. Update user choices
      transaction.update(userRef, { choices: newChoices });
    });
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
    const batch = writeBatch(db);
    filieres.forEach(filiere => {
      const docRef = doc(db, path, filiere.id!);
      // Use set with merge: true to avoid overwriting fields like candidatsCount if not provided
      // But here we want to ensure candidatsCount is at least 0 if it's a new filiere
      batch.set(docRef, { 
        ...filiere, 
        candidatsCount: filiere.candidatsCount ?? 0 
      }, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
