import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';
import { ThemeService } from '../../services/theme.service';
import { AuthService, personnelRoleToAuthRole } from '../../services/AuthService';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly dataService = inject(DataService);

  /** 'admin' = classic username/password | 'personnel' = pick-a-person */
  loginMode = signal<'admin' | 'personnel'>('personnel');

  // Admin mode fields
  username = '';
  password = '';

  // Personnel mode fields — plain strings for ngModel compatibility
  personnelName = '';
  personnelPassword = '';

  remember = signal(true);
  showPassword = signal(false);
  showPersonnelPassword = signal(false);
  loading = signal(false);
  errorMsg = signal<string>('');

  /** All active personnel from data service */
  readonly allPersonnel = computed(() => this.dataService.personnel());

  /** Personnel grouped by role for display */
  readonly groupedPersonnel = computed(() => {
    const roles = ['Technician', 'Receptionist', 'Officer', 'Custom Role 1', 'Custom Role 2'];
    return roles.map(role => ({
      role,
      members: this.allPersonnel().filter(p => p.role === role)
    })).filter(g => g.members.length > 0);
  });

  /** Currently selected personnel object */
  get currentPersonnel() {
    const name = this.personnelName.trim().toLowerCase();
    if (!name) return undefined;
    return this.allPersonnel().find(p => p.name.toLowerCase() === name);
  }

  get personInitials(): string {
    if (!this.currentPersonnel) return '';
    return this.currentPersonnel.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  togglePersonnelPassword(): void {
    this.showPersonnelPassword.update(v => !v);
  }

  toggleRemember(): void {
    this.remember.update(v => !v);
  }

  switchMode(mode: 'admin' | 'personnel'): void {
    this.loginMode.set(mode);
    this.errorMsg.set('');
  }

  onAdminSubmit(): void {
    this.errorMsg.set('');
    this.loading.set(true);

    setTimeout(() => {
      this.loading.set(false);

      if (this.username === 'admin' && this.password === 'prasanna') {
        this.authService.setRole('admin');
        this.router.navigate(['/app/dashboard']);
      } else {
        this.errorMsg.set('Invalid admin credentials. Please try again.');
      }
    }, 700);
  }

  onPersonnelSubmit(): void {
    this.errorMsg.set('');
    const person = this.currentPersonnel;

    if (!this.personnelName.trim()) {
      this.errorMsg.set('Please enter your name.');
      return;
    }

    if (!person) {
      this.errorMsg.set('Name not found. Please check your name and try again.');
      return;
    }

    if (!this.personnelPassword) {
      this.errorMsg.set('Please enter your password.');
      return;
    }

    this.loading.set(true);

    setTimeout(() => {
      this.loading.set(false);

      const expectedPwd = person.password ?? 'prasanna';
      if (this.personnelPassword === expectedPwd) {
        const authRole = personnelRoleToAuthRole(person.role);
        this.authService.setRole(authRole);
        this.authService.setSelectedPersonnel({ id: person.id, name: person.name, role: person.role });
        this.router.navigate(['/app/dashboard']);
      } else {
        this.errorMsg.set('Incorrect password. All personnel use password: prasanna');
      }
    }, 700);
  }
}

