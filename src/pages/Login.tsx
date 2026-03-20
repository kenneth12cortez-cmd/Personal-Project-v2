import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, Mail, Lock, Chrome } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (!user.email?.endsWith('@neu.edu.ph')) {
        await auth.signOut();
        setError('Only @neu.edu.ph accounts are allowed.');
        return;
      }
      
      const adminEmails = ['jcesperanza@neu.edu.ph', 'lordronkennethluis.cortez@neu.edu.ph'];
      if (adminEmails.includes(user.email || '')) {
        navigate('/admin');
      } else {
        navigate('/visitor-log');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to login with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!email.endsWith('@neu.edu.ph')) {
      setError('Only @neu.edu.ph accounts are allowed.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      const adminEmails = ['jcesperanza@neu.edu.ph', 'lordronkennethluis.cortez@neu.edu.ph'];
      if (adminEmails.includes(email)) {
        navigate('/admin');
      } else {
        navigate('/visitor-log');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('User not found. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please sign in instead.');
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with blur */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center scale-110 blur-sm"
        style={{ backgroundImage: 'url("https://neu.edu.ph/main/img/mains.jfif")' }}
      />
      <div className="absolute inset-0 z-10 bg-black/40" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-full max-w-md px-8 py-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
            N
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Sign in</h1>
          <p className="text-zinc-500 mt-2">NEU Library Visitor Log System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@neu.edu.ph"
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-600 transition-all text-zinc-900"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-600 transition-all text-zinc-900"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>{isSignUp ? 'Create Account' : 'Sign in'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/95 px-4 text-zinc-400 font-bold tracking-widest">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 px-6 bg-white hover:bg-zinc-50 disabled:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95"
        >
          <Chrome className="w-5 h-5 text-emerald-600" />
          <span>Google Account</span>
        </button>

        <p className="mt-8 text-center text-xs text-zinc-400 uppercase tracking-widest font-medium">
          Authorized NEU Personnel Only
        </p>
      </motion.div>
    </div>
  );
}
