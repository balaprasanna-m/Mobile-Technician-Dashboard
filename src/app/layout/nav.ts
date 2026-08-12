import { IconName } from '../shared/icon.component';

export interface NavItem {
  label: string;
  route: string;
  icon: IconName;
   roles: UserRole[];
}
import { UserRole } from '../services/AuthService';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    route: '/app/dashboard',
    icon: 'dashboard',
    roles: ['admin','technician','officer','receptionist']
  },
  {
    label: 'My Orders',
    route: '/app/my-orders',
    icon: 'my-orders',
    roles: ['admin']
  },
  {
    label: 'Orders',
    route: '/app/orders',
    icon: 'orders',
    roles: ['admin','technician','officer','receptionist']
  }, 
  // {
  //   label: 'Spare Update',
  //   route: '/app/spare-update',
  //   icon: 'package',
  //   roles: ['officer','admin']
  // },
  {
    label: 'Spare Parts',
    route: '/app/spare-parts',
    icon: 'package',
    roles: ['admin','technician','officer','receptionist']
  },
  {
    label: 'Payments',
    route: '/app/payments',
    icon: 'payments',
    roles: ['admin']
  },
  {
    label: 'Profile',
    route: '/app/profile',
    icon: 'profile',
    roles: ['admin','technician','officer','receptionist']
  }
];
// Items surfaced in the mobile bottom navigation (kept to 5 for thumb reach).
export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS;
