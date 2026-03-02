import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp(); // ADC z Cloud Run
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();