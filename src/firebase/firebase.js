import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDeVfwiJ3s3TzBTMSWkd4nw3bKimQsPdwI",
  authDomain: "it305webproject-e4cc2.firebaseapp.com",
  projectId: "it305webproject-e4cc2",
  storageBucket: "it305webproject-e4cc2.firebasestorage.app",
  messagingSenderId: "109202298501",
  appId: "1:109202298501:web:016d80cce2182183e8bbec",
  measurementId: "G-VQ604ND8TC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const sendVerificationEmail = sendEmailVerification;
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;