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
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  adminDb = getFirestore(app);
  adminStorage = getStorage(app);
} else {
  app = getApps()[0];
  adminDb = getFirestore(app);
  adminStorage = getStorage(app);
}

export { app, adminDb, adminStorage };
