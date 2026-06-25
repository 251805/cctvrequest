/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Header from './Header';
import { PFRFData } from '../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { Send, CheckCircle2, Loader2, FileText, Camera, Upload, Trash2, X, Printer, HelpCircle, ZoomIn, ZoomOut } from 'lucide-react';

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
  "Other Entity (not listed) — if selected, please fill out the incident description field to provide more details."
];

const BARANGAY_MAPS: Record<string, string> = {
  'Alupaye': 'https://maps.app.goo.gl/JcsTGD7WUugf1yZx8',
  'Añato': 'https://maps.app.goo.gl/QvAeSQrGofj1BfDm8',
  'Anato': 'https://maps.app.goo.gl/QvAeSQrGofj1BfDm8',
  'Antipolo': 'https://maps.app.goo.gl/AmLV8gYvZ92wyjHj9',
  'Bagumbungan Iba.': 'https://maps.app.goo.gl/9hsYkGAVZR6zEMVaA',
  'Bagumbungan Ila.': 'https://maps.app.goo.gl/SbmgtCQVFTGaKva18',
  'Bantigue': 'https://maps.app.goo.gl/pK52cyYcLhrpsv6u7',
  'Bigo': 'https://maps.app.goo.gl/Jd5C27DLZu2ndV9L8',
  'Binahaan': 'https://maps.app.goo.gl/v2yFtur6FG1gu8Mj8',
  'Bukal': 'https://maps.app.goo.gl/Vn9RSXHxA9jJc53g9',
  'Castillo (Poblacion)': 'https://maps.app.goo.gl/hUeHMwMHxT8zuDgm6',
  'Daungan (Poblacion)': 'https://maps.app.goo.gl/J1R9PZc4WWCBUTRU7',
  'Del Carmen (Poblacion)': 'https://maps.app.goo.gl/rMfSpwXZVAFmKHAk7',
  'Ikirin': 'https://maps.app.goo.gl/f4Sb1Evhh8nWYBQH7',
  'Malicboy Kan.': 'https://maps.app.goo.gl/5jcVhdKdZvsi7sVc8',
  'Malicboy Sil.': 'https://maps.app.goo.gl/h4YfQKjvNJ7iAXuS6',
  'Mapagong': 'https://maps.app.goo.gl/bd5k7qf6pmFRo4C18',
  'Mayhay': 'https://maps.app.goo.gl/zcVQrdFGxb8iaavt5',
  'Palsabangon Iba.': 'https://maps.app.goo.gl/9STN9ivfNZDbgMCaA',
  'Palsabangon Ila.': 'https://maps.app.goo.gl/pHqEKgVigLYcFdBN7',
  'Parang (Poblacion)': 'https://maps.app.goo.gl/3XZrJFghutiXoGNXA',
  'Pinagbayanan': 'https://maps.app.goo.gl/meQvYW1Hb5sN6Mp1A',
  'Polo Iba.': 'https://maps.app.goo.gl/kyq5M6H1fXEDH8x46',
  'Polo Ila.': 'https://maps.app.goo.gl/kQWMxDWHUkTyAMRZA',
  'Sta. Catalina (Poblacion)': 'https://maps.app.goo.gl/Z3KfHpY4WsWab25RA',
  'Talipan': 'https://maps.app.goo.gl/cfTeaSd4ij4iJTBs5',
  'Tambak (Poblacion)': 'https://maps.app.goo.gl/pDVU6Hz1NhRLD4YcA',
  'Tukalan': 'https://maps.app.goo.gl/ZNw6H2fbtUJxiCeTA',
};

const getBarangayMapUrl = (locationName: string): string | null => {
  if (!locationName) return null;
  const nameWithoutPrefix = locationName.replace(/^Barangay\s+/, '').trim();
  return BARANGAY_MAPS[nameWithoutPrefix] || null;
};

