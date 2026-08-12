import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './AuthService';

export const dashboardGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const role = authService.role();

  if (!role) {
    return router.createUrlTree(['/login']);
  }

  // Map custom roles to a dashboard path segment
  const dashboardSegment =
    role === 'custom_role_1' || role === 'custom_role_2' ? 'officer' : role;

  const path = state.url;

  // If accessing the main dashboard path, redirect to their role-specific dashboard
  if (path === '/app/dashboard' || path === '/app/dashboard/') {
    return router.createUrlTree([`/app/dashboard/${dashboardSegment}`]);
  }

  // Admin can access any sub-dashboard
  if (role === 'admin') {
    return true;
  }

  // Non-admins can only access their specific dashboard path
  const segments = path.split('?')[0].split('/');
  const targetDashboard = segments[segments.length - 1];

  if (targetDashboard === dashboardSegment) {
    return true;
  }

  // Redirect unauthorized dashboard access to user's dashboard
  return router.createUrlTree([`/app/dashboard/${dashboardSegment}`]);
};

