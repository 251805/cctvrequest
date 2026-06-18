/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileCheck, Clock, User, MapPin, FileText, CheckCircle2, X, Eye, Download, ShieldCheck, ChevronRight } from 'lucide-react';

interface SupervisorApprovalPortalProps {
  requestId: string;
  onBackToPortal?: () => void;
}

export default function SupervisorApprovalPortal({ requestId, onBackToPortal }: SupervisorApprovalPortalProps) {
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [supervisorNameInput, setSupervisorNameInput] = useState('Giddel Macalipay'); // Default to Giddel Macalipay as preferred
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedStatus, setCompletedStatus] = useState<'approved' | 'denied' | null>(null);

  useEffect(() => {
    async function fetchRequest() {
      try {
        const docRef = doc(db, 'requests', requestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Request ticket not found. Please verify the link address.");
        }
      } catch (err) {
        console.error("Error retrieving request info:", err);
        setError("Unable to connect to the database. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [requestId]);

  const handleApprove = async () => {
    if (!supervisorNameInput.trim()) {
      alert("Please enter supervisor name/signature line.");
      return;
    }
    setSubmitting(true);
    try {
      const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const requestRef = doc(db, 'requests', requestId);
      
      await updateDoc(requestRef, {
        status: 'approved',
        supervisorName: supervisorNameInput.trim(),
        supervisorDate: todayString,
        approvedBy: supervisorNameInput.trim(),
        updatedAt: serverTimestamp()
      });

      // Log the supervisor's dynamic approval action
      await addDoc(collection(db, 'requests', requestId, 'logs'), {
        requestId,
        operatorUid: 'supervisor_portal',
        operatorName: 'Supervisor on Duty',
        attendedBy: supervisorNameInput.trim(),
        action: 'APPROVED RELEASE',
        note: `Approved via Quick Supervisor Link on Messenger. Form cleared for footage copying.`,
        timestamp: serverTimestamp()
      });

      setCompletedStatus('approved');
      setShowApprovalModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to record approval. Please contact central operator.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a clear reason for the rejection / denial.");
      return;
    }
    setSubmitting(true);
    try {
      const todayString = new Date().toISOString().split('T')[0];
      const requestRef = doc(db, 'requests', requestId);
      
      await updateDoc(requestRef, {
        status: 'denied',
        supervisorName: supervisorNameInput.trim(),
        supervisorDate: todayString,
        operatorRemarks: rejectionReason.trim(),
        updatedAt: serverTimestamp()
      });

      // Log rejection action
      await addDoc(collection(db, 'requests', requestId, 'logs'), {
        requestId,
        operatorUid: 'supervisor_portal',
        operatorName: 'Supervisor on Duty',
        attendedBy: supervisorNameInput.trim(),
        action: 'DENIED / ARCHIVED',
        note: `Declined: "${rejectionReason.trim()}". Action performed via Quick Supervisor Link.`,
        timestamp: serverTimestamp()
      });

      setCompletedStatus('denied');
      setShowRejectionModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to archive decision. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest animate-pulse">Loading Document details...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-gray-900 uppercase tracking-wide mb-2">Review Link Invalid</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            {error || "The requested incident footage ticket could not be found."}
          </p>
          {onBackToPortal && (
            <button 
              onClick={onBackToPortal}
              className="bg-[#1e3a8a] text-white text-[10px] px-6 py-2.5 rounded-xl font-black uppercase tracking-wider"
            >
              Go to Portal Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (completedStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-gray-200 space-y-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
            completedStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              Action Status Confirmed
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
              Ticket ID: {request.ticketNo || request.id}
            </p>
          </div>
          <div className={`p-4 rounded-xl border text-xs font-semibold ${
            completedStatus === 'approved' 
              ? 'bg-emerald-50/50 text-emerald-800 border-emerald-250' 
              : 'bg-rose-50/50 text-rose-800 border-rose-250'
          }`}>
            {completedStatus === 'approved' ? (
              <p>✓ APPROVED: Footage release is officially authorized. The CCTV Operators have been notified in real time to export the video files.</p>
            ) : (
              <p>✗ REJECTED: Request has been declined and logged as archived. CCTV Operator has been notified.</p>
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-extrabold uppercase">
            Thank you, Supervisor. You may now close this browser tab.
          </p>
          {onBackToPortal && (
            <button 
              onClick={onBackToPortal}
              className="mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] px-5 py-2 rounded-xl font-bold uppercase tracking-wider"
            >
              Back to Home page
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner header inside Supervisor Quick Auth portal */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-[#1e3a8a] text-white p-6 md:p-8 flex items-center justify-between gap-6 flex-wrap md:flex-nowrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-blue-800 text-white text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                  Official Supervisor Review
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none mt-2">
                FOOTAGE RELEASE PANEL
              </h1>
              <p className="text-[11px] text-blue-200 font-bold uppercase tracking-wide">
                Pagbilao Central Command Center • Quezon Public Order Office
              </p>
            </div>
            <div className="w-16 h-16 shrink-0 bg-white/10 rounded-full flex items-center justify-center p-2.5">
              <img src="https://raw.githubusercontent.com/251805/etcfile/main/PCCLogo.png" alt="PCC" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-gray-400 uppercase">Ticket Number</span>
                <p className="text-xs font-black text-blue-900 tracking-wide font-mono uppercase">
                  {request.ticketNo || "PENDING"}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-gray-400 uppercase">Creation Date</span>
                <p className="text-xs font-bold text-gray-800">
                  {request.date || "N/A"}
                </p>
              </div>
              <div className="space-y-0.5 col-span-2">
                <span className="text-[9px] font-black text-gray-400 uppercase">Operator Remarks</span>
                <p className="text-xs font-bold text-gray-600 truncate italic">
                  {request.operatorRemarks || "No remarks logged yet."}
                </p>
              </div>
            </div>

            {/* Main Form Fields For Review */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-150 pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> 1. PFRF Request Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                <div className="flex justify-between items-start py-2 border-b border-gray-50">
                  <span className="text-gray-400 font-bold">REQUESTER NAME:</span>
                  <span className="font-extrabold text-gray-800 text-right">{request.requesterName}</span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-gray-50">
                  <span className="text-gray-400 font-bold">OFFICE / DESIGNATION:</span>
                  <span className="font-extrabold text-blue-900 text-right uppercase">{request.designation}</span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-gray-50">
                  <span className="text-gray-400 font-bold">INCIDENT TIME:</span>
                  <span className="font-extrabold text-gray-800 text-right">{request.incidentDate} at {request.incidentTime}</span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-gray-50">
                  <span className="text-gray-400 font-bold">SPECIFIC LOCATION:</span>
                  <span className="font-extrabold text-gray-800 text-right">
                    {request.location === 'Other' ? request.locationOther : request.location}
                  </span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-gray-50 col-span-1 md:col-span-2">
                  <span className="text-gray-400 font-bold">NEAREST LANDMARKS:</span>
                  <span className="font-extrabold text-gray-800 text-right">{request.landmark || 'None Provided'}</span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-gray-50 col-span-1 md:col-span-2 flex-col gap-1">
                  <span className="text-gray-400 font-bold">REASON FOR PLAYBACK:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.playbackReasons?.map((reason: string, i: number) => (
                      <span key={i} className="bg-blue-50 text-blue-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                        {reason}
                      </span>
                    ))}
                    {request.playbackReasonOther && (
                      <span className="bg-gray-100 text-gray-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                        Other: {request.playbackReasonOther}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-gray-50 col-span-1 md:col-span-2 flex-col gap-1">
                  <span className="text-gray-400 font-bold">VEHICLE/S INVOLVED:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.vehiclesInvolved?.map((veh: string, i: number) => (
                      <span key={i} className="bg-indigo-50 text-indigo-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                        {veh}
                      </span>
                    ))}
                  </div>
                  {request.vehicleDescription && (
                    <p className="text-[11px] text-gray-500 italic mt-1 font-mono">
                      Quantities/Details: {request.vehicleDescription}
                    </p>
                  )}
                </div>
                <div className="col-span-1 md:col-span-2 space-y-1 py-2">
                  <span className="text-gray-400 font-bold">COMPREHENSIVE INCIDENT DESCRIPTION:</span>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 text-gray-700 leading-relaxed font-semibold">
                    {request.incidentDescription}
                  </div>
                </div>
              </div>
            </div>

            {/* Document / Attestation Segment */}
            <div className="space-y-4 pt-4 border-t border-gray-150">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> 2. Supporting Attestation / Document Evidence
              </h3>
              
              {request.attachmentData ? (
                request.attachmentData.startsWith('data:image/') ? (
                  <div className="relative border-2 border-dashed border-gray-200 rounded-3xl p-3 bg-gray-50 flex flex-col items-center">
                    <img 
                      src={request.attachmentData} 
                      alt="Supporting Evidence File" 
                      className="max-h-60 object-contain rounded-2xl bg-white shadow-md p-1.5"
                      referrerPolicy="no-referrer"
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-[10px] px-5 py-2.5 rounded-xl font-black uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" /> Full Screen Preview
                      </button>
                      <a 
                        href={request.attachmentData} 
                        download={request.attachmentName || 'police_report'}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[10px] px-5 py-2.5 rounded-xl font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" /> Download File
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-5 bg-blue-50/40 rounded-2xl border border-blue-200 justify-between flex-wrap md:flex-nowrap shadow-xs">
                    <div className="flex items-center gap-3 md:max-w-[70%]">
                      <div className="bg-blue-600 text-white p-3 rounded-xl shrink-0">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-gray-900 uppercase">OFFICIAL DOCUMENT EVIDENCE ATTACHED</h4>
                        <p className="text-[10px] text-gray-500 font-mono truncate max-w-sm md:max-w-md mt-0.5 italic">
                          {request.attachmentName || 'attestation_report_and_supporting_credentials.pdf'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto mt-3 md:mt-0 justify-end">
                      <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" /> View Digital File
                      </button>
                      <a 
                        href={request.attachmentData} 
                        download={request.attachmentName || 'evidence_document'}
                        className="bg-blue-650 hover:bg-blue-700 text-white text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-6 bg-amber-50/45 rounded-2xl border border-amber-200 text-center space-y-1">
                  <p className="text-xs font-black text-amber-800 uppercase tracking-wide">No Supporting Document Evidence Attached</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">This request doesn't have an attachment block. Please review security guidelines carefully before proceeding.</p>
                </div>
              )}
            </div>

            {/* Action Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-6 md:p-8 rounded-3xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block font-mono">
                  DECISION BLOCK
                </span>
                <h4 className="text-base font-black text-gray-900 uppercase">
                  Do you authorize releasing this footage?
                </h4>
                <p className="text-xs text-gray-500 max-w-md">
                  Releasing video logs requires completing the physical signing cycles. Make sure you reviewed the PFRF inputs above.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto w-full md:w-auto">
                <button 
                  onClick={() => setShowRejectionModal(true)}
                  className="flex-1 md:flex-none text-center bg-white border border-red-300 hover:bg-red-50 text-red-600 text-xs px-6 py-4 rounded-xl font-black uppercase tracking-wider transition-all"
                >
                  Decline request
                </button>
                <button 
                  onClick={() => setShowApprovalModal(true)}
                  className="flex-1 md:flex-none text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-6 py-4 rounded-xl font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10"
                >
                  Approve release
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Embedded Document Viewer Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative bg-white rounded-3xl shadow-3xl flex flex-col w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-150 bg-gray-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Document Evidence / Supporting Attestation</h3>
                  <p className="text-[10px] text-gray-500 truncate max-w-md mt-0.5 font-mono">{request.attachmentName || 'attested_document.pdf'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-250 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-grow p-4 bg-gray-100 flex items-center justify-center overflow-auto">
              {request.attachmentData ? (
                request.attachmentData.startsWith('data:image/') ? (
                  <img 
                    src={request.attachmentData} 
                    alt="Supporting Evidence Preview" 
                    className="max-h-full max-w-full object-contain shadow-lg rounded-xl bg-white p-2"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <iframe 
                    src={request.attachmentData} 
                    className="w-full h-full rounded-xl bg-white border border-gray-200 shadow-inner" 
                    title="PDF Evidence Viewer"
                  />
                )
              ) : (
                <p className="text-xs text-gray-400 italic">No attachment located.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation of Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-150 space-y-6">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="bg-emerald-50 p-2.5 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-wide">Confirm Footage Release</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              By authorizing, you state that the requested footage from CCTVs is legal to release and is cleared by municipal supervisor guidelines.
            </p>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Supervisor Name / Signature Line</label>
              <input 
                type="text"
                value={supervisorNameInput}
                onChange={(e) => setSupervisorNameInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                placeholder="Type your name..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-150 text-gray-700 text-xs py-3.5 rounded-xl font-bold uppercase tracking-wider transition-all"
              >
                No, cancel
              </button>
              <button 
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-3.5 rounded-xl font-extrabold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Yes, Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation of Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-150 space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <div className="bg-red-50 p-2.5 rounded-full">
                <X className="w-6 h-6" />
              </div>
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-wide">Decline Footage Release</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Please document a specific justification for archiving this ticket with a "Denied" status. This reason will be logged and visible to the requesting party.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Supervisor Name / Signature Line</label>
                <input 
                  type="text"
                  value={supervisorNameInput}
                  onChange={(e) => setSupervisorNameInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Rejection Reason / Remarks <span className="text-red-500">*</span></label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full h-24 bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-semibold focus:bg-white focus:border-red-600 focus:outline-none"
                  placeholder="e.g. Incomplete Police report, Footage outside CCTV timestamp range..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-150 text-gray-700 text-xs py-3.5 rounded-xl font-bold uppercase tracking-wider transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-3.5 rounded-xl font-extrabold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Decline Release'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
