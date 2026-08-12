import { Component, inject, signal } from '@angular/core';
import {  Router,RouterLink } from '@angular/router';
import { DataService, Expense, Revenue } from '../../services/data.service';
import { IconComponent } from '../../shared/icon.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type PaymentTab = 'expense' | 'revenue' | 'income';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, RouterLink],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css',
})
export class PaymentsComponent {
  readonly dataService = inject(DataService);
readonly showAuthModal = signal(true);
private readonly router = inject(Router);
username = '';
secretPin = '';
otp = '';

verifyAccess(): void {
  if (
    this.username === 'admin' &&
    this.secretPin === '1234' &&
    this.otp === '987654'
  ) {
    this.showAuthModal.set(false);
  } else {
    alert('Invalid credentials.');
  }
}
  // Active subtab
  activeTab = signal<PaymentTab>('expense');
cancelAccess(): void {
  this.router.navigate(['/app/dashboard']);
}
  // Form toggling
  showExpenseForm = signal(false);

  // Form states
  category = 'Spare Parts Procurement';
  amount = 0;
  description = '';
  dateStr = new Date().toISOString().split('T')[0];
  formSubmitted = signal(false);

  // Categories list
  readonly categories = [
    'Spare Parts Procurement',
    'Equipment purchase',
    'Operations',
    'Utilities',
    'Marketing',
    'Rent & Maintenance',
    'Repairs & Diagnostics Tools',
  ];

  setTab(tab: PaymentTab): void {
    this.activeTab.set(tab);
    this.showExpenseForm.set(false);
  }

  toggleExpenseForm(): void {
    this.showExpenseForm.update((v) => !v);
    this.formSubmitted.set(false);
    this.clearForm();
  }

  clearForm(): void {
    this.amount = 0;
    this.description = '';
    this.dateStr = new Date().toISOString().split('T')[0];
  }

  onSubmitExpense(): void {
    if (this.amount <= 0 || !this.description.trim()) {
      return;
    }

    this.dataService.addExpense(
      this.category,
      this.amount,
      this.description.trim(),
      this.dateStr
    );

    this.formSubmitted.set(true);
    this.clearForm();

    setTimeout(() => {
      this.showExpenseForm.set(false);
      this.formSubmitted.set(false);
    }, 1500);
  }

  formatAmount(value: number): string {
    return '$' + value.toFixed(2);
  }
}