const Field = React.memo(({ label, name, value, type = "text", required = false, onChange }: { label: string, name: keyof PFRFData, value: string, type?: string, required?: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="flex flex-col space-y-1">
    <label className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="border-b-2 border-gray-300 text-[13px] px-1 py-1 focus:border-blue-600 focus:outline-none bg-transparent transition-colors font-medium hover:border-gray-400"
    />
  </div>
));

const CheckboxGroup = React.memo(({ options, selected, name, onChange }: { options: string[], selected: string[], name: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {options.map(option => (
      <label key={option} className="flex items-start gap-2 cursor-pointer group">
        <input 
          type="checkbox"
          name={name}
          value={option}
          checked={selected.includes(option)}
          onChange={onChange}
          className="mt-1 accent-blue-600"
        />
        <span className="text-[12px] font-medium text-gray-700 group-hover:text-blue-900 transition-colors uppercase tracking-tight">{option}</span>
      </label>
    ))}
  </div>
));

const TextArea = React.memo(({ label, name, value, placeholder, minHeight = "150px", required = false, onChange }: { label?: string, name: string, value: string, placeholder?: string, minHeight?: string, required?: boolean, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="font-bold text-[10px] text-gray-500 uppercase tracking-wider block mb-2">{label} {required && <span className="text-red-500">*</span>}</label>}
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full p-4 bg-gray-50 rounded-xl border-2 border-gray-300 focus:border-blue-600 focus:bg-white focus:outline-none text-[13px] transition-colors hover:border-gray-400"
      style={{ minHeight }}
    />
  </div>
));

export default function PFRFForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [attachmentMethod, setAttachmentMethod] = useState<'upload' | 'camera' | null>(null);
  const [attachments, setAttachments] = useState<{ name: string; data: string; type: 'image' | 'file' }[]>([]);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [showPinGuide, setShowPinGuide] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper to compress images client-side to keep Firestore document size small
  const compressImageIfNeeded = (dataUrl: string, maxDim: number = 800, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl.startsWith('data:image/')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFormError(null);
      (Array.from(files) as File[]).forEach(file => {
        const isImage = file.type.startsWith('image/');
        const limitSize = isImage ? 15 * 1024 * 1024 : 450 * 1024; // 15MB for images (since we compress them), 450KB for documents
        if (file.size > limitSize) {
          if (isImage) {
            setFormError(`Image "${file.name}" is too large. Please use a smaller image.`);
          } else {
            setFormError(`Document/file "${file.name}" is too large (${(file.size / 1024).toFixed(0)} KB). Since attachments are saved with the form, non-image files must be under 450 KB. Please upload smaller files or host them online and share a link.`);
          }
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          const fileType = isImage ? 'image' : 'file';
          const rawData = reader.result as string;
          try {
            const finalData = fileType === 'image' ? await compressImageIfNeeded(rawData) : rawData;
            setAttachments(prev => {
              const currentTotalSize = prev.reduce((acc, att) => acc + att.data.length, 0);
              const newTotalSize = currentTotalSize + finalData.length;
              // Limit total character size to 800,000 (~600KB base64 content) to fit in Firestore 1MB limits
              if (newTotalSize > 800000) {
                setFormError(`Cannot add "${file.name}". The combined size of all attachments would exceed the database storage limit of 1MB. Please remove some existing attachments first.`);
                return prev;
              }
              return [
                ...prev,
                {
                  name: file.name,
                  data: finalData,
                  type: fileType,
                }
              ];
            });
          } catch (compressErr) {
            // Fallback to raw data if compression fails
            setAttachments(prev => {
              const currentTotalSize = prev.reduce((acc, att) => acc + att.data.length, 0);
              const newTotalSize = currentTotalSize + rawData.length;
              if (newTotalSize > 800000) {
                setFormError(`Cannot add "${file.name}". The combined size of all attachments would exceed the database storage limit of 1MB. Please remove some existing attachments first.`);
                return prev;
              }
              return [
                ...prev,
                {
                  name: file.name,
                  data: rawData,
                  type: fileType,
                }
              ];
            });
          }
        };
        reader.readAsDataURL(file);
      });
      // Clear value to allow re-upload
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFormError(null);
      (Array.from(files) as File[]).forEach(file => {
        const isImage = file.type.startsWith('image/');
        const limitSize = isImage ? 15 * 1024 * 1024 : 450 * 1024; // 15MB for images (since we compress them), 450KB for documents
        if (file.size > limitSize) {
          if (isImage) {
            setFormError(`Image "${file.name}" is too large. Please use a smaller image.`);
          } else {
            setFormError(`Document/file "${file.name}" is too large (${(file.size / 1024).toFixed(0)} KB). Since attachments are saved with the form, non-image files must be under 450 KB. Please upload smaller files or host them online and share a link.`);
          }
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          const fileType = isImage ? 'image' : 'file';
          const rawData = reader.result as string;
          try {
            const finalData = fileType === 'image' ? await compressImageIfNeeded(rawData) : rawData;
            setAttachments(prev => {
              const currentTotalSize = prev.reduce((acc, att) => acc + att.data.length, 0);
              const newTotalSize = currentTotalSize + finalData.length;
              if (newTotalSize > 800000) {
                setFormError(`Cannot add "${file.name}". The combined size of all attachments would exceed the database storage limit of 1MB. Please remove some existing attachments first.`);
                return prev;
              }
              return [
                ...prev,
                {
                  name: file.name,
                  data: finalData,
                  type: fileType,
                }
              ];
            });
          } catch (compressErr) {
            // Fallback to raw data
            setAttachments(prev => {
              const currentTotalSize = prev.reduce((acc, att) => acc + att.data.length, 0);
              const newTotalSize = currentTotalSize + rawData.length;
              if (newTotalSize > 800000) {
                setFormError(`Cannot add "${file.name}". The combined size of all attachments would exceed the database storage limit of 1MB. Please remove some existing attachments first.`);
                return prev;
              }
              return [
                ...prev,
                {
                  name: file.name,
                  data: rawData,
                  type: fileType,
                }
              ];
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Stop camera on unmount
  React.useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (isCameraLoading) return;
    setCameraError(null);
    setAttachmentMethod('camera');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported in this browser or environment (unsecured/HTTP context or sandboxed iframe restriction). Please upload your document instead using the 'Upload File' option.");
      return;
    }

    setIsCameraLoading(true);
    try {
      let stream;
      try {
        // Attempt 1: Try back/environment camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        });
      } catch (err1) {
        console.warn("Environment (rear) camera failed or unsupported, trying user (front) camera...", err1);
        try {
          // Attempt 2: Try front/user camera
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }
          });
        } catch (err2) {
          console.warn("User camera request failed, trying simple generic video...", err2);
          try {
            // Attempt 3: Try general true video without facingMode constraint
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: true 
            });
          } catch (err3) {
            console.warn("Generic video failed, trying minimal resolution constraint...", err3);
            // Attempt 4: Minimal video requirements to satisfy restrictive/older hardware
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: { width: { ideal: 320 }, height: { ideal: 240 } }
            });
          }
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera access failed all fallbacks:", err);
      let errorMessage = `Camera error: ${err.message || err.name || 'Unknown'}`;
      const lowerMessage = String(err.message || '').toLowerCase();
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Camera access was denied. Please allow camera permissions in your browser/device settings, or open the app in a new tab if you are viewing it inside a sandboxed iframe.";
      } else if (
        err.name === 'NotFoundError' || 
        err.name === 'DevicesNotFoundError' || 
        lowerMessage.includes('object can not be found') ||
        lowerMessage.includes('not found') ||
        lowerMessage.includes('requested device')
      ) {
        errorMessage = "No hardware camera found, or the camera is occupied by another app/tab, or browser sandbox security is preventing direct iframe hardware access. \n\nTip: You can easily satisfy the attachment rule by clicking 'Upload File' and picking any photo, PDF, or screenshot from your device!";
      }
      setCameraError(errorMessage);
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setAttachmentMethod(null);
    setVideoAspectRatio(null);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      compressImageIfNeeded(photoDataUrl).then(compressedDataUrl => {
        setAttachments(prev => {
          const currentTotalSize = prev.reduce((acc, att) => acc + att.data.length, 0);
          if (currentTotalSize + compressedDataUrl.length > 800000) {
            setFormError("Cannot add photo. The combined size of all attachments would exceed the database storage limit of 1MB. Please remove some existing attachments first.");
            return prev;
          }
          return [
            ...prev,
            {
              name: `camera_capture_${Date.now()}.jpg`,
              data: compressedDataUrl,
              type: 'image',
            }
          ];
        });
      }).catch(() => {
        setAttachments(prev => {
          const currentTotalSize = prev.reduce((acc, att) => acc + att.data.length, 0);
          if (currentTotalSize + photoDataUrl.length > 800000) {
            setFormError("Cannot add photo. The combined size of all attachments would exceed the database storage limit of 1MB. Please remove some existing attachments first.");
            return prev;
          }
          return [
            ...prev,
            {
              name: `camera_capture_${Date.now()}.jpg`,
              data: photoDataUrl,
              type: 'image',
            }
          ];
        });
      });
      stopCamera();
    }
  };

  const [formData, setFormData] = useState<PFRFData>({
    requesterName: '',
    date: new Date().toISOString().split('T')[0],
    designation: '',
    requestNo: `PFRF-${Date.now().toString().slice(-6)}`,
    playbackReasons: [],
    playbackReasonOther: '',
    incidentDate: '',
    incidentTime: '',
    location: '',
    locationOther: '',
    landmark: '',
    vehiclesInvolved: [],
    vehicleOther: '',
    vehicleDescription: '',
    incidentDescription: '',
    status: 'pending',
    operatorRemarks: '',
    attendedBy: '',
    attendedDate: '',
    supervisorName: '',
    supervisorDate: '',
    approvedBy: '',
  });

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      const fieldName = name as 'playbackReasons' | 'vehiclesInvolved';
      
      setFormData(prev => {
        const currentValues = prev[fieldName] as string[];
        if (checkbox.checked) {
          return { ...prev, [name]: [...currentValues, value] };
        } else {
          return { ...prev, [name]: currentValues.filter(v => v !== value) };
        }
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-open Google Map for selected Barangay to help user pin landmark
      if (name === 'location' && value) {
        const mapUrl = getBarangayMapUrl(value);
        if (mapUrl) {
          window.open(mapUrl, '_blank');
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (formData.playbackReasons.length === 0) {
      setFormError("Please select at least one Reason for Playback.");
      return;
    }

    if (formData.vehiclesInvolved.length === 0) {
      setFormError("Please select at least one Vehicle Involved.");
      return;
    }

    if (!formData.incidentDescription?.trim()) {
      setFormError("Please provide an Incident Description.");
      return;
    }

    if (!formData.location) {
      setFormError("Please select a Location.");
      return;
    }

    if (formData.location === 'Other location') {
      if (!formData.locationOther?.trim()) {
        setFormError("Please specify the location in the 'Specify Other Location' field.");
        return;
      }
    } else {
      if (!formData.landmark?.trim()) {
        setFormError("Please provide landmark information with coordinates. For help, click the 'How to get coordinates?' button.");
        return;
      }
    }

    if (attachments.length === 0) {
      setFormError("Please provide at least one Supporting Document (either upload a file/document or take a device camera photo).");
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        requesterUid: user?.uid || 'guest-public',
        hasAttachment: attachments.length > 0,
        attachmentName: attachments[0]?.name || null,
        attachmentData: attachments[0]?.data || null,
        attachments: attachments,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Measure the actual raw bytes of the payload to guarantee Firestore size limits (1,048,576 bytes) are met
      const measurementPayload = {
        ...submissionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const serializedData = JSON.stringify(measurementPayload);
      const payloadByteSize = new Blob([serializedData]).size;

      if (payloadByteSize > 1000000) {
        setFormError(`Submission failed because the total form data size (${(payloadByteSize / (1024 * 1024)).toFixed(2)} MB) exceeds the database's 1 MB storage limit. Please remove one or more attachments, or compress your files before trying again.`);
        setIsSubmitting(false);
        return;
      }

      const docRef = await addDoc(collection(db, 'requests'), submissionData);
      setSubmittedId(docRef.id);
    } catch (error) {
      console.error("Submission failed:", error);
      setFormError("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/pfrf1.docx');
      if (!response.ok) {
        throw new Error('Could not download PFRF template.');
      }
      const arrayBuffer = await response.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      const requestDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

      // Build text payload using exact placeholders from user's template
      const payload = {
        'NAME OF REQUESTER:': formData.requesterName || 'N/A',
        'DATE_REQUESTED:': requestDate,
        'DESIGNATION:': formData.designation || 'N/A',
        'REQUEST NO:': formData.requestNo || 'N/A',
        'REASON OF PLAYBACK:': Array.isArray(formData.playbackReasons) ? formData.playbackReasons.join(', ') : formData.playbackReasons || 'N/A',
        'DATE OF INCIDENT:': formData.incidentDate || 'N/A',
        'TIME OF INCIDENT:': formData.incidentTime || 'N/A',
        'LOCATION:': formData.location === 'Other' || formData.location === 'Other location' ? formData.locationOther : formData.location || 'N/A',
        'LANDMARK (if applicable):': formData.landmark || 'N/A',
        'VEHICLE/S INVOLVED (if applicable):': Array.isArray(formData.vehiclesInvolved) ? formData.vehiclesInvolved.join(', ') : formData.vehiclesInvolved || 'N/A',
      'Additional Info:': formData.vehicleDescription || '',
        'INCIDENT DESCRIPTION': formData.incidentDescription || '',
        ' FOLLOW UP ACTION / REMARKS (to be fill-out by CCTV operator)': formData.operatorRemarks || '',
        'ATTENDED BY:': formData.attendedBy || 'N/A',
        'DATE_ATTENDED:': formData.attendedDate || '',
        'SUPERVISOR NAME/SIGNATURE:': formData.supervisorName || '',
        'DATE_APPROVED:': formData.supervisorDate || '',
      };

      doc.render(payload);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `${formData.requestNo}.docx`);
    } catch (error: any) {
      console.error('Export error:', error);
      alert('Error generating document: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      requesterName: '',
      date: new Date().toISOString().split('T')[0],
      designation: '',
      requestNo: `PFRF-${Date.now().toString().slice(-6)}`,
      playbackReasons: [],
      playbackReasonOther: '',
      incidentDate: '',
      incidentTime: '',
      location: '',
      locationOther: '',
      landmark: '',
      vehiclesInvolved: [],
      vehicleOther: '',
      vehicleDescription: '',
      incidentDescription: '',
      status: 'pending',
      operatorRemarks: '',
      attendedBy: '',
      attendedDate: '',
      supervisorName: '',
      supervisorDate: '',
      approvedBy: '',
    });
    setAttachments([]);
    setAttachmentMethod(null);
    setSubmittedId(null);
  };

  if (submittedId) {
    return (
      <div className="max-w-[850px] mx-auto bg-white p-10 md:p-20 shadow-2xl rounded-3xl text-center flex flex-col items-center justify-center space-y-6 print:shadow-none print:p-0">
        <div className="print:hidden flex flex-col items-center space-y-6">
          <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-green-500" />
          <h2 className="text-2xl md:text-3xl font-black text-blue-900 uppercase">Submission Successful</h2>
          <p className="text-gray-600 font-medium px-4">Your request has been documented and queued for processing by Pagbilao Command Center.</p>
        </div>
        
        <div className="bg-blue-50 p-6 md:p-8 rounded-2xl border border-blue-100 w-full max-w-sm shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-12 h-12" />
          </div>
          <p className="text-[10px] md:text-[11px] uppercase font-black text-blue-400 mb-1 tracking-widest text-left">Tracking Reference</p>
          <p className="font-mono text-xl md:text-2xl text-blue-900 font-black text-left">{formData.requestNo}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md pt-4 print:hidden">
          <button 
            onClick={handleExportDocx}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Print Copy
              </>
            )}
          </button>
          <button 
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200"
          >
            New Request
          </button>
        </div>

        <div className="hidden print:block w-full text-left">
           <Header />
           <div className="mt-12 space-y-8">
             <div className="grid grid-cols-2 gap-8 border-b pb-8">
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase">Requester</p>
                 <p className="font-bold text-lg">{formData.requesterName}</p>
                 <p className="text-xs text-gray-500 uppercase">{formData.designation}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase">Request Number</p>
                 <p className="font-mono font-bold text-lg text-blue-900">{formData.requestNo}</p>
                 <p className="text-xs text-gray-500 uppercase">Submitted on {new Date().toLocaleDateString()}</p>
               </div>
             </div>
             <div>
               <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Incident Details</p>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-4 rounded-xl">
                   <p className="text-[9px] font-bold text-gray-400 uppercase">Location</p>
                   <p className="font-bold text-sm">{formData.location === 'Other location' ? formData.locationOther : formData.location}</p>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-xl">
                   <p className="text-[9px] font-bold text-gray-400 uppercase">Landmark</p>
                   <p className="font-bold text-sm">{formData.landmark}</p>
                 </div>
               </div>
               <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                 <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Reason for Playback</p>
                 <p className="text-sm font-medium">{formData.playbackReasons.join(', ')} {formData.playbackReasonOther && `(${formData.playbackReasonOther})`}</p>
               </div>
               <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                 <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Vehicles involved</p>
                 <p className="text-sm font-medium">{formData.vehiclesInvolved.join(', ') || 'None'}</p>
                 {formData.vehicleDescription && (
                   <p className="mt-2 text-sm text-gray-600 italic">Details: {formData.vehicleDescription}</p>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[850px] mx-auto bg-white p-6 md:p-12 shadow-2xl border border-gray-100 min-h-screen md:min-h-[1100px] flex flex-col font-sans text-black relative print:shadow-none print:border-none print:p-0 rounded-3xl md:rounded-none">
      <Header />

      <div className="space-y-8 flex-grow mt-8">
        {/* Top Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label="NAME OF REQUESTER" name="requesterName" value={formData.requesterName} onChange={handleChange} required />
            <Field label="DATE" name="date" value={formData.date} type="date" onChange={handleChange} required />
            <Field label="DESIGNATION" name="designation" value={formData.designation} onChange={handleChange} />
            <Field label="REQUEST NO (AUTO)" name="requestNo" value={formData.requestNo} onChange={handleChange} />
          </div>

        {/* INCIDENT INFORMATION */}
        <div>
          <div className="bg-[#1e3a8a] text-white px-4 py-2 font-bold text-sm uppercase tracking-[0.2em] mb-6 shadow-sm">
            INCIDENT INFORMATION
          </div>
          <div className="space-y-8">
            {/* Reasons for Playback */}
            <div className="space-y-3">
              <label className="font-bold text-[10px] text-gray-500 uppercase tracking-wider block">REASON FOR PLAYBACK (Select all that apply) <span className="text-red-500">*</span></label>
              <CheckboxGroup 
                options={REASON_OPTIONS} 
                selected={formData.playbackReasons} 
                name="playbackReasons" 
                onChange={handleChange} 
              />
              {formData.playbackReasons.includes('Others') && (
                <div className="mt-2 pl-6">
                  <input
                    type="text"
                    name="playbackReasonOther"
                    value={formData.playbackReasonOther}
                    onChange={handleChange}
                    placeholder="Please specify other reason..."
                    className="w-full border-b-2 border-gray-300 hover:border-gray-400 text-[12px] py-1 focus:border-blue-600 focus:outline-none bg-transparent font-medium transition-colors"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-4 border-t border-gray-100">
              <Field label="DATE OF INCIDENT" name="incidentDate" value={formData.incidentDate} type="date" onChange={handleChange} required />
              <Field label="TIME OF INCIDENT" name="incidentTime" value={formData.incidentTime} type="time" onChange={handleChange} required />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">LOCATION <span className="text-red-500">*</span></label>
                <select 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="border-b-2 border-gray-300 text-[13px] px-1 py-2 focus:border-blue-600 focus:outline-none bg-white transition-colors font-medium hover:border-gray-400 rounded-none appearance-none"
                >
                  <option value="">Select Barangay...</option>
                  {LOCATION_OPTIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                {formData.location && getBarangayMapUrl(formData.location) && (
                  <div className="mt-2 text-[10px] text-blue-700 bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex flex-col gap-1 select-none">
                    <span className="font-extrabold uppercase tracking-wider text-[8px] text-blue-500">📍 Google Map Reference Loaded</span>
                    <p className="leading-relaxed text-gray-650 font-medium">A Google Maps helper tab was triggered for <strong>{formData.location.replace(/^Barangay\s+/, '')}</strong>. Use it to find your landmark or copy coordinates.</p>
                    <a 
                      href={getBarangayMapUrl(formData.location) || undefined} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-lg transition-colors w-max"
                    >
                      Reopen Google Maps for {formData.location.replace(/^Barangay\s+/, '')}
                    </a>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-1 relative">
                {formData.location === 'Other location' ? (
                  <Field label="SPECIFY OTHER LOCATION (Use Landmark)" name="locationOther" value={formData.locationOther || ''} onChange={handleChange} required />
                ) : (
                  <div className="flex flex-col space-y-1">
                     <div className="flex justify-between items-center bg-[#f8fafc] px-2 py-1.5 rounded-lg border border-gray-100">
                       <label className="font-bold text-[10px] text-gray-650 uppercase tracking-wider">
                         LANDMARK <span className="text-red-500">*</span>
                       </label>
                       <button
                         type="button"
                         onClick={() => setShowPinGuide(true)}
                         className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] px-2.5 py-1 rounded-md border border-blue-200 transition-colors font-black uppercase tracking-wider"
                       >
                         <HelpCircle className="w-3 h-3" />
                         How to get coordinates?
                       </button>
                     </div>
                     <div className="flex gap-2">
                       <input
                         type="text"
                         name="landmark"
                         value={formData.landmark}
                         onChange={handleChange}
                         required={formData.location !== 'Other location' && formData.location !== ''}
                         placeholder=" "
                         className="flex-grow border-b-2 border-gray-300 text-[13px] px-1 py-1 focus:border-blue-600 focus:outline-none bg-transparent transition-colors font-medium hover:border-gray-400"
                       />
                     </div>
                     <p className="text-[10px] text-gray-400 font-medium leading-tight">
                       This field is required. Click the button above to learn how to find and pin landmark coordinates.
                     </p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicles Involved */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <label className="font-bold text-[10px] text-gray-500 uppercase tracking-wider block">VEHICLE/S INVOLVED (Select all that apply) <span className="text-red-500">*</span></label>
              <CheckboxGroup 
                options={VEHICLE_OPTIONS} 
                selected={formData.vehiclesInvolved} 
                name="vehiclesInvolved" 
                onChange={handleChange} 
              />
            </div>
          </div>
        </div>

        {/* INCIDENT DESCRIPTION */}
        <div>
          <div className="bg-[#1e3a8a] text-white px-4 py-2 font-bold text-sm uppercase tracking-[0.2em] mb-4 shadow-sm">
            INCIDENT DESCRIPTION <span className="text-red-500 font-bold">*</span>
          </div>
          <TextArea
            name="incidentDescription"
            value={formData.incidentDescription}
            onChange={handleChange}
            required={true}
            placeholder="Please provide a detailed description of the incident, covering what happened, why it occurred, when it took place, where it happened, and how it unfolded."
            minHeight="150px"
          />
        </div>

        {/* ATTACHMENTS SECTION */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <div className="bg-gray-800 text-white px-4 py-2 font-bold text-[10px] uppercase tracking-widest mb-4">
            Supporting Documents (Required) <span className="text-red-500">*</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => {
                setAttachmentMethod('upload');
                fileInputRef.current?.click();
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${attachmentMethod === 'upload' || isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
            >
              <Upload className={`w-8 h-8 ${attachmentMethod === 'upload' || isDragOver ? 'text-blue-500' : 'text-gray-300'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {isDragOver ? "Drop File Here" : "Upload File up to 450 KB"}
              </span>
            </button>
            <button 
              type="button"
              onClick={() => attachmentMethod === 'camera' ? stopCamera() : startCamera()}
              className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${attachmentMethod === 'camera' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
            >
              <Camera className={`w-8 h-8 ${attachmentMethod === 'camera' ? 'text-blue-500' : 'text-gray-300'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Take Photo</span>
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />

          {/* Active Attachments Grid */}
          {attachments.length > 0 && (
            <div className="mt-6">
              <h4 className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Added Attachments ({attachments.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group rounded-2xl border border-gray-150 bg-white p-3.5 flex items-center justify-between shadow-xs hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {att.type === 'image' ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                          <img src={att.data} alt="Attachment thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate font-mono">{att.name}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{att.type === 'image' ? 'Image Capture' : 'Uploaded Document'}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="ml-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 p-2 rounded-xl transition-all flex-shrink-0 border border-red-100/30"
                      title="Remove Attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attachmentMethod === 'camera' && (
            <div 
              className="mt-4 relative bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center w-full max-w-md mx-auto transition-all duration-300"
              style={{ 
                aspectRatio: videoAspectRatio ? `${videoAspectRatio}` : '4/3',
                maxHeight: '60vh'
              }}
            >
              {isCameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 text-center p-6 space-y-4">
                  <div className="bg-red-500/20 p-3 rounded-full text-red-500 border border-red-500/30">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-red-400">Camera Access Failed</h4>
                    <p className="text-[11px] text-gray-300 max-w-sm leading-relaxed px-4 whitespace-pre-line">{cameraError}</p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button 
                      type="button" 
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl transition-all"
                    >
                      Try Again
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setAttachmentMethod(null);
                        setCameraError(null);
                      }}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl transition-all border border-gray-700"
                    >
                      Close Info
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      if (video.videoWidth && video.videoHeight) {
                        setVideoAspectRatio(video.videoWidth / video.videoHeight);
                      }
                    }}
                    className="w-full h-full object-cover" 
                  />
                  {!isCameraLoading && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-20">
                      <button 
                        type="button" 
                        onClick={takePhoto}
                        className="bg-white text-blue-900 p-4 rounded-full shadow-lg hover:scale-110 transition-transform animate-pulse"
                        title="Capture Photo"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                      <button 
                        type="button" 
                        onClick={stopCamera}
                        className="bg-red-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
                        title="Close Camera"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {attachmentMethod === 'upload' && (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/50'}`}
            >
              <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Drag and Drop Supporting Documents here</p>
              <button type="button" className="text-[10px] font-black text-blue-600 uppercase hover:underline mt-2">
                {isDragOver ? "Drop your files here" : "Or Choose From Device"}
              </button>
              <p className="text-[9px] text-gray-400 uppercase mt-1">Accepts images, PDF, and Word documents up to 10MB</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex flex-col md:flex-row justify-end items-center gap-4 border-t border-gray-100 pt-8 px-4 md:px-0">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200 disabled:opacity-50 group"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>

      {showPinGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#f8fafc]">
              <div className="flex items-center gap-2 text-[#1e3a8a]">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">How to Pin & Copy Landmarks</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowPinGuide(false);
                  setIsImageZoomed(false);
                }}
                className="text-gray-400 hover:text-gray-650 hover:bg-gray-100 p-2 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-3 text-xs leading-relaxed text-gray-650">
                <p className="font-bold text-gray-800">Please trace and document real-time coordinates of your incident location:</p>
                
                <ol className="list-decimal list-inside space-y-2.5 font-semibold text-gray-700">
                  <li>
                    <span className="font-extrabold text-[#1e3a8a] uppercase text-[10px]">Step 1:</span> Identify the exact location or nearest physical landmark of the incident on Google Maps.
                  </li>
                  <li>
                    <span className="font-extrabold text-[#1e3a8a] uppercase text-[10px]">Step 2:</span> Click share on the upper part of the screen (see image).
                  </li>
                  <li>
                    <span className="font-extrabold text-[#1e3a8a] uppercase text-[10px]">Step 3:</span> Copy the link and paste it on the Landmark field on the online form (see image).
                  </li>
                </ol>
              </div>

              {/* Guide Image with zoom indicator */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5" /> Click anywhere on the image below to zoom & view full size
                  </span>
                </div>
                <div 
                  onClick={() => setIsImageZoomed(true)}
                  className="bg-gray-50 border border-gray-150 rounded-2xl overflow-hidden p-2 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative"
                >
                  <img 
                    src="https://raw.githubusercontent.com/251805/etcfile/main/gmappin.png" 
                    alt="Google Maps Pin Coordinate Tutorial" 
                    className="w-full h-auto rounded-xl object-contain shadow-inner" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-2 bottom-2 bg-black/60 backdrop-blur-xs text-white text-[10px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider">Click to view actual high-res details</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-[#f8fafc] flex justify-end">
              <button 
                type="button"
                onClick={() => {
                  setShowPinGuide(false);
                  setIsImageZoomed(false);
                }}
                className="bg-[#1e3a8a] hover:bg-blue-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-blue-100"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full screen zoom lightbox */}
      {showPinGuide && isImageZoomed && (
        <div 
          onClick={() => setIsImageZoomed(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
            <span className="bg-black/50 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 select-none">
              Click anywhere to close full screen
            </span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageZoomed(false);
              }}
              className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-5xl w-full max-h-[85vh] p-2 flex items-center justify-center overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img 
              src="https://raw.githubusercontent.com/251805/etcfile/main/gmappin.png" 
              alt="Google Maps Pin Coordinate Tutorial Expanded" 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl select-none" 
              referrerPolicy="no-referrer"
              onClick={() => setIsImageZoomed(false)}
            />
          </div>
        </div>
      )}

      {/* Form Verification Error Modal */}
      {formError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-50 text-red-500 p-4 rounded-full border border-red-100">
              <X className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800">Form Verification</h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">{formError}</p>
            </div>
            <button 
              type="button"
              onClick={() => setFormError(null)}
              className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              Okay, I'll Fix It
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
