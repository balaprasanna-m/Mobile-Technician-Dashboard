import { Injectable, signal } from '@angular/core';

export type UserRole = 'admin' | 'technician' | 'officer' | 'receptionist' | 'custom_role_1' | 'custom_role_2';

export interface SelectedPersonnel {
  id: string;
  name: string;
  role: string;
}

/** Maps a PersonnelRole string to the AuthService UserRole */
export function personnelRoleToAuthRole(personnelRole: string): UserRole {
  switch (personnelRole) {
    case 'Technician':   return 'technician';
    case 'Receptionist': return 'receptionist';
    case 'Officer':      return 'officer';
    case 'Custom Role 1': return 'custom_role_1';
    case 'Custom Role 2': return 'custom_role_2';
    default:             return 'technician';
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly role = signal<UserRole | null>(null);
  readonly selectedPersonnel = signal<SelectedPersonnel | null>(null);

  setRole(role: UserRole) {
    this.role.set(role);
  }

  setSelectedPersonnel(person: SelectedPersonnel) {
    this.selectedPersonnel.set(person);
  }

  clearSelectedPersonnel() {
    this.selectedPersonnel.set(null);
  }

  logout() {
    this.role.set(null);
    this.selectedPersonnel.set(null);
  }
}