import * as admin from "firebase-admin";

export function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  return {
    adminAuth: admin.auth(),
    adminDb: admin.firestore(),
  };
}