import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';

const authenticatedGuard: CanActivateFn = (_route, state) => {
	const auth = inject(AuthService);
	const router = inject(Router);

	return auth.isAuthenticated()
		? true
		: router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
};

const loadPanelComparison = () =>
	import('../pages/panel-comparison/panel-comparison').then(module => module.PanelComparison);

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
	{
		path: 'dashboard',
		canActivate: [authenticatedGuard],
		loadComponent: () => import('../pages/dashboard/dashboard').then(module => module.Dashboard)
	},
	{
		path: 'comparison',
		canActivate: [authenticatedGuard],
		loadComponent: loadPanelComparison
	},
	{
		path: 'comparison/:panel',
		canActivate: [authenticatedGuard],
		loadComponent: loadPanelComparison
	},
	{
		path: 'comparison/:panel/:product',
		canActivate: [authenticatedGuard],
		loadComponent: loadPanelComparison
	},
	{
		path: 'sign-in',
		loadComponent: () => import('../pages/sign-in/sign-in').then(module => module.SignIn)
	},
	{ path: '**', redirectTo: 'dashboard' }
];
