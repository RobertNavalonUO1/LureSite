import { auth, googleProvider, facebookProvider } from '@/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    setPersistence,
    updateProfile,
    browserLocalPersistence
} from 'firebase/auth';
import { sendEmailVerification } from 'firebase/auth';

// Establecer persistencia en localStorage para mantener la sesión al cerrar pestaña
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('❌ Error al establecer persistencia:', err);
});

export async function sendVerificationEmail(user) {
    return await sendEmailVerification(user);
}

export async function loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // ✅ Obtener token actualizado
    return await cred.user.getIdToken(true);
}

export async function registerWithEmail(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return await cred.user.getIdToken(true); // token fresco
}

export async function sendResetEmail(email) {
    return await sendPasswordResetEmail(auth, email);
}

export async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return await result.user.getIdToken(true);
}

export async function loginWithFacebook() {
    const result = await signInWithPopup(auth, facebookProvider);
    return await result.user.getIdToken(true);
}
