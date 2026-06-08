import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Proyecto } from '../types';

const estadoColor = (p: { avanceFisico: number; avanceFinanciero: number; estado: string }) => {
  const dev = p.avanceFinanciero - p.avanceFisico;
  if (p.estado === 'planeacion') return '#94a3b8';
  if (dev > 8) return '#ef4444';
  if (dev > 3) return '#fbbf24';
  return '#10b981';
};

const TILE_PROVIDERS: Record<string, { url: string; attr: string }> = {
  Calle: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  Satélite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  Topográfico: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
  },
};

const LayerSwitcher: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const entries = Object.entries(TILE_PROVIDERS);
    const layers = entries.map(([, cfg]) =>
      L.tileLayer(cfg.url, { attribution: cfg.attr })
    );

    const baseLayers: Record<string, L.TileLayer> = {};
    entries.forEach(([name], i) => { baseLayers[name] = layers[i]; });

    const control = L.control.layers(baseLayers, {}, { position: 'bottomleft', collapsed: false }).addTo(map);
    layers[0].addTo(map);

    return () => {
      control.remove();
      layers.forEach(l => l.remove());
    };
  }, [map]);

  return null;
};

const HeatMap: React.FC<{ proyectos: Proyecto[] }> = ({ proyectos }) => {
  const center: [number, number] = [14.6349, -90.5069];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden isolate" style={{ height: 220 }}>
      <MapContainer center={center} zoom={7} scrollWheelZoom={false} className="w-full h-full">
        <LayerSwitcher />
        {proyectos.map(p =>
          p.lat != null && p.lng != null && (
            <Marker key={p.id} position={[p.lat, p.lng]}>
              <Popup>
                <div className="text-xs leading-relaxed min-w-[140px]">
                  <b className="text-sm">{p.nombre}</b>
                  <br /><span className="text-muted-foreground">{p.cliente || '—'}</span>
                  <br /><span className="text-muted-foreground">{p.ubicacion}</span>
                </div>
              </Popup>
            </Marker>
          )
        )}
      </MapContainer>
      <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'rgba(255, 140, 0, 0.1)' }} />
    </div>
  );
};

export default HeatMap;
