import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, db, listenAuth, checkRedirectLogin } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result on mount
    const handleRedirect = async () => {
      try {
        const user = await checkRedirectLogin();
        if (user) {
          // You could do extra processing here if needed
          console.log("User detected from redirect in AuthProvider");
        }
      } catch (err) {
        console.error("Error checking redirect in AuthProvider", err);
      }
    };

    handleRedirect();

    const unsubscribe = listenAuth(async (user: User | null) => {
      if (user) {
        try {
          // Sync user document with Firestore if possible
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.warn("Firestore user document sync failed:", error);
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
