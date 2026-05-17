import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';

@Component({
  selector: 'app-add-algo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-container">
      <div class="modal-backdrop" (click)="close.emit(false)"></div>
      <div class="modal-box">
        <h2>Nowy Algorytm</h2>
        <form class="auth-form" (ngSubmit)="onSubmit()">
          <label>Nazwa (np. T-Perm)<input type="text" [(ngModel)]="algo.name" name="name" required></label>
          <label>Rozmiar kostki
            <select [(ngModel)]="algo.cubeSize" name="cubeSize">
              <option value="2x2">2x2</option>
              <option value="3x3">3x3</option>
              <option value="4x4">4x4</option>
            </select>
          </label>
          <label>Kategoria
            <select [(ngModel)]="algo.category" name="category">
              <option value="1 warstwa">1 warstwa</option>
              <option value="Ostatnia warstwa">Ostatnia warstwa</option>
              <option value="Całość">Całość</option>
            </select>
          </label>
          <label>Ruchy (notacja)<input type="text" [(ngModel)]="algo.moves" name="moves" placeholder="R U R' U'"></label>
          <label>Opis<textarea [(ngModel)]="algo.description" name="description" rows="2"></textarea></label>
          
          <button type="submit" [disabled]="loading">Dodaj algorytm</button>
          @if (error) { <p class="auth-error">{{ error }}</p> }
        </form>
        <button class="close-btn" (click)="close.emit(false)">✕</button>
      </div>
    </div>
  `
})
export class AddAlgoModalComponent {
  api = inject(ApiService);
  @Output() close = new EventEmitter<boolean>(); // emit true if added

  loading = false;
  error = '';
  
  algo = {
    name: '',
    cubeSize: '3x3',
    category: 'Całość',
    moves: '',
    description: ''
  };

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.api.addAlgorithm(this.algo).subscribe({
      next: () => {
        this.loading = false;
        this.close.emit(true);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Błąd dodawania algorytmu';
      }
    });
  }
}
