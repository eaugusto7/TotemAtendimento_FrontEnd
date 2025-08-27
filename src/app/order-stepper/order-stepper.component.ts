import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as QRCode from 'qrcode';                         // ⬅️ gera QR local

import { environment } from '../../environments/environment';

import { Product } from '../models/product.model';
import { Addon }   from '../models/addon.model';
import { ProductService } from '../services/product.service';
import { AddonService }   from '../services/addon.service';
import { OrderService }   from '../services/order.service';

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';

interface PaymentResponse {
  status: 'approved' | 'pending' | 'failed' | string;
  transaction_id?: string;
  message?: string;
  qr_code?: string;   // base64 png (com ou sem prefixo data:)
  pix_code?: string;  // copia-e-cola
  receipt_data?: string;
}

@Component({
  selector: 'app-order-stepper',
  templateUrl: './order-stepper.component.html',
  styleUrls: ['./order-stepper.component.css']
})
export class OrderStepperComponent implements OnInit {

  productForm!: FormGroup;
  addonForm!: FormGroup;

  paymentForm!: FormGroup;
  isPaying = false;

  products: Product[] = [];
  addons:   Addon[]   = [];

  brands = [
    { key: 'VISA',        label: 'Visa',        img: 'assets/flags/visa.png' },
    { key: 'MASTERCARD',  label: 'Mastercard',  img: 'assets/flags/mastercard.png' },
    { key: 'ELO',         label: 'Elo',         img: 'assets/flags/elo.png' },
    { key: 'AMEX',        label: 'Amex',        img: 'assets/flags/amex.png' },
    { key: 'HIPERCARD',   label: 'Hipercard',   img: 'assets/flags/hipercard.png' },
  ];

  // ▶️ PIX: dados para exibir
  pixQrDataUrl: string | null = null;   // data:image/png;base64,....
  pixCode: string | null = null;        // copia-e-cola

  loadingProducts = false;
  loadingAddons   = false;
  loadError: string | null = null;

  constructor(
    private fb: FormBuilder,
    public  orderService: OrderService,
    private productService: ProductService,
    private addonService:   AddonService,
    private http: HttpClient,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Step 1
    this.productForm = this.fb.group({
      productId: [null, Validators.required]
    });

    // Step 2
    this.addonForm = this.fb.group({
      selectedAddons: [[]]
    });

    // Step 4 (pagamento unificado)
    this.paymentForm = this.fb.group({
      method:       ['PIX', Validators.required],
      // cartão
      brand:        [''],
      card_number:  [''],
      card_holder:  [''],
      expiry_month: [''],
      expiry_year:  [''],
      cvv:          [''],
      // PIX
      buyer_name:   [''],
      buyer_cpf:    [''],
    });

    this.configureValidatorsFor(this.paymentForm.value.method);
    this.paymentForm.get('method')!.valueChanges.subscribe((m: PaymentMethod) => {
      this.configureValidatorsFor(m);
      // trocou o método? limpa preview de PIX
      this.pixQrDataUrl = null;
      this.pixCode = null;
    });

    this.fetchProducts();
    this.fetchAddons();
  }

  // ===== Validadores dinâmicos =====
  private setV(c: AbstractControl, v: any[]) {
    c.setValidators(v);
    c.updateValueAndValidity({ emitEvent: false });
  }
  private configureValidatorsFor(method: PaymentMethod) {
    const f = this.paymentForm;
    const brand        = f.get('brand')!;
    const card_number  = f.get('card_number')!;
    const card_holder  = f.get('card_holder')!;
    const expiry_month = f.get('expiry_month')!;
    const expiry_year  = f.get('expiry_year')!;
    const cvv          = f.get('cvv')!;
    const buyer_name   = f.get('buyer_name')!;
    const buyer_cpf    = f.get('buyer_cpf')!;

    if (method === 'PIX') {
      this.setV(buyer_name, [Validators.required, Validators.minLength(3)]);
      this.setV(buyer_cpf,  [Validators.required, Validators.pattern(/^\d{11}$/)]);
      this.setV(brand,       []);
      this.setV(card_number, []);
      this.setV(card_holder, []);
      this.setV(expiry_month,[]);
      this.setV(expiry_year, []);
      this.setV(cvv,         []);
    } else {
      this.setV(brand,        [Validators.required]);
      this.setV(card_number,  [Validators.required, Validators.minLength(13), Validators.maxLength(19)]);
      this.setV(card_holder,  [Validators.required, Validators.minLength(3)]);
      this.setV(expiry_month, [Validators.required, Validators.pattern(/^(0?[1-9]|1[0-2])$/)]);
      this.setV(expiry_year,  [Validators.required, Validators.pattern(/^\d{2,4}$/)]);
      this.setV(cvv,          [Validators.required, Validators.minLength(3), Validators.maxLength(4)]);
      this.setV(buyer_name,   []);
      this.setV(buyer_cpf,    []);
    }
  }

