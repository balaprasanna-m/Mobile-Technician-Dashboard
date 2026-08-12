import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DataService,
  Order,
  OrderStatus,
  ORDER_STATUSES,
  SparePartRef,
  SparePart,
  WorkLogEntry
} from '../../services/data.service';
import { AuthService } from '../../services/AuthService';
import { IconComponent } from '../../shared/icon.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, FormsModule],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css',
})
export class OrderDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);
readonly statuses = ORDER_STATUSES;
  order = signal<Order | undefined>(undefined);
  backUrl = '/app/orders';
  selectedTechnicianId: string = '';

  // Expose Math for template
  readonly Math = Math;

  // ── Spare picker modal ──
  showSparePicker = signal(false);
  sparePickerSearch = signal('');
  sparePickerFilter = signal<'all' | 'In Stock' | 'Low Stock'>('all');
  sparePickerQty = signal(1);
  selectedPickerSpare = signal<SparePart | null>(null);

  readonly filteredPickerSpares = computed(() => {
    const q = this.sparePickerSearch().trim().toLowerCase();
    const f = this.sparePickerFilter();
    return this.dataService.spareParts().filter(s => {
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.modelCompatibility.toLowerCase().includes(q);
      const matchFilter = f === 'all' ? true : s.status === f;
      return matchSearch && matchFilter;
    });
  });

  // ── Work log entry fields ──
  newLogDate = '';
  newLogNote = '';

  // ── Invoice builder state (admin only) ──
  newExtraLabel = '';
  newExtraAmount: number | null = null;

  // ── Edit mode ──
  editMode = signal(false);
  draft = signal<Order | undefined>(undefined);
  saveSuccess = signal(false);

  // ── Role helpers ──
  get role() { return this.authService.role(); }

  get isAdmin(): boolean { return this.role === 'admin'; }
  get isOfficer(): boolean { return this.role === 'officer'; }
  get isTechnician(): boolean { return this.role === 'technician'; }
  get isReceptionist(): boolean { return this.role === 'receptionist'; }

  /** Repair info: Admin, Technician */
  get canEditRepairInfo(): boolean { return this.isAdmin || this.isTechnician; }
  /** Device specs / customer profile: Admin, Receptionist */
  get canEditDeviceCustomer(): boolean { return this.isAdmin || this.isReceptionist; }
  /** Spare parts assignment: Admin, Technician */
  get canEditSpares(): boolean { return this.isAdmin || this.isTechnician; }
  /** Prebooking details: Admin, Receptionist */
  get canEditPrebooking(): boolean { return this.isAdmin || this.isReceptionist; }
  /** Work details / log: Admin, Technician */
  get canEditWorkDetails(): boolean { return this.isAdmin || this.isTechnician; }
  /** Advance payment & payment method/status: Admin, Officer only */
  get canEditPayment(): boolean { return this.isAdmin || this.isOfficer; }
  /** Delivery address: Admin, Receptionist */
  get canEditDelivery(): boolean { return this.isAdmin || this.isReceptionist; }
  /** Invoice / cost breakdown: Admin only */
  get canEditInvoice(): boolean { return this.isAdmin; }

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      const found = this.dataService.getOrderById(orderId);
      if (found) {
        this.order.set({ ...found });
      }
    }

    if (this.router.url.includes('my-orders')) {
      this.backUrl = '/app/my-orders';
    } else {
      this.backUrl = '/app/orders';
    }
  }

  // ─── Edit Mode Controls ───────────────────────────────────────────────────

  startEdit(): void {
    const o = this.order();
    if (!o) return;
    const baseDraft: Order = {
      ...o,
      spareParts: o.spareParts ? [...o.spareParts.map(s => ({ ...s }))] : [],
      workLog: o.workLog ? [...o.workLog.map(l => ({ ...l }))] : [],
      invoiceExtraCharges: o.invoiceExtraCharges ? [...o.invoiceExtraCharges.map(e => ({ ...e }))] : [],
      invoiceSpareExclusions: o.invoiceSpareExclusions ? [...o.invoiceSpareExclusions] : []
    };
    // Seed labour cost if admin has never explicitly set it
    if (baseDraft.invoiceLaborCost === undefined) {
      baseDraft.invoiceLaborCost = Math.max(0, this.getLaborBase(o));
    }
    this.draft.set(baseDraft);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.draft.set(undefined);
    this.editMode.set(false);
    this.newLogDate = '';
    this.newLogNote = '';
    this.newExtraLabel = '';
    this.newExtraAmount = null;
  }

  saveChanges(): void {
    const d = this.draft();
    if (!d) return;
    d.initials = d.customer
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    // compute workDays from log count if not set manually
    if (d.workLog && d.workLog.length > 0 && !d.workDays) {
      d.workDays = d.workLog.length;
    }
    this.dataService.updateOrder(d);
    this.order.set({ ...d });
    this.editMode.set(false);
    this.draft.set(undefined);
    this.newLogDate = '';
    this.newLogNote = '';
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  /** Called by embedded spare assignment inline form */
  onSpareAssigned(ref: SparePartRef): void {
    const d = this.draft();
    if (!d) return;
    const existing = d.spareParts.find(s => s.name === ref.name);
    if (existing) {
      existing.qty += ref.qty;
    } else {
      d.spareParts = [...d.spareParts, ref];
    }
    d.amount = d.spareParts.reduce((sum, s) => sum + s.cost * s.qty, 0) + this.getLaborBase(d);
    this.draft.set({ ...d });
  }

  /** Open spare picker modal */
  openSparePicker(): void {
    this.sparePickerSearch.set('');
    this.sparePickerFilter.set('all');
    this.sparePickerQty.set(1);
    this.selectedPickerSpare.set(null);
    this.showSparePicker.set(true);
  }

  /** Close spare picker modal */
  closeSparePicker(): void {
    this.showSparePicker.set(false);
    this.selectedPickerSpare.set(null);
  }

  /** Assign the selected spare from the picker */
  confirmPickerAssign(): void {
    const spare = this.selectedPickerSpare();
    const qty = this.sparePickerQty();
    if (!spare || qty < 1) return;
    const person = this.authService.selectedPersonnel();
    this.onSpareAssigned({
      name: spare.name,
      qty,
      cost: spare.price,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedBy: person?.name || undefined,
      status: 'Ordered'
    });
    this.closeSparePicker();
  }

  removeSpare(index: number): void {
    const d = this.draft();
    if (!d) return;
    const parts = [...d.spareParts];
    parts.splice(index, 1);
    d.spareParts = parts;
    d.amount = parts.reduce((sum, s) => sum + s.cost * s.qty, 0) + this.getLaborBase(d);
    this.draft.set({ ...d });
  }

  updateSpareStatus(index: number, status: 'Ordered' | 'Received' | 'Installed'): void {
    const d = this.draft();
    if (!d) return;
    const parts = [...d.spareParts.map(s => ({ ...s }))];
    parts[index].status = status;
    d.spareParts = parts;
    this.draft.set({ ...d });
  }

  // ─── Work Log ─────────────────────────────────────────────────────────────

  addWorkLogEntry(): void {
    const d = this.draft();
    if (!d || !this.newLogDate || !this.newLogNote.trim()) return;
    const person = this.authService.selectedPersonnel();
    const entry: WorkLogEntry = {
      date: this.newLogDate,
      note: this.newLogNote.trim(),
      technicianName: person?.name || 'Technician'
    };
    d.workLog = [...(d.workLog || []), entry];
    this.draft.set({ ...d });
    this.newLogDate = '';
    this.newLogNote = '';
  }

  removeWorkLogEntry(index: number): void {
    const d = this.draft();
    if (!d) return;
    const log = [...(d.workLog || [])];
    log.splice(index, 1);
    d.workLog = log;
    this.draft.set({ ...d });
  }

  // ─── Computed balance due ──────────────────────────────────────────────────

  getBalanceDue(o: Order): number {
    return Math.max(0, o.amount - (o.advanceAmount || 0));
  }

  // ─── Status Update (view mode — backwards compat) ─────────────────────────

  updateStatus(newStatus: string): void {
    const currentOrder = this.order();
    if (currentOrder) {
      const updatedStatus = newStatus as OrderStatus;
      currentOrder.status = updatedStatus;
      const orders = this.dataService.orders();
      const idx = orders.findIndex(o => o.id === currentOrder.id);
      if (idx !== -1) {
        orders[idx].status = updatedStatus;
        this.dataService.orders.set([...orders]);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('tf_orders', JSON.stringify(orders));
        }
      }
      this.order.set({ ...currentOrder });
    }
  }

  // ─── Display Helpers ──────────────────────────────────────────────────────

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
      return 'status-info';
  }
}
  spareStatusClass(status?: string): string {
    switch (status) {
      case 'Installed': return 'spare-status-installed';
      case 'Received':  return 'spare-status-received';
      case 'Ordered':   return 'spare-status-ordered';
      default:          return 'spare-status-none';
    }
  }

  formatAmount(value: number): string {
    return '$' + value.toFixed(2);
  }

  getPartsTotal(o: Order): number {
    if (!o.spareParts) return 0;
    return o.spareParts.reduce((sum, item) => sum + item.cost * item.qty, 0);
  }

  getLaborBase(o: Order): number {
    return Math.max(0, o.amount - this.getPartsTotal(o));
  }

  getLaborTotal(): number {
    const o = this.order();
    if (!o) return 0;
    return this.getLaborBase(o);
  }

  getDraftLaborTotal(): number {
    const d = this.draft();
    if (!d) return 0;
    return this.getLaborBase(d);
  }

  getDraftPartsTotal(): number {
    const d = this.draft();
    if (!d) return 0;
    return this.getPartsTotal(d);
  }


  // ─── Invoice Builder (Admin Only) ────────────────────────────────────────

  isSpareIncluded(spareName: string): boolean {
    const d = this.draft();
    if (!d) return true;
    return !(d.invoiceSpareExclusions || []).includes(spareName);
  }

  toggleSpareInclusion(spareName: string): void {
    const d = this.draft();
    if (!d) return;
    const excl = [...(d.invoiceSpareExclusions || [])];
    const idx = excl.indexOf(spareName);
    if (idx === -1) { excl.push(spareName); } else { excl.splice(idx, 1); }
    const updated = { ...d, invoiceSpareExclusions: excl };
    this.recalcInvoiceAmount(updated);
    this.draft.set(updated);
  }

  onLaborCostChange(value: number): void {
    const d = this.draft();
    if (!d) return;
    const updated = { ...d, invoiceLaborCost: +value || 0 };
    this.recalcInvoiceAmount(updated);
    this.draft.set(updated);
  }

  addExtraCharge(): void {
    const d = this.draft();
    if (!d || !this.newExtraLabel.trim() || this.newExtraAmount == null) return;
    const charges = [
      ...(d.invoiceExtraCharges || []),
      { label: this.newExtraLabel.trim(), amount: +this.newExtraAmount || 0 }
    ];
    const updated = { ...d, invoiceExtraCharges: charges };
    this.recalcInvoiceAmount(updated);
    this.draft.set(updated);
    this.newExtraLabel = '';
    this.newExtraAmount = null;
  }

  removeExtraCharge(index: number): void {
    const d = this.draft();
    if (!d) return;
    const charges = [...(d.invoiceExtraCharges || [])];
    charges.splice(index, 1);
    const updated = { ...d, invoiceExtraCharges: charges };
    this.recalcInvoiceAmount(updated);
    this.draft.set(updated);
  }

  private recalcInvoiceAmount(d: Order): void {
    const excl = new Set(d.invoiceSpareExclusions || []);
    const partsTotal = (d.spareParts || [])
      .filter(p => !excl.has(p.name))
      .reduce((sum, p) => sum + p.cost * p.qty, 0);
    const labor = d.invoiceLaborCost ?? 0;
    const extras = (d.invoiceExtraCharges || []).reduce((sum, e) => sum + e.amount, 0);
    d.amount = partsTotal + labor + extras;
  }

  getIncludedSpares(o: Order): SparePartRef[] {
    const excl = new Set(o.invoiceSpareExclusions || []);
    return (o.spareParts || []).filter(p => !excl.has(p.name));
  }

  getInvoiceLaborCost(o: Order): number {
    if (o.invoiceLaborCost !== undefined) return o.invoiceLaborCost;
    return this.getLaborBase(o);
  }

  getInvoiceExtras(o: Order): Array<{ label: string; amount: number }> {
    return o.invoiceExtraCharges || [];
  }

  getInvoiceSubtotal(o: Order): number {
    const parts = this.getIncludedSpares(o).reduce((s, p) => s + p.cost * p.qty, 0);
    const labor = this.getInvoiceLaborCost(o);
    const extras = this.getInvoiceExtras(o).reduce((s, e) => s + e.amount, 0);
    return parts + labor + extras;
  }

  getDraftIncludedSparesCost(): number {
    const d = this.draft();
    if (!d) return 0;
    return this.getIncludedSpares(d).reduce((s, p) => s + p.cost * p.qty, 0);
  }

  getDraftInvoiceSubtotal(): number {
    const d = this.draft();
    if (!d) return 0;
    return this.getInvoiceSubtotal(d);
  }

  readonly personnelList = computed(() => this.dataService.personnel());
}
