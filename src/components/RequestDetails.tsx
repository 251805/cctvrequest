/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from './StatusBadge';
import { X, Save, MessageSquare, History, FileCheck, AlertTriangle, Camera, Printer, MapPin, Edit, Trash2, CheckCircle2, Eye } from 'lucide-react';

const REASON_OPTIONS = [
  "For investigation of reported incident",
  "Verification of crime or unlawful activity",
  "Road/traffic accident review",
  "Identification of suspect/s or person/s involved",
  "Verification of entry/exit of vehicle/s or individual/s",
  "Security concern reported by resident/business",
  "Support to official police blotter or complaint",
  "Monitoring of disturbance / altercation in public area",
  "For evidence in legal or administrative case",
  "Others"
];

const VEHICLE_OPTIONS = [
  "Sedan",
  "Hatchback",
  "SUV (Sports Utility Vehicle)",
  "Pickup Truck",
  "MPV / AUV (Multi-purpose vehicle / Asian Utility Vehicle)",
  "Standard motorcycles",
  "Scooters / Underbones",
  "Big bikes",
  "Tricycle – motorcycle with sidecar",
  "Jeepney",
  "UV Express / Vans",
  "Bus",
  "E-jeep / E-trike",
  "Delivery trucks – small elf trucks, 10-wheeler cargo trucks.",
  "Construction vehicles – dump trucks, cement mixers.",
  "Service vehicles – police cars, fire trucks, ambulances.",
  "Agricultural – farm vehicle, tractors.",
  "Other motorized vehicles / multiple vehicles",
  "Other Entity (not listed) — if selected, please fill out the description field to provide more details."
];

const LOCATION_OPTIONS = [
  "Barangay Añato",
  "Barangay Alupaye",
  "Barangay Antipolo",
  "Barangay Bagumbungan Iba.",
  "Barangay Bagumbungan Ila.",
  "Barangay Bantigue",
  "Barangay Bigo",
  "Barangay Binahaan",
  "Barangay Bukal",
  "Barangay Castillo (Poblacion)",
  "Barangay Daungan (Poblacion)",
  "Barangay Del Carmen (Poblacion)",
  "Barangay Ikirin",
  "Barangay Malicboy Kan.",
  "Barangay Malicboy Sil.",
  "Barangay Mapagong",
  "Barangay Mayhay",
  "Barangay Palsabangon Iba.",
  "Barangay Palsabangon Ila.",
  "Barangay Parang (Poblacion)",
  "Barangay Pinagbayanan",
  "Barangay Polo Iba.",
  "Barangay Polo Ila.",
  "Barangay Sta. Catalina (Poblacion)",
  "Barangay Talipan",
  "Barangay Tambak (Poblacion)",
  "Barangay Tukalan",
  "Other location"
];

