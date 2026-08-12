import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon.component';
import { DataService, SparePart } from '../../services/data.service';

@Component({
  selector: 'app-spare-parts',
  standalone: true,
  imports: [IconComponent, RouterLink, FormsModule],
  templateUrl: './spare-parts.component.html',
  styleUrl: './spare-parts.component.css',
})
export class SparePartsComponent {
  private readonly router = inject(Router);
  readonly dataService = inject(DataService);

  // ── Filter / Search ──
  readonly searchQuery  = signal('');
  readonly statusFilter = signal<'all' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('all');
  readonly sortBy       = signal<'name' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('name');

  readonly filteredParts = computed(() => {
    const q   = this.searchQuery().trim().toLowerCase();
    const f   = this.statusFilter();
    const s   = this.sortBy();
    let list  = this.dataService.spareParts();

    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.modelCompatibility.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q)
      );
    }
    if (f !== 'all') {
      list = list.filter(p => p.status === f);
    }
    return [...list].sort((a, b) => {
      switch (s) {
        case 'price-asc':   return a.price - b.price;
        case 'price-desc':  return b.price - a.price;
        case 'stock-asc':   return a.stock - b.stock;
        case 'stock-desc':  return b.stock - a.stock;
        default:            return a.name.localeCompare(b.name);
      }
    });
  });

  // ── Add Form ──
  showAddForm = signal(false);
  addForm = signal<Omit<SparePart, 'id'>>({
    name: '', sku: '', modelCompatibility: '', stock: 0,
    price: 0, status: 'In Stock', location: '', supplier: '',
    warranty: '', description: ''
  });
  addSuccess = signal(false);
  addError   = signal('');

  openAddForm(): void {
    this.addForm.set({
      name: '', sku: '', modelCompatibility: '', stock: 0,
      price: 0, status: 'In Stock', location: '', supplier: '',
      warranty: '', description: ''
    });
    this.addError.set('');
    this.showAddForm.set(true);
  }
  closeAddForm(): void { this.showAddForm.set(false); }

  submitAdd(): void {
    const f = this.addForm();
    if (!f.name.trim() || !f.sku.trim() || !f.modelCompatibility.trim()) {
      this.addError.set('Name, SKU and Model Compatibility are required.');
      return;
    }
    this.dataService.addSparePart({ ...f });
    this.showAddForm.set(false);
    this.addSuccess.set(true);
    setTimeout(() => this.addSuccess.set(false), 3000);
  }

  patchForm(patch: Partial<Omit<SparePart, 'id'>>): void {
    this.addForm.update(f => ({ ...f, ...patch }));
  }

  viewSpareDetails(id: string): void {
    this.router.navigate(['/app/spare-parts', id]);
  }

  spareStatusClass(status: string): string {
    switch (status) {
      case 'In Stock':     return 'status-success';
      case 'Low Stock':    return 'status-warning';
      case 'Out of Stock': return 'status-danger';
      default:             return '';
    }
  }

  formatPrice(value: number): string {
    return '$' + value.toFixed(2);
  }
}
