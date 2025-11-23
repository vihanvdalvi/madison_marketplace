import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saEnv) {
      let serviceAccount: any;
      try {
        // first try plain JSON string
        serviceAccount = JSON.parse(saEnv);
      } catch (e) {
        // fallback: assume base64-encoded JSON
        serviceAccount = JSON.parse(Buffer.from(saEnv, "base64").toString());
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // fallback to Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
      admin.initializeApp();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to initialize firebase-admin:", err);
    throw err;
  }
}

const db = admin.firestore();

export { db };
