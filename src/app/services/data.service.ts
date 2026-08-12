import { Injectable, signal, computed } from '@angular/core';

export const ORDER_STATUSES = [
  'New Order',
  'Work in Progress',
  'Request for Spare',
  'Waiting For Spare',
  'Price Demand',
  'Completed',
  'Wait for Payment',
  'Wait for Delivery',
  'Reassigned',
  'Closed'
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];
export interface SparePartRef {
  name: string;
  qty: number;
  cost: number;
  assignedDate?: string;
  assignedBy?: string;
  status?: 'Ordered' | 'Received' | 'Installed';
}

export interface WorkLogEntry {
  date: string;
  note: string;
  technicianName: string;
}

export interface Order {
  id: string;
  customer: string;
  initials: string;
  phone: string;
  email: string;
  model: string;
  imei: string;
  issue: string;
  technician: string;
  status: OrderStatus;
  amount: number;
  createdDate: string;
  diagnosisNotes: string;
  spareParts: SparePartRef[];
  deliveryAddress?: string;
  devicePassword?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  // Prebooking
  prebookingDate?: string;
  prebookingTime?: string;
  prebookingNotes?: string;
  receivedDate?: string;
receivedAddress?: string;
  // Technician Work
  workStartDate?: string;
  workEndDate?: string;
  workDays?: number;
  workLog?: WorkLogEntry[];invoiceLaborCost?: number;

invoiceExtraCharges?: {
  label: string;
  amount: number;
}[];

invoiceSpareExclusions?: string[];deliveryId?: string;
deliveryDate?: string;
  // Advance Payment
  advanceAmount?: number;
  advancePaidDate?: string;
  advancePaidBy?: string;
}

export type PersonnelRole =
  | 'Technician'
  | 'Receptionist'
  | 'Officer'
  | 'Custom Role 1'
  | 'Custom Role 2';

