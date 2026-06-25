/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StatusBadge } from './StatusBadge';
import { PFRFData } from '../types';
import { Search, Filter, Clock } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface RequestWithId extends PFRFData {
  id: string;
  createdAt: any;
  isDeleted?: boolean;
}

export default function LiveQueue({ onSelect }: { onSelect: (req: RequestWithId) => void }) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<RequestWithId[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!db || !profile) return;
    
    // Only staff can subscribe to the full list
    if (profile.role !== 'operator' && profile.role !== 'admin') return;
    
    // Base query
    let q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RequestWithId[];
      setRequests(data);
    }, (error) => {
      console.error("LiveQueue subscription error:", error);
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredRequests = requests.filter(req => {
    if (req.isDeleted) return false;
    const matchesSearch = req.requesterName.toLowerCase().includes(search.toLowerCase()) || 
                          req.requestNo.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || req.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Request Queue List
        </h2>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search request..."
              className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="bg-white border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="reviewing">Reviewing Request</option>
            <option value="seeking_approval">Video Captured</option>
            <option value="approved">Approved / Ready</option>
            <option value="processing">No Video Captured</option>
            <option value="denied">Rejected</option>
            <option value="closed">Closed / Archived</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="block sm:hidden divide-y divide-gray-100">
        {filteredRequests.map((req) => (
          <div key={req.id} className="p-4 hover:bg-blue-50/50 transition-colors space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded border border-blue-100">
                {req.requestNo}
              </span>
              <StatusBadge status={req.status as any} />
            </div>
            
            <div>
              <p className="text-sm font-bold text-gray-805">{req.requesterName}</p>
              <p className="text-[10px] text-gray-400 font-semibold">{req.designation || 'No Designation'}</p>
            </div>

            <div className="text-xs text-gray-600 line-clamp-2">
              <span className="font-bold">Reason:</span> {req.playbackReasons?.join(', ') || (req as any).playbackReason || 'No reason provided'}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-[10px] text-gray-400">
                {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'Just now'} at{' '}
                {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
              <button 
                onClick={() => onSelect(req)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Details
              </button>
            </div>
          </div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="px-6 py-16 text-center text-gray-400 italic text-sm">
            No requests found matching your query.
          </div>
        )}
      </div>

      {/* Desktop/Tablet Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="px-6 py-3">PFRF No.</th>
              <th className="px-6 py-3">Date Submitted</th>
              <th className="px-6 py-3">Requester</th>
              <th className="px-6 py-3">Reason</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-blue-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-xs font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-100">
                    {req.requestNo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-xs font-medium text-gray-900">
                    {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </p>
                  <p className="text-[10px] text-gray-400 tracking-tighter">
                    {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleTimeString() : ''}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-800">{req.requesterName}</p>
                  <p className="text-[10px] text-gray-500">{req.designation}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-gray-600 line-clamp-1 font-medium">
                    {req.playbackReasons?.join(', ') || (req as any).playbackReason || 'No reason provided'}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={req.status as any} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onSelect(req)}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-shadow shadow-sm"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">
                  No requests found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
