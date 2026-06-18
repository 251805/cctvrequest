/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';

interface MapPickerProps {
  onSelect: (coords: { lat: number; lng: number }) => void;
  onClose: () => void;
  initialCoords?: { lat: number; lng: number };
}

declare global {
  interface Window {
    L?: any;
  }
}

let leafletLoadPromise: Promise<any> | null = null;

function loadLeaflet() {
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    // Load styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

export default function MapPicker({ onSelect, onClose, initialCoords }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialCoords || { lat: 13.9145, lng: 121.6888 } // Pagbilao coordinates
  );

  useEffect(() => {
    let isMounted = true;

    loadLeaflet()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;
        setLoading(false);

        // Avoid double initialization
        if (mapInstanceRef.current) return;

        // Initialize leaflet map
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([coords.lat, coords.lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Custom beautiful blue marker with bounce and shadow matching application theme
        const customIcon = L.divIcon({
          html: `<div class="flex items-center justify-center">
            <div class="relative -top-5">
              <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/40 rounded-full blur-[1px]"></div>
            </div>
          </div>`,
          className: 'custom-map-marker',
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        });

        // Add marker
        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);
        markerInstanceRef.current = marker;
        mapInstanceRef.current = map;

        // Handle Map Click placing marker
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setCoords({ lat, lng });
        });
      })
      .catch((err) => {
        console.error('Failed to load Leaflet map:', err);
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  const handleConfirm = () => {
    onSelect(coords);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh] md:h-[600px] border border-gray-100">
        <div className="p-4 border-b flex items-center justify-between bg-white">
          <div>
            <h3 className="font-extrabold text-blue-900 uppercase text-sm select-none">Select Landmark Location</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase select-none flex items-center gap-1">
              <span>●</span> Click on the map to pin the exact reference location
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-grow relative bg-gray-50 flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Initializing OpenStreetMap...</p>
            </div>
          )}
          {/* Map Container */}
          <div ref={mapContainerRef} className="w-full h-full" style={{ outline: 'none' }} />
        </div>

        <div className="p-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-[10px] font-mono text-blue-800 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full font-bold shadow-xs">
            Coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase text-gray-500 hover:bg-gray-200 transition-colors w-1/2 sm:w-auto"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors w-1/2 sm:w-auto"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
