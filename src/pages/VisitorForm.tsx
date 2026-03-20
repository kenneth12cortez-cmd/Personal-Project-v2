import { motion } from 'motion/react';
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { CheckCircle2, ChevronRight, School, UserCircle2, ShieldCheck } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

interface VisitorFormProps {
  user: UserProfile;
}

export default function VisitorForm({ user }: VisitorFormProps) {
  const [reason, setReason] = useState<string>('');
  const [college, setCollege] = useState<string>('');
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const reasons = ['Research', 'Study', 'Relax', 'Other'];
  const colleges = [
    'College of Engineering',
    'College of Arts and Sciences',
    'College of Business Administration',
    'College of Education',
    'College of Nursing',
    'College of Computer Studies',
    'College of Criminology',
    'College of Law',
    'Graduate School'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !college) return;

    setLoading(true);
    const path = 'logs';
    try {
      await addDoc(collection(db, path), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        reason,
        college,
        isEmployee,
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white rounded-3xl p-12 shadow-xl text-center border border-black/5"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Log Submitted!</h2>
          <p className="text-zinc-500 mb-8">Thank you for visiting the NEU Library. Have a productive session!</p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-all active:scale-95"
          >
            Submit Another Log
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-zinc-50 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Welcome to NEU Library!</h1>
        <p className="text-zinc-500 mt-2 font-medium">Please fill out your visitor log for today.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white rounded-3xl p-10 shadow-xl border border-black/5"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Reason Section */}
          <div>
            <label className="block text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              Reason for Visit
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`py-4 px-6 rounded-2xl text-sm font-semibold transition-all border-2 flex items-center justify-between ${
                    reason === r 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : 'bg-zinc-50 border-transparent text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {r}
                  {reason === r && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* College Section */}
          <div>
            <label className="block text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <School className="w-4 h-4" />
              Your College
            </label>
            <select
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full p-4 bg-zinc-50 border-2 border-transparent rounded-2xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-600 outline-none transition-all appearance-none"
              required
            >
              <option value="" disabled>Select your college</option>
              {colleges.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Employee Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <UserCircle2 className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm font-bold text-zinc-900">Employee Status</p>
                <p className="text-xs text-zinc-500">Teacher or Staff member</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEmployee(!isEmployee)}
              className={`w-12 h-6 rounded-full transition-all relative ${
                isEmployee ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                isEmployee ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !reason || !college}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Submit Visitor Log</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
