import { Component } from '@angular/core';

@Component({
  selector: 'app-food-box-illustration',
  template: `
    <svg viewBox="0 0 200 160" role="img" aria-label="ข้าวกล่อง">
      <ellipse cx="100" cy="146" rx="74" ry="7" fill="#2a170a" opacity="0.08" />
      <path d="M38 70h124l-10 62a10 10 0 0 1-10 8H58a10 10 0 0 1-10-8z" fill="#ff5a1f" />
      <path d="M48 70h104l-2 12H50z" fill="#e8470f" />
      <ellipse cx="100" cy="70" rx="64" ry="12" fill="#fff8f0" />
      <circle cx="78" cy="64" r="12" fill="#fff" stroke="#f1e6dc" stroke-width="2" />
      <circle cx="96" cy="58" r="13" fill="#fff" stroke="#f1e6dc" stroke-width="2" />
      <path d="M108 64c6-12 24-14 32-4-6 10-22 12-32 4z" fill="#12a150" />
      <circle cx="122" cy="68" r="7" fill="#e5383b" />
      <circle cx="134" cy="66" r="5" fill="#ffb800" />
      <path d="M72 102h56" stroke="#fff" stroke-width="7" stroke-linecap="round" />
      <path d="M84 116h32" stroke="#ffd3bf" stroke-width="5" stroke-linecap="round" />
      <path d="M70 34c0-8 8-8 8-16M96 30c0-8 8-8 8-16M122 34c0-8 8-8 8-16" stroke="#ffb3a1" stroke-width="4" stroke-linecap="round" fill="none" />
    </svg>
  `,
  styles: [':host{display:block} svg{width:100%;height:auto}'],
})
export class FoodBoxIllustrationComponent {}
