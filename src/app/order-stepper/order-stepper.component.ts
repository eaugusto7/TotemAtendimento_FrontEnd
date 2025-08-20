import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../models/product.model';
import { Addon }   from '../models/addon.model';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order-stepper',
  templateUrl: './order-stepper.component.html',
  styleUrls: ['./order-stepper.component.css']
})
export class OrderStepperComponent implements OnInit {
  productForm!: FormGroup;
  addonForm!: FormGroup;

  products: Product[] = [
    { id: 1, name: 'Cachorro Quente Simples', price: 9.90, imageUrl: 'assets/hotdog1.png', description: 'Pão macio, salsicha, molho e batata palha. Clássico e rápido.' },
    { id: 2, name: 'Cachorro Com Vinagrete', price: 17.90, imageUrl: 'assets/hotdog2.png', description: 'Salsicha, molho, vinagrete fresquinho e batata palha crocante.' },
    { id: 3, name: 'Cachorro Especial', price: 22.50, imageUrl: 'assets/hotdog3.png', description: 'Com tudo: queijo, bacon, maionese e mais.' }
  ];

  addons: Addon[] = [
    { id: 1, name: 'Cheddar', price: 2.00, imageUrl: 'assets/cheddar.png' },
    { id: 2, name: 'Bacon',   price: 3.00, imageUrl: 'assets/bacon.png' }
  ];

  constructor(private fb: FormBuilder, public orderService: OrderService) {}

  ngOnInit() {
    this.productForm = this.fb.group({ product: [null, Validators.required] });
    this.addonForm   = this.fb.group({ addons: [[]] });
  }

  selectProduct(p: Product) {
    this.productForm.setValue({ product: p });
    this.orderService.setProduct(p);
  }

  toggleAddon(a: Addon) {
    const current: Addon[] = this.addonForm.value.addons || [];
    const idx = current.findIndex(x => x.id === a.id);
    if (idx > -1) current.splice(idx, 1);
    else current.push(a);
    this.addonForm.patchValue({ addons: [...current] });
    this.orderService.setAddons(current);
  }

  isProductSelected(p: Product): boolean {
    return this.orderService.getOrder().product?.id === p.id;
  }

  isAddonSelected(a: Addon): boolean {
    return this.orderService.getOrder().addons.some(ad => ad.id === a.id);
  }

  get total(): number {
    const o = this.orderService.getOrder();
    return (o.product?.price||0) + o.addons.reduce((s,x)=>s+x.price,0);
  }
}
