import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ShellComponent } from './layout/shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminDashboardComponent } from './pages/dashboard/admin/admin.component';
import { ReceptionistDashboardComponent } from './pages/dashboard/receptionist/receptionist.component';
import { TechnicianDashboardComponent } from './pages/dashboard/technician/technician.component';
import { OfficerDashboardComponent } from './pages/dashboard/officer/officer.component';
import { dashboardGuard } from './services/dashboard.guard';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailsComponent } from './pages/order-details/order-details.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SpareDetailsComponent } from './pages/spare-details/spare-details.component';
import { SparePartsComponent } from './pages/spare-parts/spare-parts.component';
// import { SpareUpdateComponent } from './pages/spare-update/spare-update.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [dashboardGuard],
        children: [
          { path: 'admin', component: AdminDashboardComponent },
          { path: 'receptionist', component: ReceptionistDashboardComponent },
          { path: 'technician', component: TechnicianDashboardComponent },
          { path: 'officer', component: OfficerDashboardComponent },
        ]
      },
      {
        path: 'my-orders',
        component: OrdersComponent,
        data: { title: 'My Orders', subtitle: 'Orders assigned to you' },
      },
      {
        path: 'my-orders/:id',
        component: OrderDetailsComponent,
        data: { title: 'Order Details', subtitle: 'Detailed job card and billing' },
      },
      {
        path: 'orders',
        component: OrdersComponent,
        data: { title: 'Orders', subtitle: 'All repair orders across the workshop' },
      },
      {
        path: 'orders/:id',
        component: OrderDetailsComponent,
        data: { title: 'Order Details', subtitle: 'Detailed job card and billing' },
      },
      {
        path: 'payments',
        component: PaymentsComponent,
        data: { title: 'Payments', subtitle: 'Invoices, transactions and balances' },
      },
// ,{
//   path: 'spare-update',
//   component: SpareUpdateComponent,
//   data: {
//     title: 'Spare Update',
//     subtitle: 'Manage spare requests and inventory updates'
//   },
// },
      {
        path: 'profile',
        component: ProfileComponent,
        data: { title: 'Profile', subtitle: 'Manage your account details' },
      },
      {
        path: 'spare-parts',
        component: SparePartsComponent,
        data: { title: 'Spare Parts', subtitle: 'Workshop inventory and stock levels' },
      },
      {
        path: 'spare-parts/:id',
        component: SpareDetailsComponent,
        data: { title: 'Spare Part Details', subtitle: 'SKU specifications and inventory' },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
