import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Location } from '@angular/common';

@Component({
  imports: [Button],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.css',
})
export class PreviewComponent {
  constructor(private readonly location: Location) {}
  goBack() {
    this.location.back();
  }
}
