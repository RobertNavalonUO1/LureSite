import { auth, googleProvider, facebookProvider } from '@/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import { sendEmailVerification } from 'firebase/auth';

export async function sendVerificationEmail(user) {
    return await sendEmailVerification(user);
}

export async function loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return await cred.user.getIdToken();
}

export async function registerWithEmail(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await cred.user.updateProfile({ displayName: name });
    return await cred.user.getIdToken();
}

export async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    console.debug('[DEBUG] Token Google:', token);
    return token;
}

export async function loginWithFacebook() {
    const result = await signInWithPopup(auth, facebookProvider);
    const token = await result.user.getIdToken();
    console.debug('[DEBUG] Token Facebook:', token);
    return token;
}
