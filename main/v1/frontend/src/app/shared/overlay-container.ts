import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
// Native <dialog> is in the browser top layer. Keep Material popups inside it.
@Injectable()
export class DialogOverlayContainer extends OverlayContainer {
  private observer?: MutationObserver;
  private move(container: HTMLElement) {
    const active = this._document.activeElement?.closest('dialog[open]');
    const parent = active || this._document.querySelector('dialog[open]') || this._document.body;
    if (container.parentElement !== parent) parent.appendChild(container);
  }
  override ngOnDestroy() {
    this.observer?.disconnect();
    super.ngOnDestroy();
  }

  override getContainerElement(): HTMLElement {
    const container = super.getContainerElement();
    this.move(container);
    if (!this.observer) {
      this.observer = new MutationObserver(() => this.move(container));
      this.observer.observe(this._document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['open'],
      });
    }
    return container;
  }
}
