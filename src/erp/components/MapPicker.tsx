import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

interface MapPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

const ClickHandler: React.FC<{ onClick: (latlng: LatLng) => void }> = ({ onClick }) => {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
};

const FlyTo: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 16); }, [lat, lng, map]);
  return null;
};

const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onChange, height = 220 }) => {
  const center: [number, number] = lat && lng ? [lat, lng] : [14.6349, -90.5069];
  const [search, setSearch] = useState('');

  const buscarEnMapa = async () => {
    if (!search.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1&countrycodes=gt`);
      const data = await res.json();
      if (data.length > 0) {
        onChange(parseFloat(data[0].lat), parseFloat(data[0].lon));
      }
    } catch { }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarEnMapa()}
            placeholder="Buscar dirección o lugar en Guatemala..."
            className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button type="button" onClick={buscarEnMapa}
          className="px-3 py-1.5 text-xs rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-1">
          <Navigation className="w-3 h-3" /> Ir
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
        <MapContainer center={center} zoom={lat ? 16 : 7} scrollWheelZoom style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={(ll) => onChange(ll.lat, ll.lng)} />
          {lat && lng && (
            <>
              <Marker position={[lat, lng]} />
              <FlyTo lat={lat} lng={lng} />
            </>
          )}
        </MapContainer>
      </div>
      {lat && lng && (
        <div className="flex gap-2 text-[10px] text-muted-foreground">
          <span>Lat: {lat.toFixed(5)}</span>
          <span>Lng: {lng.toFixed(5)}</span>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
