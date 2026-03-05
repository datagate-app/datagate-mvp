import * as admin from "firebase-admin";

let serviceAccount;

if (process.env.NODE_ENV !== "production") {
  serviceAccount = require("../firebase-service-account.json");
}

if (!admin.apps.length) {
  if (process.env.NODE_ENV === "production") {
    admin.initializeApp();
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();