import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App;
let adminDb: Firestore;
let adminStorage: Storage;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    // Remove storageBucket to prevent Firestore from validating URLs as Storage paths
    // We store Replicate URLs directly, not Firebase Storage paths
  });
  adminDb = getFirestore(app);
  adminStorage = getStorage(app);
} else {
  app = getApps()[0];
  adminDb = getFirestore(app);
  adminStorage = getStorage(app);
}

export { app, adminDb, adminStorage };
