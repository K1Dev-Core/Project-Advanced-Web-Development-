import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { GeoPoint } from '../../core/models';

export interface MapMarker {
  id: number | string;
  location: GeoPoint;
  color?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  faded?: boolean;
}

export interface MapLine {
  points: GeoPoint[];
  color: string;
  weight?: number;
  dashed?: boolean;
  faded?: boolean;
}

export interface MapCircle {
  center: GeoPoint;
  radiusKm: number;
  color?: string;
}

@Component({
  selector: 'app-map',
  template: `<div #host class="map"></div>`,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        min-height: 240px;
        border-radius: var(--radius);
        overflow: hidden;
        isolation: isolate;
      }
      .map {
        width: 100%;
        height: 100%;
        min-height: inherit;
      }
    `,
  ],
})
export class MapViewComponent implements AfterViewInit, OnDestroy {
  private static readonly DEFAULT_CENTER: GeoPoint = { latitude: 16.246825, longitude: 103.252021 };
  private static readonly TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  readonly markers = input<MapMarker[]>([]);
  readonly lines = input<MapLine[]>([]);
  readonly shop = input<GeoPoint | null>(null);
  readonly circle = input<MapCircle | null>(null);
  readonly picked = input<GeoPoint | null>(null);
  readonly pickable = input(false);
  readonly zoom = input(14);

  readonly pick = output<GeoPoint>();
  readonly markerClick = output<number | string>();

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map?: L.Map;
  private readonly layer = L.layerGroup();
  private resizeObserver?: ResizeObserver;
  private lastFitKey = '';

  constructor() {
    effect(() => {
      const state = {
        markers: this.markers(),
        lines: this.lines(),
        shop: this.shop(),
        circle: this.circle(),
        picked: this.picked(),
      };
      this.render(state.markers, state.lines, state.shop, state.circle, state.picked);
    });
  }

  ngAfterViewInit(): void {
    const center = this.picked() ?? this.shop() ?? MapViewComponent.DEFAULT_CENTER;
    this.map = L.map(this.host().nativeElement, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    }).setView([center.latitude, center.longitude], this.zoom());

    L.tileLayer(MapViewComponent.TILE_URL, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(this.map);

    this.layer.addTo(this.map);
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      if (this.pickable()) {
        this.pick.emit({
          latitude: Number(event.latlng.lat.toFixed(6)),
          longitude: Number(event.latlng.lng.toFixed(6)),
        });
      }
    });

    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(this.host().nativeElement);
    this.render(this.markers(), this.lines(), this.shop(), this.circle(), this.picked());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  focus(point: GeoPoint, zoom = 16): void {
    this.map?.flyTo([point.latitude, point.longitude], zoom, { duration: 0.6 });
  }

  private render(
    markers: MapMarker[],
    lines: MapLine[],
    shop: GeoPoint | null,
    circle: MapCircle | null,
    picked: GeoPoint | null,
  ): void {
    if (!this.map) {
      return;
    }
    this.layer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    if (circle) {
      L.circle([circle.center.latitude, circle.center.longitude], {
        radius: circle.radiusKm * 1000,
        color: circle.color ?? '#ff5a1f',
        weight: 1.5,
        fillOpacity: 0.08,
        dashArray: '6 6',
      }).addTo(this.layer);
      bounds.push([circle.center.latitude, circle.center.longitude]);
    }

    for (const line of lines) {
      const latlngs = line.points.map((point) => [point.latitude, point.longitude] as L.LatLngTuple);
      if (latlngs.length < 2) {
        continue;
      }
      L.polyline(latlngs, { color: '#ffffff', weight: (line.weight ?? 5) + 4, opacity: line.faded ? 0.3 : 0.9 }).addTo(this.layer);
      L.polyline(latlngs, {
        color: line.color,
        weight: line.weight ?? 5,
        opacity: line.faded ? 0.25 : 0.95,
        dashArray: line.dashed ? '8 8' : undefined,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(this.layer);
      bounds.push(...latlngs);
    }

    for (const marker of markers) {
      const icon = L.divIcon({
        className: 'map-pin',
        html: `<div class="pin" style="background:${marker.color ?? '#ff5a1f'};opacity:${marker.faded ? 0.45 : 1}"><span>${MapViewComponent.escape(marker.label ?? '')}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 36],
        popupAnchor: [0, -34],
      });
      const leafletMarker = L.marker([marker.location.latitude, marker.location.longitude], { icon }).addTo(this.layer);
      if (marker.title) {
        leafletMarker.bindPopup(
          `<b>${MapViewComponent.escape(marker.title)}</b>${marker.subtitle ? `<br><span style="color:#727885">${MapViewComponent.escape(marker.subtitle)}</span>` : ''}`,
        );
      }
      leafletMarker.on('click', () => this.markerClick.emit(marker.id));
      bounds.push([marker.location.latitude, marker.location.longitude]);
    }

    if (shop) {
      const icon = L.divIcon({
        className: 'map-pin shop',
        html: `<div class="pin"><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/></svg></span></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 46],
        popupAnchor: [0, -44],
      });
      L.marker([shop.latitude, shop.longitude], { icon, zIndexOffset: 1000 }).bindPopup('<b>ร้านข้าวกล่อง</b><br>จุดออกรถ').addTo(this.layer);
      bounds.push([shop.latitude, shop.longitude]);
    }

    if (picked) {
      const icon = L.divIcon({
        className: 'map-pin',
        html: `<div class="pin" style="background:#ff5a1f;width:36px;height:36px"><span>●</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 42],
      });
      L.marker([picked.latitude, picked.longitude], { icon, zIndexOffset: 2000 }).addTo(this.layer);
      bounds.push([picked.latitude, picked.longitude]);
    }

    const fitKey = JSON.stringify([markers.map((m) => m.id), lines.length, circle?.radiusKm, circle?.center, shop, picked ? 1 : 0]);
    if (fitKey !== this.lastFitKey) {
      this.lastFitKey = fitKey;
      if (bounds.length > 1) {
        this.map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 16 });
      } else if (bounds.length === 1) {
        this.map.setView(bounds[0], 16);
      }
    }
  }

  private static escape(text: string): string {
    return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  }
}
