import { Component, inject, signal, computed } from '@angular/core';
import { DataService, Personnel, PersonnelRole } from '../../services/data.service';
import { IconComponent } from '../../shared/icon.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/AuthService';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  readonly dataService = inject(DataService);
  private readonly authService = inject(AuthService);

  /** True only for admin — can create personnel and see full directory */
  readonly canManageStaff = computed(() => this.authService.role() === 'admin');

  /** Logged-in personnel details (null for admin) */
  readonly currentPersonnel = computed(() => this.authService.selectedPersonnel());

  /** Personnel record matching the currently logged-in non-admin user */
  readonly myPersonnel = computed(() => {
    const person = this.authService.selectedPersonnel();
    if (!person) return null;
    return this.dataService.personnel().find(p => p.id === person.id) ?? null;
  });

  // ─── Create Form ───────────────────────────────────────────────────
  showForm = signal(false);
  formSubmitted = signal(false);

  newName = '';
  newEmail = '';
  newPhone = '';
  newRole: PersonnelRole = 'Technician';
  newPassword = '';
  newPasswordVisible = signal(false);

  // ─── Edit Drawer ───────────────────────────────────────────────────
  editTarget = signal<Personnel | null>(null);
  showEditDrawer = signal(false);

  editRole: PersonnelRole = 'Technician';
  editStatus: 'Active' | 'Inactive' = 'Active';
  editPassword = '';
  editPasswordVisible = signal(false);
  editSaved = signal(false);
  showDeleteConfirm = signal(false);

  // ─── Hardcoded profile stats ────────────────────────────────────────
  stats = [
    { label: 'Orders Completed', count: '482' },
    { label: 'Active Repairs', count: '8' },
    { label: 'Efficiency Rating', count: '98.4%' },
  ];

  readonly roles: PersonnelRole[] = [
    'Technician', 'Receptionist', 'Officer', 'Custom Role 1', 'Custom Role 2'
  ];

  // ─── Create form actions ─────────────────────────────────────────────
  toggleAddForm(): void {
    this.showForm.update(v => !v);
    this.formSubmitted.set(false);
    this.clearCreateForm();
  }

  clearCreateForm(): void {
    this.newName = '';
    this.newEmail = '';
    this.newPhone = '';
    this.newRole = 'Technician';
    this.newPassword = '';
    this.newPasswordVisible.set(false);
  }

  onSubmitStaff(): void {
    if (!this.newName.trim() || !this.newEmail.trim()) return;

    this.dataService.addPersonnel(
      this.newName.trim(),
      this.newRole,
      this.newEmail.trim(),
      this.newPassword.trim() || 'prasanna',
      this.newPhone.trim()
    );
    this.formSubmitted.set(true);
    this.clearCreateForm();

    setTimeout(() => {
      this.showForm.set(false);
      this.formSubmitted.set(false);
    }, 1800);
  }

  // ─── Edit drawer actions ─────────────────────────────────────────────
  openEdit(person: Personnel): void {
    this.editTarget.set(person);
    this.editRole = person.role;
    this.editStatus = person.status;
    this.editPassword = '';
    this.editPasswordVisible.set(false);
    this.editSaved.set(false);
    this.showDeleteConfirm.set(false);
    this.showEditDrawer.set(true);
  }

  closeEdit(): void {
    this.showEditDrawer.set(false);
    this.editTarget.set(null);
    this.showDeleteConfirm.set(false);
  }

  saveEdit(): void {
    const target = this.editTarget();
    if (!target) return;

    const changes: Partial<Personnel> = {
      role: this.editRole,
      status: this.editStatus,
    };
    if (this.editPassword.trim()) {
      changes['password'] = this.editPassword.trim();
    }

    this.dataService.updatePersonnel(target.id, changes);
    this.editSaved.set(true);

    setTimeout(() => {
      this.editSaved.set(false);
      this.closeEdit();
    }, 1500);
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  doDelete(): void {
    const target = this.editTarget();
    if (!target) return;
    this.dataService.deletePersonnel(target.id);
    this.closeEdit();
  }
}
