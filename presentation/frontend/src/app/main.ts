import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DialogOverlayContainer } from './shared/overlay-container';
import { AppComponent } from './app';
import { routes } from './app.routes';
bootstrapApplication(AppComponent, {
  providers: [
    { provide: OverlayContainer, useClass: DialogOverlayContainer },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
  ],
}).catch(console.error);
