import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OverlaysComponent } from './shared/components/overlays.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OverlaysComponent],
  template: `<router-outlet /><app-overlays />`,
})
export class App {}
