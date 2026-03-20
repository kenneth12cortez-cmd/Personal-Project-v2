import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import { handleFirestoreError, OperationType } from './utils/errorHandlers';

import Login from './pages/Login';
import VisitorForm from './pages/VisitorForm';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.email?.endsWith('@neu.edu.ph')) {
          await auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        const path = `users/${firebaseUser.uid}`;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const adminEmails = ['jcesperanza@neu.edu.ph', 'lordronkennethluis.cortez@neu.edu.ph'];
          const shouldBeAdmin = adminEmails.includes(firebaseUser.email || '');
          
          if (userDoc.exists()) {
            const existingUser = userDoc.data() as UserProfile;
            // Force admin role if they are in the list but not marked as admin in DB
            if (shouldBeAdmin && existingUser.role !== 'admin') {
              const updatedUser = { ...existingUser, role: 'admin' as const };
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...updatedUser,
                timestamp: serverTimestamp()
              }, { merge: true });
              setUser(updatedUser);
            } else {
              setUser(existingUser);
            }
          } else {
            // Default role logic
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'NEU User',
              role: shouldBeAdmin ? 'admin' : 'user',
              createdAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              timestamp: serverTimestamp()
            });
            setUser(newUser);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, path);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50">
        <Navbar user={user} />
        <Layout>
          <Routes>
            <Route 
              path="/" 
              element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/visitor-log" />) : <Login />} 
            />
            <Route 
              path="/visitor-log" 
              element={user ? <VisitorForm user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/admin" 
              element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/visitor-log" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}
