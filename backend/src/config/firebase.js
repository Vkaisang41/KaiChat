import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
let bucket = null;

try {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const serviceAccount = {
      type: "service_account",
      project_id: "kaichat-5c62b",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'kaichat-5c62b.firebasestorage.app'
      });
    }

    bucket = admin.storage().bucket();
    console.log('✅ Firebase initialized successfully');
  } else {
    console.log('⚠️ Firebase credentials not found, file uploads will be disabled');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('⚠️ File uploads will be disabled');
}

// Export bucket (will be null if Firebase is not configured)
export { bucket };
export default admin;