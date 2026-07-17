import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Filter, Download, MapPin, Building2, TrendingUp, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Proyecto } from '../types';
import ProjectMapSidebar from './ProjectMapSidebar';

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

    const control = L.control.layers(baseLayers, {}, { position: 'bottomleft', collapsed: true }).addTo(map);
    layers[0].addTo(map);

    return () => {
      control.remove();
      layers.forEach(l => l.remove());
    };
  }, [map]);

  return null;
};

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const HeatMap: React.FC<{ proyectos: Proyecto[] }> = ({ proyectos }) => {
  const center: [number, number] = [14.6349, -90.5069];
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filteredProyectos, setFilteredProyectos] = useState<Proyecto[]>(proyectos);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [filters, setFilters] = useState({
    estado: 'todos',
    categoria: 'todos',
    fechaInicio: null as any,
    fechaFin: null as any,
  });
  const [regionalStats, setRegionalStats] = useState<any>(null);

  useEffect(() => {
    let filtered = proyectos;

    if (filters.estado !== 'todos') {
      filtered = filtered.filter(p => p.estado === filters.estado);
    }

    if (filters.categoria !== 'todos') {
      filtered = filtered.filter(p => p.categoria === filters.categoria);
    }

    if (filters.fechaInicio && filters.fechaFin) {
      filtered = filtered.filter(p => {
        const fecha = p.fechaInicio ? new Date(p.fechaInicio) : null;
        return fecha && fecha >= filters.fechaInicio[0] && fecha <= filters.fechaFin[1];
      });
    }

    setFilteredProyectos(filtered);

    const regions: Record<string, { count: number; presupuesto: number }> = {};
    filtered.forEach(p => {
      const region = p.ubicacion?.split(',')[0] || 'Otros';
      if (!regions[region]) {
        regions[region] = { count: 0, presupuesto: 0 };
      }
      regions[region].count++;
      regions[region].presupuesto += p.presupuestoTotal || 0;
    });

    setRegionalStats(regions);
  }, [proyectos, filters]);

  const handleExport = async () => {
    if (containerRef.current) {
      const canvas = await html2canvas(containerRef.current);
      const link = document.createElement('a');
      link.download = 'mapa-proyectos.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const estados = ['todos', ...new Set(proyectos.map(p => p.estado))];
  const categorias = ['todos', ...new Set(proyectos.map(p => (p as any).categoria).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">Filtros Avanzados</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-3">
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {estados.map(estado => (
                <option key={estado} value={estado}>
                  {estado === 'todos' ? 'Todos' : estado}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3">
            <select
              value={filters.categoria}
              onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'todos' ? 'Todas' : cat}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-4">
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.fechaInicio?.[0] || ''}
                onChange={(e) => setFilters({ ...filters, fechaInicio: [e.target.value, filters.fechaInicio?.[1] || ''] })}
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Fecha Inicio"
              />
              <input
                type="date"
                value={filters.fechaFin?.[1] || ''}
                onChange={(e) => setFilters({ ...filters, fechaFin: [filters.fechaFin?.[0] || '', e.target.value] })}
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Fecha Fin"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <button
              onClick={handleExport}
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {regionalStats && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold">Estadísticas Regionales</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(regionalStats).map(([region, stats]) => (
              <div key={region} className="p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-medium">{region}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.count} <span className="text-sm font-normal text-muted-foreground">proyectos</span></p>
                <div className="text-sm text-muted-foreground mt-1">
                  ${stats.presupuesto.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div
          ref={containerRef}
          className="flex-1 relative rounded-2xl overflow-hidden isolate h-[400px]"
        >
          <MapContainer
            center={center}
            zoom={7}
            scrollWheelZoom={false}
            className="w-full h-full"
            ref={(map) => { mapRef.current = map; }}
          >
            <LayerSwitcher />
            <MarkerClusterGroup chunkedLoading>
              {filteredProyectos.map(p =>
                p.lat != null && p.lng != null && (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={createCustomIcon(estadoColor(p))}
                    eventHandlers={{
                      click: () => setSelectedProyecto(p),
                    }}
                  >
                    <Popup>
                      <div className="text-xs leading-relaxed min-w-[140px]">
                        <b className="text-sm">{p.nombre}</b>
                        <br /><span className="text-muted-foreground">{p.cliente || '—'}</span>
                        <br /><span className="text-muted-foreground">{p.ubicacion}</span>
                        <br /><span className="text-muted-foreground">Estado: {p.estado}</span>
                        <br /><span className="text-muted-foreground">Avance: {p.avanceFisico}%</span>
                      </div>
                    </Popup>
                  </Marker>
                )
              )}
            </MarkerClusterGroup>
          </MapContainer>
          <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-orange-500/20 to-black/80" />
        </div>

        {selectedProyecto && (
          <ProjectMapSidebar
            proyecto={selectedProyecto}
            onClose={() => setSelectedProyecto(null)}
          />
        )}
      </div>

      {filteredProyectos.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <MapPin className="w-5 h-5" />
            <h3 className="font-semibold">Análisis de Proximidad</h3>
          </div>
          <div className="space-y-2">
            {filteredProyectos.slice(0, 5).map((p1, i) => {
              const nearby = filteredProyectos
                .filter(p2 => p2.id !== p1.id)
                .map(p2 => ({
                  proyecto: p2,
                  distancia: p1.lat && p1.lng && p2.lat && p2.lng
                    ? calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng)
                    : Infinity,
                }))
                .filter((p: { distancia: number }) => p.distancia < 100)
                .sort((a: { distancia: number }, b: { distancia: number }) => a.distancia - b.distancia)
                .slice(0, 3);

              if (nearby.length === 0) return null;

              return (
                <div key={p1.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium">{p1.nombre}</p>
                  <div className="text-sm text-gray-500 mt-1">
                    Proyectos cercanos:
                    {nearby.map(n => (
                      <span key={n.proyecto.id} className="ml-2">
                        {n.proyecto.nombre} ({n.distancia.toFixed(1)} km)
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatMap;