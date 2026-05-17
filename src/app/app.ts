import { Component, signal, Inject, Renderer2, OnInit } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { ApiService, Algorithm } from './api.service';
import { AuthModalComponent } from './auth-modal.component';
import { AddAlgoModalComponent } from './add-algo-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AddAlgoModalComponent, AuthModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  isDarkMode = signal(true);
  
  cubeTypes = ['2x2', '3x3', '4x4'];
  selectedCube = signal('3x3');

  categories = ['1 warstwa', 'Ostatnia warstwa', 'Całość'];
  selectedCategory = signal('Całość');

  dictionaryMoves = [
    { move: 'R', desc: 'prawa ściana w górę' },
    { move: "R'", desc: 'prawa ściana w dół' },
    { move: 'L', desc: 'lewa ściana' },
    { move: 'U', desc: 'góra' },
    { move: 'F', desc: 'przód' },
    { move: 'B', desc: 'tył' }
  ];

  algorithms = signal<Algorithm[]>([]);
  loadingAlgos = signal(true);
  selectedAlgorithm = signal<Algorithm | null>(null);
  
  showAuthModal = signal(false);
  showAddAlgoModal = signal(false);

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    public api: ApiService
  ) {
    const savedTheme = localStorage.getItem('rubik_theme') ?? 'dark';
    this.isDarkMode.set(savedTheme === 'dark');
    this.renderer.setAttribute(this.document.body, 'data-theme', savedTheme);
  }

  ngOnInit() {
    this.loadAlgorithms();
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    const newTheme = this.isDarkMode() ? 'dark' : 'light';
    this.renderer.setAttribute(this.document.body, 'data-theme', newTheme);
    localStorage.setItem('rubik_theme', newTheme);
  }

  onFilterChange(type: 'cube' | 'category', event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (type === 'cube') this.selectedCube.set(value);
    if (type === 'category') this.selectedCategory.set(value);
    this.loadAlgorithms();
  }

  loadAlgorithms() {
    this.loadingAlgos.set(true);
    this.api.getAlgorithms(this.selectedCube(), this.selectedCategory()).subscribe({
      next: (algos) => {
        this.algorithms.set(algos);
        this.loadingAlgos.set(false);
        if (algos.length > 0) {
          this.selectedAlgorithm.set(algos[0]);
        } else {
          this.selectedAlgorithm.set(null);
        }
      },
      error: (err) => {
        console.error('Nie można załadować algorytmów z API', err);
        this.loadingAlgos.set(false);
        this.selectedAlgorithm.set(null);
      }
    });
  }

  selectAlgorithm(algo: Algorithm) {
    this.selectedAlgorithm.set(algo);
  }

  logout() {
    this.api.clearAuth();
  }

  onAlgoAdded(added: boolean) {
    this.showAddAlgoModal.set(false);
    if (added) {
      this.loadAlgorithms();
    }
  }
}
