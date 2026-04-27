import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.languageCode = 'tr';

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google login success:", result.user);
    return result.user;
  } catch (error: any) {
    console.error("Google popup login error:", {
      code: error.code,
      message: error.message,
      domain: window.location.hostname
    });

    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request" ||
      error.code === "auth/unauthorized-domain"
    ) {
      console.log("Attempting sign-in with redirect...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw error;
  }
};

export const checkRedirectLogin = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("Redirect login success:", result.user);
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error("Google redirect login error:", {
      code: error.code,
      message: error.message,
      domain: window.location.hostname
    });
    return null;
  }
};

export const logout = () => signOut(auth);

export const listenAuth = (callback: any) => {
  return onAuthStateChanged(auth, callback);
};

// End of file cleanup

