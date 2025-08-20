import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient }                          from '@angular/common/http';
import { MatSnackBar }                         from '@angular/material/snack-bar';
import { MatDialog }                           from '@angular/material/dialog';
import { OrderService }                        from '../services/order.service';
import { QrDialogComponent }                   from './qr-dialog.component';

interface CardBrand {
  value: string;
  icon: string;
}

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;

  brands: CardBrand[] = [
    { value: 'Visa',       icon: 'assets/visa.png' },
    { value: 'Mastercard', icon: 'assets/mastercard.png' },
    { value: 'Elo',        icon: 'assets/elo.png' },
    { value: 'Amex',       icon: 'assets/amex.png' },
    { value: 'Hipercard',  icon: 'assets/hipercard.png' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private orderService: OrderService
  ) {
    this.paymentForm = this.fb.group({
      method:      ['', Validators.required],
      amount:      [{ value: this.totalAmount, disabled: true }],
      buyer_name:  [''],
      buyer_cpf:   [''],
      card_number: [''],
      card_holder: [''],
      expiry_month:[''],
      expiry_year: [''],
      cvv:         [''],
      brand:       ['']
    });
  }

  ngOnInit() {
    // quando o método mudar, ajusta validadores
    this.paymentForm.get('method')?.valueChanges.subscribe(method => {
      const name  = this.paymentForm.get('buyer_name')!;
      const cpf   = this.paymentForm.get('buyer_cpf')!;
      const num   = this.paymentForm.get('card_number')!;
      const holder= this.paymentForm.get('card_holder')!;
      const month = this.paymentForm.get('expiry_month')!;
      const year  = this.paymentForm.get('expiry_year')!;
      const cvv   = this.paymentForm.get('cvv')!;
      const brand = this.paymentForm.get('brand')!;

      // limpa todos
      [name, cpf, num, holder, month, year, cvv, brand].forEach(ctrl => {
        ctrl.clearValidators();
        ctrl.reset();
      });

      if (method === 'PIX') {
        name.setValidators([Validators.required]);
        cpf.setValidators([Validators.required]);
      }

      if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
        num.setValidators([Validators.required]);
        holder.setValidators([Validators.required]);
        month.setValidators([Validators.required]);
        year.setValidators([Validators.required, Validators.minLength(2)]);
        cvv.setValidators([Validators.required, Validators.minLength(3)]);
        brand.setValidators([Validators.required]);
      }

      // atualiza estados
      [name, cpf, num, holder, month, year, cvv, brand].forEach(ctrl => ctrl.updateValueAndValidity());
    });
  }

  get totalAmount(): number {
    const o = this.orderService.getOrder();
    return (o.product?.price || 0) + o.addons.reduce((s,x)=>s+x.price,0);
  }

  selectBrand(b: CardBrand) {
    this.paymentForm.patchValue({ brand: b.value });
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.snackBar.open('Preencha todos os campos corretamente.', '', {
        duration:3000,
        panelClass:['snack-error']
      });
      return;
    }
    const v = this.paymentForm.getRawValue();
    const payload: any = {
      method:   v.method,
      amount:   this.totalAmount,
      order_id: `ORDER-${Date.now()}`
    };

    if (v.method === 'PIX') {
      payload.buyer_name = v.buyer_name;
      payload.buyer_cpf  = v.buyer_cpf;
    }

    if (v.method === 'CREDIT_CARD' || v.method === 'DEBIT_CARD') {
      Object.assign(payload, {
        card_number:  v.card_number,
        card_holder:  v.card_holder,
        expiry_month: v.expiry_month,
        expiry_year:  v.expiry_year.length===2?`20${v.expiry_year}`:v.expiry_year,
        cvv:          v.cvv,
        brand:        v.brand
      });
    }

    this.http.post<any>('http://localhost:8080/payments/process', payload).subscribe({
      next: res => {
        const msg = res.status==='approved'
          ? 'Pagamento aprovado!'
          : 'Pagamento não autorizado.';
        this.snackBar.open(msg, '', {
          duration:4000,
          panelClass:[res.status==='approved'?'snack-success':'snack-error']
        });
        if (res.pix_code) {
          this.dialog.open(QrDialogComponent, {
            data: res.pix_code,
            panelClass: 'qr-dialog'
          });
        }
      },
      error: err => {
        this.snackBar.open('Erro: '+(err.error?.message||'desconhecido'), '', {
          duration:5000,
          panelClass:['snack-error']
        });
      }
    });
  }
}
