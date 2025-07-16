import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDmqwMmH-uP4t_olP8rVGYPe2y_D4YhQNQ",
  authDomain: "opensea-c540d.firebaseapp.com",
  projectId: "opensea-c540d",
  storageBucket: "opensea-c540d.appspot.com", // ✅ CORRECTO
  messagingSenderId: "391910298410",
  appId: "1:391910298410:web:ff7f451653234c306f4453",
  measurementId: "G-PVJSH1QH6Q"
};


console.log('[Firebase] Inicializando con config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, googleProvider, facebookProvider };
