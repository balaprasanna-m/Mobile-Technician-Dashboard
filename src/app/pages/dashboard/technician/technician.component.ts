import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon.component';
import { DataService, Order, OrderStatus } from '../../../services/data.service';
import { AuthService, UserRole } from '../../../services/AuthService';

@Component({
  selector: 'app-technician-dashboard',
  standalone: true,
  imports: [IconComponent, RouterLink],
  templateUrl: './technician.component.html',
  styleUrl: './technician.component.css',
})
export class TechnicianDashboardComponent {
  private readonly router = inject(Router);
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);

  /** The technician name to filter by — either the selected personnel or a default */
  private readonly techName = computed(() => {
    const selected = this.authService.selectedPersonnel();
    return selected?.name ?? 'Kojo A.';
  });

  switchView(role: UserRole): void {
    this.authService.clearSelectedPersonnel();
    this.router.navigate(['/app/dashboard', role]);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

 readonly technicianNew = computed<Order[]>(() => {
  return this.dataService.orders().filter(
    (o) =>
      o.technician === this.techName() &&
      o.status === 'New Order'
  );
});
  readonly technicianWip = computed<Order[]>(() => {
    return this.dataService.orders().filter((o) => o.technician === this.techName() && o.status === 'Work in Progress');
  });
  readonly technicianSpares = computed<Order[]>(() => {
    return this.dataService.orders().filter((o) => o.technician === this.techName() && o.status === 'Request for Spare');
  });

  viewOrderDetails(id: string): void {
    this.router.navigate(['/app/orders', id]);
  }

statusClass(status: OrderStatus): string {
  switch (status) {
    case 'New Order':
    case 'Work in Progress':
    case 'Waiting For Spare':
      return 'status-warning';

    case 'Completed':
    case 'Wait for Payment':
    case 'Wait for Delivery':
    case 'Closed':
      return 'status-success';

    case 'Request for Spare':
    case 'Price Demand':
      return 'status-danger';

    default:
      return 'status-danger';
  }
}

  formatAmount(value: number): string {
    return '$' + value.toFixed(2);
  }
}
