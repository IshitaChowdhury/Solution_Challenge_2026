const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let firestore = null;

function parseServiceAccountFromEnv() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath) {
    const absolutePath = path.resolve(serviceAccountPath);
    const fileContents = fs.readFileSync(absolutePath, "utf8");
    const parsedFromFile = JSON.parse(fileContents);

    if (typeof parsedFromFile.private_key === "string") {
      parsedFromFile.private_key = parsedFromFile.private_key.replace(/\\n/g, "\n");
    }

    return parsedFromFile;
  }

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!rawJson) {
    return null;
  }

  const parsed = JSON.parse(rawJson);

  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}

function getFirestore() {
  if (firestore) {
    return firestore;
  }

  const serviceAccount = parseServiceAccountFromEnv();

  if (!serviceAccount) {
    throw new Error("Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in backend/.env");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  firestore = admin.firestore();
  return firestore;
}

module.exports = {
  getFirestore
};