export default function RequestDetails({ request, onClose }: { request: any, onClose: () => void }) {
  const { user, profile, staffPassphrase } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isOperator = profile?.role === 'operator';

  // Toggle edit/view mode for Admin
  const [isEditing, setIsEditing] = useState(false);
  
  // Form/detail states
  const [status, setStatus] = useState(request.status || 'pending');
  const [remarks, setRemarks] = useState(request.operatorRemarks || '');
  const [requesterName, setRequesterName] = useState(request.requesterName || '');
  const [designation, setDesignation] = useState(request.designation || '');
  const [incidentDate, setIncidentDate] = useState(request.incidentDate || '');
  const [incidentTime, setIncidentTime] = useState(request.incidentTime || '');
  const [location, setLocation] = useState(request.location || '');
  const [locationOther, setLocationOther] = useState(request.locationOther || '');
  const [landmark, setLandmark] = useState(request.landmark || '');
  const [vehiclesInvolved, setVehiclesInvolved] = useState<string[]>(request.vehiclesInvolved || []);
  const [vehicleDescription, setVehicleDescription] = useState(request.vehicleDescription || '');
  const [incidentDescription, setIncidentDescription] = useState(request.incidentDescription || '');
  
  // Sign-off / Review fields
  const [attendedBy, setAttendedBy] = useState(request.attendedBy || '');
  const [attendedDate, setAttendedDate] = useState(request.attendedDate || '');
  const [supervisorName, setSupervisorName] = useState(request.supervisorName || '');
  const [supervisorDate, setSupervisorDate] = useState(request.supervisorDate || '');
  const [approvedBy, setApprovedBy] = useState(request.approvedBy || '');
  
  // Playback Reasons state for editing
  const [playbackReasons, setPlaybackReasons] = useState<string[]>(request.playbackReasons || []);
  const [playbackReasonOther, setPlaybackReasonOther] = useState(request.playbackReasonOther || '');

  // Log traces & tracking
  const [logs, setLogs] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [suggestedStatus, setSuggestedStatus] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'requests', request.id, 'logs'),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Logs subscription error:", err));
  }, [request.id]);

  const togglePlaybackReason = (option: string) => {
    setPlaybackReasons(prev => 
      prev.includes(option) ? prev.filter(r => r !== option) : [...prev, option]
    );
  };

  const toggleVehicleInvolved = (option: string) => {
    setVehiclesInvolved(prev => 
      prev.includes(option) ? prev.filter(v => v !== option) : [...prev, option]
    );
  };

  const executeSave = async (statusOverride?: string) => {
    const finalStatus = statusOverride || status;
    setSaving(true);
    try {
      const requestRef = doc(db, 'requests', request.id);
      
      // Collect payload
      const updatedFields: any = {
        status: finalStatus,
        operatorRemarks: remarks,
        attendedBy,
        attendedDate,
        supervisorName,
        supervisorDate,
        approvedBy,
        updatedAt: serverTimestamp(),
      };

      if (staffPassphrase) {
        updatedFields.staffCode = staffPassphrase;
      }

      // If user is Admin, pass full modified fields
      if (isAdmin) {
        updatedFields.requesterName = requesterName;
        updatedFields.designation = designation;
        updatedFields.incidentDate = incidentDate;
        updatedFields.incidentTime = incidentTime;
        updatedFields.location = location;
        updatedFields.locationOther = locationOther;
        updatedFields.landmark = landmark;
        updatedFields.vehiclesInvolved = vehiclesInvolved;
        updatedFields.vehicleDescription = vehicleDescription;
        updatedFields.incidentDescription = incidentDescription;
        updatedFields.playbackReasons = playbackReasons;
        updatedFields.playbackReasonOther = playbackReasonOther;
      }

      await updateDoc(requestRef, updatedFields);

      // Log status changes or note additions
      const isStatusChanged = finalStatus !== request.status;
      const wasAdminSave = isAdmin && isEditing;
      let logAction = 'Update Notes';
      
      if (isStatusChanged) {
        const STATUS_HUMAN_LABELS: Record<string, string> = {
          pending: 'Pending Review',
          reviewing: 'Reviewing Request',
          seeking_approval: 'Video Captured',
          approved: 'Approved',
          processing: 'No Video Captured',
          closed: 'Closed / Archived',
          denied: 'Rejected'
        };
        const statusLabel = STATUS_HUMAN_LABELS[finalStatus] || finalStatus.toUpperCase().replace(/_/g, ' ');
        logAction = `Status progressed to "${statusLabel}"`;
      } else if (wasAdminSave) {
        logAction = 'Request values modified by Admin';
      }

      if (newNote.trim() || isStatusChanged || wasAdminSave) {
        await addDoc(collection(db, 'requests', request.id, 'logs'), {
          requestId: request.id,
          operatorUid: user?.uid || profile?.uid || 'system',
          operatorName: profile?.displayName || 'Authorized User',
          attendedBy: attendedBy || '',
          action: logAction,
          note: newNote.trim() || 'Form details updated and synchronized with the system.',
          timestamp: serverTimestamp(),
          ...(staffPassphrase ? { staffCode: staffPassphrase } : {}),
        });
      }

      setNewNote('');
      setIsEditing(false);
      setShowSaveConfirmModal(false);
      alert("Successfully updated and synchronized with database!");
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update request. Make sure you entered valid values.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = () => {
    // Determine if status matches original but notes/remarks have changed
    const isStatusSame = status === request.status;
    const isNewNoteAdded = !!newNote.trim();
    const isRemarksEdited = remarks !== (request.operatorRemarks || '');
    
    let statusSuggestion: string | null = null;
    const lowerRemarks = (remarks.toLowerCase() + ' ' + newNote.toLowerCase());
    
    if (isStatusSame) {
      if (status === 'pending' && (isRemarksEdited || isNewNoteAdded)) {
        statusSuggestion = 'reviewing'; // Suggest advancing to Reviewing Request
      } else if (status === 'reviewing' && (lowerRemarks.includes('found') || lowerRemarks.includes('video') || lowerRemarks.includes('captured') || lowerRemarks.includes('exist') || lowerRemarks.includes('timestamp') || lowerRemarks.includes('capture'))) {
        statusSuggestion = 'seeking_approval'; // Suggest seeking approval
      }
    }
    
    setSuggestedStatus(statusSuggestion);
    setShowSaveConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this footage request from database? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const requestRef = doc(db, 'requests', request.id);

      // If unauthenticated staff session (Dojie credentials), soft update first to grant delete access
      if (staffPassphrase) {
        await updateDoc(requestRef, {
          isDeleted: true,
          staffCode: staffPassphrase
        });
      }

      await deleteDoc(requestRef);
      alert("Request has been deleted successfully!");
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete request. Check database rules.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl my-8 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Block */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-100">{request.requestNo}</span>
            <h2 className="text-xl font-black text-gray-900 uppercase">Review Request Details</h2>
            <StatusBadge status={status} />
          </div>

          <div className="flex items-center gap-2">
            {/* Show Print */}
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-[10px] font-black text-gray-500 uppercase rounded-xl hover:bg-gray-150 hover:border-gray-300 transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Form
            </button>

            {/* Toggle Edit Mode for Admin */}
            {isAdmin && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-3.5 py-2 text-[10px] uppercase font-black rounded-xl transition-all shadow-xs border ${
                  isEditing 
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' 
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                {isEditing ? 'Cancel Editing' : 'Modify Request'}
              </button>
            )}

            {/* Delete Request for Admin */}
            {isAdmin && (
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-[10px] font-black uppercase transition-all shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}

            {/* Close Button */}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/CENTER 2 COLS: The Form Representation */}
          <div className="lg:col-span-2 space-y-8 print:col-span-3">
            
            {/* 1. Request Header representation */}
            <div className="border border-gray-200 rounded-2xl p-5 md:p-6 bg-[#fafafa] space-y-4">
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Office Authority</label>
                  <p className="text-xs font-extrabold text-[#111827] uppercase leading-tight tracking-tight">Pagbilao Command Center</p>
                </div>
                <div className="text-right">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Reference Code</label>
                  <p className="text-xs font-mono font-black text-blue-900 uppercase leading-tight">{request.requestNo}</p>
                </div>
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Name of Requester</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={requesterName} 
                      onChange={(e) => setRequesterName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-800 uppercase">{requesterName}</p>
                  )}
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Designation / Role</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={designation} 
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-600 uppercase">{designation || 'None specified'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. INCIDENT & PLAYBACK DETAILS */}
            <div className="border border-gray-200 rounded-2xl p-5 md:p-6 bg-white space-y-6">
              <div className="bg-[#1e3a8a] text-white px-3.5 py-1.5 font-bold text-[10px] uppercase tracking-[0.2em] rounded">
                Playback Reasons & Incident Frame
              </div>

              {/* Reason checkboxes - editable if Admin is editing */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Playback Intention / Reasons</label>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {REASON_OPTIONS.map(opt => (
                      <label key={opt} className="flex items-start gap-2 cursor-pointer font-bold uppercase text-gray-700">
                        <input 
                          type="checkbox"
                          checked={playbackReasons.includes(opt)}
                          onChange={() => togglePlaybackReason(opt)}
                          className="mt-1 accent-blue-600"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                    {playbackReasons.includes('Others') && (
                      <div className="col-span-2 pl-6 mt-1">
                        <input 
                          type="text" 
                          value={playbackReasonOther} 
                          onChange={(e) => setPlaybackReasonOther(e.target.value)}
                          placeholder="Provide other reason..."
                          className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-700 font-semibold bg-blue-50/50 p-4 rounded-xl border border-blue-100 list-disc uppercase leading-relaxed">
                    {playbackReasons.join(', ') || request.playbackReason || 'No playback reasons recorded.'}
                    {playbackReasonOther && ` - ${playbackReasonOther}`}
                  </div>
                )}
              </div>

              {/* Incident Date, Time, Location & Landmark */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-150">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Date of Incident</label>
                  {isEditing ? (
                    <input 
                      type="date" 
                      value={incidentDate} 
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-800">{incidentDate}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Time of Incident</label>
                  {isEditing ? (
                    <input 
                      type="time" 
                      value={incidentTime} 
                      onChange={(e) => setIncidentTime(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-800">{incidentTime}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Barangay Location</label>
                  {isEditing ? (
                    <select 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
                    >
                      <option value="">Select Barangay...</option>
                      {LOCATION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-bold text-gray-800">{location}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    {location === 'Other location' ? 'Specified Location' : 'Landmark Coordinates'}
                  </label>
                  {isEditing ? (
                    location === 'Other location' ? (
                      <input 
                        type="text" 
                        value={locationOther} 
                        onChange={(e) => setLocationOther(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold focus:border-blue-600"
                      />
                    ) : (
                      <input 
                        type="text" 
                        value={landmark} 
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold focus:border-blue-600"
                      />
                    )
                  ) : (
                    <p className="text-sm font-bold text-gray-800 leading-tight">
                      {location === 'Other location' ? locationOther : landmark}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. INCIDENT DESCRIPTION */}
            <div className="border border-gray-200 rounded-2xl p-5 md:p-6 bg-white space-y-4">
              <div className="bg-[#1e3a8a] text-white px-3.5 py-1.5 font-bold text-[10px] uppercase tracking-[0.2em] rounded flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Incident Details & Description
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">What Happened Reference</label>
                {isEditing ? (
                  <textarea 
                    value={incidentDescription} 
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none h-40"
                  />
                ) : (
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-150 font-medium whitespace-pre-line tracking-tight">
                    {incidentDescription || "No written description provided."}
                  </p>
                )}
              </div>
            </div>

            {/* 4. VEHICLES INVOLVED */}
            <div className="border border-gray-200 rounded-2xl p-5 md:p-6 bg-white space-y-4">
              <div className="bg-[#1e3a8a] text-white px-3.5 py-1.5 font-bold text-[10px] uppercase tracking-[0.2em] rounded">
                Vehicles Involved Information
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {VEHICLE_OPTIONS.map(opt => (
                      <label key={opt} className="flex items-start gap-2 cursor-pointer font-bold uppercase text-gray-700">
                        <input 
                          type="checkbox"
                          checked={vehiclesInvolved.includes(opt)}
                          onChange={() => toggleVehicleInvolved(opt)}
                          className="mt-1 accent-blue-600"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div className="pt-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Specific Vehicle Quantities & Plates</label>
                    <textarea 
                      value={vehicleDescription}
                      onChange={(e) => setVehicleDescription(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 h-24"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {vehiclesInvolved && vehiclesInvolved.length > 0 ? (
                      vehiclesInvolved.map((v: string) => (
                        <span key={v} className="bg-[#fafafa] px-2.5 py-1 rounded-md border border-gray-200 text-[10px] font-extrabold text-gray-700 uppercase">{v}</span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No types specified</span>
                    )}
                  </div>
                  {vehicleDescription && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 leading-relaxed font-semibold italic">
                      Details: {vehicleDescription}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. ATTACHMENTS VIEW CONTAINER */}
            {(request.hasAttachment || request.attachmentData) && (
              <div className="border border-gray-200 rounded-2xl p-5 md:p-6 bg-white space-y-4 print:hidden">
                <div className="bg-gray-800 text-white px-3.5 py-1.5 font-bold text-[9px] uppercase tracking-[0.2em] rounded flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Supporting Attestation / Document Evidence
                </div>

                {request.attachmentData ? (
                  request.attachmentData.startsWith('data:image/') ? (
                    <div className="relative group overflow-hidden rounded-xl border border-gray-250 max-h-80 flex items-center justify-center bg-[#fafafa]">
                      <img 
                        src={request.attachmentData} 
                        alt="Supporting attachment file" 
                        className="max-h-80 object-contain hover:scale-[1.02] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <button 
                          onClick={() => setIsPreviewOpen(true)}
                          className="bg-[#1e3a8a] hover:bg-blue-700 text-white text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-colors shadow-lg flex items-center gap-1.5 animate-pulse"
                        >
                          <Eye className="w-3 h-3" /> View Image
                        </button>
                        <a 
                          href={request.attachmentData} 
                          download={request.attachmentName || 'pcc_footage_request_attachment.jpg'}
                          className="bg-black/70 hover:bg-black/90 text-white text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-colors shadow-lg"
                        >
                          Download Image File
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-blue-50/40 rounded-xl border border-blue-200 justify-between shadow-xs flex-wrap md:flex-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2.5 rounded-xl">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Document Attachment Loaded</p>
                          <p className="text-xs text-gray-700 font-bold font-mono truncate max-w-sm mt-0.5">{request.attachmentName || 'attested_document.pdf'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end">
                        <button 
                          onClick={() => setIsPreviewOpen(true)}
                          className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-wider transition-colors shadow-md shadow-blue-100 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Document
                        </button>
                        <a 
                          href={request.attachmentData} 
                          download={request.attachmentName || 'document'}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-wider transition-colors shadow-md shadow-blue-100"
                        >
                          Download Document
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-gray-500 font-medium italic">Attachment reported but binary data is empty.</p>
                )}
              </div>
            )}

            {/* FOLLOW UP ACTION / REMARKS Display Section */}
            <div className="border border-gray-200 rounded-2xl p-5 md:p-6 bg-[#f9fafb] space-y-4 print:block">
              <div className="bg-[#1e3a8a] text-white px-3.5 py-1.5 font-bold text-[10px] uppercase tracking-[0.1em] rounded flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> FOLLOW UP ACTION / REMARKS (to be fill-out by CCTV operator)
              </div>
              
              {/* Remarks Text Box */}
              <div className="p-4 bg-white rounded-xl border border-gray-150 min-h-[80px]">
                {remarks ? (
                  <p className="text-xs text-gray-750 font-bold whitespace-pre-wrap leading-relaxed uppercase">
                    {remarks}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No follow up action or remarks entered yet.</p>
                )}
              </div>

              {/* Attended & Supervisor Sign-off Lines */}
              <div className="pt-4 border-t border-gray-200 space-y-4 text-xs font-semibold uppercase tracking-tight text-gray-800">
                
                {/* Attended By line representation */}
                <div className="flex flex-wrap items-center justify-between gap-4 leading-loose">
                  <div className="flex-grow flex items-baseline gap-2">
                    <span className="text-gray-500 font-extrabold shrink-0 text-[10px]">ATTENDED BY:</span>
                    <span className="border-b border-gray-400 flex-grow px-2 font-black text-blue-900 min-w-[200px] text-center pb-0.5">
                      {attendedBy || <span className="text-gray-300">____________________________________________</span>}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className="text-gray-500 font-extrabold text-[10px]">DATE:</span>
                    <span className="border-b border-gray-400 px-4 font-black text-gray-900 pb-0.5 text-center min-w-[120px]">
                      {attendedDate || <span className="text-gray-300">________________________________</span>}
                    </span>
                  </div>
                </div>

                {/* Supervisor Line representation */}
                <div className="flex flex-wrap items-center justify-between gap-4 leading-loose pt-2">
                  <div className="flex-grow flex items-baseline gap-2">
                    <span className="text-gray-500 font-extrabold shrink-0 text-[10px]">SUPERVISOR NAME/SIGNATURE:</span>
                    <span className="border-b border-gray-400 flex-grow px-2 font-black text-green-950 min-w-[200px] text-center pb-0.5">
                      {supervisorName || <span className="text-gray-300">_____________________________</span>}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className="text-gray-500 font-extrabold text-[10px]">DATE:</span>
                    <span className="border-b border-gray-400 px-4 font-black text-gray-900 pb-0.5 text-center min-w-[120px]">
                      {supervisorDate || <span className="text-gray-300">________________________________</span>}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COL: Status, Shift Log, Workflow Notes, Save Actions */}
          <div className="space-y-6 lg:border-l lg:border-gray-150 lg:pl-8 print:hidden">
            
            {/* Operator/Admin Workflow Block */}
            <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                <MessageSquare className="w-4.5 h-4.5 text-blue-600" /> CCTV Operator Panel
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Action Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-white border-2 border-gray-100 p-3 rounded-xl text-xs font-black focus:border-blue-600 focus:outline-none uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="reviewing">Reviewing Request</option>
                    <option value="seeking_approval">Video Captured</option>
                    <option value="approved">Approved</option>
                    <option value="processing">No Video Captured</option>
                    <option value="denied">Rejected</option>
                    <option value="closed">Closed / Archived</option>
                  </select>
                </div>

                {/* Dynamically display Sub-meaning to avoid UI clutter */}
                <div className="bg-blue-50/40 border border-blue-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[8px] font-black uppercase text-blue-800 tracking-wider block">Current Phase Guide</span>
                  <p className="text-[11px] font-semibold text-gray-600 leading-normal">
                    {status === 'pending' && "✓ Check if the request documents are complete (filled-out PFRF form, police report, or letter of request). If complete, proceed to pick up the ticket and check whether any footage was captured."}
                    {status === 'reviewing' && "✓ Proceeding with physically searching and reviewing the CCTV footage at the incident date/time to determine if the event was captured."}
                    {status === 'seeking_approval' && "✓ Video Captured: Update the police that video footage has been captured. Seek official digital authorization from the Supervisor on Duty to release a copy of the clips."}
                    {status === 'approved' && "✓ Supervisor Approved: Clear to release the copy of the video to the requesting party via email/media along with the details, and archive the ticket."}
                    {status === 'processing' && "✓ No Video Captured: Update the police that no video footage was captured. Add operator notes to this ticket explaining the reason for no footage, and archive."}
                    {status === 'denied' && "✓ Supervisor Rejected: Clear denial recorded. Add specific reason details to operator remarks or log notes, and archive the ticket."}
                    {status === 'closed' && "✓ Closed / Archived: Ticket cycle has been completed and fully archived in the system database."}
                  </p>
                </div>

                {/* Supervisor Approval Link Automation sharing block */}
                {status === 'seeking_approval' && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold uppercase text-[10px] text-indigo-700 tracking-wider">Approval Automation Link</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Messenger Ready</span>
                    </div>
                    <div className="bg-indigo-50/20 border border-indigo-100 p-3.5 rounded-xl space-y-2.5">
                      <p className="text-[10px] text-gray-500 font-bold leading-normal">
                        Instead of taking screenshots manually, copy this automated review message and paste it directly into your Messenger chat with the supervisor.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const base = window.location.protocol + "//" + window.location.host;
                          const approvalLink = `${base}/?approve=${request.id}`;
                          const messageText = `🚨 *CCTV FOOTAGE RELEASE FOR REVIEW* 🚨\n\n📌 *Ticket ID:* ${request.ticketNo || request.id}\n👤 *Requester:* ${request.requesterName}\n🗺️ *Incident Spot:* ${request.location === 'Other' ? request.locationOther : request.location}\n🕒 *Date/Time:* ${request.incidentDate} at ${request.incidentTime}\n📝 *Reasons:* ${request.playbackReasons ? request.playbackReasons.join(', ') : 'CCTV footage view'}\n\n👉 *Click here to review details & approve/deny digitally:* ${approvalLink}`;
                          
                          navigator.clipboard.writeText(messageText);
                          alert("Awesome! Copied to clipboard. Now go to Messenger and click Paste (Ctrl+V) to send the direct live-approval link to the supervisor.");
                        }}
                        className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Copy Messenger Share Code
                      </button>
                    </div>
                  </div>
                )}

                

                {/* 1. Footage Reviewed By (Operator) section moved here */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <span className="font-extrabold uppercase text-[10px] text-blue-600 tracking-wider block">1. Footage Reviewed By</span>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Attended By (Name)</label>
                    <input 
                      type="text"
                      value={attendedBy}
                      onChange={(e) => setAttendedBy(e.target.value)}
                      placeholder="Name of operator..."
                      className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Review Date</label>
                    <input 
                      type="date"
                      value={attendedDate}
                      onChange={(e) => setAttendedDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Supervisor Sign-off with Dropdown for Giddel Macalipay */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <span className="font-extrabold uppercase text-[10px] text-green-700 tracking-wider block">2. Supervisor on Duty</span>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Supervisor Name / Signature</label>
                    <select
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Supervisor...</option>
                      <option value="Giddel Macalipay">Giddel Macalipay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Date signed</label>
                    <input 
                      type="date"
                      value={supervisorDate}
                      onChange={(e) => setSupervisorDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">On going log notes</label>
                  <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Describe specific changes or handover comments, time stamps, CCTV captures"
                    className="w-full h-20 bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </section>


            <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">FINAL REMARKS BY CCTV Operator</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter your final remarks, this will reflect on  FOLLOW UP ACTION / REMARKS (to be fill-out by CCTV operator) field"
                    className="w-full h-24 bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

            {/* Save Actions Button */}
            <button 
              onClick={handleUpdate}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2.5 bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-750 transition-all shadow-md disabled:opacity-50"
            >
              {saving ? 'Synchronizing Archive...' : (
                <>
                  <Save className="w-4 h-4" />
                  Save Form & Logs
                </>
              )}
            </button>

            {/* Shift logs timeline */}
            <section className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                <History className="w-4.5 h-4.5 text-gray-500" /> Administrative Logs
              </h3>
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {logs.length > 0 ? (
                  logs.map(log => (
                    <div key={log.id} className="bg-white p-3 rounded-xl text-xs border border-gray-150 space-y-1 shadow-2xs">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-extrabold text-blue-900 uppercase tracking-tight text-wrap">
                          {log.operatorName || 'Officer'}{log.attendedBy ? ` (${log.attendedBy})` : (request.attendedBy ? ` (${request.attendedBy})` : '')}
                        </span>
                        <span className="text-gray-400 font-bold">{log.timestamp?.toDate().toLocaleString() || 'Just now'}</span>
                      </div>
                      <p className="text-[#1e3a8a] font-bold text-[9px] uppercase tracking-wider">{log.action}</p>
                      {log.note && <p className="text-gray-600 font-medium tracking-tight mt-0.5">{log.note}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">No audit logs documented yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Modern High-Fidelity Modal Overlay for Evidence & Image Viewer */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300">
          <div className="relative bg-white rounded-2xl shadow-3xl flex flex-col w-full max-w-6xl h-[90vh] overflow-hidden border border-gray-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-150 bg-gray-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Document Evidence / Supporting Attestation</h3>
                  <p className="text-[10px] text-gray-500 truncate max-w-md mt-0.5 font-mono">{request.attachmentName || 'attested_document.pdf'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={request.attachmentData} 
                  download={request.attachmentName || 'evidence_document'}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-md shadow-blue-100"
                >
                  Download This File
                </a>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Dynamic Display */}
            <div className="flex-grow p-4 min-h-0 bg-gray-100 flex items-center justify-center overflow-auto">
              {request.attachmentData ? (
                request.attachmentData.startsWith('data:image/') ? (
                  <div className="relative flex items-center justify-center h-full w-full">
                    <img 
                      src={request.attachmentData} 
                      alt="Supporting Evidence Preview" 
                      className="max-h-full max-w-full object-contain shadow-md rounded-xl bg-white p-2"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : request.attachmentData.startsWith('data:application/pdf') || request.attachmentData.includes('application/pdf') ? (
                  <iframe 
                    src={request.attachmentData} 
                    className="w-full h-full rounded-xl bg-white border border-gray-200 shadow-inner" 
                    title="PDF Evidence Viewer"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-1.5">No Inline Preview Available</h4>
                    <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                      This specific file ({request.attachmentName || 'attachment'}) belongs to a format that modern web browsers cannot render directly inside a sandboxed frame dashboard.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <a 
                        href={request.attachmentData} 
                        download={request.attachmentName || 'evidence_document'}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-5 py-2.5 rounded-xl font-black uppercase tracking-wider transition-colors shadow-lg shadow-blue-100"
                      >
                        Download file to view locally
                      </a>
                      <button 
                        onClick={() => setIsPreviewOpen(false)}
                        className="bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] px-5 py-2.5 rounded-xl font-black uppercase tracking-wider transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-xs text-gray-400 italic font-medium">No valid attachment data located for this request.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Operator Pre-Save Confirmation Dialog */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-150 space-y-6">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="bg-blue-50 p-2.5 rounded-full">
                <FileCheck className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-wider">Confirm Action & Progression</h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Changes Summary</span>
                <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 space-y-2 text-xs text-gray-700">
                  <p className="flex justify-between">
                    <span className="font-bold text-gray-400">Current Saved Status:</span>
                    <span className="font-extrabold uppercase text-blue-900">{request.status.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-bold text-gray-400">Selected Dropdown Status:</span>
                    <span className="font-extrabold uppercase text-indigo-900">{status.replace(/_/g, ' ')}</span>
                  </p>
                  {remarks !== (request.operatorRemarks || '') && (
                    <p className="text-[11px] text-gray-600">
                      📝 <span className="font-bold">Final Remarks</span> were edited.
                    </p>
                  )}
                  {newNote.trim() && (
                    <p className="text-[11px] text-gray-600">
                      💬 <span className="font-bold">New Log Note:</span> "{newNote.trim()}"
                    </p>
                  )}
                </div>
              </div>

              {suggestedStatus && (
                <div className="bg-[#eff6ff] border border-blue-200 p-4 rounded-xl space-y-2 text-xs">
                  <p className="font-extrabold text-blue-950 uppercase tracking-tight flex items-center gap-1">
                    💡 Smart Status Progression Advised
                  </p>
                  <p className="text-gray-600 leading-relaxed font-bold">
                    Since you have added a comment or update to this ticket, it is recommended to progress the status to:
                    <span className="ml-1 inline-block bg-[#1e3a8a] text-white px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wide">
                      {suggestedStatus === 'reviewing' ? 'Reviewing Request' : 'Video Captured'}
                    </span>
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus(suggestedStatus);
                        executeSave(suggestedStatus);
                      }}
                      className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-[10px] px-3.5 py-1.5 rounded-lg font-black uppercase tracking-wider transition-colors shadow-xs"
                    >
                      Progress and Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestedStatus(null)}
                      className="bg-white hover:bg-gray-100 text-gray-600 text-[10px] px-3 py-1.5 rounded-lg border border-gray-200 font-bold uppercase transition-colors"
                    >
                      Ignore Recommendation
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-gray-400 block">Or Select/Re-validate Status:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pending', label: 'Pending Review' },
                    { id: 'reviewing', label: 'Reviewing Request' },
                    { id: 'seeking_approval', label: 'Video Captured' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'processing', label: 'No Video Captured' },
                    { id: 'closed', label: 'Closed / Archived.' },
                    { id: 'denied', label: 'Rejected' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatus(st.id)}
                      className={`text-[10px] font-bold p-2 rounded-lg text-left border uppercase tracking-wider transition-colors truncate ${
                        status === st.id 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white hover:bg-gray-50 text-gray-650 border-gray-200'
                      }`}
                    >
                      {status === st.id ? '● ' : ''}{st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowSaveConfirmModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-150 text-gray-700 text-xs py-3.5 rounded-xl font-bold uppercase tracking-wider transition-all"
              >
                No, cancel
              </button>
              <button 
                onClick={() => executeSave()}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-650 text-white text-xs py-3.5 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Yes, Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
