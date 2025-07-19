// resources/js/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDmqwMmH-uP4t_olP8rVGYPe2y_D4YhQNQ",
  authDomain: "opensea-c540d.firebaseapp.com",
  projectId: "opensea-c540d",
  storageBucket: "opensea-c540d.firebasestorage.app",
  messagingSenderId: "391910298410",
  appId: "1:391910298410:web:ff7f451653234c306f4453",
  measurementId: "G-PVJSH1QH6Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
