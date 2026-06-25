/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import PFRFForm from './components/PFRFForm';
import LiveQueue from './components/LiveQueue';
import Navigation from './components/Navigation';
import RequestDetails from './components/RequestDetails';
import SupervisorApprovalPortal from './components/SupervisorApprovalPortal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { FilePlus, KeyRound, LayoutDashboard } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'form' | 'queue' | 'landing'>('landing');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [approvalId, setApprovalId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('approve');
  });

  // Re-evaluate view when profile changes
  React.useEffect(() => {
    if (!loading) {
      if (profile?.role === 'operator' || profile?.role === 'admin') {
        setActiveTab('queue');
      } else if (activeTab === 'landing' && profile?.role === 'requester') {
        // If they just signed in as guest/requester, take them to form
        setActiveTab('form');
      }
    }
  }, [loading, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest animate-pulse">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (approvalId) {
    return (
      <SupervisorApprovalPortal 
        requestId={approvalId} 
        onBackToPortal={() => {
          const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
          window.history.replaceState({ path: newUrl }, '', newUrl);
          setApprovalId(null);
          setActiveTab('landing');
        }} 
      />
    );
  }

  const isStaff = profile?.role === 'operator' || profile?.role === 'admin';

  return (
    <div className="bg-gray-100 min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-7xl mx-auto py-10 px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              exit={{ opacity: 0, scale: 0.99 }}
            >
              <div className="mb-8 flex justify-between items-end print:hidden">
                <button 
                  onClick={() => setActiveTab('landing')}
                  className="text-[10px] font-black text-blue-600 uppercase mb-4 hover:underline flex items-center gap-1"
                >
                  ← Return Home
                </button>
              </div>
              <PFRFForm />
            </motion.div>
          ) : activeTab === 'queue' && isStaff ? (
            <motion.div
              key="queue"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              exit={{ opacity: 0, scale: 0.99 }}
            >
               <div className="mb-8">
                <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">Monitoring room Dashboard</h1>
                <p className="text-gray-500 font-medium tracking-tight">CCTV Footage request manager</p>
              </div>
              <LiveQueue onSelect={setSelectedRequest} />
            </motion.div>
          ) : (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-12"
            >
              <div className="space-y-4">
                <div className="w-28 h-28 mx-auto flex items-center justify-center">
                  <img src="https://raw.githubusercontent.com/251805/etcfile/main/PCCLogo.png" alt="PCC Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                </div>
                <h1 className="text-5xl font-black text-blue-900 uppercase tracking-tighter leading-none">
                  Pagbilao Command Center <br /> CCTV Request Portal
                </h1>
                <p className="text-lg text-gray-500 font-medium">Bayan ng Pagbilao CCTV Footage Request Management System</p>
              </div>

              <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
                <button 
                  onClick={() => setActiveTab('form')}
                  className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center space-y-4 hover:border-blue-400 hover:shadow-blue-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FilePlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-gray-900 uppercase text-sm">Create a Request</h3>
                  <p className="text-xs text-gray-400 font-medium">Submit a new request for incident investigation or footage review. No account required.</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase mt-4">Click to proceed →</p>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedRequest && (
          <RequestDetails 
            request={selectedRequest} 
            onClose={() => setSelectedRequest(null)} 
          />
        )}
      </AnimatePresence>
      
      <footer className="py-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">
            Municipality of Pagbilao, Quezon • Public Safety & Order
          </p>
          <div className="flex justify-center gap-8 text-[9px] font-bold text-gray-300 uppercase italic">
            <span>this is a beta version</span>
            <span>this is a beta version</span>
            <span>this is a beta version</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
