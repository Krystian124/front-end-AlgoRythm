import { Component, signal, Inject, Renderer2, OnInit } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { ApiService, Algorithm, Scheme } from './api.service';
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
    { move: 'Legenda', desc: '→ bez apostrofu ( \' ) = ze wskazówkami zegara | z apostrofem ( \' ) = przeciwnie do wskazówek zegara' },
    { move: 'R', desc: 'Prawa ściana - ze wskazówkami zegara' },
    { move: "R'", desc: 'Prawa ściana - przeciwnie do wskazówek zegara' },
    { move: 'R2', desc: 'Prawa ściana - obrót o 180°' },
    { move: 'L', desc: 'Lewa ściana - ze wskazówkami zegara' },
    { move: "L'", desc: 'Lewa ściana - przeciwnie do wskazówek zegara' },
    { move: 'L2', desc: 'Lewa ściana - obrót o 180°' },
    { move: 'U', desc: 'Górna ściana - ze wskazówkami zegara' },
    { move: "U'", desc: 'Górna ściana - przeciwnie do wskazówek zegara' },
    { move: 'U2', desc: 'Górna ściana - obrót o 180°' },
    { move: 'F', desc: 'Przednia ściana - ze wskazówkami zegara' },
    { move: "F'", desc: 'Przednia ściana - przeciwnie do wskazówek zegara' },
    { move: 'F2', desc: 'Przednia ściana - obrót o 180°' }
  ];

  algorithms = signal<Algorithm[]>([]);
  allSchemes = signal<Scheme[]>([]);
  loadingAlgos = signal(true);
  selectedAlgorithm = signal<Algorithm | null>(null);
  selectedSchemeBlock = signal<string | null>(null);  // Schemat wybrany do wyświetlenia ruchów
  selectedDictionaryMove = signal<string | null>(null);  // Ruch wybrany ze słownika

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
    this.loadSchemes();
  }

  loadSchemes() {
    this.api.getSchemes().subscribe({
      next: (schemes) => {
        this.allSchemes.set(schemes);
        // Ładuj algorytmy DOPIERO po załadowaniu schematów
        this.loadAlgorithms();
      },
      error: (err) => {
        console.error('Nie można załadować schematów z API', err);
        // Załaduj algorytmy nawet jeśli schematy się nie załadowały
        this.loadAlgorithms();
      }
    });
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
    this.selectedSchemeBlock.set(null);  // Reset wybranego bloku
  }

  selectSchemeBlock(movesNotation: string) {
    this.selectedSchemeBlock.set(movesNotation);
  }

  selectDictionaryMove(move: string) {
    this.selectedDictionaryMove.set(move === this.selectedDictionaryMove() ? null : move);
  }

  getSelectedMove(): string | null {
    const block = this.selectedSchemeBlock();
    if (!block) return null;
    // Format: "scheme.id-$index-move"
    const parts = block.split('-');
    return parts[parts.length - 1] || null;
  }

  getVideoSrc(): string {
    // Najpierw sprawdź czy wybrany ruch ze słownika
    const dictionaryMove = this.selectedDictionaryMove();
    if (dictionaryMove && dictionaryMove !== 'Legenda') {
      const safeName = dictionaryMove.replace(/'/g, '-prime');
      return `assets/${safeName}.mkv`;
    }
    
    const selectedMove = this.getSelectedMove();
    if (selectedMove) {
      // Spróbuj wideo dla konkretnego ruchu
      const safeName = selectedMove.replace(/'/g, '-prime');
      return `assets/${safeName}.mkv`;
    }
    // Wpadnij na wideo algorytmu
    return `assets/animations/${(this.selectedAlgorithm()?.name?.toLowerCase() || 'default')}.mp4`;
  }

  getSchemeMovesArray(): string[] {
    const scheme = this.selectedAlgorithm()?.scheme;
    if (!scheme) return [];
    return scheme.moves.split(' ').filter(m => m.trim().length > 0);
  }

  getSelectedAlgorithmSchemes(): Scheme[] {
    const algo = this.selectedAlgorithm();
    if (!algo || !algo.moves) return [];
    const ids = algo.moves.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    return ids.map(id => this.allSchemes().find(s => s.id === id)).filter((s): s is Scheme => !!s);
  }

  getAlgorithmSchemes(algo: Algorithm): Scheme[] {
    if (!algo || !algo.moves) return [];
    const ids = algo.moves.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    return ids.map(id => this.allSchemes().find(s => s.id === id)).filter((s): s is Scheme => !!s);
  }

  logout() {
    this.api.clearAuth();
    this.loadAlgorithms();
  }

  onAlgoAdded(added: boolean) {
    this.showAddAlgoModal.set(false);
    if (added) {
      this.loadAlgorithms();
    }
  }
}
