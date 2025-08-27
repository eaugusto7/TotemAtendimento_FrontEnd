import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AddonDTO {
  id?: string;        
  name: string;
  description?: string;
  price: number;
  imageName: string;  
}

@Injectable({ providedIn: 'root' })
export class AddonService {
  private base = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  list(): Observable<AddonDTO[]> {
    return this.http.get<AddonDTO[]>(`${this.base}/api/addons`);
  }
}
