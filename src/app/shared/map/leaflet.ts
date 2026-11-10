// Piezas comunes de los mapas (selector de ubicación y página /mapa).
//
// Leaflet se carga bajo demanda con import() dinámico, y su CSS es una hoja
// aparte que angular.json NO inyecta (bundleName "leaflet", inject: false): así
// ninguno de los dos entra en el bundle inicial, que ya pasa el presupuesto de
// aviso. La primera pantalla con mapa paga la descarga; las siguientes, no.

import type * as Leaflet from 'leaflet';
import { ReportType } from 'src/app/models/report.model';

export type LeafletLib = typeof Leaflet;

/** Punto elegido en el mapa. El backend exige lat y lng juntos o ninguno. */
export interface GeoPoint {
  lat: number;
  lng: number;
}

// Vista inicial: Ecuador continental, encuadrado con fitBounds para que se vea
// entero en cualquier ancho de pantalla (un zoom fijo dejaba el móvil en el mar).
export const ECUADOR_MAINLAND: [[number, number], [number, number]] = [
  [-5.0, -81.1],
  [1.45, -75.2],
];

// Hasta dónde se puede desplazar: Ecuador continental + Galápagos, con margen.
// El sitio solo cubre Ecuador (los catálogos de provincia/cantón/sector son de aquí).
export const ECUADOR_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-7, -95],
  [3, -73],
];

// Teselas de OpenStreetMap: gratis y sin clave, a cambio de mostrar la
// atribución. Su política de uso no admite tráfico intensivo: si el sitio
// crece, se cambia aquí por un proveedor (MapTiler, Stadia...).
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

let pending: Promise<LeafletLib> | null = null;

export function loadLeaflet(): Promise<LeafletLib> {
  if (!pending) {
    pending = Promise.all([import('leaflet'), injectLeafletCss()])
      .then(([mod]) => ((mod as any).default ?? mod) as LeafletLib)
      .catch((err) => {
        pending = null; // permite reintentar al volver a la pantalla
        throw err;
      });
  }
  return pending;
}

function injectLeafletCss(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById('leaflet-css')) return resolve();
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'leaflet.css';
    // Sin la hoja el mapa se ve roto, pero funciona: no bloquea si falla.
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

/** Pin con el color del tipo (mismos colores que las etiquetas de las tarjetas).
 *  divIcon en vez de la imagen por defecto de Leaflet, que el bundler no
 *  resuelve. Los estilos son globales: styles/_map.scss. */
export function pinIcon(L: LeafletLib, kind: ReportType | 'pick'): Leaflet.DivIcon {
  return L.divIcon({
    className: `map-pin map-pin--${kind}`,
    html: '<span class="map-pin__dot"></span>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

/** 6 decimales (~10 cm): la columna es decimal(9, 6). */
export function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Ubicación del dispositivo. Rechaza con un mensaje listo para mostrar. */
export function currentPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject('Tu navegador no permite obtener la ubicación.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: roundCoord(pos.coords.latitude),
          lng: roundCoord(pos.coords.longitude),
        }),
      (err) =>
        reject(
          err.code === err.PERMISSION_DENIED
            ? 'No diste permiso para usar tu ubicación. Puedes marcar el punto tocando el mapa.'
            : 'No pudimos obtener tu ubicación. Marca el punto tocando el mapa.'
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
