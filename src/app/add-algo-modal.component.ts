import { Component, inject, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Scheme } from './api.service';

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
            <select [(ngModel)]="algo.cubeSize" name="cubeSize" (change)="onCubeSizeChange()">
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
          
          <div class="techniques-timeline">
            <label>Sekwencja Schematów:</label>
            
            @if (loadingSchemes()) {
              <p style="opacity: 0.7;">Ładowanie schematów...</p>
            } @else {
              <!-- Timeline -->
              <div class="timeline">
                @for (scheme of schemesSequence(); track $index; let idx = $index) {
                  <div class="timeline-item">
                    <div class="timeline-node">
                      <button type="button" (click)="removeScheme(idx)" class="remove-tech-btn" title="Usuń">×</button>
                    </div>
                    <div class="timeline-tech">
                      {{ scheme.name }}
                    </div>
                    @if (idx < schemesSequence().length - 1) {
                      <div class="timeline-arrow">→</div>
                    }
                  </div>
                }
                
                <!-- Przycisk dodania kolejnego schematu -->
                <div class="timeline-item">
                  <div class="timeline-node">
                    <button type="button" (click)="showDropdown.set(!showDropdown())" class="add-tech-btn">
                      +
                    </button>
                  </div>
                </div>
              </div>

              <!-- Dropdown do wyboru schematu -->
              @if (showDropdown()) {
                <div class="technique-dropdown">
                  @for (scheme of filteredSchemes(); track scheme.id) {
                    <button 
                      type="button" 
                      (click)="addScheme(scheme)"
                      class="technique-option"
                    >
                      {{ scheme.name }} - {{ scheme.moves }}
                    </button>
                  }
                </div>
              }
            }
          </div>

          <label>Dodatkowe ruchy (notacja - opcjonalnie)
            <input 
              type="text" 
              [(ngModel)]="algo.moves" 
              name="moves" 
              placeholder="np. R U R' U' (poza głównymi schematami)"
            >
          </label>
          
          <label>Opis<textarea [(ngModel)]="algo.description" name="description" rows="2"></textarea></label>
          
          <button type="submit" [disabled]="loading || schemesSequence().length === 0">Dodaj algorytm</button>
          @if (error) { <p class="auth-error">{{ error }}</p> }
          @if (schemesSequence().length === 0) { 
            <p class="auth-error" style="color: #ff9800;">Dodaj co najmniej jeden schemat</p> 
          }
        </form>
        <button class="close-btn" (click)="close.emit(false)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .techniques-timeline {
      margin: 12px 0;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }

    .techniques-timeline > label {
      display: block;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .timeline {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .timeline-node {
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .remove-tech-btn,
    .add-tech-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--accent);
      background: transparent;
      color: var(--accent);
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-weight: bold;
    }

    .remove-tech-btn:hover {
      background: rgba(255, 0, 0, 0.2);
      border-color: #ff4444;
      color: #ff4444;
    }

    .add-tech-btn {
      border-color: var(--accent);
    }

    .add-tech-btn:hover {
      background: var(--accent);
      color: #fff;
    }

    .timeline-tech {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      font-size: 13px;
      white-space: nowrap;
      font-weight: 500;
    }

    .timeline-arrow {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.5);
      margin: 0 2px;
    }

    .technique-dropdown {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 6px;
      padding: 10px;
      background: rgba(20, 20, 30, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
    }

    .technique-option {
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      border-radius: 4px;
      text-align: left;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .technique-option:hover {
      background: var(--accent);
      border-color: var(--accent);
    }
  `]
})
export class AddAlgoModalComponent implements OnInit {
  api = inject(ApiService);
  @Output() close = new EventEmitter<boolean>();

  loading = false;
  error = '';
  loadingSchemes = signal(true);
  schemesSequence = signal<Scheme[]>([]);
  allSchemes = signal<Scheme[]>([]);
  filteredSchemes = signal<Scheme[]>([]);
  showDropdown = signal(false);
  
  algo = {
    name: '',
    cubeSize: '3x3',
    category: 'Całość',
    moves: '',
    description: ''
  };

  ngOnInit() {
    this.loadSchemes();
  }

  loadSchemes() {
    this.loadingSchemes.set(true);
    this.api.getSchemes().subscribe({
      next: (schemes) => {
        this.allSchemes.set(schemes);
        this.updateFilteredSchemes();
        this.loadingSchemes.set(false);
      },
      error: (err) => {
        console.error('Error loading schemes:', err);
        this.loadingSchemes.set(false);
        this.error = 'Błąd ładowania schematów';
      }
    });
  }

  onCubeSizeChange() {
    this.updateFilteredSchemes();
    this.schemesSequence.set([]);
    this.showDropdown.set(false);
  }

  updateFilteredSchemes() {
    // Tutaj możesz dodać logikę filtrowania schematów po rozmiarze kostki
    // Na razie pokazujemy wszystkie schematy
    this.filteredSchemes.set(this.allSchemes());
  }

  addScheme(scheme: Scheme) {
    this.schemesSequence.update(sequence => [...sequence, scheme]);
    this.showDropdown.set(false);
  }

  removeScheme(idx: number) {
    this.schemesSequence.update(sequence => sequence.filter((_, i) => i !== idx));
  }

  onSubmit() {
    if (this.schemesSequence().length === 0) {
      this.error = 'Dodaj co najmniej jeden schemat';
      return;
    }

    this.loading = true;
    this.error = '';
    
    // Użyj pierwszego schematu z sekwencji jako główny
    const mainScheme = this.schemesSequence()[0];
    
    const submissionData = {
      name: this.algo.name,
      cubeSize: this.algo.cubeSize,
      category: this.algo.category,
      schemeId: mainScheme.id,
      moves: this.algo.moves || '',
      description: this.algo.description
    };

    this.api.addAlgorithm(submissionData).subscribe({
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
