import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule }    from '@angular/material/card';
import { MatButtonModule }  from '@angular/material/button';
import { MatSnackBarModule} from '@angular/material/snack-bar';
import { MatDialogModule }  from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }   from '@angular/material/input';
import { MatIconModule }    from '@angular/material/icon';

import { AppComponent }          from './app.component';
import { OrderStepperComponent } from './order-stepper/order-stepper.component';
import { PaymentComponent }      from './payment/payment.component';
import { QrDialogComponent }     from './payment/qr-dialog.component';

import { OrderService }          from './services/order.service';

@NgModule({
  declarations: [
    AppComponent,
    OrderStepperComponent,
    PaymentComponent,
    QrDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  providers: [OrderService],
  bootstrap: [AppComponent]
})
export class AppModule {}