export interface Personnel {
  id: string;
  name: string;
  role: PersonnelRole;
  email: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  joinedDate: string;
  password?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface Revenue {
  id: string;
  source: string;
  amount: number;
  date: string;
  referenceId?: string;
}

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  modelCompatibility: string;
  stock: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  location: string;
  supplier: string;
  warranty: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Signals for state
  readonly orders = signal<Order[]>([]);
  readonly personnel = signal<Personnel[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly spareParts = signal<SparePart[]>([]);

  // Computed signals
  readonly revenues = computed<Revenue[]>(() => {
    // Generate revenues from closed orders plus a few static ones
    const staticRevenues: Revenue[] = [
      { id: 'REV-201', source: 'Direct accessory sale', amount: 45.00, date: '2026-06-25' },
      { id: 'REV-202', source: 'Corporate maintenance contract deposit', amount: 800.00, date: '2026-06-28' },
    ];
    
    const orderRevenues = this.orders()
      .filter(o => o.status === 'Closed')
      .map(o => ({
        id: `REV-${o.id.replace('#ORD-', '')}`,
        source: `Repair service for ${o.customer} (${o.model})`,
        amount: o.amount,
        date: o.createdDate,
        referenceId: o.id
      }));

    return [...staticRevenues, ...orderRevenues];
  });

  readonly totalRevenue = computed(() => {
    return this.revenues().reduce((sum, item) => sum + item.amount, 0);
  });

  readonly totalExpenses = computed(() => {
    return this.expenses().reduce((sum, item) => sum + item.amount, 0);
  });

  readonly overallIncome = computed(() => {
    return this.totalRevenue() - this.totalExpenses();
  });

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    const isBrowser = typeof localStorage !== 'undefined';
    
    // 1. Orders
    let savedOrders: Order[] = [];
    if (isBrowser) {
      const data = localStorage.getItem('tf_orders');
      if (data) savedOrders = JSON.parse(data);
    }

    if (savedOrders.length < 13) {
      savedOrders = [
        {
          id: '#ORD-1042',
          customer: 'Rama Mensah',
          initials: 'RM',
          phone: '+1 (555) 234-5678',
          email: 'rama.mensah@gmail.com',
          model: 'iPhone 14 Pro',
          imei: '358925110482751',
          issue: 'Cracked outer display glass and unstable touch feedback',
          technician: 'Kojo A.',
          status: 'New Order',
          amount: 120,
          createdDate: '2026-06-30',
          diagnosisNotes: 'Requires replacement of assembly. Frame is slightly bent at power volume buttons.',
          spareParts: [
            { name: 'iPhone 14 Pro Screen Assembly', qty: 1, cost: 75 }
          ]
        },
        {
          id: '#ORD-1041',
          customer: 'Sofia Almeida',
          initials: 'SA',
          phone: '+351 912 345 678',
          email: 'sofia.almeida@live.pt',
          model: 'Samsung S22',
          imei: '990000862518293',
          issue: 'Rapid battery drain and device running hot',
          technician: 'Ama D.',
          status: 'New Order',
          amount: 85,
          createdDate: '2026-06-30',
          diagnosisNotes: 'Battery capacity reported at 68%. Heavy swelling. Needs battery replacement.',
          spareParts: [
            { name: 'Samsung S22 Replacement Battery', qty: 1, cost: 35 }
          ]
        },
        {
          id: '#ORD-1040',
          customer: 'Daniel Owusu',
          initials: 'DO',
          phone: '+233 24 555 8921',
          email: 'dowusu@outlook.com',
          model: 'Pixel 7',
          imei: '357283120194883',
          issue: 'Rear camera lens glass shattered, dust in camera sensor',
          technician: 'Yaw B.',
          status: 'Closed',
          amount: 60,
          createdDate: '2026-06-29',
          diagnosisNotes: 'Cleaned camera cavity under microscope. Swapped back camera glass cover.',
          spareParts: [
            { name: 'Pixel 7 camera lens glass cover', qty: 1, cost: 15 }
          ]
        },
        {
          id: '#ORD-1039',
          customer: 'Leila Haddad',
          initials: 'LH',
          phone: '+961 71 888 223',
          email: 'leila_h@gmail.com',
          model: 'iPhone 13',
          imei: '358172034928120',
          issue: 'Charging port issues, only charging when cable is bent',
          technician: 'Kojo A.',
          status: 'Request for Spare',
          amount: 145,
          createdDate: '2026-06-29',
          diagnosisNotes: 'Dirt and pocket lint compressed inside lightning port. Cleaned out first, but socket pins are damaged. Needs connector replacement.',
          spareParts: [
            { name: 'iPhone 13 Charging Port Flex', qty: 1, cost: 40 }
          ]
        },
        {
          id: '#ORD-1038',
          customer: 'Marcus Lee',
          initials: 'ML',
          phone: '+65 9123 4567',
          email: 'marcus.lee@gmail.com',
          model: 'OnePlus 11',
          imei: '861928038472910',
          issue: 'Water damage assessment, device not booting after rain exposure',
          technician: 'Ama D.',
          status: 'Closed',
          amount: 95,
          createdDate: '2026-06-28',
          diagnosisNotes: 'Submersion in isopropyl wash. Cleaned corrosion near battery connection points. Boots normally.',
          spareParts: []
        },
        {
          id: '#ORD-1037',
          customer: 'Nadia Costa',
          initials: 'NC',
          phone: '+55 11 98888-7777',
          email: 'nadia.costa@uol.com.br',
          model: 'Xiaomi 13',
          imei: '862019488392817',
          issue: 'No audio from receiver speaker on normal phone calls',
          technician: 'Yaw B.',
          status: 'Completed',
          amount: 70,
          createdDate: '2026-06-28',
          diagnosisNotes: 'Confirmed receiver speaker open coil circuit. Replaced receiver board module.',
          spareParts: [
            { name: 'Xiaomi 13 Earpiece Receiver Speaker', qty: 1, cost: 20 }
          ]
        },
        {
          id: '#ORD-1036',
          customer: 'Kwame Mensah',
          initials: 'KM',
          phone: '+1 (555) 345-6789',
          email: 'kwame@gmail.com',
          model: 'iPhone 12',
          imei: '358925110482999',
          issue: 'Shattered front screen panel',
          technician: 'Ama D.',
          status: 'Wait for Payment',
          amount: 110,
          createdDate: '2026-06-27',
          diagnosisNotes: 'Replaced cracked screen with OEM panel. Tested touch and TrueTone functionality.',
          spareParts: [
            { name: 'iPhone 12 Screen Panel', qty: 1, cost: 60 }
          ]
        },
        {
          id: '#ORD-1035',
          customer: 'Yaa Asantewaa',
          initials: 'YA',
          phone: '+233 20 123 4567',
          email: 'yaa@techfix.com',
          model: 'Pixel 6a',
          imei: '357283120194000',
          issue: 'Motherboard boot loop',
          technician: 'Kojo A.',
          status: 'Work in Progress',
          amount: 90,
          createdDate: '2026-06-26',
          diagnosisNotes: 'Identified minor short near power management IC. Conducting micro-soldering.',
          spareParts: []
        },
        {
          id: '#ORD-1034',
          customer: 'Kofi Annan',
          initials: 'KA',
          phone: '+233 24 999 8888',
          email: 'kofi@un.org',
          model: 'Samsung Note 20',
          imei: '990000862518111',
          issue: 'Hinge folding damage and screen flex crack',
          technician: 'Yaw B.',
          status: 'Work in Progress',
          amount: 200,
          createdDate: '2026-06-25',
          diagnosisNotes: 'Requires senior officer inspection and supplier coverage verification.',
          spareParts: []
        },
        {
          id: '#ORD-1033',
          customer: 'Abena Sarkodie',
          initials: 'AS',
          phone: '+1 (555) 789-0123',
          email: 'abena@gmail.com',
          model: 'iPhone 11',
          imei: '358172034928555',
          issue: 'Camera lens scratch assessment',
          technician: 'Ama D.',
          status: 'Price Demand',
          amount: 75,
          createdDate: '2026-06-24',
          diagnosisNotes: 'Customer demanding discount on parts cost. Awaiting quote approval from manager.',
          spareParts: []
        },
        {
          id: '#ORD-1032',
          customer: 'Osei Tutu',
          initials: 'OT',
          phone: '+233 27 777 6666',
          email: 'oseitutu@palace.gh',
          model: 'Samsung Fold 4',
          imei: '861928038472000',
          issue: 'Inner flexible display blank screen',
          technician: 'Yaw B.',
          status: 'Price Demand',
          amount: 350,
          createdDate: '2026-06-23',
          diagnosisNotes: 'Screen panel replaced under warranty, checking for final service payment transfer validation.',
          spareParts: []
        },
        {
          id: '#ORD-1031',
          customer: 'Ekow Mensah',
          initials: 'EM',
          phone: '+1 (555) 987-6543',
          email: 'ekow@gmail.com',
          model: 'iPhone 13 Pro',
          imei: '358925110482888',
          issue: 'Battery replacement completed',
          technician: 'Ama D.',
          status: 'Wait for Delivery',
          amount: 90,
          createdDate: '2026-06-22',
          diagnosisNotes: 'Battery replacement completed. Payment verified. Awaiting customer pick up.',
          spareParts: []
        }
      ];
      if (isBrowser) {
        localStorage.setItem('tf_orders', JSON.stringify(savedOrders));
      }
    }
    this.orders.set(savedOrders);

    // 2. Personnel
    let savedPersonnel: Personnel[] = [];
    if (isBrowser) {
      const data = localStorage.getItem('tf_personnel');
      if (data) savedPersonnel = JSON.parse(data);
    }

    if (savedPersonnel.length < 10) {
      savedPersonnel = [
        // Technicians (2)
        { id: 'P-101', name: 'Kojo Prasanna', role: 'Technician', email: 'kojo@techfix.com', status: 'Active', joinedDate: '2024-03-12', password: 'prasanna' },
        { id: 'P-102', name: 'Yaw Boateng', role: 'Technician', email: 'yaw@techfix.com', status: 'Active', joinedDate: '2024-06-20', password: 'prasanna' },
        // Receptionists (2)
        { id: 'P-103', name: 'Ama Darko', role: 'Receptionist', email: 'ama@techfix.com', status: 'Active', joinedDate: '2024-08-15', password: 'prasanna' },
        { id: 'P-104', name: 'Abena Serwaa', role: 'Receptionist', email: 'abena@techfix.com', status: 'Active', joinedDate: '2025-01-05', password: 'prasanna' },
        // Officers (2)
        { id: 'P-105', name: 'Frank Mensah', role: 'Officer', email: 'frank@techfix.com', status: 'Active', joinedDate: '2025-01-10', password: 'prasanna' },
        { id: 'P-106', name: 'Kofi Asante', role: 'Officer', email: 'kofi@techfix.com', status: 'Active', joinedDate: '2025-03-22', password: 'prasanna' },
        // Custom Role 1 (2)
        { id: 'P-107', name: 'Nana Acheampong', role: 'Custom Role 1', email: 'nana@techfix.com', status: 'Active', joinedDate: '2025-04-18', password: 'prasanna' },
        { id: 'P-108', name: 'Kweku Ofori', role: 'Custom Role 1', email: 'kweku@techfix.com', status: 'Active', joinedDate: '2025-07-11', password: 'prasanna' },
        // Custom Role 2 (2)
        { id: 'P-109', name: 'Grace Frimpong', role: 'Custom Role 2', email: 'grace@techfix.com', status: 'Active', joinedDate: '2025-11-22', password: 'prasanna' },
        { id: 'P-110', name: 'Efua Asiedu', role: 'Custom Role 2', email: 'efua@techfix.com', status: 'Inactive', joinedDate: '2026-02-14', password: 'prasanna' }
      ];
      if (isBrowser) {
        localStorage.setItem('tf_personnel', JSON.stringify(savedPersonnel));
      }
    }
    this.personnel.set(savedPersonnel);

    // 3. Expenses
    let savedExpenses: Expense[] = [];
    if (isBrowser) {
      const data = localStorage.getItem('tf_expenses');
      if (data) savedExpenses = JSON.parse(data);
    }

    if (savedExpenses.length === 0) {
      savedExpenses = [
        { id: 'EXP-001', category: 'Spare Parts Procurement', amount: 120.00, description: 'Screen Parts procurement for iPhone models', date: '2026-06-28' },
        { id: 'EXP-002', category: 'Equipment purchase', amount: 450.00, description: 'High-speed soldering station for Micro-soldering work', date: '2026-06-29' },
        { id: 'EXP-003', category: 'Operations', amount: 85.00, description: 'Workshop coffee replenishment and pantry items', date: '2026-06-30' },
        { id: 'EXP-004', category: 'Utilities', amount: 250.00, description: 'Electricity / Utility Bill for workshop', date: '2026-07-01' }
      ];
      if (isBrowser) {
        localStorage.setItem('tf_expenses', JSON.stringify(savedExpenses));
      }
    }
    this.expenses.set(savedExpenses);

    // 4. Spare Parts
    let savedSpares: SparePart[] = [];
    if (isBrowser) {
      const data = localStorage.getItem('tf_spares');
      if (data) savedSpares = JSON.parse(data);
    }

    if (savedSpares.length === 0) {
      savedSpares = [
        {
          id: 'SP-001',
          name: 'OEM iPhone 14 Pro OLED Display',
          sku: 'DSP-IP14P-02',
          modelCompatibility: 'iPhone 14 Pro',
          stock: 45,
          price: 189.00,
          status: 'In Stock',
          location: 'Bin A4-Shelf 2',
          supplier: 'OEM Direct Parts Inc.',
          warranty: '6 Months',
          description: 'Original equipment manufacturer OLED panel assembly. True Tone capability, 120Hz ProMotion support.'
        },
        {
          id: 'SP-002',
          name: 'Samsung S22 Ultra Battery',
          sku: 'BAT-SMS22U-09',
          modelCompatibility: 'Samsung Galaxy S22 Ultra',
          stock: 12,
          price: 45.00,
          status: 'Low Stock',
          location: 'Bin B12-Shelf 1',
          supplier: 'MobileSpares Corp',
          warranty: '3 Months',
          description: 'Replacement lithium-ion battery. Nominal capacity 5000mAh. Overheat and short circuit protection built-in.'
        },
        {
          id: 'SP-003',
          name: 'USB-C Dock Port Flex for Pixel 7',
          sku: 'FLX-PXL7-CHG',
          modelCompatibility: 'Google Pixel 7',
          stock: 85,
          price: 12.50,
          status: 'In Stock',
          location: 'Bin C1-Shelf 3',
          supplier: 'PixelParts Co',
          warranty: '12 Months',
          description: 'USB-C charging docking port ribbon flex cable assembly. Includes primary microphone element.'
        },
        {
          id: 'SP-004',
          name: 'iPhone 13 Back Glass Cover',
          sku: 'GLS-IP13-BLK',
          modelCompatibility: 'iPhone 13',
          stock: 6,
          price: 24.99,
          status: 'Low Stock',
          location: 'Bin G8-Shelf 2',
          supplier: 'GlassTech Solutions',
          warranty: 'None',
          description: 'A-grade rear back glass repair replacement with enlarged camera cutout for easier installation.'
        },
        {
          id: 'SP-005',
          name: 'OnePlus 11 Camera Module (Main)',
          sku: 'CAM-OP11-MAIN',
          modelCompatibility: 'OnePlus 11',
          stock: 0,
          price: 79.00,
          status: 'Out of Stock',
          location: 'Bin M2-Shelf 4',
          supplier: 'Shenzhen Optics Supply',
          warranty: '6 Months',
          description: '50 MP main rear camera module with optical image stabilization (OIS). Original sensor specification.'
        }
      ];
      if (isBrowser) {
        localStorage.setItem('tf_spares', JSON.stringify(savedSpares));
      }
    }
    this.spareParts.set(savedSpares);
  }

