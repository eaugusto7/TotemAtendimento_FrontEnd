import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { Addon }   from '../models/addon.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private product: Product | null = null;
  private addons: Addon[] = [];

  setProduct(p: Product) { this.product = p; }
  setAddons(a: Addon[])   { this.addons = a; }
  getOrder()              { return { product: this.product, addons: this.addons }; }
}
