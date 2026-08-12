import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon.component';
import { DataService, Order } from '../../../services/data.service';
import { AuthService, UserRole } from '../../../services/AuthService';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [IconComponent, RouterLink],
  templateUrl: './officer.component.html',
  styleUrl: './officer.component.css',
})
export class OfficerDashboardComponent {
  private readonly router = inject(Router);
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);

  /** The officer name to filter by — either the selected personnel or a default */
  private readonly officerName = computed(() => {
    const selected = this.authService.selectedPersonnel();
    return selected?.name ?? 'Yaw B.';
  });

  switchView(role: UserRole): void {
    this.authService.clearSelectedPersonnel();
    this.router.navigate(['/app/dashboard', role]);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  readonly officerAssigned = computed<Order[]>(() => {
    return this.dataService.orders().filter((o) => o.technician === this.officerName() && o.status === 'Request for Spare');
  });
  readonly officerSpares = computed<Order[]>(() => {
    return this.dataService.orders().filter((o) => o.status === 'Waiting For Spare');
  });

  viewOrderDetails(id: string): void {
    this.router.navigate(['/app/orders', id]);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Open':
        return 'status-info';
      case 'New Order':
      case 'Work in Progress':
        return 'status-warning';
      case 'Closed':
      case 'Work Completed':
      case 'Wait for Payment & Delivery':
      case 'Wait for Payment':
      case 'Wait for Delivery':
        return 'status-success';
      case 'Request for Spare':
      case 'Waiting For Spare':
      case 'Price Demand':
      default:
        return 'status-danger';
    }
  }

  formatAmount(value: number): string {
    return '$' + value.toFixed(2);
  }
}
