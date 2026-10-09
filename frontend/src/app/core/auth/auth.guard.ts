import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const ownerGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (await auth.ensureSession()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};
