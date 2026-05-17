import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
    if (userStr) {
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
    const params: any = {};
    if (cubeSize) params.cubeSize = cubeSize;
    if (category) params.category = category;

    return this.http.get<Algorithm[]>(`${this.API_URL}/algorithms`, { 
      params, 
      headers: this.getHeaders() 
    });
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((res: any) => {
        this.setToken(res.access_token);
        localStorage.setItem('rubik_user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, data);
  }

  addAlgorithm(algo: any): Observable<any> {
    return this.http.post(`${this.API_URL}/algorithms`, algo, { 
      headers: this.getHeaders() 
    });
  }
}
