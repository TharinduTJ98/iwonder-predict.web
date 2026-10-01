import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn {
  mode: 'sign-in' | 'register' = 'sign-in';
  username = '';
  password = '';
  confirmPassword = '';
  loginError = '';
  registrationError = '';
  registrationSuccess = '';
  signingIn = false;
  registering = false;

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  signIn(): void {
    this.loginError = '';
    this.signingIn = true;
    this.auth.signIn(this.username.trim(), this.password).subscribe({
      next: () => {
        this.signingIn = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
          ? returnUrl
          : '/dashboard';
        void this.router.navigateByUrl(destination);
      },
      error: () => {
        this.signingIn = false;
        this.loginError = 'Sign-in failed. Check your credentials and try again.';
      }
    });
  }

  register(): void {
    this.registrationError = '';
    this.registrationSuccess = '';
    if (this.password !== this.confirmPassword) {
      this.registrationError = 'Passwords do not match.';
      return;
    }

    this.registering = true;
    this.auth.register(this.username.trim(), this.password).subscribe({
      next: () => {
        this.registering = false;
        this.mode = 'sign-in';
        this.confirmPassword = '';
        this.password = '';
        this.loginError = '';
        this.registrationSuccess = 'Account created. Sign in with your new credentials.';
      },
      error: () => {
        this.registering = false;
        this.registrationError = 'Account creation failed. Check your details and try again.';
      }
    });
  }
}