import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Waves } from 'lucide-react';
import type { RegionData } from '../lib/api';

interface MapProps {
  selectedLat: number;
  selectedLon: number;
  onLocationSelect: (lat: number, lon: number, districtName?: string) => void;
  regionData: RegionData | null;
  selectedDistrictId: string;
}

// Major Bihar River Basin & Wetland Hazard Zones
const FLOOD_BASIN_ZONES = [
  {
    name: 'Kosi Basin Floodway (Supaul / Saharsa / Madhepura)',
    color: '#0284c7',
    coords: [
      [26.5, 86.4],
      [26.4, 87.1],
      [25.6, 87.2],
      [25.5, 86.5],
    ] as L.LatLngExpression[],
    description: 'High velocity flood breaches, active siltation, and waterlogging.',
  },
  {
    name: 'Bagmati & Kamala-Balan Lowlands (Darbhanga / Madhubani)',
    color: '#0369a1',
    coords: [
      [26.6, 85.7],
      [26.5, 86.3],
      [25.9, 86.2],
      [26.0, 85.6],
    ] as L.LatLngExpression[],
    description: 'Extensive low-lying chaur wetlands, ideal for field-based Makhana rotations.',
  },
  {
    name: 'Mokama Tal Depression (South of Ganga / Patna / Lakhisarai)',
    color: '#059669',
    coords: [
      [25.6, 85.2],
      [25.5, 86.0],
      [25.2, 85.9],
      [25.3, 85.1],
    ] as L.LatLngExpression[],
    description: 'Post-monsoon backwater submergence (September–November) preventing kharif crop, leading to single rabi pulse/oilseed.',
  },
];

export const Map: React.FC<MapProps> = ({
  selectedLat,
  selectedLon,
  onLocationSelect,
  regionData,
  selectedDistrictId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const floodLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [showFloodLayer, setShowFloodLayer] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default to Bihar center: 25.6, 85.1, zoom 7
    const map = L.map(mapContainerRef.current, {
      center: [25.6, 85.1],
      zoom: 7,
      minZoom: 3,
      maxZoom: 18,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Flood layer group
    const floodGroup = L.layerGroup().addTo(map);
    floodLayerGroupRef.current = floodGroup;

    // Render flood hazard basins
    FLOOD_BASIN_ZONES.forEach((zone) => {
      const polygon = L.polygon(zone.coords, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '4, 4',
      });
      polygon.bindTooltip(`<strong>${zone.name}</strong><br/>${zone.description}`, {
        sticky: true,
      });
      floodGroup.addLayer(polygon);
    });

    // Custom SVG Marker Icon
    const customIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div style="
          background-color: #15803d;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([selectedLat, selectedLon], { icon: customIcon }).addTo(map);
    markerRef.current = marker;

    // Click handler to select point worldwide
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = parseFloat(e.latlng.lat.toFixed(4));
      const lon = parseFloat(e.latlng.lng.toFixed(4));
      onLocationSelect(lat, lon);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position when coords change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([selectedLat, selectedLon]);
    }
  }, [selectedLat, selectedLon]);

  // Toggle Flood Layer visibility
  useEffect(() => {
    if (!floodLayerGroupRef.current || !mapInstanceRef.current) return;
    if (showFloodLayer) {
      mapInstanceRef.current.addLayer(floodLayerGroupRef.current);
    } else {
      mapInstanceRef.current.removeLayer(floodLayerGroupRef.current);
    }
  }, [showFloodLayer]);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dId = e.target.value;
    if (!regionData) return;
    const district = regionData.districts.find((d) => d.id === dId);
    if (district) {
      onLocationSelect(district.lat, district.lon, district.name);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([district.lat, district.lon], 9, {
          animate: true,
        });
      }
    }
  };

  const handleResetToBihar = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([25.6, 85.1], 7, { animate: true });
      onLocationSelect(25.5941, 85.1376, 'Patna');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Map Control Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span className="font-semibold text-slate-800 text-xs">District:</span>
          <select
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            aria-label="Select Bihar District"
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Choose Bihar District --</option>
            {regionData?.districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.zone})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Basin Flood Risk Layer Toggle */}
          <button
            type="button"
            onClick={() => setShowFloodLayer(!showFloodLayer)}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border transition cursor-pointer ${
              showFloodLayer
                ? 'bg-sky-100 text-sky-800 border-sky-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle Basin Flood Risk & Wetland Zones overlay"
          >
            <Waves className="w-3.5 h-3.5 text-sky-600" />
            <span>Flood Basins</span>
          </button>

          <button
            type="button"
            onClick={handleResetToBihar}
            className="flex items-center gap-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium px-2 py-1 rounded-md border border-emerald-200 transition cursor-pointer"
            title="Reset map view to Bihar"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Bihar</span>
          </button>

          <div className="text-[11px] bg-slate-200/80 text-slate-700 px-2 py-1 rounded-md font-mono">
            {selectedLat.toFixed(3)}°N, {selectedLon.toFixed(3)}°E
          </div>
        </div>
      </div>

      {/* Map Leaflet Container */}
      <div className="relative w-full h-[400px] md:h-[480px]">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 shadow-sm flex items-center gap-1.5 pointer-events-none">
          <Navigation className="w-3 h-3 text-emerald-600" />
          <span>Click anywhere to select coordinates worldwide</span>
        </div>

        {/* Legend pill */}
        {showFloodLayer && (
          <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg p-2 text-[10px] text-slate-700 shadow-sm flex flex-col gap-1 pointer-events-none">
            <span className="font-bold text-slate-800 uppercase tracking-wider">Hydrological Hazard Overlays:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/40 border border-sky-600 inline-block"></span>
              <span>Kosi Basin Floodway</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600/40 border border-blue-700 inline-block"></span>
              <span>Bagmati/Kamala Chaur Wetland</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600/40 border border-emerald-700 inline-block"></span>
              <span>Mokama Tal Depression</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
