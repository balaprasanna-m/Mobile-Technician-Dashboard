import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, SparePart } from '../../services/data.service';
import { IconComponent } from '../../shared/icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spare-details',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './spare-details.component.html',
  styleUrl: './spare-details.component.css',
})
export class SpareDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly dataService = inject(DataService);

  spare = signal<SparePart | undefined>(undefined);

  ngOnInit(): void {
    const spareId = this.route.snapshot.paramMap.get('id');
    if (spareId) {
      const found = this.dataService.getSpareById(spareId);
      if (found) {
        this.spare.set(found);
      }
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'In Stock':
        return 'status-success';
      case 'Low Stock':
        return 'status-warning';
      case 'Out of Stock':
        return 'status-danger';
      default:
        return 'status-neutral';
    }
  }

  formatPrice(val: number): string {
    return '$' + val.toFixed(2);
  }
}
