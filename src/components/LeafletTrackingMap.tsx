import React, { Component, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Order } from '../types';
import { fetchStreetRoute } from '../routing';

export type TrackingPoint = { name: string; coordinates: [number, number] };

const cities: Record<string, TrackingPoint> = {
  Beirut: { name: 'Beirut', coordinates: [33.8938, 35.5018] },
  Hamra: { name: 'Hamra, Beirut', coordinates: [33.8959, 35.4781] },
  Jounieh: { name: 'Jounieh', coordinates: [33.9808, 35.6178] },
  Byblos: { name: 'Byblos', coordinates: [34.123, 35.6511] },
  Tripoli: { name: 'Tripoli', coordinates: [34.4367, 35.8497] },
  Zahle: { name: 'Zahle', coordinates: [33.8463, 35.902] },
  Sidon: { name: 'Sidon', coordinates: [33.5571, 35.3729] },
  Baalbek: { name: 'Baalbek', coordinates: [34.0047, 36.211] },
};

const icon = (color: string, symbol: string) => L.divIcon({
  className: 'tracking-marker',
  html: `<span style="--marker-color:${color}">${symbol}</span>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});
const originIcon = icon('#635bff', '↗');
const destinationIcon = icon('#14b89a', '●');
const shipmentIcon = icon('#ef6f62', '▰');

function destinationForOrder(order?: Order): TrackingPoint {
  const city = (order?.city || 'Beirut').split(',')[0].replace(/\s+/g, ' ').trim().toLowerCase();
  return Object.entries(cities).find(([key]) => key.toLowerCase() === city)?.[1] || cities.Beirut;
}

function FitRoute({ points }: { points: TrackingPoint[] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLngBounds(points.map(point => point.coordinates)), { padding: [26, 26] });
  }, [map, points]);
  return null;
}

function AnimatedShipment({ points, progress }: { points: TrackingPoint[]; progress: number }) {
  const [position, setPosition] = useState<[number, number]>(points[0].coordinates);
  useEffect(() => {
    if (points.length < 2) return;
    // l-sh7ne btemshe 3a geometry taba3 l-shaware3 7asab l-progress.
    const safeProgress = Math.max(0, Math.min(100, progress));
    const segment = (safeProgress / 100) * (points.length - 1);
    const index = Math.min(Math.floor(segment), points.length - 2);
    const fraction = segment - index;
    const from = points[index].coordinates;
    const to = points[index + 1].coordinates;
    setPosition([from[0] + (to[0] - from[0]) * fraction, from[1] + (to[1] - from[1]) * fraction]);
  }, [points, progress]);
  return <Marker position={position} icon={shipmentIcon}><Popup>Shipment is {Math.round(progress)}% complete</Popup></Marker>;
}

type Props = { order?: Order; className?: string };
type State = { failed: boolean };

class MapBoundary extends Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="mapfallback">Map unavailable — route details are still safe in your tracker.</div>;
    return this.props.children;
  }
}

export default function LeafletTrackingMap({ order, className = '' }: Props) {
  const origin = cities.Hamra;
  const destination = useMemo(() => destinationForOrder(order), [order?.city]);
  const fallbackRoute = useMemo(() => [origin.coordinates, destination.coordinates], [destination, origin.coordinates]);
  const [route, setRoute] = useState<[number, number][]>(fallbackRoute);
  const [routeState, setRouteState] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [routeError, setRouteError] = useState('');
  const progress = order?.progress ?? 0;

  useEffect(() => {
    const controller = new AbortController();
    setRoute(fallbackRoute);
    setRouteState('loading');
    setRouteError('');
    fetchStreetRoute(origin, destination, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setRoute(result.coordinates);
      setRouteState(result.source === 'osrm' ? 'ready' : 'fallback');
      setRouteError(result.error || '');
    }).catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setRouteState('fallback');
      setRouteError(error instanceof Error ? error.message : 'Street routing failed.');
    });
    return () => controller.abort();
  }, [destination, fallbackRoute, origin]);

  const routePoints = useMemo(() => route.map((coordinates, index) => ({
    name: index === 0 ? origin.name : index === route.length - 1 ? destination.name : 'Street route',
    coordinates,
  })), [destination, origin.name, route]);

  return (
    <MapBoundary>
      <div className={`leaflet-map ${className}`}>
        <MapContainer center={origin.coordinates} zoom={9} scrollWheelZoom={false}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitRoute points={routePoints} />
          <Polyline positions={route} pathOptions={{ color: '#635bff', weight: 5, dashArray: '8 8' }} />
          <Marker position={origin.coordinates} icon={originIcon}><Popup>Origin: {origin.name}</Popup></Marker>
          <Marker position={destination.coordinates} icon={destinationIcon}><Popup>Destination: {destination.name}</Popup></Marker>
          <AnimatedShipment points={routePoints} progress={progress} />
        </MapContainer>
        <div className="map-status">
          <b>{progress}% delivered</b>
          <small>{origin.name} → {destination.name}</small>
          {routeState === 'loading' && <span>Loading street route…</span>}
          {routeState === 'fallback' && <span role="status">Street routing unavailable; showing direct fallback. {routeError}</span>}
        </div>
      </div>
    </MapBoundary>
  );
}
