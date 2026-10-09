import { Component } from '@angular/core';

@Component({
  selector: 'app-rider-illustration',
  template: `
    <svg viewBox="0 0 340 250" role="img" aria-label="ไรเดอร์ส่งข้าวกล่อง">
      <ellipse cx="176" cy="226" rx="128" ry="11" fill="#2a170a" opacity="0.08" />
      <rect x="14" y="118" width="52" height="7" rx="3.5" fill="#ffd3bf" />
      <rect x="32" y="140" width="36" height="7" rx="3.5" fill="#ffe4d6" />
      <rect x="6" y="162" width="62" height="7" rx="3.5" fill="#ffd3bf" />
      <circle cx="118" cy="198" r="27" fill="#1d1f24" />
      <circle cx="118" cy="198" r="11" fill="#d9d2cb" />
      <circle cx="252" cy="198" r="27" fill="#1d1f24" />
      <circle cx="252" cy="198" r="11" fill="#d9d2cb" />
      <rect x="76" y="78" width="84" height="74" rx="12" fill="#ff5a1f" />
      <rect x="76" y="78" width="84" height="20" rx="10" fill="#e8470f" />
      <path d="M100 120h36" stroke="#fff" stroke-width="7" stroke-linecap="round" />
      <path d="M106 134h24" stroke="#ffd3bf" stroke-width="5" stroke-linecap="round" />
      <path
        d="M92 186c0-20 14-30 32-30h74l26-44h22l-9 16 22 50c3 8-2 14-10 14h-34c-4-18-16-26-32-26h-34c-14 0-22 8-24 22H100c-5 0-8-1-8-2z"
        fill="#ff5a1f"
      />
      <rect x="134" y="146" width="66" height="14" rx="7" fill="#1d1f24" />
      <path d="M224 112l12-18" stroke="#1d1f24" stroke-width="7" stroke-linecap="round" />
      <path d="M226 92h20" stroke="#1d1f24" stroke-width="7" stroke-linecap="round" />
      <circle cx="252" cy="128" r="7" fill="#ffb800" />
      <path d="M160 146c-4-30 4-50 20-54 14-3 24 4 28 16" fill="#2d3038" />
      <path d="M186 104c16 2 30-2 42-8" stroke="#2d3038" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M166 146l20 26h24" stroke="#454a55" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="184" cy="70" r="22" fill="#ff5a1f" />
      <path d="M184 64h22a7 7 0 0 1 0 14h-16" fill="#1d1f24" opacity="0.9" />
      <path d="M166 62a20 20 0 0 1 30-12" stroke="#ffd3bf" stroke-width="4" stroke-linecap="round" fill="none" />
      <g transform="translate(270 34)">
        <path d="M0 22a22 22 0 1 1 44 0c0 16-22 34-22 34S0 38 0 22z" fill="#12a150" />
        <circle cx="22" cy="22" r="8" fill="#fff" />
      </g>
      <path d="M262 60c-20 8-34 18-40 30" stroke="#12a150" stroke-width="3" stroke-dasharray="4 6" fill="none" stroke-linecap="round" />
    </svg>
  `,
  styles: [':host{display:block} svg{width:100%;height:auto}'],
})
export class RiderIllustrationComponent {}
