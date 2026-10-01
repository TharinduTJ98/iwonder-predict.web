import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { App } from './app';
import { SignIn } from '../pages/sign-in/sign-in';
import { AuthService } from '../services/auth-service';
import { HttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from '../services/auth-interceptor';
import { AUTH_LOGIN_URL } from '../services/auth-service';

const validToken = 'header.eyJleHAiOjQxMDI0NDQ4MDB9.signature';

describe('App', () => {
  beforeEach(async () => {
    window.sessionStorage.removeItem('accessToken');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
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
    TestBed.inject(AuthService).signIn('admin', '123').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne(AUTH_LOGIN_URL)
      .flush({ accessToken: validToken });
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-dashboard')).not.toBeNull();
  });

  it('should attach the JWT only to requests sent to the auth API origin', () => {
    TestBed.inject(AuthService).signIn('admin', '123').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne(AUTH_LOGIN_URL)
      .flush({ accessToken: validToken });

    const http = TestBed.inject(HttpClient);
    http.get('https://localhost:7081/api/Forecast').subscribe();
    http.get('https://iwonder-gzewb3d3hwafhma7.indiasouthcentral-01.azurewebsites.net/api/Forecast').subscribe();

    const httpTesting = TestBed.inject(HttpTestingController);
    const localRequest = httpTesting.expectOne('https://localhost:7081/api/Forecast');
    expect(localRequest.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
    localRequest.flush([]);

    const forecastRequest = httpTesting.expectOne('https://iwonder-gzewb3d3hwafhma7.indiasouthcentral-01.azurewebsites.net/api/Forecast');
    expect(forecastRequest.request.headers.has('Authorization')).toBe(false);
    forecastRequest.flush([]);
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
    TestBed.inject(HttpTestingController)
      .expectOne(AUTH_LOGIN_URL)
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(app.auth.isAuthenticated()).toBe(false);
    expect(signIn.loginError).toContain('credentials');

    signIn.password = '123';
    signIn.signIn();
    TestBed.inject(HttpTestingController)
      .expectOne(AUTH_LOGIN_URL)
      .flush({ accessToken: validToken });
    await fixture.whenStable();
    fixture.detectChanges();
    app.signOut();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(app.auth.isAuthenticated()).toBe(false);
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Welcome back');
  });
});
