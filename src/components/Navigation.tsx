/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Shield, LayoutDashboard, FilePlus, LogIn, X, KeyRound } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: any) => void }) {
  const { user, profile, loginWithGoogle, loginWithCredentials, logout, isAuthenticating } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginWithCredentials(username, password);
    if (success) {
      setShowLoginModal(false);
      setError('');
      setUsername('');
      setPassword('');
      setActiveTab('queue');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <nav className="bg-[#1e3a8a] text-white py-3 px-6 shadow-lg sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex flex-col cursor-pointer" onClick={() => setActiveTab('landing')}>
            <span className="font-black text-lg tracking-tight uppercase leading-none">PFRF</span>
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Online submission form</span>
          </div>

          <div className="flex items-center gap-1 ml-4 sm:ml-8">
            {user || profile ? (
               (profile?.role === 'operator' || profile?.role === 'admin') && (
                <button 
                  onClick={() => setActiveTab('queue')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors ${activeTab === 'queue' ? 'bg-white/10 text-white' : 'text-blue-200 hover:text-white'}`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Live Queue</span>
                  <span className="sm:hidden">Queue</span>
                </button>
               )
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {profile ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end text-right">
                <p className="text-[11px] font-bold leading-none">{profile?.displayName}</p>
                <div className="flex items-center gap-1">
                  {profile?.role === 'admin' ? <Shield className="w-3 h-3 text-yellow-400" /> : <UserIcon className="w-3 h-3 text-blue-300" />}
                  <p className="text-[9px] font-black uppercase text-blue-300 tracking-widest">{profile?.role}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Staff Login
            </button>
          )}
        </div>
      </div>

      {/* Staff Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-gray-900">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-blue-900">Staff Portal</h2>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm focus:border-blue-600 focus:outline-none"
                  placeholder=" "
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm focus:border-blue-600 focus:outline-none"
                  placeholder=" "
                />
              </div>
              
              {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
              
              <button 
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200 disabled:opacity-50"
              >
                {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
