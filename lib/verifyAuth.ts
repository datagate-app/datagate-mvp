import { adminAuth } from "@/lib/firebase-admin";

export async function verifyAuth(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (e) {
    console.error("verifyAuth error:", e);
    throw new Error("Unauthorized");
  }
}