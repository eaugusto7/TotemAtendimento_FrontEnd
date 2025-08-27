import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  id?: string;         
  name: string;
  description: string;
  price: number;
  imageName: string;   
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/api/products`);
  }
}