"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for missing default marker icons in Leaflet with Next.js
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "/marker-shadow.png",
  shadowSize: [41, 41],
});

// Since we don't have the image files locally yet, let's use a CDN for the icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Lead = {
  id: string;
  company_name: string;
  address: string;
  lat: number;
  lng: number;
};

export default function LeadsMap({ leads }: { leads: Lead[] }) {
  // Center map on Dallas by default, or the first lead
  const center: [number, number] = leads.length > 0 
    ? [leads[0].lat, leads[0].lng] 
    : [32.7767, -96.7970];

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 z-0 relative">
      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {leads.map((lead) => (
          <Marker 
            key={lead.id} 
            position={[lead.lat, lead.lng]} 
            icon={defaultIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong className="block text-base">{lead.company_name}</strong>
                <span className="text-gray-500">{lead.address}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}