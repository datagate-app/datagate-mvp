import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let app;

function loadServiceAccount() {
  const filePath = path.join(
    process.cwd(),
    "secrets",
    "firebase-admin.json"
  );

  console.log("🔥 Loading Firebase Admin");
  console.log("📁 CWD:", process.cwd());
  console.log("📁 Looking for:", filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `❌ firebase-admin.json not found at: ${filePath}`
    );
  }

  const raw = fs.readFileSync(filePath, "utf8");

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (e) {
    throw new Error("❌ firebase-admin.json is not valid JSON");
  }

  if (!serviceAccount.private_key) {
    throw new Error("❌ private_key missing in firebase-admin.json");
  }

  // Naprawa \n w private_key
  serviceAccount.private_key =
    serviceAccount.private_key.replace(/\\n/g, "\n");

  return serviceAccount;
}

if (!getApps().length) {
  const serviceAccount = loadServiceAccount();

  app = initializeApp({
    credential: cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized");
} else {
  app = getApp();
  console.log("♻️ Firebase Admin reused existing app");
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);