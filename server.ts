import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import admin from 'firebase-admin';

// Initialize Firebase Admin
// This requires GOOGLE_APPLICATION_CREDENTIALS or process.env.FIREBASE_SERVICE_ACCOUNT
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } else {
    admin.initializeApp(); // relies on GOOGLE_APPLICATION_CREDENTIALS
  }
} catch (error) {
  console.warn("Firebase Admin Initialization Warning:", error);
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to update choices
  app.post('/api/choices', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const { newChoices, oldChoices, newAverage } = req.body;
      if (!Array.isArray(newChoices) || !Array.isArray(oldChoices)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(uid);
        
        // Find added and removed choices
        const added = newChoices.filter(c => !oldChoices.includes(c));
        const removed = oldChoices.filter(c => !newChoices.includes(c));
        
        // Refs for filieres to update
        const filieresRefs = [...added, ...removed].map(id => db.collection('filieres').doc(id));
        const filieresDocs = await transaction.getAll(...filieresRefs);
        
        const updates = new Map();
        
        for (const doc of filieresDocs) {
          if (!doc.exists) continue;
          
          let data = doc.data();
          let count = data.candidatsCount || 0;
          let stats = data.stats_anonymes || { moyenne_generale: 0 };
          
          if (added.includes(doc.id)) {
            // Recompute stats
            const currentTotalAvg = stats.moyenne_generale * count;
            count += 1;
            stats.moyenne_generale = (currentTotalAvg + (newAverage || 0)) / count;
          } else if (removed.includes(doc.id)) {
            const currentTotalAvg = stats.moyenne_generale * count;
            count = Math.max(0, count - 1);
            if (count === 0) {
              stats.moyenne_generale = 0;
            } else {
              stats.moyenne_generale = (currentTotalAvg - (newAverage || 0)) / count;
            }
          }
          
          updates.set(doc.ref, {
            candidatsCount: count,
            stats_anonymes: stats
          });
        }
        
        // Apply writes
        transaction.update(userRef, { choices: newChoices });
        for (const [ref, data] of updates) {
          transaction.update(ref, data);
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating choices:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
