import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Algorithm {
  id: number;
  name: string;
  cubeSize: string;
  category: string;
  moves?: string;
  description?: string;
  animationType: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = 'http://localhost:3001/api';
  private http = inject(HttpClient);

  currentUser = signal<User | null>(this.getSavedUser());
  
  private getSavedUser(): User | null {
    const userStr = localStorage.getItem('rubik_user');
    if (userStr && userStr !== 'undefined') {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  get token(): string | null {
    return localStorage.getItem('rubik_token');
  }

  setToken(token: string) {
    localStorage.setItem('rubik_token', token);
  }

  clearAuth() {
    console.log('[API] Wylogowywanie użytkownika: czyszczenie sesji i tokenu z localStorage');
    localStorage.removeItem('rubik_token');
    localStorage.removeItem('rubik_user');
    this.currentUser.set(null);
  }

  private getHeaders() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return headers;
  }

  getAlgorithms(cubeSize?: string, category?: string): Observable<Algorithm[]> {
    console.log(`[API] Pobieranie algorytmów z filtrami: cubeSize="${cubeSize || 'wszystkie'}", category="${category || 'wszystkie'}"`);
    const params: any = {};
    if (cubeSize) params.cubeSize = cubeSize;
    if (category) params.category = category;

    return this.http.get<any>(`${this.API_URL}/algorithms`, { 
      params, 
      headers: this.getHeaders() 
    }).pipe(
      map(res => {
        console.log(`[API] Pomyślnie pobrano algorytmy. Liczba rekordów: ${res.data?.length || 0}`);
        return res.data || [];
      })
    );
  }

  login(credentials: any): Observable<any> {
    console.log(`[API] Próba logowania dla emailu: ${credentials.email}`);
    return this.http.post<any>(`${this.API_URL}/auth/login`, credentials).pipe(
      map(res => res.data),
      tap((data: any) => {
        console.log(`[API] Zalogowano pomyślnie. Zapisuję sesję dla użytkownika:`, data.user);
        this.setToken(data.access_token);
        localStorage.setItem('rubik_user', JSON.stringify(data.user));
        this.currentUser.set(data.user);
      })
    );
  }

  register(data: any): Observable<any> {
    console.log(`[API] Próba rejestracji użytkownika: username="${data.username}", email="${data.email}"`);
    return this.http.post<any>(`${this.API_URL}/auth/register`, data).pipe(
      map(res => {
        console.log('[API] Rejestracja zakończona sukcesem. Odpowiedź serwera:', res.data);
        return res.data;
      })
    );
  }

  addAlgorithm(algo: any): Observable<any> {
    console.log(`[API] Próba dodania nowego algorytmu: name="${algo.name}", cubeSize="${algo.cubeSize}", category="${algo.category}"`);
    return this.http.post<any>(`${this.API_URL}/algorithms`, algo, { 
      headers: this.getHeaders() 
    }).pipe(
      map(res => {
        console.log('[API] Algorytm dodany pomyślnie. Odpowiedź serwera:', res.data);
        return res.data;
      })
    );
  }
}

