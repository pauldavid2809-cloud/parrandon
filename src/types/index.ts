export type PaymentMethod = 'pago_movil' | 'zelle' | 'binance' | 'cash' | 'paypal';

export type OrderStatus = 'pending' | 'approved' | 'rejected';

export type Currency = 'USD' | 'VES' | 'USDT';

export type SalesChannel = 'online' | 'seminarista_parroquia' | 'taquilla';

export interface SeatSelection {
  tableId: string; // e.g. "A1", "C4"
  seatNumber: number; // 1 to 10
  sector: string; // "A", "B", "C", "D", "E"
}

export interface Attendee {
  name: string;
  docId?: string;
  isChild?: boolean;
  tableId?: string;
  seatNumber?: number;
}

export interface Ticket {
  id: string; // e.g. TKT-9021-1
  orderId: string;
  ticketCode: string; // Secure token for QR: e.g. PARR-A1-S03-X89
  tableId: string; // e.g. "A1"
  seatNumber: number; // 1 to 10
  sector: string; // "A", "B", "C", "D", "E"
  attendeeName: string;
  buyerName: string;
  buyerPhone: string;
  ticketNumber: number;
  qrCodeDataUrl?: string;
  isUsed: boolean;
  scannedAt?: string;
  scannedBy?: string;
  mealServed: boolean;
  mealServedAt?: string;
}

export interface Order {
  id: string; // e.g. ORD-8392
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerDocId: string;
  quantity: number;
  seats: SeatSelection[];
  attendees: Attendee[];
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentProofUrl?: string;
  amountPaid: number;
  currency: Currency;
  convertedUsd: number;
  rateApplied?: number;
  status: OrderStatus;
  salesChannel: SalesChannel;
  sellerName?: string; // Seminarista name if applicable
  parishName?: string; // Parroquia if sold by seminarista
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  tickets: Ticket[];
}

export interface TableInfo {
  id: string; // "A1", "A2", ... "E10"
  sector: 'A' | 'B' | 'C' | 'D' | 'E';
  number: number; // 1 to 10
  totalSeats: number; // always 10
  seats: {
    number: number; // 1 to 10
    isOccupied: boolean;
    isPending: boolean;
    ticketCode?: string;
    attendeeName?: string;
    orderId?: string;
  }[];
}

export interface EventConfig {
  eventName: string;
  subtitle: string;
  edition: string;
  date: string;
  time: string;
  venue: string;
  venueAddress: string;
  totalQuota: number; // 500
  totalTables: number; // 50
  seatsPerTable: number; // 10
  ticketPriceUsd: number;
  childTicketPriceUsd: number;
  currentRateBs: number;
  description: string;
  includesMeal: boolean;
  mealName: string;
  announcement?: string;
  paymentDetails: {
    pagoMovil: {
      bank: string;
      phone: string;
      docId: string;
      holder: string;
    };
    zelle: {
      email: string;
      holder: string;
    };
    binance: {
      payId: string;
      email: string;
      network: string;
      address: string;
    };
    cash: {
      location: string;
      schedule: string;
    };
    paypal?: {
      clientId?: string;
      paymentLink?: string;
      buttonId?: string;
    };
  };
}

export interface ScanResult {
  success: boolean;
  status: 'valid' | 'already_used' | 'not_found' | 'pending_payment';
  message: string;
  ticket?: Ticket;
  order?: {
    id: string;
    buyerName: string;
    buyerPhone: string;
    status: OrderStatus;
  };
}

export interface EventStats {
  totalQuota: number;
  totalSoldTickets: number;
  confirmedTickets: number;
  pendingTickets: number;
  availableTickets: number;
  totalOrders: number;
  pendingOrdersCount: number;
  approvedOrdersCount: number;
  rejectedOrdersCount: number;
  totalRevenueUsd: number;
  salesByChannel: {
    online: { count: number; revenueUsd: number };
    seminaristas: { count: number; revenueUsd: number };
    taquilla: { count: number; revenueUsd: number };
  };
  revenueByMethod: {
    pago_movil: { totalVes: number; totalUsd: number; count: number };
    zelle: { totalUsd: number; count: number };
    binance: { totalUsdt: number; count: number };
    cash: { totalUsd: number; count: number };
  };
  attendance: {
    scannedCount: number;
    pendingScanCount: number;
    mealsServedCount: number;
  };
}