  // ===== Carregar dados =====
  private fetchProducts(): void {
    this.loadingProducts = true;
    this.productService.list().subscribe({
      next: (items) => {
        this.products = items.map((p, i) => ({
          id: i + 1,
          name: p.name,
          price: p.price,
          imageUrl: `assets/${p.imageName}`,
          description: p.description
        }));
        this.loadingProducts = false;
      },
      error: (err) => {
        this.loadError = 'Falha ao carregar produtos. Verifique o backend.';
        console.error('[OrderStepper] load products error:', err);
        this.loadingProducts = false;
      }
    });
  }
  private fetchAddons(): void {
    this.loadingAddons = true;
    this.addonService.list().subscribe({
      next: (items) => {
        this.addons = items.map((a, i) => ({
          id: i + 1,
          name: a.name,
          price: a.price,
          imageUrl: `assets/${a.imageName}`,
          description: a.description ?? ''
        }));
        this.loadingAddons = false;
      },
      error: (err) => {
        this.loadError = 'Falha ao carregar addons. Verifique o backend.';
        console.error('[OrderStepper] load addons error:', err);
        this.loadingAddons = false;
      }
    });
  }

  // ===== Step 1 =====
  selectProduct(p: Product): void {
    this.orderService.setProduct(p);
    this.productForm.patchValue({ productId: p.id });
  }
  isProductSelected(p: Product): boolean {
    return this.orderService.getOrder().product?.id === p.id;
  }

  // ===== Step 2 =====
  toggleAddon(a: Addon): void {
    const current = this.orderService.getOrder().addons;
    const exists  = current.some(x => x.id === a.id);
    const next    = exists ? current.filter(x => x.id !== a.id) : [...current, a];
    this.orderService.setAddons(next);
    this.addonForm.patchValue({ selectedAddons: next.map(x => x.id) });
  }
  isAddonSelected(a: Addon): boolean {
    return this.orderService.getOrder().addons.some(ad => ad.id === a.id);
  }

  // ===== Método / Bandeira =====
  setMethod(m: PaymentMethod) {
    this.paymentForm.patchValue({ method: m });
  }
  selectBrand(key: string) {
    this.paymentForm.patchValue({ brand: key });
  }

  // ===== Helpers =====
  get total(): number {
    const o = this.orderService.getOrder();
    const prod   = o.product?.price ?? 0;
    const extras = o.addons.reduce((sum, x) => sum + x.price, 0);
    return prod + extras;
  }
  private buildDescription(): string {
    const o = this.orderService.getOrder();
    const p = o.product?.name ?? '';
    const adds = o.addons.map(a => a.name).join(', ');
    return adds ? `${p} + ${adds}` : p;
  }
  private newOrderId(): string {
    return 'ORD-' + Date.now();
  }

  private toastOk(msg: string)   { this.snack.open(msg, 'OK',     { duration: 3500, panelClass: ['snack-ok']   }); }
  private toastInfo(msg: string) { this.snack.open(msg, 'OK',     { duration: 4000, panelClass: ['snack-info'] }); }
  private toastErr(msg: string)  { this.snack.open(msg, 'Fechar', { duration: 5000, panelClass: ['snack-err']  }); }

  private toDataUrl(b64?: string | null): string | null {
    if (!b64) return null;
    return b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
  }

