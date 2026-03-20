import { motion } from 'motion/react';
import { LogOut, User, Shield, LayoutGrid, FileText } from 'lucide-react';
import { auth } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const isAdmin = user?.role === 'admin';
  const isAdminPage = location.pathname === '/admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
          N
        </div>
        <span className="font-semibold text-zinc-900 tracking-tight">NEU Library</span>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded border border-zinc-200">
              <button
                onClick={() => navigate('/visitor-log')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${
                  !isAdminPage 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Form
              </button>
              <button
                onClick={() => navigate('/admin')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${
                  isAdminPage 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Admin
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full">
            {isAdmin ? (
              <Shield className="w-4 h-4 text-emerald-600" />
            ) : (
              <User className="w-4 h-4 text-zinc-500" />
            )}
            <span className="text-sm font-medium text-zinc-700 hidden sm:inline">{user.displayName}</span>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}
    </nav>
  );
}
