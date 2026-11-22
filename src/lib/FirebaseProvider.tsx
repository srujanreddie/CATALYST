import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider, isAuthorizedAdminEmail } from './firebase';

interface FirebaseContextValue {
  user: User | null;
  isAuthReady: boolean;
  isAdmin: boolean;
  authBusy: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  user: null,
  isAuthReady: false,
  isAdmin: false,
  authBusy: false,
  authError: null,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError(null);
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups and try again.');
      } else {
        setAuthError('Unable to complete Google sign-in right now. Please try again.');
      }
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await signOut(auth);
    } catch {
      setAuthError('Unable to sign out right now. Please refresh and try again.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const isAdmin = isAuthorizedAdminEmail(user?.email, user?.emailVerified);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isAuthReady,
        isAdmin,
        authBusy,
        authError,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}