  // Gera o QR localmente se só vier o pix_code
  private async ensurePixQr(res: PaymentResponse): Promise<void> {
    this.pixCode = res.pix_code || null;

    // se o backend já mandou a imagem base64, usa direto
    if (res.qr_code) {
      this.pixQrDataUrl = this.toDataUrl(res.qr_code);
      return;
    }

    // se só veio o pix_code, gera um PNG base64 localmente
    if (this.pixCode) {
      try {
        this.pixQrDataUrl = await QRCode.toDataURL(this.pixCode, { width: 280, margin: 1 });
      } catch (e) {
        console.error('Erro ao gerar QR local:', e);
        this.pixQrDataUrl = null;
      }
    }
  }

  private async handlePixResponse(res: PaymentResponse) {
    await this.ensurePixQr(res);

    // Se temos QR ou código, mostramos como "gerado" mesmo que o status venha errado
    if (this.pixQrDataUrl || this.pixCode) {
      this.toastInfo('PIX gerado! Escaneie o QR ou copie o código.');
      return;
    }

    // fallback para mensagens padrão
    if (res.status === 'approved') return this.toastOk(`Pagamento aprovado${res.transaction_id ? ` (#${res.transaction_id})` : ''}!`);
    if (res.status === 'pending')  return this.toastInfo(res.message || 'PIX pendente.');
    return this.toastErr(res.message || 'Falha ao gerar PIX.');
  }

  // ===== Pagamento =====
  onPayPix(): void {
    const buyerNameCtrl = this.paymentForm.get('buyer_name')!;
    const buyerCpfCtrl  = this.paymentForm.get('buyer_cpf')!;
    buyerNameCtrl.markAsTouched(); buyerCpfCtrl.markAsTouched();
    if (buyerNameCtrl.invalid || buyerCpfCtrl.invalid) {
      this.toastInfo('Preencha Nome do Comprador e CPF (11 dígitos).');
      return;
    }

    // limpar preview anterior
    this.pixQrDataUrl = null;
    this.pixCode = null;

    const v = this.paymentForm.value;
    const cpfDigits = (v.buyer_cpf || '').toString().replace(/\D/g, '');
    const payload = {
      method: 'PIX',
      amount: this.total,
      order_id: this.newOrderId(),
      description: this.buildDescription(),
      buyer_name: v.buyer_name,
      buyer_cpf:  cpfDigits
    };

    this.isPaying = true;
    this.http.post<PaymentResponse>(`${environment.apiBaseUrl}/payments/process`, payload)
      .pipe(finalize(() => this.isPaying = false))
      .subscribe({
        next: async (res) => { await this.handlePixResponse(res); },
        error: (err) => { console.error('PIX ERRO', err); this.toastErr('Erro ao processar PIX.'); }
      });
  }

  onPayCard(): void {
    if (this.paymentForm.value.method !== 'CREDIT_CARD' && this.paymentForm.value.method !== 'DEBIT_CARD') {
      this.toastInfo('Selecione Crédito ou Débito.');
      return;
    }
    this.paymentForm.markAllAsTouched();
    if (this.paymentForm.invalid) {
      this.toastInfo('Preencha os dados do cartão.');
      return;
    }
    const v = this.paymentForm.value;
    const payload = {
      method: v.method,
      amount: this.total,
      order_id: this.newOrderId(),
      description: this.buildDescription(),
      card_number:  v.card_number,
      card_holder:  v.card_holder,
      expiry_month: v.expiry_month,
      expiry_year:  v.expiry_year,
      cvv:          v.cvv,
      brand:        v.brand,
    };
    this.isPaying = true;
    this.http.post<PaymentResponse>(`${environment.apiBaseUrl}/payments/process`, payload)
      .pipe(finalize(() => this.isPaying = false))
      .subscribe({
        next: (res) => {
          if (res.status === 'approved') return this.toastOk('Pagamento aprovado!');
          if (res.status === 'pending')  return this.toastInfo(res.message || 'Pagamento pendente.');
          return this.toastErr(res.message || 'Pagamento não aprovado.');
        },
        error: (err) => { console.error('CARD ERRO', err); this.toastErr('Erro ao processar pagamento no cartão.'); }
      });
  }

  // trackBy
  productTrackBy(_i: number, p: Product) { return p.id; }
  addonTrackBy(_i: number, a: Addon)     { return a.id; }
}
