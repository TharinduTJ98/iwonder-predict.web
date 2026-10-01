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
  username = '';
  password = '';
  loginError = '';
  signingIn = false;

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
}