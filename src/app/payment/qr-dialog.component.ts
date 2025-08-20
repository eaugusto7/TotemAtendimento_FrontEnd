import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA }            from '@angular/material/dialog';

@Component({
  selector: 'app-qr-dialog',
  templateUrl: './qr-dialog.component.html',
  styleUrls: ['./qr-dialog.component.css']
})
export class QrDialogComponent implements OnInit {
  qrCodeUrl!: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {}

  ngOnInit() {
    const encoded = encodeURIComponent(this.data);
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=300x300`;
  }
}
