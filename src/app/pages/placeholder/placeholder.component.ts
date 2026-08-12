import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [IconComponent],
  template: `
    <section class="page">
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-sub">{{ subtitle }}</p>

      <div class="empty-card">
        <span class="empty-icon"><app-icon name="package" [size]="32"></app-icon></span>
        <h2>{{ title }} coming together</h2>
        <p>This section of the workshop console is ready for content. The layout, theming and navigation are fully wired.</p>
      </div>
    </section>
  `,
  styles: [`
    .page-title { font-size: 22px; }
    .page-sub { margin: 4px 0 24px; color: var(--text-muted); font-size: 14px; }
    .empty-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      padding: 56px 24px;
      text-align: center;
      max-width: 520px;
      margin: 0 auto;
    }
    .empty-icon {
      display: inline-flex;
      width: 72px;
      height: 72px;
      align-items: center;
      justify-content: center;
      border-radius: 18px;
      background: var(--primary-soft);
      color: var(--primary);
      margin-bottom: 16px;
    }
    .empty-card h2 { font-size: 18px; }
    .empty-card p { margin: 8px auto 0; color: var(--text-muted); font-size: 14px; max-width: 360px; }
  `],
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  title = this.route.snapshot.data['title'] ?? 'Page';
  subtitle = this.route.snapshot.data['subtitle'] ?? '';
}
