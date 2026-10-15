import {
  Component,
  input,
  output,
  signal,
  effect,
  afterNextRender,
  ElementRef,
  viewChild,
  OnDestroy,
  ViewEncapsulation,
} from "@angular/core";
import type * as Leaflet from "leaflet";
import { Point, DeliveryRoute } from "../../models/models";
import { Icon } from "../ui/icon";
type RouteShape = Pick<DeliveryRoute, "path" | "geometry" | "color">;
@Component({
  selector: "parcel-map",
  imports: [Icon],
  encapsulation: ViewEncapsulation.None,
  template: ` <div
    class="real-map-shell"
    [class.expanded]="expanded()"
    [class.editable]="editable()"
    [class.clear-map-theme]="clearMap()"
  >
    <div
      #canvas
      class="real-map-canvas"
      role="region"
      aria-label="แผนที่ถนนจริงและจุดจัดส่ง ใช้ลูกศรเลื่อนแผนที่และปุ่มบวกลบเพื่อซูม"
    ></div>
    <div class="map-tools">
      @if (editable()) {
        <button
          class="map-tool"
          type="button"
          aria-label="ใช้ตำแหน่งปัจจุบัน"
          title="ใช้ตำแหน่งปัจจุบัน"
          [disabled]="locating()"
          (click)="locate()"
        >
          <ui-icon name="locate" />
        </button>
      }
      <button
        class="map-tool"
        type="button"
        aria-label="แสดงทุกจุดบนแผนที่"
        title="แสดงทุกจุดบนแผนที่"
        (click)="fit()"
      >
        <ui-icon name="route" /></button
      ><button
        class="map-tool"
        [class.active]="clearMap()"
        type="button"
        [attr.aria-label]="
          clearMap() ? 'ใช้สีแผนที่ปกติ' : 'ใช้ธีมแผนที่สว่างชัด'
        "
        [title]="clearMap() ? 'ใช้สีแผนที่ปกติ' : 'ใช้ธีมแผนที่สว่างชัด'"
        (click)="clearMap.update((value) => !value)"
      >
        <ui-icon name="eye" /></button
      ><button
        class="map-tool"
        type="button"
        [attr.aria-label]="expanded() ? 'ย่อแผนที่' : 'ขยายแผนที่'"
        (click)="toggle()"
      >
        <ui-icon [name]="expanded() ? 'close' : 'expand'" />
      </button>
    </div>
    @if (loading()) {
      <div class="map-loading" role="status">
        <span class="spinner"></span>กำลังโหลดแผนที่จริง
      </div>
    }
    <div class="map-messages">
      @if (tileError()) {
        <div class="map-error" role="status">
          แผนที่พื้นหลังโหลดไม่สำเร็จ
          <button type="button" (click)="retry()">ลองอีกครั้ง</button> ·
          หมุดยังอ้างอิงพิกัดจริง
        </div>
      }
      @if (mapNotice()) {
        <div class="map-error" role="status">{{ mapNotice() }}</div>
      }
    </div>
  </div>`,
  styles: [
    `
      parcel-map {
        display: block;
        min-width: 0;
        height: 100%;
      }
      .real-map-shell {
        position: relative;
        height: 100%;
        min-height: 265px;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid #f0e1d3;
        background: #fff0e5;
        isolation: isolate;
      }
      .real-map-canvas {
        height: 100%;
        min-height: 265px;
        width: 100%;
      }
      .real-map-shell.expanded {
        position: fixed;
        inset: 22px;
        z-index: 1000;
        height: calc(100dvh - 44px);
        box-shadow: 0 0 0 100vmax #38221e99;
      }
      .map-tools {
        position: absolute;
        top: 12px;
        right: 12px;
        display: grid;
        gap: 8px;
        z-index: 500;
      }
      .map-tool {
        border: 1px solid #ead8c9;
        border-radius: 13px;
        width: 44px;
        height: 44px;
        background: white;
        color: #753c22;
        display: grid;
        place-items: center;
        box-shadow: 0 3px 9px #442a1615;
      }
      .map-tool:hover {
        background: #fff0df;
      }
      .map-tool.active {
        color: #a83c14;
        border-color: #f0c5a8;
        background: #fff3e8;
      }
      .map-tool ui-icon {
        width: 19px;
        height: 19px;
      }
      .real-map-shell .delivery-marker {
        background: none;
        border: 0;
      }
      .real-map-shell .map-pin {
        display: grid;
        place-items: center;
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 8px;
        transform: rotate(-45deg);
        background: var(--pin-color);
        border: 2px solid white;
        color: white;
        box-shadow: 0 2px 6px #442a1640;
        font:
          700 11px system-ui,
          sans-serif;
      }
      .real-map-shell .map-pin b {
        display: grid;
        place-items: center;
        transform: rotate(45deg);
      }
      .real-map-shell .depot-pin {
        background: #642a1c;
      }
      .real-map-shell .delivery-marker:focus-visible {
        outline: 3px solid #923600;
        outline-offset: 5px;
        border-radius: 50%;
      }
      .real-map-shell .leaflet-container {
        font-family:
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Noto Sans Thai",
          sans-serif;
        background: #f6f3ed;
      }
      .real-map-shell .leaflet-tile {
        transition: filter 160ms ease;
      }
      .real-map-shell.clear-map-theme .leaflet-tile {
        filter: saturate(0.58) contrast(1.08) brightness(1.02);
      }
      .real-map-shell .leaflet-bar {
        border: 1px solid #ead8c9;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 3px 9px #442a1615;
      }
      .real-map-shell .leaflet-bar a {
        width: 44px;
        height: 44px;
        line-height: 44px;
        color: #753c22;
      }
      .real-map-shell .leaflet-popup-content-wrapper {
        border-radius: 16px;
      }
      .real-map-shell .leaflet-control-attribution {
        font-size: 10px;
      }
      .map-loading {
        pointer-events: none;
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: #fff5eae6;
        z-index: 450;
        font-size: 12px;
        color: #754b32;
      }
      .map-messages {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 65px;
        z-index: 450;
        display: grid;
        gap: 8px;
      }
      .map-error {
        padding: 9px;
        background: #fff1dbee;
        color: #784b21;
        font-size: 12px;
        border-radius: 12px;
      }
      .map-error button {
        border: 0;
        background: none;
        text-decoration: underline;
        color: #8a350b;
      }
      .expanded .real-map-canvas {
        height: 100%;
      }
      @media (max-width: 600px) {
        .real-map-shell.expanded {
          inset: 10px;
          height: calc(100dvh - 20px);
        }
      }
    `,
  ],
})
export class ParcelMap implements OnDestroy {
  routes = input<RouteShape[]>([]);
  points = input<Point[]>([]);
  center = input<Point>({ latitude: 16.246825, longitude: 103.252021 });
  editable = input(false);
  drawLines = input(true);
  decorativeRider = input(false);
  pointChange = output<Point>();
  canvas = viewChild.required<ElementRef<HTMLDivElement>>("canvas");
  loading = signal(true);
  tileError = signal(false);
  expanded = signal(false);
  clearMap = signal(true);
  private L?: typeof Leaflet;
  private map?: Leaflet.Map;
  private layers?: Leaflet.FeatureGroup;
  private tiles?: Leaflet.TileLayer;
  private resize?: ResizeObserver;
  private destroyed = false;
  private tileCount = 0;
  locating = signal(false);
  mapNotice = signal("");
  private fitted = false;
  private geoWatch?: number;
  constructor() {
    effect(() => {
      this.routes();
      this.points();
      this.center();
      this.editable();
      this.drawLines();
      this.render();
    });
    afterNextRender(async () => {
      const leafletModule = await import("leaflet");
      // The production Angular bundle exposes the CommonJS Leaflet package
      // as a default export; normalize it to the Leaflet namespace API.
      const L =
        (leafletModule as unknown as { default?: typeof Leaflet }).default ??
        leafletModule;
      if (this.destroyed) return;
      this.L = L;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.map = L.map(this.canvas().nativeElement, {
        center: [this.center().latitude, this.center().longitude],
        zoom: 14,
        scrollWheelZoom: false,
        zoomSnap: 0.5,
        zoomAnimation: !reduced,
        fadeAnimation: !reduced,
        markerZoomAnimation: !reduced,
      });
      this.map.zoomControl.setPosition("topleft");
      this.tiles = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
          maxZoom: 19,
          detectRetina: false,
        },
      ).addTo(this.map);
      this.tiles.on("tileload", () => {
        this.tileCount++;
        this.loading.set(false);
        this.tileError.set(false);
      });
      this.tiles.on("tileerror", () => {
        this.loading.set(false);
        if (!this.tileCount) this.tileError.set(true);
      });
      this.tiles.on("load", () => this.loading.set(false));
      this.layers = L.featureGroup().addTo(this.map);
      this.map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        if (this.editable())
          this.pointChange.emit({
            latitude: Number(e.latlng.lat.toFixed(6)),
            longitude: Number(e.latlng.lng.toFixed(6)),
          });
      });
      this.map.on("keydown", (e: Leaflet.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === "Escape" && this.expanded()) this.toggle();
      });
      this.resize = new ResizeObserver(() => {
        this.map?.invalidateSize({ animate: false });
      });
      this.resize.observe(this.canvas().nativeElement);
      this.render();
    });
  }
  private valid(p: Point) {
    return (
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude) &&
      Math.abs(p.latitude) <= 90 &&
      Math.abs(p.longitude) <= 180
    );
  }
  private pointList(value: unknown): Point[] {
    if (typeof value === "string") {
      try {
        return this.pointList(JSON.parse(value));
      } catch {
        return [];
      }
    }
    if (!Array.isArray(value)) return [];
    return value.filter(
      (point): point is Point =>
        !!point &&
        typeof point === "object" &&
        typeof point.latitude === "number" &&
        typeof point.longitude === "number" &&
        this.valid(point as Point),
    );
  }
  render() {
    const L = this.L,
      m = this.map,
      g = this.layers;
    if (!L || !m || !g) return;
    g.clearLayers();
    // API deployments can temporarily return null, encoded JSON, or an
    // unexpected shape while old and new payloads coexist. Keep malformed
    // map data from crashing the Angular render effect.
    const routeInput: unknown = this.routes();
    const routes =
      Array.isArray(routeInput) && routeInput.length
        ? routeInput
        : [
            {
              path: this.pointList(this.points()),
              geometry: [],
              color: "#ff641c",
            },
          ];
    let depotAdded = false;
    let deliverySequence = 0;
    for (const value of routes) {
      const route =
        value && typeof value === "object"
          ? (value as Partial<RouteShape>)
          : {};
      const path = this.pointList(route.path),
        road = this.pointList(route.geometry);
      const color =
        typeof route.color === "string" && /^#[0-9a-f]{6}$/i.test(route.color)
          ? route.color
          : "#ff641c";
      if (this.drawLines() && (road.length > 1 || path.length > 1)) {
        const real = road.length > 1;
        L.polyline(
          (real ? road : path).map(
            (p) => [p.latitude, p.longitude] as Leaflet.LatLngTuple,
          ),
          { color: "#fff", weight: 10, opacity: 0.96 },
        ).addTo(g);
        L.polyline(
          (real ? road : path).map(
            (p) => [p.latitude, p.longitude] as Leaflet.LatLngTuple,
          ),
          {
            color,
            weight: 6,
            opacity: 1,
            ...(!real ? { dashArray: "8 10" } : {}),
          },
        ).addTo(g);
      }
      for (let i = 0; i < path.length; i++) {
        if (i === 0 && depotAdded) continue;
        if (i === 0) depotAdded = true;
        const point = path[i];
        const sequence = i === 0 ? 0 : ++deliverySequence;
        const marker = L.marker([point.latitude, point.longitude], {
          icon: L.divIcon({
            className: "delivery-marker",
            html: `<span class="map-pin ${i === 0 && !this.editable() ? "depot-pin" : ""}" style="--pin-color:${color}"><b>${this.editable() ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' : i === 0 ? "ร้าน" : sequence}</b></span>`,
            iconSize: [36, 40],
            iconAnchor: [18, 36],
          }),
          title: this.editable()
            ? "พิกัดที่เลือก"
            : i === 0
              ? "ร้านผู้ส่ง"
              : `จุดส่ง ${sequence}`,
          keyboard: true,
          draggable: this.editable(),
          autoPan: this.editable(),
          riseOnHover: true,
        });
        const text = document.createElement("div");
        text.textContent = this.editable()
          ? "ตำแหน่งที่เลือก · ลากหมุดเพื่อปรับตำแหน่ง"
          : i === 0
            ? "ร้านผู้ส่ง"
            : "จุดส่ง " + sequence;
        marker.on("dragend", () => this.emitPoint(marker.getLatLng()));
        marker.on("add", () =>
          marker
            .getElement()
            ?.addEventListener("keydown", (originalEvent: KeyboardEvent) => {
              const event = { originalEvent };
              if (!this.editable() || !event.originalEvent.shiftKey) return;
              const directions: Record<string, [number, number]> = {
                ArrowUp: [0, -10],
                ArrowDown: [0, 10],
                ArrowLeft: [-10, 0],
                ArrowRight: [10, 0],
              };
              const delta = directions[event.originalEvent.key];
              if (!delta) return;
              event.originalEvent.preventDefault();
              event.originalEvent.stopPropagation();
              const pixel = m.latLngToContainerPoint(marker.getLatLng());
              this.emitPoint(m.containerPointToLatLng(pixel.add(delta)));
              queueMicrotask(() =>
                this.canvas()
                  .nativeElement.querySelector<HTMLElement>(".delivery-marker")
                  ?.focus(),
              );
            }),
        );
        marker.bindPopup(text).addTo(g);
      }
    }
    if (!this.editable() || !this.fitted) {
      this.fit();
      this.fitted = true;
    }
  }
  fit() {
    const m = this.map,
      g = this.layers;
    if (!m || !g) return;
    const bounds = g.getBounds();
    if (bounds.isValid())
      m.fitBounds(bounds, {
        padding: [40, 45],
        maxZoom: this.editable() ? 17 : 16,
        animate: false,
      });
    else
      m.setView([this.center().latitude, this.center().longitude], 14, {
        animate: false,
      });
  }
  private emitPoint(point: Leaflet.LatLng) {
    if (!this.editable()) return;
    this.pointChange.emit({
      latitude: Number(point.lat.toFixed(6)),
      longitude: Number(point.lng.toFixed(6)),
    });
  }
  locate() {
    if (!this.editable() || this.locating()) return;
    this.mapNotice.set("");
    if (!navigator.geolocation) {
      this.mapNotice.set("อุปกรณ์นี้ไม่รองรับตำแหน่งปัจจุบัน");
      return;
    }
    this.locating.set(true);
    this.geoWatch = navigator.geolocation.watchPosition(
      (position) => {
        if (this.geoWatch !== undefined)
          navigator.geolocation.clearWatch(this.geoWatch);
        this.geoWatch = undefined;
        if (this.destroyed) return;
        this.locating.set(false);
        const { latitude, longitude } = position.coords;
        this.pointChange.emit({ latitude, longitude });
        this.map?.setView([latitude, longitude], 17);
      },
      () => {
        if (this.geoWatch !== undefined)
          navigator.geolocation.clearWatch(this.geoWatch);
        this.geoWatch = undefined;
        if (this.destroyed) return;
        this.locating.set(false);
        this.mapNotice.set(
          "เปิดสิทธิ์ตำแหน่งในเบราว์เซอร์ หรือแตะบนแผนที่เพื่อปักหมุด",
        );
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true },
    );
  }
  toggle() {
    this.expanded.update((v) => !v);
    setTimeout(() => {
      if (!this.destroyed) {
        this.map?.invalidateSize();
        this.fit();
        this.canvas().nativeElement.focus();
      }
    }, 0);
  }
  retry() {
    this.tileCount = 0;
    this.tileError.set(false);
    this.loading.set(true);
    this.tiles?.redraw();
  }
  ngOnDestroy() {
    this.destroyed = true;
    this.resize?.disconnect();
    if (this.geoWatch !== undefined)
      navigator.geolocation.clearWatch(this.geoWatch);
    this.map?.remove();
  }
}
