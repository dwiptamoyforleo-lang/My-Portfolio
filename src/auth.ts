import {
  AppleAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { auth, authPersistenceReady, firebaseConfigReady } from './firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

const isMobile = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);

export function subscribeToAuthState(
  callback: (user: User | null) => void,
  onError: (error: unknown) => void,
) {
  if (!auth || !firebaseConfigReady) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, callback, onError);
}

export async function finishRedirectAuthentication() {
  if (!auth || !firebaseConfigReady) return null;
  await authPersistenceReady;
  return getRedirectResult(auth);
}

export async function signInWithGoogle() {
  if (!auth || !firebaseConfigReady) {
    throw new Error('Firebase authentication is not configured.');
  }

  await authPersistenceReady;

  if (isMobile()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  return signInWithPopup(auth, googleProvider);
}

export async function signInWithApple() {
  if (!auth || !firebaseConfigReady) {
    throw new Error('Firebase authentication is not configured.');
  }

  await authPersistenceReady;

  if (isMobile()) {
    await signInWithRedirect(auth, appleProvider);
    return null;
  }

  return signInWithPopup(auth, appleProvider);
}

export async function logout() {
  if (!auth) return;
  await signOut(auth);
}
