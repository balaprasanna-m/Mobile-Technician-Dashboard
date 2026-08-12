import { Component, HostListener, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { ThemeService } from '../services/theme.service';
import { DataService } from '../services/data.service';
import { FormsModule } from '@angular/forms';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from './nav';
import { AuthService } from '../services/AuthService';


@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, FormsModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  readonly themeService = inject(ThemeService);
  readonly dataService = inject(DataService);
  private readonly router = inject(Router);

readonly authService = inject(AuthService);
readonly navItems = computed(() => {
  const role = this.authService.role();

  if (!role) {
    return [];
  }

  return NAV_ITEMS.filter(item => item.roles.includes(role));
});

readonly bottomNavItems = computed(() => {
  const role = this.authService.role();

  if (!role) {
    return [];
  }

  return BOTTOM_NAV_ITEMS.filter(item => item.roles.includes(role));
});

  collapsed = signal(false);
  mobileOpen = signal(false);
  notifOpen = signal(false);
  profileOpen = signal(false);

  // New Order Modal State
  readonly newOrderModalOpen = signal(false);

  // Form Fields
  customerName = '';
  phone = '';
  email = '';
  deliveryAddress = '';
  model = '';
  imei = '';
  devicePassword = '';
  issue = '';
  technician = '';
  amount = 0;
  paymentMethod = 'Cash';
  paymentStatus = 'Pending';
  initialStatus: 'New Order' | 'Work in Progress' | 'Request for Spare' | 'Waiting For Spare' | 'Price Demand' | 'Completed' | 'Wait for Payment' | 'Wait for Delivery' | 'Reassigned' | 'Closed' = 'New Order';

  // Computed signal for active technicians
  readonly technicians = computed(() => {
    return this.dataService.personnel().filter(p => p.role === 'Technician' && p.status === 'Active');
  });

  openNewOrderModal(): void {
    this.resetForm();
    const techs = this.technicians();
    if (techs.length > 0) {
      this.technician = techs[0].name;
    }
    this.newOrderModalOpen.set(true);
    this.profileOpen.set(false);
    this.notifOpen.set(false);
    this.mobileOpen.set(false);
  }
//1
  closeNewOrderModal(): void {
    this.newOrderModalOpen.set(false);
  }

  submitNewOrder(): void {
    if (!this.customerName || !this.phone || !this.model || !this.issue) {
      alert('Please fill out all required fields.');
      return;
    }

    this.dataService.addOrder({
      customer: this.customerName,
      phone: this.phone,
      email: this.email || 'N/A',
      deliveryAddress: this.deliveryAddress || 'N/A',
      model: this.model,
      imei: this.imei || 'N/A',
      devicePassword: this.devicePassword || 'N/A',
      issue: this.issue,
      technician: this.technician || 'Unassigned',
      status: this.initialStatus,
      amount: this.amount || 0,
      diagnosisNotes: 'No technical assessment yet.',
      spareParts: []
    });

    this.closeNewOrderModal();
  }

  resetForm(): void {
    this.customerName = '';
    this.phone = '';
    this.email = '';
    this.deliveryAddress = '';
    this.model = '';
    this.imei = '';
    this.devicePassword = '';
    this.issue = '';
    this.technician = '';
    this.amount = 0;
    this.paymentMethod = 'Cash';
    this.paymentStatus = 'Pending';
    this.initialStatus = 'New Order';
  }


  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleNotif(): void {
    this.notifOpen.update((v) => !v);
    this.profileOpen.set(false);
  }

  toggleProfile(): void {
    this.profileOpen.update((v) => !v);
    this.notifOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.has-popover')) {
      this.notifOpen.set(false);
      this.profileOpen.set(false);
    }
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
