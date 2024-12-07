import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, database } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sellerStatus, setSellerStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSellerStatus = async (userId) => {
    const sellerRef = ref(database, `sellers/${userId}`);
    const snapshot = await get(sellerRef);
    if (snapshot.exists()) {
      setSellerStatus(snapshot.val());
    } else {
      setSellerStatus(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.email === 'admin@example.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setUser(currentUser);
        await checkSellerStatus(currentUser.uid);
      } else {
        setUser(null);
        setIsAdmin(false);
        setSellerStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    isAdmin,
    sellerStatus,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 