  // Operations
 addPersonnel(
    name: string,
    role: PersonnelRole,
    email: string,
    password: string = 'prasanna',
    phone: string = ''
): void {
    const list = this.personnel();
    const nextIdNum = list.length > 0 
      ? Math.max(...list.map(p => parseInt(p.id.replace('P-', '')))) + 1 
      : 101;
    
    const newPerson: Personnel = {
      id: `P-${nextIdNum}`,
      name,
      role,
      email,
      status: 'Active',phone,
      joinedDate: new Date().toISOString().split('T')[0],
      password
    };

    const updated = [...list, newPerson];
    this.personnel.set(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tf_personnel', JSON.stringify(updated));
    }
  }
updatePersonnel(id: string, changes: Partial<Personnel>): void {

  const updated = this.personnel().map(p =>
    p.id === id ? { ...p, ...changes } : p
  );

  this.personnel.set(updated);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tf_personnel', JSON.stringify(updated));
  }
}deletePersonnel(id: string): void {

  const updated = this.personnel().filter(p => p.id !== id);

  this.personnel.set(updated);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tf_personnel', JSON.stringify(updated));
  }
}
  addExpense(category: string, amount: number, description: string, date: string): void {
    const list = this.expenses();
    const nextIdNum = list.length > 0
      ? Math.max(...list.map(e => parseInt(e.id.replace('EXP-', '')))) + 1
      : 1;

    const newExpense: Expense = {
      id: `EXP-${String(nextIdNum).padStart(3, '0')}`,
      category,
      amount,
      description,
      date: date || new Date().toISOString().split('T')[0]
    };

    const updated = [...list, newExpense];
    this.expenses.set(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tf_expenses', JSON.stringify(updated));
    }
  }

  getOrderById(id: string): Order | undefined {
    return this.orders().find(o => o.id === id);
  }

  updateOrder(updated: Order): void {
    const list = this.orders();
    const idx = list.findIndex(o => o.id === updated.id);
    if (idx === -1) return;
    const updatedList = [...list];
    updatedList[idx] = { ...updated };
    this.orders.set(updatedList);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tf_orders', JSON.stringify(updatedList));
    }
  }

  getSpareById(id: string): SparePart | undefined {
    return this.spareParts().find(s => s.id === id);
  }

  addSparePart(data: Omit<SparePart, 'id'>): void {
    const list = this.spareParts();
    const nextIdNum = list.length > 0
      ? Math.max(...list.map(s => parseInt(s.id.replace('SP-', '')) || 0)) + 1
      : 1;
    const newPart: SparePart = {
      ...data,
      id: `SP-${String(nextIdNum).padStart(3, '0')}`
    };
    const updated = [...list, newPart];
    this.spareParts.set(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tf_spares', JSON.stringify(updated));
    }
  }

  addOrder(orderData: Omit<Order, 'id' | 'initials' | 'createdDate'>): void {
    const list = this.orders();
    const nextIdNum = list.length > 0
      ? Math.max(...list.map(o => {
          const match = o.id.match(/#ORD-(\d+)/);
          return match ? parseInt(match[1]) : 1000;
        })) + 1
      : 1043;

    const initials = orderData.customer
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newOrder: Order = {
      ...orderData,
      id: `#ORD-${nextIdNum}`,
      initials,
      createdDate: new Date().toISOString().split('T')[0],
      spareParts: orderData.spareParts || []
    };

    const updated = [newOrder, ...list];
    this.orders.set(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tf_orders', JSON.stringify(updated));
    }
  }
}
