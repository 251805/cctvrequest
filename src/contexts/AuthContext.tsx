/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'guest' | 'requester' | 'operator' | 'admin';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  staffPassphrase: string | null;
  loading: boolean;
  isAuthenticating: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (username: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const HARDCODED_USERS = {
  'operator': { pass: 'cctv2026', role: 'operator' as UserRole, name: 'CCTV Operator' },
  'dojie': { pass: 'mgdh1', role: 'admin' as UserRole, name: 'Dojie (Admin)' }
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [staffPassphrase, setStaffPassphrase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Try to recover staff session first
    const saved = localStorage.getItem('pfrf_staff_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile(parsed);
      setStaffPassphrase(parsed.pass);
    }

    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // If staff session exists, use it
        if (localStorage.getItem('pfrf_staff_session')) return;

        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || 'guest@system.local',
            displayName: user.displayName || 'Guest User',
            role: user.email === 'dsp.jaroldlee@gmail.com' ? 'admin' : 'requester',
          };
          try {
            await setDoc(doc(db, 'users', user.uid), newProfile);
          } catch (e) {
            console.error("Error setting profile in Firestore:", e);
          }
          setProfile(newProfile);
        }
      } else if (!localStorage.getItem('pfrf_staff_session')) {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const loginWithGoogle = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') return;
      console.error("Authentication error:", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loginWithCredentials = async (username: string, pass: string): Promise<boolean> => {
    const userData = HARDCODED_USERS[username as keyof typeof HARDCODED_USERS];
    if (userData && userData.pass === pass) {
      const simulatedUid = `staff-${username}`;
      const newProfile: UserProfile = {
        uid: simulatedUid,
        email: `${username}@system.local`,
        displayName: userData.name,
        role: userData.role,
      };
      
      // Save to local storage to persist the "session" locally
      localStorage.setItem('pfrf_staff_session', JSON.stringify({ ...newProfile, pass }));
      
      setProfile(newProfile);
      setStaffPassphrase(pass);
      return true;
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('pfrf_staff_session');
    setStaffPassphrase(null);
    setProfile(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, staffPassphrase, loading, isAuthenticating, loginWithGoogle, loginWithCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
