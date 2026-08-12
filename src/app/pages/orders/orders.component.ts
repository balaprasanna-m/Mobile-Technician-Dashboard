import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService, Order, OrderStatus, ORDER_STATUSES } from '../../services/data.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly dataService = inject(DataService);
selectedMyOrderTab = signal<'work' | 'price' | 'completed'>('work');
  readonly orderStatuses = ORDER_STATUSES;
  title = '';
  subtitle = '';
  isMyOrders = false;

  // Search and filter states
  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  sortBy = signal<string>('id-desc'); // id-desc, id-asc, amount-desc, amount-asc, date-desc

  // Filtered orders list
  readonly filteredOrders = computed(() => {
  let list = this.dataService.orders();

  // My Orders
  if (this.isMyOrders) {
    list = list.filter(o => o.technician === 'Kojo A.');

    switch (this.selectedMyOrderTab()) {
      case 'work':
        list = list.filter(o => o.status === 'Work in Progress');
        break;

      case 'price':
        list = list.filter(o => o.status === 'Price Demand');
        break;

      case 'completed':
        list = list.filter(o => o.status === 'Completed' || o.status === 'Closed');
        break;
    }
  }

  // Search
  const query = this.searchQuery().trim().toLowerCase();
  if (query) {
    list = list.filter(
      o =>
        o.id.toLowerCase().includes(query) ||
        o.customer.toLowerCase().includes(query) ||
        o.model.toLowerCase().includes(query) ||
        o.phone.toLowerCase().includes(query) ||
        o.issue.toLowerCase().includes(query)
    );
  }

  // Orders page only
  if (!this.isMyOrders) {
    const status = this.selectedStatus();
    if (status !== 'all') {
      list = list.filter(o => o.status === status);
    }

    const sort = this.sortBy();

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'id-desc':
          return b.id.localeCompare(a.id);
        case 'id-asc':
          return a.id.localeCompare(b.id);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'date-desc':
          return b.createdDate.localeCompare(a.createdDate);
        default:
          return 0;
      }
    });
  }

  return list;
});

  ngOnInit(): void {
    this.title = this.route.snapshot.data['title'] ?? 'Orders';
    this.subtitle = this.route.snapshot.data['subtitle'] ?? '';
    this.isMyOrders = this.route.snapshot.url[0]?.path === 'my-orders';

    // Pre-select status filter if provided via query param (e.g. from the Closed Orders banner)
    const statusParam = this.route.snapshot.queryParamMap.get('status');
    if (statusParam) {
      this.selectedStatus.set(statusParam);
    }
  }

  statusClass(status: OrderStatus): string {
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

  viewOrderDetails(id: string): void {
    const parentPath = this.isMyOrders ? 'my-orders' : 'orders';
    this.router.navigate([`/app/${parentPath}`, id]);
  }
}
