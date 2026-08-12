import { Component, inject, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../../../shared/icon.component';
import { DataService, Order } from '../../../services/data.service';
import { AuthService, UserRole } from '../../../services/AuthService';

interface SummaryCard {
  label: string;
  value: string;
  icon: IconName;
  tone: 'primary' | 'info' | 'warning' | 'success' | 'neutral';
  trend: string;
  up: boolean;
  route?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [IconComponent, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminDashboardComponent {
  private readonly router = inject(Router);
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);

  readonly currentAdminTab = signal<'price-demand' | 'payment-check' | 'completed'>('price-demand');

  // Personnel picker modal state
  readonly showPersonnelModal = signal(false);
  readonly modalTargetRole = signal<string>('');
  readonly modalTargetDashboardRole = signal<UserRole>('receptionist');

  switchView(role: UserRole): void {
    this.authService.clearSelectedPersonnel();
    this.router.navigate(['/app/dashboard', role]);
  }

  setAdminTab(tab: 'price-demand' | 'payment-check' | 'completed'): void {
    this.currentAdminTab.set(tab);
  }

  /** Filtered personnel list for the open modal */
  readonly modalPersonnel = computed(() => {
    const role = this.modalTargetRole();
    if (!role) return [];
    return this.dataService.personnel().filter(p => p.role === role);
  });

  readonly cards = computed<SummaryCard[]>(() => {
    const orders = this.dataService.orders();
    const spares = this.dataService.spareParts();

    const myOrdersCount = orders.filter((o) => o.technician === 'Kojo A.').length;
    const receptionistCount = orders.filter((o) => o.status === 'New Order' || o.status === 'Completed' || o.status === 'Wait for Payment' || o.status === 'Wait for Delivery').length;
    const technicianCount = orders.filter((o) => o.status === 'New Order' || o.status === 'Work in Progress' || o.status === 'Request for Spare').length;
    const officerCount = orders.filter((o) => o.status === 'Waiting For Spare' || o.status === 'Price Demand').length;

    const availableSpares = spares.filter((s) => s.status !== 'Out of Stock').length;
    const sparesPct = spares.length > 0 ? Math.round((availableSpares / spares.length) * 100) : 0;

    return [
      {
        label: 'My Orders',
        value: myOrdersCount.toString(),
        icon: 'my-orders',
        tone: 'primary',
        trend: 'Assigned to Me',
        up: true,
      },
      {
        label: 'With Receptionist',
        value: receptionistCount.toString(),
        icon: 'clock',
        tone: 'info',
        trend: 'Receptionist Desk',
        up: true,
      },
      {
        label: 'With Technician',
        value: technicianCount.toString(),
        icon: 'wrench',
        tone: 'warning',
        trend: 'Tech Workbench',
        up: true,
      },
      {
        label: 'With Officer',
        value: officerCount.toString(),
        icon: 'user',
        tone: 'primary',
        trend: 'Officer Console',
        up: true,
      },
      // {
      //   label: 'Closed Orders',
      //   value: closedCount.toString(),
      //   icon: 'check-circle',
      //   tone: 'success',
      //   trend: 'Completed Jobs',
      //   up: true,
      // },
      {
        label: 'Spares Available',
        value: sparesPct + '%',
        icon: 'package',
        tone: 'neutral',
        trend: sparesPct >= 70 ? 'Healthy' : 'Low',
        up: sparesPct >= 70,
        route: '/app/spare-parts',
      },
    ];
  });

  readonly adminPriceDemand = computed<Order[]>(() => {
    return this.dataService.orders().filter((o) => o.status === 'Price Demand');
  });
  readonly adminPaymentCheck = computed<Order[]>(() => {
    return this.dataService.orders().filter((o) => o.status === 'Work in Progress');
  });
  readonly adminCompletedOnly = computed<Order[]>(() => {
    return this.dataService.orders().filter((o) => o.status === 'Completed');
  });
  readonly adminClosedOnly = computed<Order[]>(() => {
    return this.dataService.orders().filter((o) => o.status === 'Closed');
  });
  readonly adminCompleted = computed<Order[]>(() => {
    return [...this.adminCompletedOnly(), ...this.adminClosedOnly()];
  });
  readonly closedOrdersCount = computed<number>(() => this.adminClosedOnly().length);

  onCardClick(card: SummaryCard): void {
    if (card.label === 'My Orders') {
      this.authService.clearSelectedPersonnel();
      this.switchView('admin');
    } else if (card.label === 'With Receptionist') {
      this.openPersonnelPicker('Receptionist', 'receptionist');
    } else if (card.label === 'With Technician') {
      this.openPersonnelPicker('Technician', 'technician');
    } else if (card.label === 'With Officer') {
      this.openPersonnelPicker('Officer', 'officer');
    } else if (card.route) {
      this.router.navigate([card.route]);
    }
  }

  openPersonnelPicker(role: string, dashboardRole: UserRole): void {
    this.modalTargetRole.set(role);
    this.modalTargetDashboardRole.set(dashboardRole);
    this.showPersonnelModal.set(true);
  }

  closeModal(): void {
    this.showPersonnelModal.set(false);
    this.modalTargetRole.set('');
  }

  selectPersonnel(person: { id: string; name: string; role: string }): void {
    this.authService.setSelectedPersonnel({
      id: person.id,
      name: person.name,
      role: person.role,
    });
    this.showPersonnelModal.set(false);
    this.router.navigate(['/app/dashboard', this.modalTargetDashboardRole()]);
  }

  getPersonnelInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  viewOrderDetails(id: string): void {
    this.router.navigate(['/app/orders', id]);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'New Order':
      case 'Work in Progress':
        return 'status-warning';
      case 'Closed':
      case 'Completed':
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
