import { Component } from '@angular/core';

@Component({
  selector: 'app-route-illustration',
  template: `
    <svg viewBox="0 0 220 160" role="img" aria-label="แผนที่เส้นทาง">
      <rect x="10" y="12" width="200" height="136" rx="20" fill="#fff4ee" />
      <path d="M10 60h200M10 110h200M70 12v136M150 12v136" stroke="#ffe4d6" stroke-width="10" />
      <path d="M44 120c20-30 40-10 56-40s40-24 58-46" stroke="#e5383b" stroke-width="5" fill="none" stroke-linecap="round" />
      <path d="M44 120c30 6 60-6 90 4s40 0 52-14" stroke="#12a150" stroke-width="5" fill="none" stroke-linecap="round" />
      <path d="M44 120c-4-26 10-50 6-80" stroke="#2f6fed" stroke-width="5" fill="none" stroke-linecap="round" />
      <rect x="30" y="106" width="28" height="28" rx="9" fill="#1d1f24" />
      <path d="M38 118l2-6h8l2 6M39 118v8h10v-8" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round" />
      <circle cx="158" cy="34" r="9" fill="#e5383b" stroke="#fff" stroke-width="3" />
      <circle cx="186" cy="110" r="9" fill="#12a150" stroke="#fff" stroke-width="3" />
      <circle cx="50" cy="40" r="9" fill="#2f6fed" stroke="#fff" stroke-width="3" />
      <circle cx="100" cy="80" r="7" fill="#e5383b" stroke="#fff" stroke-width="3" />
      <circle cx="134" cy="124" r="7" fill="#12a150" stroke="#fff" stroke-width="3" />
    </svg>
  `,
  styles: [':host{display:block} svg{width:100%;height:auto}'],
})
export class RouteIllustrationComponent {}
