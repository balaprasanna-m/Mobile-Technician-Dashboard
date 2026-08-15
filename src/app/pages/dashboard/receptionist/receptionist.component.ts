import { Component, inject, computed, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/icon.component';
import { DataService, Order, ORDER_STATUSES } from '../../../services/data.service';
import { AuthService, UserRole } from '../../../services/AuthService';

/** Represents a 3×3 grid node for the pattern lock */
interface PatternNode {
  index: number;
  cx: number;
  cy: number;
  active: boolean;
  order: number;
}

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [IconComponent, RouterLink, FormsModule],
  templateUrl: './receptionist.component.html',
  styleUrl: './receptionist.component.css',
})
export class ReceptionistDashboardComponent implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  readonly dataService = inject(DataService);
  readonly authService = inject(AuthService);
  readonly statuses = ORDER_STATUSES;

  // ── Create New Order Modal ──
  showCreateModal = signal(false);
  createSuccess = signal(false);

  // Form fields
  newOrder = {
    customer: '',
    phone: '',
    email: '',
    model: '',
    imei: '',
    issue: '',
    technician: '',
    status: 'New Order' as (typeof ORDER_STATUSES)[number],
    amount: 0,
    diagnosisNotes: '',
    devicePassword: '',
    passwordType: 'none' as 'none' | 'pin' | 'pattern' | 'text',
    // Received details
    receivedDate: '',
    receivedAddress: '',bookingDate: '',
bookingSlot: '',
advanceAmount: 0,
advancePaymentMode: '',
  };

  // ── Pattern Lock ──
  @ViewChild('patternCanvas') patternCanvasRef?: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D | null = null;
  private patternDrawing = false;
  private patternSequence: number[] = [];
  patternNodes: PatternNode[] = [];
  patternDisplay = signal('');
  private canvasSize = 240;
  private nodeRadius = 18;
  private nodeGap = 80;
  private nodeOffset = 40;

  private boundMouseDown?: (e: MouseEvent) => void;
  private boundMouseMove?: (e: MouseEvent) => void;
  private boundMouseUp?: (e: MouseEvent) => void;
  private boundTouchStart?: (e: TouchEvent) => void;
  private boundTouchMove?: (e: TouchEvent) => void;
  private boundTouchEnd?: (e: TouchEvent) => void;

  ngAfterViewInit(): void {
    // Canvas setup happens when modal opens
  }

  ngOnDestroy(): void {
    this.detachCanvasListeners();
  }

  // ── Receptionist computed data ──
  readonly receptionistOpen = computed<Order[]>(() =>
    this.dataService.orders().filter(o => o.status === 'New Order')
  );
  readonly receptionistReassigned = computed<Order[]>(() =>
    this.dataService.orders().filter(o => o.status === 'Reassigned')
  );
  readonly receptionistPayment = computed<Order[]>(() =>
    this.dataService.orders().filter(o => o.status === 'Wait for Payment')
  );
  readonly receptionistDelivery = computed<Order[]>(() =>
    this.dataService.orders().filter(o => o.status === 'Wait for Delivery')
  );
  readonly personnelList = computed(() => this.dataService.personnel());

  switchView(role: UserRole): void {
    this.authService.clearSelectedPersonnel();
    this.router.navigate(['/app/dashboard', role]);
  }

  getInitials(name: string): string {
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
      default:
        return 'status-danger';
    }
  }

  formatAmount(value: number): string {
    return '$' + value.toFixed(2);
  }

  // ── Modal Controls ──
  openCreateModal(): void {
    this.resetForm();
    this.showCreateModal.set(true);
    // Initialize canvas after DOM renders
    setTimeout(() => this.initCanvas(), 80);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.detachCanvasListeners();
  }

  resetForm(): void {
    this.newOrder = {
      customer: '',
      phone: '',
      email: '',
      model: '',
      imei: '',
      issue: '',
      technician: '',
      status: 'New Order',
      amount: 0,
      diagnosisNotes: '',
      devicePassword: '',
      passwordType: 'none',
      receivedDate: new Date().toISOString().split('T')[0],
      receivedAddress: '',bookingDate: new Date().toISOString().split('T')[0],
bookingSlot: '',
advanceAmount: 0,
advancePaymentMode: '',
    };
    this.patternSequence = [];
    this.patternDisplay.set('');
  }

  submitOrder(): void {
    if (!this.newOrder.customer.trim() || !this.newOrder.phone.trim() || !this.newOrder.model.trim() || !this.newOrder.issue.trim()) {
      return;
    }

    // Build password string
    let pwd = '';
    if (this.newOrder.passwordType === 'pattern') {
      pwd = this.patternSequence.length > 0
        ? 'Pattern: ' + this.patternSequence.map(i => i + 1).join('→')
        : '';
    } else if (this.newOrder.passwordType === 'pin' || this.newOrder.passwordType === 'text') {
      pwd = this.newOrder.devicePassword;
    }

    this.dataService.addOrder({
      customer: this.newOrder.customer.trim(),
      phone: this.newOrder.phone.trim(),
      email: this.newOrder.email.trim(),
      model: this.newOrder.model.trim(),
      imei: this.newOrder.imei.trim(),
      issue: this.newOrder.issue.trim(),
      technician: this.newOrder.technician || 'Unassigned',
      status: this.newOrder.status,
      amount: +this.newOrder.amount || 0,
      diagnosisNotes: this.newOrder.diagnosisNotes.trim(),
      devicePassword: pwd,
      passwordType: this.newOrder.passwordType !== 'none' ? this.newOrder.passwordType : undefined,
      spareParts: [],
      receivedDate: this.newOrder.receivedDate || undefined,
      receivedAddress: this.newOrder.receivedAddress.trim() || undefined,
      prebookingDate: this.newOrder.bookingDate || undefined,
      bookingSlot: this.newOrder.bookingSlot || undefined,
      advanceAmount: this.newOrder.advanceAmount || undefined,
      advancePaymentMode: this.newOrder.advancePaymentMode || undefined,
    });


    this.showCreateModal.set(false);
    this.createSuccess.set(true);
    setTimeout(() => this.createSuccess.set(false), 3500);
  }

  // ── Password type switch ──
  onPasswordTypeChange(): void {
    this.newOrder.devicePassword = '';
    this.patternSequence = [];
    this.patternDisplay.set('');
    if (this.newOrder.passwordType === 'pattern') {
      setTimeout(() => this.initCanvas(), 80);
    }
  }

  // ── Pattern Lock Implementation ──
  private initCanvas(): void {
    const canvas = this.patternCanvasRef?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = this.canvasSize * dpr;
    canvas.height = this.canvasSize * dpr;
    canvas.style.width = this.canvasSize + 'px';
    canvas.style.height = this.canvasSize + 'px';
    this.ctx.scale(dpr, dpr);

    // Build 3×3 grid nodes
    this.patternNodes = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        this.patternNodes.push({
          index: r * 3 + c,
          cx: this.nodeOffset + c * this.nodeGap,
          cy: this.nodeOffset + r * this.nodeGap,
          active: false,
          order: -1,
        });
      }
    }

    this.drawPattern();
    this.attachCanvasListeners(canvas);
  }

  private attachCanvasListeners(canvas: HTMLCanvasElement): void {
    this.detachCanvasListeners();

    this.boundMouseDown = (e: MouseEvent) => { e.preventDefault(); this.onPointerStart(e.offsetX, e.offsetY); };
    this.boundMouseMove = (e: MouseEvent) => { e.preventDefault(); this.onPointerMove(e.offsetX, e.offsetY); };
    this.boundMouseUp   = (e: MouseEvent) => { e.preventDefault(); this.onPointerEnd(); };

    this.boundTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.onPointerStart(t.clientX - rect.left, t.clientY - rect.top);
    };
    this.boundTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.onPointerMove(t.clientX - rect.left, t.clientY - rect.top);
    };
    this.boundTouchEnd = (e: TouchEvent) => { e.preventDefault(); this.onPointerEnd(); };

    canvas.addEventListener('mousedown', this.boundMouseDown);
    canvas.addEventListener('mousemove', this.boundMouseMove);
    canvas.addEventListener('mouseup', this.boundMouseUp);
    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
  }

  private detachCanvasListeners(): void {
    const canvas = this.patternCanvasRef?.nativeElement;
    if (!canvas) return;
    if (this.boundMouseDown) canvas.removeEventListener('mousedown', this.boundMouseDown);
    if (this.boundMouseMove) canvas.removeEventListener('mousemove', this.boundMouseMove);
    if (this.boundMouseUp)   canvas.removeEventListener('mouseup', this.boundMouseUp);
    if (this.boundTouchStart) canvas.removeEventListener('touchstart', this.boundTouchStart);
    if (this.boundTouchMove)  canvas.removeEventListener('touchmove', this.boundTouchMove);
    if (this.boundTouchEnd)   canvas.removeEventListener('touchend', this.boundTouchEnd);
  }

  private onPointerStart(x: number, y: number): void {
    this.patternDrawing = true;
    this.patternSequence = [];
    this.patternNodes.forEach(n => { n.active = false; n.order = -1; });
    this.tryActivateNode(x, y);
    this.drawPattern();
  }

  private onPointerMove(x: number, y: number): void {
    if (!this.patternDrawing) return;
    this.tryActivateNode(x, y);
    this.drawPattern(x, y);
  }

  private onPointerEnd(): void {
    this.patternDrawing = false;
    this.drawPattern();
    const nums = this.patternSequence.map(i => i + 1).join('→');
    this.patternDisplay.set(this.patternSequence.length > 0 ? `Pattern recorded: ${nums}` : '');
  }

  private tryActivateNode(x: number, y: number): void {
    for (const node of this.patternNodes) {
      if (node.active) continue;
      const dx = x - node.cx;
      const dy = y - node.cy;
      if (Math.sqrt(dx * dx + dy * dy) < this.nodeRadius + 6) {
        node.active = true;
        node.order = this.patternSequence.length;
        this.patternSequence.push(node.index);
      }
    }
  }

  private drawPattern(curX?: number, curY?: number): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

    // Draw connecting lines between active nodes
    const active = this.patternNodes.filter(n => n.active).sort((a, b) => a.order - b.order);
    if (active.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 179, 237, 0.7)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(active[0].cx, active[0].cy);
      for (let i = 1; i < active.length; i++) {
        ctx.lineTo(active[i].cx, active[i].cy);
      }
      ctx.stroke();
    }

    // Draw line to current cursor position
    if (this.patternDrawing && active.length > 0 && curX !== undefined && curY !== undefined) {
      const last = active[active.length - 1];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 179, 237, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(last.cx, last.cy);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw all nodes
    for (const node of this.patternNodes) {
      // Outer ring
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, this.nodeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = node.active ? 'rgba(99, 179, 237, 0.9)' : 'rgba(150, 160, 180, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, node.active ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = node.active ? '#63b3ed' : 'rgba(150, 160, 180, 0.6)';
      ctx.fill();

      // Order number inside active node
      if (node.active) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(node.order + 1), node.cx, node.cy);
      }
    }
  }

  clearPattern(): void {
    this.patternSequence = [];
    this.patternNodes.forEach(n => { n.active = false; n.order = -1; });
    this.patternDisplay.set('');
    this.drawPattern();
  }
}
