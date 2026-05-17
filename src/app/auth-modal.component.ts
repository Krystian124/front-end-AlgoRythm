import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-container">
      <div class="modal-backdrop" (click)="close.emit()"></div>
      <div class="modal-box">
        <h2>{{ activeTab === 'login' ? 'Logowanie' : 'Rejestracja' }}</h2>

        <div class="modal-tabs">
          <button class="tab-btn" [class.active]="activeTab === 'login'" (click)="activeTab = 'login'">Zaloguj</button>
          <button class="tab-btn" [class.active]="activeTab === 'register'" (click)="activeTab = 'register'">Rejestracja</button>
        </div>

        <!-- LOGIN -->
        @if (activeTab === 'login') {
          <form class="auth-form" (ngSubmit)="onLogin()">
            <label>Email<input type="email" [(ngModel)]="loginData.email" name="email" required></label>
            <label>Hasło<input type="password" [(ngModel)]="loginData.password" name="password" required></label>
            <button type="submit" [disabled]="loading">Zaloguj się</button>
            @if (error) { <p class="auth-error">{{ error }}</p> }
          </form>
        }

        <!-- REGISTER -->
        @if (activeTab === 'register') {
          <form class="auth-form" (ngSubmit)="onRegister()">
            <label>Nazwa użytkownika<input type="text" [(ngModel)]="registerData.username" name="username" required minlength="3"></label>
            <label>Email<input type="email" [(ngModel)]="registerData.email" name="email" required></label>
            <label>Hasło (min. 6 znaków)<input type="password" [(ngModel)]="registerData.password" name="password" required minlength="6"></label>
            <button type="submit" [disabled]="loading">Utwórz konto</button>
            @if (error) { <p class="auth-error" [style.color]="success ? '#4caf50' : '#ff6b6b'">{{ error }}</p> }
          </form>
        }

        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>
    </div>
  `
})
export class AuthModalComponent {
  api = inject(ApiService);
  @Output() close = new EventEmitter<void>();

  activeTab: 'login' | 'register' = 'login';
  loading = false;
  error = '';
  success = false;

  loginData = { email: '', password: '' };
  registerData = { username: '', email: '', password: '' };

  onLogin() {
    this.loading = true;
    this.error = '';
    this.api.login(this.loginData).subscribe({
      next: () => {
        this.loading = false;
        this.close.emit();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Błąd logowania';
      }
    });
  }

  onRegister() {
    this.loading = true;
    this.error = '';
    this.success = false;
    this.api.register(this.registerData).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.error = 'Konto utworzone! Możesz się teraz zalogować.';
        setTimeout(() => {
          this.activeTab = 'login';
          this.error = '';
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Błąd rejestracji';
      }
    });
  }
}
