import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { App } from './app';
import { SignIn } from '../pages/sign-in/sign-in';
import { AuthService } from '../services/auth-service';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show the sign-in page before accessing the dashboard', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Welcome back');
    expect(compiled.querySelector('app-dashboard')).toBeNull();
  });

  it('should show the dashboard after valid credentials are submitted', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(AuthService).signIn('admin', '123');
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-dashboard')).not.toBeNull();
  });

  it('should reject invalid credentials and return to sign-in after signing out', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;
    const signIn = fixture.debugElement.query(By.directive(SignIn)).componentInstance as SignIn;
    signIn.username = 'admin';
    signIn.password = 'incorrect';
    signIn.signIn();
    fixture.detectChanges();

    expect(app.auth.isAuthenticated()).toBe(false);
    expect(signIn.loginError).toContain('did not match');

    signIn.password = '123';
    signIn.signIn();
    await fixture.whenStable();
    fixture.detectChanges();
    app.signOut();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(app.auth.isAuthenticated()).toBe(false);
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Welcome back');
  });
});
