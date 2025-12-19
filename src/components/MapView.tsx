"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import type { DentistWithFeatured } from "@/lib/ranking";
import { parseCoordinates } from "@/lib/geo";

interface MapViewProps {
  dentists: DentistWithFeatured[];
  origin?: { lat: number; lng: number };
  cityName: string;
}

let leafletPromise: Promise<any> | null = null;

function ensureLeaflet() {
  if (typeof window === "undefined") {
    return Promise.reject("No window");
  }

  if ((window as any).L) {
    return Promise.resolve((window as any).L);
  }

  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    const existingCss = document.querySelector('link[data-leaflet]');
    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute('data-leaflet', 'true');
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = (err) => {
      leafletPromise = null;
      reject(err);
    };
    document.body.appendChild(script);
  });

  return leafletPromise;
}

export default function MapView({ dentists, origin, cityName }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dentists.some((d) => parseCoordinates(d.lat, d.lng))) {
      return;
    }

    let map: any;
    let markers: any[] = [];

    ensureLeaflet()
      .then((leaflet) => {
        if (!mapRef.current) return;

        map = leaflet.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: false,
        });

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          })
          .addTo(map);

        dentists.forEach((dentist) => {
          const coords = parseCoordinates(dentist.lat, dentist.lng);
          if (!coords) return;
          const marker = leaflet
            .marker([coords.lat, coords.lng])
            .addTo(map)
            .bindPopup(
              `<div><strong>${dentist.name}</strong><br/>${dentist.address ?? ""}</div>`
            );
          markers.push(marker);
        });

        if (markers.length > 0) {
          const group = leaflet.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.2));
        } else if (origin) {
          map.setView([origin.lat, origin.lng], 11);
        } else {
          map.setView([28.0781, -80.6081], 10); // Default Space Coast area
        }
      })
      .catch((err) => {
        console.error("Failed to load map", err);
        setError("Map unavailable right now.");
      });

    return () => {
      if (map) {
        map.remove();
      }
      markers = [];
    };
  }, [dentists, origin]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-600">
        {error}
      </div>
    );
  }

  if (!dentists.some((d) => parseCoordinates(d.lat, d.lng))) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-600 px-6 text-center">
        No geocoded locations yet for dentists in {cityName}. Listings will appear here once
        coordinates are available.
      </div>
    );
  }

  return <div ref={mapRef} className="h-full w-full" />;
}
