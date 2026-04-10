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

      // 2. Calculate user average and mention
      const calculateUserAverage = (grades: Record<string, number> = {}) => {
        const values = Object.values(grades);
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
      };

      const getMention = (avg: number) => {
        if (avg >= 16) return 'tres_bien';
        if (avg >= 14) return 'bien';
        if (avg >= 12) return 'assez_bien';
        return 'passable';
      };

      const userAvg = calculateUserAverage(userData.grades);
      const userMention = getMention(userAvg);

      // 3. Calculate added and removed choices
      const added = newChoices.filter(c => !oldChoices.includes(c));
      const removed = oldChoices.filter(c => !newChoices.includes(c));

      // 4. Update filieres candidatsCount and stats_anonymes
      for (const filiereId of added) {
        const filiereRef = doc(db, `filieres/${filiereId}`);
        const filiereSnap = await transaction.get(filiereRef);
        if (filiereSnap.exists()) {
          const data = filiereSnap.data() as FlattenedFiliere;
          const currentCount = data.candidatsCount || 0;
          const currentStats = data.stats_anonymes || { moyenne_generale: 0, mentions: { tres_bien: 0, bien: 0, assez_bien: 0, passable: 0 } };
          
          const newCount = currentCount + 1;
          const newMoyenne = ((currentStats.moyenne_generale * currentCount) + userAvg) / newCount;
          const newMentions = { ...currentStats.mentions };
          newMentions[userMention] = (newMentions[userMention] || 0) + 1;

          transaction.update(filiereRef, { 
            candidatsCount: newCount,
            stats_anonymes: {
              moyenne_generale: newMoyenne,
              mentions: newMentions
            }
          });
        }
      }

      for (const filiereId of removed) {
        const filiereRef = doc(db, `filieres/${filiereId}`);
        const filiereSnap = await transaction.get(filiereRef);
        if (filiereSnap.exists()) {
          const data = filiereSnap.data() as FlattenedFiliere;
          const currentCount = data.candidatsCount || 0;
          if (currentCount > 0) {
            const currentStats = data.stats_anonymes || { moyenne_generale: 0, mentions: { tres_bien: 0, bien: 0, assez_bien: 0, passable: 0 } };
            const newCount = currentCount - 1;
            const newMoyenne = newCount === 0 ? 0 : ((currentStats.moyenne_generale * currentCount) - userAvg) / newCount;
            const newMentions = { ...currentStats.mentions };
            newMentions[userMention] = Math.max(0, (newMentions[userMention] || 0) - 1);

            transaction.update(filiereRef, { 
              candidatsCount: newCount,
              stats_anonymes: {
                moyenne_generale: newMoyenne,
                mentions: newMentions
              }
            });
          }
        }
      }

      // 5. Update user choices
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
