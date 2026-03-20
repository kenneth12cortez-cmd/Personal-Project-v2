import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'TODO_KEYHERE') {
  console.warn('Firebase configuration is missing or incomplete. Please set up Firebase in the AI Studio UI.');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: 'neu.edu.ph' // Hint for NEU domain
});

// Validate Connection to Firestore
async function testConnection() {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'TODO_KEYHERE') return;
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}

testConnection();
